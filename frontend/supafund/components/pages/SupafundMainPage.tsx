import { useMemo } from 'react';

import { CardFlex } from '@/components/styled/CardFlex';
import { MainHeader } from '@/components/MainPage/header';
import { KeepAgentRunningSection } from '@/components/MainPage/sections/KeepAgentRunningSection';
import { AgentType } from '@/enums/Agent';
import { Pages } from '@/enums/Pages';
import { useNeedsFunds } from '@/hooks/useNeedsFunds';
import { usePageState } from '@/hooks/usePageState';
import { useServices } from '@/hooks/useServices';

import { SupafundMainSettings } from '../sections/MainSettings';

/**
 * Supafund-specific main page that shows the settings as primary content
 * with the start agent button preserved for easy access
 */
export const SupafundMainPage = () => {
  const { goto } = usePageState();
  const { selectedAgentType } = useServices();
  const {
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    hasEnoughAdditionalTokensForInitialFunding,
    isInitialFunded,
  } = useNeedsFunds(undefined);

  const isSupafundAgent = useMemo(
    () => selectedAgentType === AgentType.Supafund,
    [selectedAgentType],
  );

  const canAccessDashboard = useMemo(() => {
    if (isInitialFunded === true) return true;

    const fundingFlags = [
      hasEnoughNativeTokenForInitialFunding,
      hasEnoughOlasForInitialFunding,
      hasEnoughAdditionalTokensForInitialFunding,
    ];

    const hasFundingInfo = fundingFlags.every(
      (flag) => flag !== undefined && flag !== null,
    );

    if (!hasFundingInfo) return false;

    return fundingFlags.every((flag) => flag === true);
  }, [
    hasEnoughAdditionalTokensForInitialFunding,
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    isInitialFunded,
  ]);

  if (!isSupafundAgent) {
    return null;
  }

  return (
    <CardFlex $padding="12px" style={{ overflowX: 'hidden' }}>
      {/* Keep the header with start agent functionality */}
      <MainHeader />

      {/* Keep agent running section for easy start/stop */}
      <KeepAgentRunningSection />

      {/* Show Supafund Settings as main content with dashboard entry point */}
      <SupafundMainSettings
        renderAsCard={false}
        onNavigateToDashboard={() => goto(Pages.SupafundDashboard)}
        canNavigateToDashboard={canAccessDashboard}
        showBackToMain={false}
      />
    </CardFlex>
  );
};
