import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isNil } from 'lodash';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useState,
} from 'react';

import { STAKING_PROGRAM_IDS } from '@/enums/StakingProgram';
import { FIVE_SECONDS_INTERVAL } from '@/constants/intervals';
import { REACT_QUERY_KEYS } from '@/constants/react-query-keys';
import { StakingProgramId } from '@/enums/StakingProgram';
import { useServices } from '@/hooks/useServices';
import { Maybe, Nullable } from '@/types/Util';

export const StakingProgramContext = createContext<{
  isActiveStakingProgramLoaded: boolean;
  activeStakingProgramId?: Maybe<StakingProgramId>;
  defaultStakingProgramId?: Maybe<StakingProgramId>;
  selectedStakingProgramId: Nullable<StakingProgramId>;
  setDefaultStakingProgramId: (stakingProgramId: StakingProgramId) => void;
}>({
  isActiveStakingProgramLoaded: false,
  selectedStakingProgramId: null,
  setDefaultStakingProgramId: () => {},
});

/**
 * hook to get the active staking program id
 */
const useGetActiveStakingProgramId = (serviceNftTokenId: Maybe<number>) => {
  const queryClient = useQueryClient();
  const { selectedAgentConfig, isFetched: isServicesLoaded } = useServices();

  const { serviceApi, evmHomeChainId } = selectedAgentConfig;

  const response = useQuery({
    queryKey: REACT_QUERY_KEYS.STAKING_PROGRAM_KEY(
      evmHomeChainId,
      serviceNftTokenId!,
    ),
    queryFn: async () => {
      if (!serviceNftTokenId) return null;
      if (!Number(serviceNftTokenId)) return null;

      const currentStakingProgramId =
        await serviceApi.getCurrentStakingProgramByServiceId(
          serviceNftTokenId,
          evmHomeChainId,
        );

      // If service is not staked yet, do not fallback here.
      // Let the provider use the agent-specific defaultStakingProgramId instead.
      return currentStakingProgramId;
    },
    enabled: !isNil(evmHomeChainId) && isServicesLoaded && !!serviceNftTokenId,
    refetchInterval: FIVE_SECONDS_INTERVAL,
  });

  const setActiveStakingProgramId = useCallback(
    (stakingProgramId: Nullable<StakingProgramId>) => {
      if (!serviceNftTokenId)
        throw new Error(
          'serviceNftTokenId is required to set the active staking program id',
        );
      if (!stakingProgramId)
        throw new Error(
          'stakingProgramId is required to set the active staking program id',
        );

      // update the active staking program id in the cache
      queryClient.setQueryData(
        REACT_QUERY_KEYS.STAKING_PROGRAM_KEY(evmHomeChainId, serviceNftTokenId),
        stakingProgramId,
      );
    },
    [queryClient, evmHomeChainId, serviceNftTokenId],
  );

  return { ...response, setActiveStakingProgramId };
};

/**
 * context provider responsible for determining the current active staking program based on the service.
 * It does so by checking if the current service is staked, and if so, which staking program it is staked in.
 * It also provides a method to update the active staking program id in state.
 *
 * @note When the service is not yet deployed, a default staking program state is used to allow switching
 * between staking programs before deployment is complete, ensuring the relevant staking program is displayed,
 * even if deployment is still in progress
 */
export const StakingProgramProvider = ({ children }: PropsWithChildren) => {
  const { selectedService } = useServices();

  const [defaultStakingProgramId, setDefaultStakingProgramId] = useState(
    STAKING_PROGRAM_IDS.SupafundTest,
  );

  const serviceNftTokenId = isNil(selectedService?.chain_configs)
    ? null
    : selectedService.chain_configs?.[selectedService?.home_chain]?.chain_data
        ?.token;

  const { isLoading, data: activeStakingProgramId } =
    useGetActiveStakingProgramId(serviceNftTokenId);

  const selectedStakingProgramId = isLoading
    ? null
    : activeStakingProgramId || defaultStakingProgramId;

  return (
    <StakingProgramContext.Provider
      value={{
        isActiveStakingProgramLoaded: !isLoading,
        activeStakingProgramId,
        defaultStakingProgramId,
        selectedStakingProgramId,
        setDefaultStakingProgramId,
      }}
    >
      {children}
    </StakingProgramContext.Provider>
  );
};
