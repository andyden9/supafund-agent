import { ConfigProvider, Typography } from 'antd';

import { CustomAlert } from '@/components/Alert';
import { CardFlex } from '@/components/styled/CardFlex';
import { SetupCreateHeader } from '@/components/SetupPage/Create/SetupCreateHeader';
import { SERVICE_TEMPLATES } from '@/constants/serviceTemplates';
import { AgentType } from '@/enums/Agent';
import { SetupScreen } from '@/enums/SetupScreen';
import { useServices } from '@/hooks/useServices';
import { LOCAL_FORM_THEME } from '@/theme';

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
