import { ConfigProvider, Typography } from 'antd';
import React from 'react';

import { CardFlex } from '@/supafund/ui/components/styled/CardFlex';
import { SERVICE_TEMPLATES } from '@/supafund/core/constants/serviceTemplates';
import { SetupScreen } from '@/supafund/core/enums/SetupScreen';
import { SupafundAgentForm } from '@/supafund/components/sections/SetupForm/SupafundAgentForm';
import { LOCAL_FORM_THEME } from '@/supafund/core/theme';

import { SetupCreateHeader } from '../Create/SetupCreateHeader';

const { Title, Text } = Typography;

export const SetupYourAgent = () => {
  const [serviceTemplate] = SERVICE_TEMPLATES;

  if (!serviceTemplate) {
    return (
      <Text type="secondary">Supafund service template could not be found.</Text>
    );
  }

  return (
    <ConfigProvider theme={LOCAL_FORM_THEME}>
      <CardFlex gap={10} styles={{ body: { padding: '12px 24px' } }} noBorder>
        <SetupCreateHeader prev={SetupScreen.AgentIntroduction} />
        <Title level={3} className="mb-0">
          Set up your agent
        </Title>

        <SupafundAgentForm serviceTemplate={serviceTemplate} />
      </CardFlex>
    </ConfigProvider>
  );
};
