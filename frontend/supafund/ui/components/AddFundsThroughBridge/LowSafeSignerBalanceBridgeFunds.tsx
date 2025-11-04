import { CHAIN_CONFIG } from '@/supafund/core/config/chains';
import { useMasterBalances } from '@/supafund/core/hooks/useBalanceContext';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useMasterWalletContext } from '@/supafund/core/hooks/useWallet';

import { AddFundsThroughBridge } from './AddFundsThroughBridge';

/**
 * Add funds through bridge for safe signer with low balance (master EOA).
 */
export const LowSafeSignerBalanceBridgeFunds = () => {
  const { masterEoaGasRequirement } = useMasterBalances();
  const { masterEoa } = useMasterWalletContext();
  const { selectedAgentConfig } = useServices();

  const homeChainId = selectedAgentConfig.evmHomeChainId;
  const symbol = CHAIN_CONFIG[homeChainId].nativeToken.symbol;

  return (
    <AddFundsThroughBridge
      defaultTokenAmounts={[{ symbol, amount: masterEoaGasRequirement ?? 0 }]}
      destinationAddress={masterEoa?.address}
      onlyNativeToken={true}
      completionMessage="Funds have been bridged to your Pearl Safe Signer."
    />
  );
};
