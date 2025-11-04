import { QueryObserverResult, useQuery } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useMemo } from 'react';

import {
  AddressBalanceRecord,
  BalancesAndFundingRequirements,
  MasterSafeBalanceRecord,
} from '@/supafund/core/client';
import {
  FIVE_SECONDS_INTERVAL,
  ONE_MINUTE_INTERVAL,
} from '@/supafund/core/constants/intervals';
import { REACT_QUERY_KEYS } from '@/supafund/core/constants/react-query-keys';
import { useOnlineStatusContext } from '@/supafund/core/hooks/useOnlineStatus';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useService } from '@/supafund/core/hooks/useService';
import { useServices } from '@/supafund/core/hooks/useServices';
import { BalanceService } from '@/supafund/core/services/balances';
import { Nullable, Optional } from '@/supafund/core/types/Util';
import { asMiddlewareChain } from '@/supafund/core/utils/middlewareHelpers';

export const BalancesAndRefillRequirementsProviderContext = createContext<{
  isBalancesAndFundingRequirementsLoading: boolean;
  balances: Optional<AddressBalanceRecord>;
  refillRequirements: Optional<AddressBalanceRecord | MasterSafeBalanceRecord>;
  totalRequirements: Optional<AddressBalanceRecord | MasterSafeBalanceRecord>;
  canStartAgent: boolean;
  isRefillRequired: boolean;
  refetch: Nullable<
    () => Promise<QueryObserverResult<BalancesAndFundingRequirements, Error>>
  >;
}>({
  isBalancesAndFundingRequirementsLoading: false,
  balances: undefined,
  refillRequirements: undefined,
  totalRequirements: undefined,
  canStartAgent: false,
  isRefillRequired: false,
  refetch: null,
});

export const BalancesAndRefillRequirementsProvider = ({
  children,
}: PropsWithChildren) => {
  const { isUserLoggedIn } = usePageState();
  const { selectedService, selectedAgentConfig } = useServices();
  const { isOnline } = useOnlineStatusContext();
  const configId = selectedService?.service_config_id;
  const chainId = selectedAgentConfig.evmHomeChainId;

  const { isServiceRunning } = useService(configId);

  const refetchInterval = useMemo(() => {
    if (!configId) return false;

    // If the service is running, we can afford to check balances less frequently
    if (isServiceRunning) return ONE_MINUTE_INTERVAL;

    return FIVE_SECONDS_INTERVAL;
  }, [isServiceRunning, configId]);

  const {
    data: balancesAndRefillRequirements,
    isLoading: isBalancesAndFundingRequirementsLoading,
    refetch,
  } = useQuery<BalancesAndFundingRequirements>({
    queryKey: REACT_QUERY_KEYS.BALANCES_AND_REFILL_REQUIREMENTS_KEY(
      configId as string,
    ),
    queryFn: ({ signal }) =>
      BalanceService.getBalancesAndRefillRequirements({
        serviceConfigId: configId!,
        signal,
      }),
    enabled: !!configId && isUserLoggedIn && isOnline,
    refetchInterval,
  });

  const balances = useMemo(() => {
    if (isBalancesAndFundingRequirementsLoading) return;
    if (!balancesAndRefillRequirements) return;

    return balancesAndRefillRequirements.balances[asMiddlewareChain(chainId)];
  }, [
    isBalancesAndFundingRequirementsLoading,
    chainId,
    balancesAndRefillRequirements,
  ]);

  const refillRequirements = useMemo(() => {
    if (isBalancesAndFundingRequirementsLoading) return;
    if (!balancesAndRefillRequirements) return;

    return balancesAndRefillRequirements.refill_requirements[
      asMiddlewareChain(chainId)
    ];
  }, [
    isBalancesAndFundingRequirementsLoading,
    chainId,
    balancesAndRefillRequirements,
  ]);

  const totalRequirements = useMemo(() => {
    if (isBalancesAndFundingRequirementsLoading) return;
    if (!balancesAndRefillRequirements) return;

    return balancesAndRefillRequirements.total_requirements[
      asMiddlewareChain(chainId)
    ];
  }, [
    isBalancesAndFundingRequirementsLoading,
    chainId,
    balancesAndRefillRequirements,
  ]);

  return (
    <BalancesAndRefillRequirementsProviderContext.Provider
      value={{
        isBalancesAndFundingRequirementsLoading,
        refillRequirements,
        balances,
        totalRequirements,
        canStartAgent:
          balancesAndRefillRequirements?.allow_start_agent || false,
        isRefillRequired:
          balancesAndRefillRequirements?.is_refill_required || false,
        refetch: refetch || null,
      }}
    >
      {children}
    </BalancesAndRefillRequirementsProviderContext.Provider>
  );
};
