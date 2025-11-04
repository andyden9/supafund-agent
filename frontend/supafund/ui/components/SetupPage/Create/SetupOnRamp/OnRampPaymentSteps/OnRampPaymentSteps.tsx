import { useEffect } from 'react';

import { TransactionSteps } from '@/supafund/ui/components/ui/TransactionSteps';
import { EvmChainId } from '@/supafund/core/constants/chains';
import { Pages } from '@/supafund/core/enums/Pages';
import { useOnRampContext } from '@/supafund/core/hooks/useOnRampContext';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { delayInSeconds } from '@/supafund/core/utils/delay';

import { useBuyCryptoStep } from './useBuyCryptoStep';
import { useCreateAndTransferFundsToMasterSafeSteps } from './useCreateAndTransferFundsToMasterSafeSteps';
import { useSwapFundsStep } from './useSwapFundsStep';

type OnRampPaymentStepsProps = {
  onRampChainId: EvmChainId;
};

/**
 * Steps for the OnRamp payment process.
 * 1. Buy crypto
 * 2. Swap funds
 * 3. Create Master Safe
 * 4. Transfer funds to the Master Safe
 */
export const OnRampPaymentSteps = ({
  onRampChainId,
}: OnRampPaymentStepsProps) => {
  const { goto } = usePageState();
  const { isOnRampingStepCompleted, isSwappingFundsStepCompleted } =
    useOnRampContext();

  // step 1: Buy crypto
  const buyCryptoStep = useBuyCryptoStep();

  // step 2: Swap funds
  const { tokensToBeTransferred, step: swapStep } =
    useSwapFundsStep(onRampChainId);

  // step 3 & 4: Create Master Safe and transfer funds
  const {
    isMasterSafeCreatedAndFundsTransferred,
    steps: createAndTransferFundsToMasterSafeSteps,
  } = useCreateAndTransferFundsToMasterSafeSteps(
    isSwappingFundsStepCompleted,
    tokensToBeTransferred,
  );

  // Navigate to the main page after all steps are completed
  useEffect(() => {
    if (!isOnRampingStepCompleted) return;
    if (!isSwappingFundsStepCompleted) return;
    if (!isMasterSafeCreatedAndFundsTransferred) return;

    // Delay to ensure the UI updates before navigating
    delayInSeconds(1).then(() => goto(Pages.Main));
  }, [
    isOnRampingStepCompleted,
    isMasterSafeCreatedAndFundsTransferred,
    isSwappingFundsStepCompleted,
    goto,
  ]);

  return (
    <TransactionSteps
      steps={[
        buyCryptoStep,
        swapStep,
        ...createAndTransferFundsToMasterSafeSteps,
      ]}
    />
  );
};
