import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { Maybe } from 'graphql/jsutils/Maybe';
import { gql, request } from 'graphql-request';
import { groupBy, isEmpty, isNil } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';

import { STAKING_PROGRAM_ADDRESS } from '@/config/stakingPrograms';
import { REACT_QUERY_KEYS } from '@/constants/react-query-keys';
import { REWARDS_HISTORY_SUBGRAPH_URLS_BY_EVM_CHAIN } from '@/constants/urls';
import { EvmChainId } from '@/enums/Chain';
import {
  STAKING_PROGRAM_IDS,
  StakingProgramId,
} from '@/enums/StakingProgram';
import { Address } from '@/types/Address';
import { Nullable } from '@/types/Util';
import { asMiddlewareChain } from '@/utils/middlewareHelpers';
import { ONE_DAY_IN_MS } from '@/utils/time';

import { useService } from './useService';
import { useServices } from './useServices';
import { useStakingProgram } from './useStakingProgram';

const CheckpointGraphResponseSchema = z.object({
  epoch: z.string({
    message: 'Expected epoch to be a string',
  }),
  rewards: z.array(z.string(), {
    message: 'Expected rewards to be an array of strings',
  }),
  serviceIds: z.array(z.string(), {
    message: 'Expected serviceIds to be an array of strings',
  }),
  blockTimestamp: z.string({
    message: 'Expected blockTimestamp to be a string',
  }),
  transactionHash: z.string({
    message: 'Expected transactionHash to be a string',
  }),
  epochLength: z.string({
    message: 'Expected epochLength to be a string',
  }),
  contractAddress: z.string({
    message: 'Expected contractAddress to be a valid Ethereum address',
  }),
  availableRewards: z
    .string({
      message: 'Expected availableRewards to be a string',
    })
    .optional()
    .nullable(),
});
const CheckpointsGraphResponseSchema = z.array(CheckpointGraphResponseSchema);
type CheckpointResponse = z.infer<typeof CheckpointGraphResponseSchema>;

type UseContractCheckpointsOptions = {
  treatMissingServiceIdsAsSelfFor?: Set<string>;
};

const fetchRewardsQuery = (chainId: EvmChainId) => {
  const supportedStakingContracts = Object.values(
    STAKING_PROGRAM_ADDRESS[chainId] ?? {},
  ).map((address) => `"${address}"`);

  return gql`
  {
    checkpoints(
      orderBy: epoch
      orderDirection: desc
      first: 1000
      where: {
        contractAddress_in: [${supportedStakingContracts}]
      }
    ) {
      id
      availableRewards
      blockTimestamp
      contractAddress
      epoch
      epochLength
      rewards
      serviceIds
      transactionHash
    }
  }
`;
};

export type Checkpoint = {
  epoch: string;
  rewards: string[];
  serviceIds: string[];
  blockTimestamp: string;
  availableRewards?: string | null;
  transactionHash: string;
  epochLength: string;
  contractAddress: string;
  contractName: Nullable<string>;
  epochEndTimeStamp: number;
  epochStartTimeStamp: number;
  reward: number;
  earned: boolean;
};

/**
 * function to transform the checkpoints data from the subgraph
 * to include additional information like epoch start and end time,
 * rewards, etc.
 */
