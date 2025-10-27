import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useMemo } from 'react';

import { MainHeader } from '@/components/MainPage/header';
import { KeepAgentRunningSection } from '@/components/MainPage/sections/KeepAgentRunningSection';
import { CardFlex } from '@/components/styled/CardFlex';
import { AgentType } from '@/enums/Agent';
import { Pages } from '@/enums/Pages';
import { useNeedsFunds } from '@/hooks/useNeedsFunds';
import { usePageState } from '@/hooks/usePageState';
import { useServices } from '@/hooks/useServices';

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
