import { Flex, Typography } from 'antd';
import { useEffect } from 'react';

import { CustomAlert } from '@/components/Alert';
import { AgentType } from '@/enums/Agent';
import { useElectronApi } from '@/hooks/useElectronApi';
import { useNeedsFunds } from '@/hooks/useNeedsFunds';
import { useServices } from '@/hooks/useServices';
import { useStakingProgram } from '@/hooks/useStakingProgram';

import { FundsToActivate } from './FundsToActivate';

const { Title } = Typography;

export const MainNeedsFunds = () => {
  const { selectedAgentType } = useServices();
  const { selectedStakingProgramId } = useStakingProgram();

  const {
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    hasEnoughAdditionalTokensForInitialFunding,
    isInitialFunded,
    needsInitialFunding,
  } = useNeedsFunds(selectedStakingProgramId);

  // update the store when the agent is funded
  const electronApi = useElectronApi();
  useEffect(() => {
    if (
      hasEnoughNativeTokenForInitialFunding &&
      hasEnoughOlasForInitialFunding &&
      hasEnoughAdditionalTokensForInitialFunding &&
      !isInitialFunded
    ) {
      electronApi.store?.set?.(`${selectedAgentType}.isInitialFunded`, true);
    }
  }, [
    electronApi.store,
    selectedAgentType,
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    hasEnoughAdditionalTokensForInitialFunding,
    isInitialFunded,
  ]);

  if (!needsInitialFunding) return null;

  return (
    <CustomAlert
      fullWidth
      showIcon
      message={
        <Flex vertical gap={8} align="flex-start">
          <Title level={5} style={{ margin: 0 }}>
            Fund your agent
          </Title>
          {selectedAgentType === AgentType.Supafund && (
            <Typography.Text type="secondary">
              Note: 1.5 xDAI was deposited to your EOA to create a Safe, the
              rest were transferred to your agent wallet. Now fund your Safe
              with OLAS for staking.
            </Typography.Text>
          )}

          <FundsToActivate
            stakingFundsRequired={!hasEnoughOlasForInitialFunding}
            nativeFundsRequired={!hasEnoughNativeTokenForInitialFunding}
            additionalFundsRequired={
              !hasEnoughAdditionalTokensForInitialFunding
            }
          />
        </Flex>
      }
      type="primary"
    />
  );
};
