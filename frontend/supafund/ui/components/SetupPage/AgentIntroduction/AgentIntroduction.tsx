import { Divider, Flex, Typography } from 'antd';
import { useCallback, useMemo } from 'react';

import { Pages } from '@/supafund/core/enums/Pages';
import { SetupScreen } from '@/supafund/core/enums/SetupScreen';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useSetup } from '@/supafund/core/hooks/useSetup';
import { useSharedContext } from '@/supafund/core/hooks/useSharedContext';

import {
  AGENTS_FUND_ONBOARDING_STEPS,
  MODIUS_ONBOARDING_STEPS,
  OPTIMUS_ONBOARDING_STEPS,
  PREDICTION_ONBOARDING_STEPS,
  SUPAFUND_ONBOARDING_STEPS,
} from './constants';
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
  const { goto } = useSetup();
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
      goto(SetupScreen.AgentSelection);
    } else {
      updateOnboardingStep(onboardingStep - 1);
    }
  }, [onboardingStep, goto, updateOnboardingStep]);

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
  const { goto: gotoPage } = usePageState();
  const { selectedAgentType, selectedAgentConfig } = useServices();

  const introductionSteps = useMemo(() => {
    if (selectedAgentType === 'trader') return PREDICTION_ONBOARDING_STEPS;
    if (selectedAgentType === 'memeooorr') return AGENTS_FUND_ONBOARDING_STEPS;
    if (selectedAgentType === 'modius') return MODIUS_ONBOARDING_STEPS;
    if (selectedAgentType === 'optimus') return OPTIMUS_ONBOARDING_STEPS;
    if (selectedAgentType === 'supafund') return SUPAFUND_ONBOARDING_STEPS;

    throw new Error('Invalid agent type');
  }, [selectedAgentType]);

  const onComplete = useCallback(() => {
    // if agent is "coming soon" should be redirected to EARLY ACCESS PAGE
    if (selectedAgentConfig.isComingSoon) {
      goto(SetupScreen.EarlyAccessOnly);
      return;
    }

    // if agent is under construction, goes back to agent selection
    if (selectedAgentConfig.isUnderConstruction) {
      gotoPage(Pages.SwitchAgent);
    }

    // If the selected type requires setting up an agent,
    // for Supafund we collect funding first, then show SetupYourAgent.
    if (selectedAgentConfig.requiresSetup) {
      if (selectedAgentType === 'supafund') {
        goto(SetupScreen.SetupEoaFunding);
      } else {
        goto(SetupScreen.SetupYourAgent);
      }
    } else {
      goto(SetupScreen.SetupEoaFunding);
    }
  }, [goto, gotoPage, selectedAgentConfig]);

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
