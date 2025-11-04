import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { TEN_SECONDS_INTERVAL } from '@/supafund/core/constants/intervals';
import { REACT_QUERY_KEYS } from '@/supafund/core/constants/react-query-keys';
import { OnlineStatusContext } from '@/supafund/core/providers/OnlineStatusProvider';
import { BridgeService } from '@/supafund/core/services/Bridge';
import { BridgeRefillRequirementsRequest } from '@/supafund/core/types/Bridge';

export const useBridgeRefillRequirements = (
  params: BridgeRefillRequirementsRequest | null,
  canPoll: boolean = true,
  enabled: boolean = true,
) => {
  const { isOnline } = useContext(OnlineStatusContext);

  return useQuery({
    queryKey: REACT_QUERY_KEYS.BRIDGE_REFILL_REQUIREMENTS_KEY(params!),
    queryFn: async ({ signal }) => {
      if (!params) {
        window.console.warn(
          'No parameters provided for bridge refill requirements',
        );
        return null;
      }

      if (!enabled && !canPoll) return null;

      const response = await BridgeService.getBridgeRefillRequirements(
        params,
        signal,
      );

      return response;
    },

    refetchInterval: enabled && canPoll ? TEN_SECONDS_INTERVAL : false,
    refetchOnWindowFocus: false,
    enabled: isOnline && !!params && !!enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchIntervalInBackground: true,
  });
};
