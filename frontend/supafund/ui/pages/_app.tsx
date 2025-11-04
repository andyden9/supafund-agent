import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';

import { Layout } from '@/supafund/ui/components/Layout/Layout';
import { AgentUiProvider } from '@/supafund/core/providers/AgentUiProvider';
import { BalanceProvider } from '@/supafund/core/providers/BalanceProvider/BalanceProvider';
import { BalancesAndRefillRequirementsProvider } from '@/supafund/core/providers/BalancesAndRefillRequirementsProvider';
import { ElectronApiProvider } from '@/supafund/core/providers/ElectronApiProvider';
import { MasterWalletProvider } from '@/supafund/core/providers/MasterWalletProvider';
import { MessageProvider } from '@/supafund/core/providers/MessageProvider';
import { ModalProvider } from '@/supafund/core/providers/ModalProvider';
import { OnlineStatusProvider } from '@/supafund/core/providers/OnlineStatusProvider';
import { OnRampProvider } from '@/supafund/core/providers/OnRampProvider';
import { PageStateProvider } from '@/supafund/core/providers/PageStateProvider';
import { RewardProvider } from '@/supafund/core/providers/RewardProvider';
import { ServicesProvider } from '@/supafund/core/providers/ServicesProvider';
import { SettingsProvider } from '@/supafund/core/providers/SettingsProvider';
import { SetupProvider } from '@/supafund/core/providers/SetupProvider';
import { SharedProvider } from '@/supafund/core/providers/SharedProvider/SharedProvider';
import { StakingContractDetailsProvider } from '@/supafund/core/providers/StakingContractDetailsProvider';
import { StakingProgramProvider } from '@/supafund/core/providers/StakingProgramProvider';
import { StoreProvider } from '@/supafund/core/providers/StoreProvider';
import { SystemNotificationTriggers } from '@/supafund/core/providers/SystemNotificationTriggers';
import { mainTheme } from '@/supafund/core/theme';

const queryClient = new QueryClient();

// Expose queryClient to window for debugging in browser mode
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}

export default function App({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <OnlineStatusProvider>
      <ElectronApiProvider>
        <StoreProvider>
          <QueryClientProvider client={queryClient}>
            <PageStateProvider>
              <ServicesProvider>
                <MasterWalletProvider>
                  <StakingProgramProvider>
                    <StakingContractDetailsProvider>
                      <RewardProvider>
                        <BalanceProvider>
                          <BalancesAndRefillRequirementsProvider>
                            <SetupProvider>
                              <SettingsProvider>
                                <ConfigProvider theme={mainTheme}>
                                  <MessageProvider>
                                    <ModalProvider>
                                      <SharedProvider>
                                        <OnRampProvider>
                                          {isMounted ? (
                                            <SystemNotificationTriggers>
                                              <AgentUiProvider>
                                                <Layout>
                                                  <Component {...pageProps} />
                                                </Layout>
                                              </AgentUiProvider>
                                            </SystemNotificationTriggers>
                                          ) : null}
                                        </OnRampProvider>
                                      </SharedProvider>
                                    </ModalProvider>
                                  </MessageProvider>
                                </ConfigProvider>
                              </SettingsProvider>
                            </SetupProvider>
                          </BalancesAndRefillRequirementsProvider>
                        </BalanceProvider>
                      </RewardProvider>
                    </StakingContractDetailsProvider>
                  </StakingProgramProvider>
                </MasterWalletProvider>
              </ServicesProvider>
            </PageStateProvider>
          </QueryClientProvider>
        </StoreProvider>
      </ElectronApiProvider>
    </OnlineStatusProvider>
  );
}
