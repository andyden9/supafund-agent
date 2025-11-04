import { useMemo } from 'react';

import { useService } from '@/supafund/core/hooks/useService';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useMasterWalletContext } from '@/supafund/core/hooks/useWallet';

export const useYourWallet = () => {
  const { selectedAgentConfig, selectedService } = useServices();
  const { serviceSafes } = useService(selectedService?.service_config_id);
  const { isLoading: isMasterSafeLoading, masterSafes } =
    useMasterWalletContext();

  const evmHomeChainId = selectedAgentConfig?.evmHomeChainId;

  // master safe
  const masterSafe = useMemo(() => {
    return masterSafes?.find(({ evmChainId }) => evmChainId === evmHomeChainId);
  }, [masterSafes, evmHomeChainId]);

  // agent safe
  const serviceSafe = useMemo(() => {
    return serviceSafes?.find(
      ({ evmChainId }) => evmChainId === evmHomeChainId,
    );
  }, [serviceSafes, evmHomeChainId]);

  return {
    middlewareChain: selectedAgentConfig?.middlewareHomeChainId,
    evmHomeChainId,
    isMasterSafeLoading,
    masterSafeAddress: masterSafe?.address,
    serviceSafe,
  };
};
