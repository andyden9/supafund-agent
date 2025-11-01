import { Badge } from 'antd';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { MiddlewareDeploymentStatus } from '@/client';
import { AgentType } from '@/enums/Agent';
import { useRewardContext } from '@/hooks/useRewardContext';
import { useServices } from '@/hooks/useServices';

const badgeOffset: [number, number] = [-5, 32.5];

const AnimationContainer = styled.div`
  position: relative;
  top: -4px;
  width: 42px;
  height: 42px;
  padding: 2px 0;
  > div {
    width: 100%;
    height: 100%;
  }
`;

const TransitionalAgentHead = ({ isSupafund }: { isSupafund: boolean }) => (
  <Badge status="processing" color="orange" dot offset={badgeOffset}>
    <Image
      src={isSupafund ? '/supafund-robot.svg' : '/happy-robot.svg'}
      alt={isSupafund ? 'Supafund Robot' : 'Happy Robot'}
      width={40}
      height={40}
    />
  </Badge>
);

const DeployedAgentHead = ({ isSupafund }: { isSupafund: boolean }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [lottieView, setLottieView] = useState<React.ReactNode>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsMounted(true);
    // Only import and use lottie on client side
    const loadAnimation = async () => {
      try {
        const [{ useLottie }, animationModule] = await Promise.all([
          import('lottie-react'),
          import('../../ui/animations/robot-running.json'),
        ]);

        const animationData = animationModule.default ?? animationModule;
        const LottieComponent = () => {
          const { View } = useLottie({
            animationData,
            loop: true,
            autoplay: true,
          });

          return View;
        };

        if (!isCancelled) {
          setLottieView(<LottieComponent />);
        }
      } catch (error) {
        console.error('Failed to load agent head animation:', error);
      }
    };

    loadAnimation();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!isMounted || !lottieView) {
    return (
      <AnimationContainer>
        <Image
          src={isSupafund ? '/supafund-robot.svg' : '/happy-robot.svg'}
          alt={isSupafund ? 'Supafund Robot' : 'Happy Robot'}
          width={40}
          height={40}
        />
      </AnimationContainer>
    );
  }

  // For now, use static image for Supafund, animation for others
  if (isSupafund) {
    return (
      <AnimationContainer>
        <Image
          src="/supafund-robot.svg"
          alt="Supafund Robot"
          width={40}
          height={40}
        />
      </AnimationContainer>
    );
  }

  return <AnimationContainer>{lottieView}</AnimationContainer>;
};

const StoppedAgentHead = ({ isSupafund }: { isSupafund: boolean }) => (
  <Badge dot color="red" offset={badgeOffset}>
    <Image
      src={isSupafund ? '/supafund-robot.svg' : '/sad-robot.svg'}
      alt={isSupafund ? 'Supafund Robot' : 'Sad Robot'}
      width={40}
      height={40}
    />
  </Badge>
);

const IdleAgentHead = ({ isSupafund }: { isSupafund: boolean }) => (
  <Badge dot status="processing" color="green" offset={badgeOffset}>
    <Image
      src={isSupafund ? '/supafund-robot.svg' : '/idle-robot.svg'}
      alt={isSupafund ? 'Supafund Robot' : 'Idle Robot'}
      width={40}
      height={40}
    />
  </Badge>
);

export const AgentHead = () => {
  const { selectedService, selectedAgentType } = useServices();
  const { isEligibleForRewards } = useRewardContext();
  const status = selectedService?.deploymentStatus;

  const isSupafund = useMemo(
    () => selectedAgentType === AgentType.Supafund,
    [selectedAgentType],
  );

  if (
    status === MiddlewareDeploymentStatus.DEPLOYING ||
    status === MiddlewareDeploymentStatus.STOPPING
  ) {
    return <TransitionalAgentHead isSupafund={isSupafund} />;
  }

  if (status === MiddlewareDeploymentStatus.DEPLOYED) {
    // If the agent is eligible for rewards, agent is idle
    return isEligibleForRewards ? (
      <IdleAgentHead isSupafund={isSupafund} />
    ) : (
      <DeployedAgentHead isSupafund={isSupafund} />
    );
  }
  return <StoppedAgentHead isSupafund={isSupafund} />;
};
