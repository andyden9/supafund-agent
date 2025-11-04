import { useContext } from 'react';

import { BalancesAndRefillRequirementsProviderContext } from '@/supafund/core/providers/BalancesAndRefillRequirementsProvider';

export const useBalanceAndRefillRequirementsContext = () =>
  useContext(BalancesAndRefillRequirementsProviderContext);
