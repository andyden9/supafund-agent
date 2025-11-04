import { ConfigProvider, Typography } from 'antd';

import { CustomAlert } from '@/supafund/ui/components/Alert';
import { CardFlex } from '@/supafund/ui/components/styled/CardFlex';
import { SetupCreateHeader } from '@/supafund/ui/components/SetupPage/Create/SetupCreateHeader';
import { SERVICE_TEMPLATES } from '@/supafund/core/constants/serviceTemplates';
import { AgentType } from '@/supafund/core/enums/Agent';
import { SetupScreen } from '@/supafund/core/enums/SetupScreen';
import { useServices } from '@/supafund/core/hooks/useServices';
import { LOCAL_FORM_THEME } from '@/supafund/core/theme';

import { SupafundAgentForm } from '../sections/SetupForm/SupafundAgentForm';

const { Title, Text } = Typography;

export const SupafundSetupPage = () => {
  const { selectedAgentType } = useServices();
  const serviceTemplate = SERVICE_TEMPLATES.find(
    (template) => template.agentType === AgentType.Supafund,
  );

  if (selectedAgentType !== AgentType.Supafund || !serviceTemplate) {
    return (
      <CustomAlert
        type="error"
        showIcon
        message={<Text>This page is only for Supafund agent setup!</Text>}
        className="mb-8"
      />
    );
  }

  return (
    <ConfigProvider theme={LOCAL_FORM_THEME}>
      <CardFlex gap={10} styles={{ body: { padding: '12px 24px' } }} noBorder>
        <SetupCreateHeader prev={SetupScreen.AgentIntroduction} />
        <Title level={3} className="mb-0">
          Set up your Supafund agent
        </Title>
        <SupafundAgentForm serviceTemplate={serviceTemplate} />
      </CardFlex>
    </ConfigProvider>
  );
};
