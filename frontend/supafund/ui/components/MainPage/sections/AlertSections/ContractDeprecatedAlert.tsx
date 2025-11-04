import { Flex, Typography } from 'antd';

import { NA } from '@/supafund/core/constants/symbols';
import { Pages } from '@/supafund/core/enums/Pages';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useActiveStakingContractDetails } from '@/supafund/core/hooks/useStakingContractDetails';
import { useStakingProgram } from '@/supafund/core/hooks/useStakingProgram';

import { CustomAlert } from '../../../Alert';

const { Text } = Typography;

export const ContractDeprecatedAlert = () => {
  const { selectedAgentConfig } = useServices();
  const { goto } = usePageState();

  const { isActiveStakingProgramLoaded, selectedStakingProgramMeta } =
    useStakingProgram();

  const { isSelectedStakingContractDetailsLoading } =
    useActiveStakingContractDetails();

  if (!isActiveStakingProgramLoaded) return null;
  if (isSelectedStakingContractDetailsLoading) return null;
  if (!selectedStakingProgramMeta) return null;
  if (!selectedStakingProgramMeta.deprecated) return null;
  if (selectedAgentConfig.isUnderConstruction) return null;

  return (
    <CustomAlert
      type="error"
      fullWidth
      showIcon
      message={
        <Flex justify="space-between" gap={4} vertical>
          <Text className="font-weight-600">
            {selectedStakingProgramMeta.name || NA} contract is deprecated
          </Text>
          <span className="text-sm">
            Switch to one of the available contracts to start your agent.
          </span>
          <Text
            className="pointer hover-underline text-primary text-sm"
            onClick={() => goto(Pages.ManageStaking)}
          >
            Change staking contract
          </Text>
        </Flex>
      }
    />
  );
};
