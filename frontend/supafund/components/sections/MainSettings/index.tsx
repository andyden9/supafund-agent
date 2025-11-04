import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AddFundsSection } from '@/supafund/ui/components/MainPage/sections/AddFundsSection';
import { AlertSections } from '@/supafund/ui/components/MainPage/sections/AlertSections';
import { GasBalanceSection } from '@/supafund/ui/components/MainPage/sections/GasBalanceSection';
import { MainOlasBalance } from '@/supafund/ui/components/MainPage/sections/OlasBalanceSection';
import { RewardsSection } from '@/supafund/ui/components/MainPage/sections/RewardsSection';
import { StakingContractSection } from '@/supafund/ui/components/MainPage/sections/StakingContractUpdate';
import { CardFlex } from '@/supafund/ui/components/styled/CardFlex';
import { Pages } from '@/supafund/core/enums/Pages';
import { SetupScreen } from '@/supafund/core/enums/SetupScreen';
import { useFeatureFlag } from '@/supafund/core/hooks/useFeatureFlag';
import { useNeedsFunds } from '@/supafund/core/hooks/useNeedsFunds';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useSetup } from '@/supafund/core/hooks/useSetup';
import { useStakingProgram } from '@/supafund/core/hooks/useStakingProgram';

const { Title } = Typography;

interface SupafundMainSettingsProps {
  onNavigateToDashboard?: () => void;
  canNavigateToDashboard?: boolean;
  renderAsCard?: boolean;
  showBackToMain?: boolean;
}

/**
 * Supafund agent settings page - contains all the original main page content
 * like balances, rewards, gas, and funding sections.
 */
export const SupafundMainSettings = ({
  onNavigateToDashboard,
  canNavigateToDashboard,
  renderAsCard = true,
  showBackToMain,
}: SupafundMainSettingsProps) => {
  const { goto } = usePageState();
  const { goto: gotoSetup } = useSetup();
  const isStakingContractSectionEnabled = useFeatureFlag(
    'staking-contract-section',
  );

  // Determine if funding requirements are satisfied (Safe operating xDAI + staking OLAS + additional tokens)
  const { selectedStakingProgramId } = useStakingProgram();
  const {
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    hasEnoughAdditionalTokensForInitialFunding,
    isInitialFunded,
  } = useNeedsFunds(selectedStakingProgramId);

  const hasFundingInfo = useMemo(
    () =>
      hasEnoughNativeTokenForInitialFunding !== undefined &&
      hasEnoughOlasForInitialFunding !== undefined &&
      hasEnoughAdditionalTokensForInitialFunding !== undefined,
    [
      hasEnoughAdditionalTokensForInitialFunding,
      hasEnoughNativeTokenForInitialFunding,
      hasEnoughOlasForInitialFunding,
    ],
  );

  const allFundingSatisfied = useMemo(
    () =>
      hasEnoughNativeTokenForInitialFunding === true &&
      hasEnoughOlasForInitialFunding === true &&
      hasEnoughAdditionalTokensForInitialFunding === true,
    [
      hasEnoughAdditionalTokensForInitialFunding,
      hasEnoughNativeTokenForInitialFunding,
      hasEnoughOlasForInitialFunding,
    ],
  );

  const computedCanNavigate = useMemo(
    () => isInitialFunded === true || (hasFundingInfo && allFundingSatisfied),
    [allFundingSatisfied, hasFundingInfo, isInitialFunded],
  );

  const effectiveCanNavigate =
    canNavigateToDashboard ?? computedCanNavigate ?? false;

  // Only auto-return to Setup when user enters this page unfunded and becomes funded here
  const [enteredUnfunded] = useState<boolean>(
    () => !(isInitialFunded === true || allFundingSatisfied),
  );

  useEffect(() => {
    // Only during onboarding gating (i.e., before initial funding is completed)
    if (!isInitialFunded && enteredUnfunded && allFundingSatisfied) {
      gotoSetup(SetupScreen.SetupYourAgent);
    }
  }, [allFundingSatisfied, enteredUnfunded, gotoSetup, isInitialFunded]);

  const shouldShowBackButton =
    (showBackToMain ?? !onNavigateToDashboard) &&
    (isInitialFunded === true || allFundingSatisfied);
  const shouldShowDashboardButton = Boolean(onNavigateToDashboard);
  const isDashboardDisabled = !effectiveCanNavigate;

  const settingsContent = (
    <>
      {/* Header with navigation controls */}
      <Card style={{ marginBottom: '12px' }}>
        <Flex align="center" justify="space-between" gap={12}>
          <Flex align="center" gap={12}>
            {shouldShowBackButton ? (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => goto(Pages.Main)}
                type="text"
              />
            ) : null}
            <Title level={4} style={{ margin: 0 }}>
              Supafund Agent
            </Title>
          </Flex>

          {shouldShowDashboardButton ? (
            <Tooltip
              arrow={false}
              placement="bottomRight"
              title={
                isDashboardDisabled
                  ? 'Insufficient funds to open the dashboard'
                  : 'View Supafund Dashboard'
              }
            >
              <span>
                <Button
                  type="default"
                  disabled={isDashboardDisabled}
                  onClick={onNavigateToDashboard}
                  style={{ minWidth: '120px' }}
                >
                  Dashboard
                </Button>
              </span>
            </Tooltip>
          ) : null}
        </Flex>
      </Card>

      {/* Original main page content as settings */}
      <Card
        styles={{
          body: {
            paddingTop: 0,
            paddingBottom: 12,
            overflow: 'hidden',
          },
        }}
        style={{ borderTopColor: 'transparent' }}
      >
        <Flex vertical>
          <AlertSections />
          <MainOlasBalance />
          <RewardsSection />
          {isStakingContractSectionEnabled && <StakingContractSection />}
          <GasBalanceSection />
          <AddFundsSection />
        </Flex>
      </Card>
    </>
  );

  if (!renderAsCard) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: '16px',
        }}
      >
        {settingsContent}
      </div>
    );
  }

  return <CardFlex>{settingsContent}</CardFlex>;
};
