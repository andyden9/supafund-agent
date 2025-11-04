import { InfoCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Popover, Skeleton, Typography } from 'antd';
import { useMemo } from 'react';

import { REACT_QUERY_KEYS } from '@/supafund/core/constants/react-query-keys';
import { NA } from '@/supafund/core/constants/symbols';
import { POPOVER_WIDTH_MEDIUM } from '@/supafund/core/constants/width';
import { getLatestEpochDetails } from '@/graphql/queries';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useStakingProgram } from '@/supafund/core/hooks/useStakingProgram';
import { formatToTime } from '@/supafund/core/utils/time';

const { Text } = Typography;

const useEpochEndTime = () => {
  const { selectedAgentConfig } = useServices();
  const chainId = selectedAgentConfig.evmHomeChainId;

  const { activeStakingProgramAddress } = useStakingProgram();

  const { data, isLoading } = useQuery({
    queryKey: REACT_QUERY_KEYS.LATEST_EPOCH_TIME_KEY(
      chainId,
      activeStakingProgramAddress!,
    ),
    queryFn: async () => {
      return await getLatestEpochDetails(chainId, activeStakingProgramAddress!);
    },
    select: (data) => {
      // last epoch end time + epoch length
      return Number(data.blockTimestamp) + Number(data.epochLength);
    },
    enabled: !!activeStakingProgramAddress && !!chainId,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading };
};

/**
 * Staking rewards for the current epoch
 */
export const StakingRewardsThisEpoch = () => {
  const { data: epochEndTimeInMs } = useEpochEndTime();

  const {
    isActiveStakingProgramLoaded,
    activeStakingProgramMeta,
    defaultStakingProgramMeta,
  } = useStakingProgram();

  const stakingProgramMeta = isActiveStakingProgramLoaded
    ? activeStakingProgramMeta || defaultStakingProgramMeta
    : null;

  const popoverContent = useMemo(() => {
    if (!isActiveStakingProgramLoaded) return <Skeleton.Input />;

    if (!activeStakingProgramMeta) {
      return (
        <div style={{ maxWidth: POPOVER_WIDTH_MEDIUM }}>
          You&apos;re not yet in a staking program!
        </div>
      );
    }

    return (
      <div style={{ maxWidth: POPOVER_WIDTH_MEDIUM }}>
        The epoch for {stakingProgramMeta?.name} ends each day at ~{' '}
        <Text className="text-sm" strong>
          {epochEndTimeInMs
            ? `${formatToTime(epochEndTimeInMs * 1000)} (UTC)`
            : NA}
        </Text>
      </div>
    );
  }, [
    activeStakingProgramMeta,
    epochEndTimeInMs,
    isActiveStakingProgramLoaded,
    stakingProgramMeta?.name,
  ]);

  return (
    <Text type="secondary">
      Staking rewards this epoch&nbsp;
      <Popover arrow={false} content={popoverContent}>
        <InfoCircleOutlined />
      </Popover>
    </Text>
  );
};
