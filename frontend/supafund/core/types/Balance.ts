import { EvmChainId } from '@/supafund/core/enums/Chain';
import { TokenSymbol } from '@/supafund/core/enums/Token';
import { Address } from '@/supafund/core/types/Address';

export type WalletBalance = {
  walletAddress: Address;
  evmChainId: EvmChainId;
  symbol: TokenSymbol;
  isNative: boolean;
  balance: number;
  isWrappedToken?: boolean;
};

export type CrossChainStakedBalances = Array<{
  serviceId: string;
  evmChainId: number;
  olasBondBalance: number;
  olasDepositBalance: number;
  walletAddress: Address;
}>;
