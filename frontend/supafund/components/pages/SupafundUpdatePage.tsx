import { ConfigProvider } from 'antd';

import { AgentType } from '@/enums/Agent';
import { useServices } from '@/hooks/useServices';
import { LOCAL_FORM_THEME } from '@/theme';

import { SupafundUpdateSetup } from '../sections/UpdateSetup';

export const SupafundUpdatePage = () => {
  const { selectedAgentType } = useServices();

  if (selectedAgentType !== AgentType.Supafund) {
    return null;
  }

  return (
    <ConfigProvider theme={LOCAL_FORM_THEME}>
      <SupafundUpdateSetup />
    </ConfigProvider>
  );
};