const useTransformCheckpoints = () => {
  const { selectedAgentConfig } = useServices();
  const { serviceApi: agent, evmHomeChainId: chainId } = selectedAgentConfig;

  return useCallback(
    (
      serviceId: number,
      checkpoints: CheckpointResponse[],
      timestampToIgnore?: null | number,
      options?: { treatMissingServiceIdsAsSelf?: boolean },
    ) => {
      if (!checkpoints || checkpoints.length === 0) return [];
      if (!serviceId) return [];

      return checkpoints
        .map((checkpoint: CheckpointResponse, index: number) => {
          const serviceIdIndex =
            checkpoint.serviceIds?.findIndex(
              (id) => Number(id) === serviceId,
            ) ?? -1;

          const treatMissingServiceIdsAsSelf =
            options?.treatMissingServiceIdsAsSelf &&
            (checkpoint.serviceIds?.length ?? 0) === 0;

          let rewardSource = '0';
          let earned = false;

          if (serviceIdIndex !== -1) {
            const currentReward = checkpoint.rewards?.[serviceIdIndex];
            const isRewardFinite = isFinite(Number(currentReward));
            rewardSource = isRewardFinite ? currentReward ?? '0' : '0';
            earned = serviceIdIndex !== -1;
          } else if (treatMissingServiceIdsAsSelf) {
            const fallbackReward =
              checkpoint.availableRewards ??
              checkpoint.rewards?.[0] ??
              '0';
            const isRewardFinite = isFinite(Number(fallbackReward));
            rewardSource = isRewardFinite ? fallbackReward ?? '0' : '0';
            earned = isRewardFinite
              ? Number(fallbackReward ?? '0') > 0
              : false;
          }

          // If the epoch is 0, it means it's the first epoch else,
          // the start time of the epoch is the end time of the previous epoch
          const epochStartTimeStamp =
            checkpoint.epoch === '0'
              ? Number(checkpoint.blockTimestamp) -
                Number(checkpoint.epochLength)
              : checkpoints[index + 1]?.blockTimestamp ?? 0;

          const stakingContractId = agent.getStakingProgramIdByAddress(
            chainId,
            checkpoint.contractAddress as Address,
          );

          const normalizedServiceIds = treatMissingServiceIdsAsSelf
            ? [...(checkpoint.serviceIds ?? []), `${serviceId}`]
            : checkpoint.serviceIds ?? [];

          return {
            ...checkpoint,
            serviceIds: normalizedServiceIds,
            epochEndTimeStamp: Number(checkpoint.blockTimestamp ?? Date.now()),
            epochStartTimeStamp: Number(epochStartTimeStamp),
            reward: Number(ethers.utils.formatUnits(rewardSource, 18)),
            earned,
            contractName: stakingContractId,
          };
        })
        .filter((checkpoint) => {
          // If the contract has been switched to new contract,
          // ignore the rewards from the old contract of the same epoch,
          // as the rewards are already accounted in the new contract.
          // Example: If contract was switched on September 1st, 2024,
          // ignore the rewards before that date in the old contract.
          if (!timestampToIgnore) return true;

          if (!checkpoint) return false;
          if (!checkpoint.epochEndTimeStamp) return false;

          return checkpoint.epochEndTimeStamp < timestampToIgnore;
        });
    },
    [agent, chainId],
  );
};

type CheckpointsResponse = { checkpoints: CheckpointResponse[] };

/**
 * hook to fetch rewards history for all contracts
 */
const useContractCheckpoints = (
  chainId: EvmChainId,
  serviceId: Maybe<number>,
  options?: UseContractCheckpointsOptions,
) => {
  const transformCheckpoints = useTransformCheckpoints();

  const fallbackKey = useMemo(() => {
    if (!options?.treatMissingServiceIdsAsSelfFor) return null;
    return Array.from(options.treatMissingServiceIdsAsSelfFor)
      .map((address) => address.toLowerCase())
      .sort()
      .join('|');
  }, [options?.treatMissingServiceIdsAsSelfFor]);

  return useQuery({
    queryKey: [
      ...REACT_QUERY_KEYS.REWARDS_HISTORY_KEY(chainId, serviceId!),
      fallbackKey,
    ] as const,
    queryFn: async () => {
      const checkpointsResponse = await request<CheckpointsResponse>(
        REWARDS_HISTORY_SUBGRAPH_URLS_BY_EVM_CHAIN[chainId],
        fetchRewardsQuery(chainId),
      );

      const parsedCheckpoints = CheckpointsGraphResponseSchema.safeParse(
        checkpointsResponse.checkpoints,
      );

      if (parsedCheckpoints.error) {
        console.error(parsedCheckpoints.error);
        return [];
      }

      return parsedCheckpoints.data;
    },
    select: (checkpoints): { [contractAddress: string]: Checkpoint[] } => {
      if (!serviceId) return {};
      if (isNil(checkpoints) || isEmpty(checkpoints)) return {};

      // group checkpoints by contract address (staking program)
      const checkpointsByContractAddress = groupBy(
        checkpoints,
        'contractAddress',
      );

      // only need relevant contract history that service has participated in,
      // ignore contract addresses with no activity from the service
      return Object.keys(checkpointsByContractAddress).reduce<{
        [stakingContractAddress: string]: Checkpoint[];
      }>((acc, stakingContractAddress: string) => {
        const checkpoints =
          checkpointsByContractAddress[stakingContractAddress];

        // skip if there are no checkpoints for the contract address
        if (!checkpoints) return acc;
        if (checkpoints.length <= 0) return acc;

        // check if the service has participated in the staking contract
        // if not, skip the contract
        const shouldTreatMissingServiceIdsAsSelf =
          options?.treatMissingServiceIdsAsSelfFor?.has(
            stakingContractAddress.toLowerCase(),
          ) ?? false;

        const isServiceParticipatedInContract =
          checkpoints.some((checkpoint) =>
            checkpoint.serviceIds.includes(`${serviceId}`),
          ) || shouldTreatMissingServiceIdsAsSelf;
        if (!isServiceParticipatedInContract) return acc;

        // transform the checkpoints, includes epoch start and end time, rewards, etc
        const transformedCheckpoints = transformCheckpoints(
          serviceId,
          checkpoints,
          null,
          {
            treatMissingServiceIdsAsSelf:
              shouldTreatMissingServiceIdsAsSelf,
          },
        );

        return { ...acc, [stakingContractAddress]: transformedCheckpoints };
      }, {});
    },
    enabled: !!serviceId,
    refetchInterval: ONE_DAY_IN_MS,
    refetchOnWindowFocus: false,
  });
};

