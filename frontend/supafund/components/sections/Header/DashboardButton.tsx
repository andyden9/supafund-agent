import { BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';

import { AgentType } from '@/supafund/core/enums/Agent';
import { Pages } from '@/supafund/core/enums/Pages';
import { useNeedsFunds } from '@/supafund/core/hooks/useNeedsFunds';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';

const { Text } = Typography;

export const SupafundSettingsButton = () => {
  const { pageState, goto } = usePageState();
  const { selectedAgentType } = useServices();
  const {
    hasEnoughNativeTokenForInitialFunding,
    hasEnoughOlasForInitialFunding,
    hasEnoughAdditionalTokensForInitialFunding,
    isInitialFunded,
  } = useNeedsFunds(undefined);

  const isSupafundAgent = selectedAgentType === AgentType.Supafund;

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

  const isOnDashboard = pageState === Pages.SupafundDashboard;
  const isInSettingsView =
    pageState === Pages.Main || pageState === Pages.SupafundMainSettings;
  const isDisabled = !isOnDashboard && isInSettingsView && !canAccessDashboard;

  const tooltipTitle = (() => {
    if (isOnDashboard) {
      return 'Supafund Agent';
    }
    if (isInSettingsView) {
      return isDisabled
        ? 'Insufficient funds to open the dashboard'
        : 'Supafund Agent Dashboard';
    }
    return 'Supafund Agent';
  })();

  const icon = isOnDashboard ? (
    <SettingOutlined />
  ) : isInSettingsView ? (
    <BarChartOutlined />
  ) : (
    <SettingOutlined />
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOnDashboard) {
      goto(Pages.Main);
      return;
    }

    if (isInSettingsView) {
      if (isDisabled) return;
      goto(Pages.SupafundDashboard);
      return;
    }

    goto(Pages.Main);
  };

  if (!isSupafundAgent) {
    return null;
  }

  return (
    <Tooltip
      arrow={false}
      title={<Text className="text-sm">{tooltipTitle}</Text>}
      overlayInnerStyle={{ width: 'max-content' }}
      placement="bottomLeft"
    >
      <span
        style={{
          display: 'inline-flex',
        }}
      >
        <Button
          type="text"
          size="small"
          onClick={handleClick}
          icon={icon}
          disabled={isDisabled}
          style={{
            color: '#666',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
          }}
        />
      </span>
    </Tooltip>
  );
};
