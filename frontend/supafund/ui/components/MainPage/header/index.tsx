import { Flex, Typography } from 'antd';
import { useCallback, useMemo, useState } from 'react';

import { CardSection } from '@/supafund/ui/components/styled/CardSection';
import { useServices } from '@/supafund/core/hooks/useServices';

import { FirstRunModal } from '../modals/FirstRunModal';
import { AgentButton } from './AgentButton/AgentButton';
import { AgentHead } from './AgentHead';
import { SupafundSettingsButton } from './SupafundDashboardButton';

const { Text } = Typography;

export const MainHeader = () => {
  const [isFirstRunModalOpen, setIsFirstRunModalOpen] = useState(false);
  const handleModalClose = useCallback(() => setIsFirstRunModalOpen(false), []);
  const { selectedService } = useServices();
  const serviceLabel = useMemo(() => {
    if (!selectedService?.service_config_id) {
      return 'Supafund Agent';
    }
    return selectedService.name ?? 'Supafund Agent';
  }, [selectedService]);

  return (
    <CardSection gap={6} padding="12px 20px">
      <Flex
        justify="space-between"
        align="center"
        style={{ minHeight: '32px' }}
      >
        {/* Left: Agent info and main control */}
        <Flex justify="start" align="center" gap={12}>
          <AgentHead />
          <Flex vertical gap={0}>
            <Text strong style={{ lineHeight: 1 }}>
              {serviceLabel}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Supafund staking companion
            </Text>
          </Flex>
          <AgentButton />
          <FirstRunModal
            open={isFirstRunModalOpen}
            onClose={handleModalClose}
          />
        </Flex>

        {/* Right: Compact action buttons */}
        <Flex gap={6} align="center">
          <SupafundSettingsButton />
        </Flex>
      </Flex>
    </CardSection>
  );
};