export const useRewardsHistory = () => {
  const { selectedService, selectedAgentConfig } = useServices();
  const { evmHomeChainId: homeChainId } = selectedAgentConfig;
  const serviceConfigId = selectedService?.service_config_id;
  const { service } = useService(serviceConfigId);
  const { selectedStakingProgramId } = useStakingProgram();

  const serviceNftTokenId =
    service?.chain_configs?.[asMiddlewareChain(homeChainId)]?.chain_data?.token;

  const serviceStakingProgramIds = useMemo(() => {
    if (!service?.chain_configs) return new Set<StakingProgramId>();

    const ids = Object.values(service.chain_configs)
      .map((chainConfig) =>
        chainConfig?.chain_data?.user_params?.staking_program_id
          ? (chainConfig.chain_data.user_params
              .staking_program_id as StakingProgramId)
          : undefined,
      )
      .filter((id): id is StakingProgramId => Boolean(id));

    return new Set<StakingProgramId>(ids);
  }, [service?.chain_configs]);

  const fallbackContracts = useMemo(() => {
    const addresses = new Set<string>();

    const addAddressForProgram = (programId?: StakingProgramId) => {
      if (!programId) return;
      const address = STAKING_PROGRAM_ADDRESS[homeChainId]?.[programId];
      if (!address) return;
      addresses.add(address.toLowerCase());
    };

    if (selectedStakingProgramId) {
      addAddressForProgram(selectedStakingProgramId);
    }
    serviceStakingProgramIds.forEach(addAddressForProgram);

    return addresses;
  }, [homeChainId, selectedStakingProgramId, serviceStakingProgramIds]);

  const {
    isError,
    isLoading,
    isFetched,
    refetch,
    data: contractCheckpoints,
  } = useContractCheckpoints(homeChainId, serviceNftTokenId, {
    treatMissingServiceIdsAsSelfFor: fallbackContracts,
  });

  const epochSortedCheckpoints = useMemo<Checkpoint[]>(
    () =>
      Object.values(contractCheckpoints ?? {})
        .flat()
        .sort((a, b) => b.epochEndTimeStamp - a.epochEndTimeStamp),
    [contractCheckpoints],
  );

  const latestRewardStreak = useMemo<number>(() => {
    if (isLoading || !isFetched) return 0;
    if (!contractCheckpoints) return 0;

    // remove all histories that are not earned
    const earnedCheckpoints = epochSortedCheckpoints.filter(
      (checkpoint) => checkpoint.earned,
    );

    const timeNow = Math.trunc(Date.now() / 1000);

    let isStreakBroken = false; // flag to break the streak
    return earnedCheckpoints.reduce((streakCount, current, i) => {
      if (isStreakBroken) return streakCount;

      // first iteration
      if (i === 0) {
        const initialEpochGap = Math.trunc(timeNow - current.epochEndTimeStamp);

        // If the epoch gap is greater than the epoch length
        if (initialEpochGap > Number(current.epochLength)) {
          isStreakBroken = true;
          return streakCount;
        }

        if (current.earned) {
          return streakCount + 1;
        }

        isStreakBroken = true;
        return streakCount;
      }

      // other iterations
      const previous = earnedCheckpoints[i - 1];
      const epochGap = previous.epochStartTimeStamp - current.epochEndTimeStamp;

      if (current.earned && epochGap <= Number(current.epochLength)) {
        return streakCount + 1;
      }

      isStreakBroken = true;
      return streakCount;
    }, 0);
  }, [isLoading, isFetched, contractCheckpoints, epochSortedCheckpoints]);

  useEffect(() => {
    serviceNftTokenId && refetch();
  }, [refetch, serviceNftTokenId]);

  return {
    isError,
    isFetched,
    isLoading,
    latestRewardStreak,
    refetch,
    allCheckpoints: epochSortedCheckpoints,
    contractCheckpoints,
  };
};
