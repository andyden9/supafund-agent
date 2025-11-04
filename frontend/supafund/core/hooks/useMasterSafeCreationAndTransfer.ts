import { useMutation } from '@tanstack/react-query';

import { TokenSymbol } from '@/supafund/core/constants/token';
import { EXPLORER_URL_BY_MIDDLEWARE_CHAIN } from '@/supafund/core/constants/urls';
import { useBackupSigner } from '@/supafund/core/hooks/useBackupSigner';
import { useElectronApi } from '@/supafund/core/hooks/useElectronApi';
import { useServices } from '@/supafund/core/hooks/useServices';
import { WalletService } from '@/supafund/core/services/Wallet';
import { BridgingStepStatus } from '@/supafund/core/types/Bridge';

/**
 * Hook to create master safe and transfer funds.
 */
export const useMasterSafeCreationAndTransfer = (
  tokenSymbols: TokenSymbol[],
) => {
  const electronApi = useElectronApi();
  const backupSignerAddress = useBackupSigner();
  const { selectedAgentType, selectedAgentConfig } = useServices();

  const chain = selectedAgentConfig.middlewareHomeChainId;

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await WalletService.createSafe(
          chain,
          backupSignerAddress,
        );

        return {
          isSafeCreated: true,
          txnLink: `${EXPLORER_URL_BY_MIDDLEWARE_CHAIN[chain]}/tx/${response.create_tx}`,

          // NOTE: Currently, both creation and transfer are handled in the same API call.
          // Hence, the response contains the transfer status as well.
          masterSafeTransferStatus: 'FINISHED',
          transfers: tokenSymbols.map((symbol) => ({
            symbol,
            status: 'finish' as BridgingStepStatus,
            txnLink: null, // TODO: to integrate
          })),
        };
      } catch (error) {
        console.error('Safe creation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Since the master safe is created and the transfer is completed,
      // we can update the store to indicate that the agent is initially funded.
      // TODO: logic to be moved to BE in the future.
      electronApi.store?.set?.(`${selectedAgentType}.isInitialFunded`, true);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
