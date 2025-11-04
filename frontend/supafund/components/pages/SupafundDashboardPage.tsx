import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useMemo } from 'react';

import { MainHeader } from '@/supafund/ui/components/MainPage/header';
import { KeepAgentRunningSection } from '@/supafund/ui/components/MainPage/sections/KeepAgentRunningSection';
import { CardFlex } from '@/supafund/ui/components/styled/CardFlex';
import { AgentType } from '@/supafund/core/enums/Agent';
import { Pages } from '@/supafund/core/enums/Pages';
import { useNeedsFunds } from '@/supafund/core/hooks/useNeedsFunds';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';

import { SupafundDashboard } from '../sections/Dashboard';

export const SupafundDashboardPage = () => {
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

  const fundingFlags = [
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    hasEnoughAdditionalTokensForInitialFunding,
  ];

  const hasFundingInfo = fundingFlags.every(
    (flag) => flag !== undefined && flag !== null,
  );

  const allFundingSatisfied = fundingFlags.every((flag) => flag === true);

  const canAccessDashboard =
    isInitialFunded === true || (hasFundingInfo && allFundingSatisfied);

  useEffect(() => {
    if (!isSupafundAgent) return;
    if (hasFundingInfo && !canAccessDashboard) {
      goto(Pages.Main);
    }
  }, [canAccessDashboard, goto, hasFundingInfo, isSupafundAgent]);

  if (!isSupafundAgent) {
    return null;
  }

  if (hasFundingInfo && !canAccessDashboard) {
    return null;
  }

  return (
    <CardFlex $padding="12px" style={{ overflowX: 'hidden' }}>
      <MainHeader />
      <KeepAgentRunningSection />

      <div style={{ marginTop: '12px', marginBottom: '16px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => goto(Pages.Main)}
          type="default"
        >
          Back to Settings
        </Button>
      </div>

      <SupafundDashboard hideBackButton />
    </CardFlex>
  );
};
