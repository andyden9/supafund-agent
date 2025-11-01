import { Button, Flex, Modal, Typography } from 'antd';
import Image from 'next/image';
import { FC } from 'react';

import { STAKING_PROGRAMS } from '@/config/stakingPrograms';
import { MODAL_WIDTH } from '@/constants/width';
import { TokenSymbol } from '@/enums/Token';
import { useServices } from '@/hooks/useServices';
import { useStakingProgram } from '@/hooks/useStakingProgram';

const { Title, Paragraph } = Typography;

type FirstRunModalProps = { open: boolean; onClose: () => void };

export const FirstRunModal: FC<FirstRunModalProps> = ({ open, onClose }) => {
  const { selectedAgentConfig } = useServices();
  const { evmHomeChainId: homeChainId } = selectedAgentConfig;
  const { activeStakingProgramId } = useStakingProgram();

  if (!open) return null;
  if (!activeStakingProgramId) return null;

  const stakingProgramConfig =
    STAKING_PROGRAMS[homeChainId]?.[activeStakingProgramId];
  const requiredStakedOlas =
    stakingProgramConfig?.stakingRequirements?.[TokenSymbol.OLAS] ?? 0;

  return (
    <Modal
      open={open}
      width={MODAL_WIDTH}
      onCancel={onClose}
      footer={[
        <Button
          key="ok"
          type="primary"
          block
          size="large"
          className="mt-8"
          onClick={onClose}
        >
          Got it
        </Button>,
      ]}
    >
      <Flex align="center" justify="center">
        <Image
          src="/splash-robot-head.png"
          width={100}
          height={100}
          alt="OLAS logo"
        />
      </Flex>
      <Title level={5} className="mt-12 text-center">
        {`Your agent is running and you've staked ${requiredStakedOlas} OLAS!`}
      </Title>
      <Paragraph>Your agent is working towards earning rewards.</Paragraph>
      <Paragraph>
        Supafund 会在后台自动执行预测策略，保持在线即可持续参与质押并领取奖励。
      </Paragraph>
    </Modal>
  );
};
