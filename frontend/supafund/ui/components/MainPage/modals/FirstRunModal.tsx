import { Button, Flex, Modal, Typography } from 'antd';
import Image from 'next/image';
import { FC } from 'react';

import { STAKING_PROGRAMS } from '@/supafund/core/config/stakingPrograms';
import { MODAL_WIDTH } from '@/supafund/core/constants/width';
import { TokenSymbol } from '@/supafund/core/enums/Token';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useStakingProgram } from '@/supafund/core/hooks/useStakingProgram';

const { Title, Paragraph } = Typography;

type FirstRunModalProps = { open: boolean; onClose: () => void };

export const FirstRunModal: FC<FirstRunModalProps> = ({ open, onClose }) => {
  const { selectedAgentConfig } = useServices();
  const { evmHomeChainId: homeChainId } = selectedAgentConfig;
  const { activeStakingProgramId } = useStakingProgram();

  if (!open) return null;
  if (!activeStakingProgramId) return null;

  const stakingProgramsForChain = STAKING_PROGRAMS[homeChainId];
  if (!stakingProgramsForChain) return null;

  const activeStakingProgram =
    stakingProgramsForChain[activeStakingProgramId];
  if (!activeStakingProgram) return null;

  const requiredStakedOlas =
    activeStakingProgram.stakingRequirements[TokenSymbol.OLAS];

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
        Pearl is designed to make it easy for you to earn staking rewards every
        day. Simply leave the app and agent running in the background for ~1hr a
        day.
      </Paragraph>
    </Modal>
  );
};
