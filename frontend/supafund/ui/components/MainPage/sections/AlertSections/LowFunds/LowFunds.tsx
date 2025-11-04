import { isEmpty, round } from 'lodash';
import { useMemo } from 'react';

import { getNativeTokenSymbol } from '@/supafund/core/config/tokens';
import { TokenSymbol } from '@/supafund/core/enums/Token';
import {
  useBalanceContext,
  useMasterBalances,
} from '@/supafund/core/hooks/useBalanceContext';
import { useNeedsFunds } from '@/supafund/core/hooks/useNeedsFunds';
import { useServices } from '@/supafund/core/hooks/useServices';
import { useStakingProgram } from '@/supafund/core/hooks/useStakingProgram';

import { EmptyFunds } from './EmptyFunds';
import { LowOperatingBalanceAlert } from './LowOperatingBalanceAlert';
import { LowSafeSignerBalanceAlert } from './LowSafeSignerBalanceAlert';
import { MainNeedsFunds } from './MainNeedsFunds';

export const LowFunds = () => {
  const { selectedAgentConfig } = useServices();
  const { selectedStakingProgramId } = useStakingProgram();
  const { totalStakedOlasBalance } = useBalanceContext();
  const { isMasterEoaLowOnGas, masterEoaGasRequirement } = useMasterBalances();

  const { balancesByChain, isInitialFunded } = useNeedsFunds(
    selectedStakingProgramId,
  );

  const chainId = selectedAgentConfig.evmHomeChainId;

  // Show the empty funds alert if the agent is not funded
  const isEmptyFundsVisible = useMemo(() => {
    if (isEmpty(balancesByChain)) return false;

    // If the agent is not funded, <MainNeedsFunds /> will be displayed
    if (!isInitialFunded) return false;

    const olasOnChain = balancesByChain[chainId][TokenSymbol.OLAS];

    if (
      round(balancesByChain[chainId][getNativeTokenSymbol(chainId)], 4) === 0 &&
      round(olasOnChain + (totalStakedOlasBalance ?? 0), 4) === 0 &&
      isMasterEoaLowOnGas
    ) {
      return true;
    }

    return false;
  }, [
    isInitialFunded,
    chainId,
    isMasterEoaLowOnGas,
    totalStakedOlasBalance,
    balancesByChain,
  ]);

  if (selectedAgentConfig.isUnderConstruction) return null;

  return (
    <>
      {isEmptyFundsVisible && (
        <EmptyFunds requiredSignerFunds={masterEoaGasRequirement} />
      )}
      <MainNeedsFunds />
      <LowOperatingBalanceAlert />
      {!isEmptyFundsVisible && isMasterEoaLowOnGas && (
        <LowSafeSignerBalanceAlert
          requiredSignerFunds={masterEoaGasRequirement}
        />
      )}
    </>
  );
};
