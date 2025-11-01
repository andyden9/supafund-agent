import { Divider, Flex, Typography } from 'antd';
import { useCallback, useMemo } from 'react';

import { SetupScreen } from '@/enums/SetupScreen';
import { useServices } from '@/hooks/useServices';
import { useSetup } from '@/hooks/useSetup';
import { useSharedContext } from '@/hooks/useSharedContext';

import { SUPAFUND_ONBOARDING_STEPS } from './constants';
import { IntroductionStep, OnboardingStep } from './IntroductionStep';

const { Text } = Typography;

type IntroductionProps = {
  steps: OnboardingStep[];
  onOnboardingComplete: () => void;
  isUnderConstruction: boolean;
};

const Introduction = ({
  steps,
  onOnboardingComplete,
  isUnderConstruction,
}: IntroductionProps) => {
  const { onboardingStep, updateOnboardingStep } = useSharedContext();

  const onNextStep = useCallback(() => {
    if (onboardingStep === steps.length - 1) {
      onOnboardingComplete();
    } else {
      updateOnboardingStep(onboardingStep + 1);
    }
  }, [
    onboardingStep,
    steps.length,
    onOnboardingComplete,
    updateOnboardingStep,
  ]);

  const onPreviousStep = useCallback(() => {
    if (onboardingStep === 0) {
      return;
    } else {
      updateOnboardingStep(onboardingStep - 1);
    }
  }, [onboardingStep, updateOnboardingStep]);

  const buttonLabel = useMemo(() => {
    if (onboardingStep === steps.length - 1) {
      return isUnderConstruction ? 'Return to agent selection' : 'Set up agent';
    }
    return 'Continue';
  }, [onboardingStep, steps.length, isUnderConstruction]);

  return (
    <IntroductionStep
      title={steps[onboardingStep].title}
      desc={steps[onboardingStep].desc}
      imgSrc={steps[onboardingStep].imgSrc}
      helper={steps[onboardingStep].helper}
      btnText={buttonLabel}
      onPrev={onPreviousStep}
      onNext={onNextStep}
    />
  );
};

/**
 * Display the introduction (onboarding) of the selected agent.
 */
export const AgentIntroduction = () => {
  const { goto } = useSetup();
  const { selectedAgentConfig } = useServices();

  const introductionSteps = useMemo(() => SUPAFUND_ONBOARDING_STEPS, []);

  const onComplete = useCallback(() => {
    goto(SetupScreen.SetupEoaFunding);
  }, [goto]);

  return (
    <>
      <Flex align="center" justify="center" style={{ paddingTop: 12 }}>
        <Text>{selectedAgentConfig.displayName}</Text>
      </Flex>
      <Divider style={{ margin: '12px 0 0 0' }} />
      <Introduction
        steps={introductionSteps}
        onOnboardingComplete={onComplete}
        isUnderConstruction={!!selectedAgentConfig.isUnderConstruction}
      />
    </>
  );
};
