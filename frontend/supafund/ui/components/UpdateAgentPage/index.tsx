import { ConfigProvider } from 'antd';

import { SupafundUpdateSetup } from '@/supafund/components/sections/UpdateSetup';
import { LOCAL_FORM_THEME } from '@/supafund/core/theme';

import { UpdateAgentProvider } from './context/UpdateAgentProvider';

export const UpdateAgentPage = () => (
  <UpdateAgentProvider>
    <ConfigProvider theme={LOCAL_FORM_THEME}>
      <SupafundUpdateSetup />
    </ConfigProvider>
  </UpdateAgentProvider>
);
