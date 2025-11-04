import { useCallback } from 'react';

import { Bridge } from '@/supafund/ui/components/Bridge/Bridge';
import { AllEvmChainIdMap } from '@/supafund/core/constants/chains';
import { SetupScreen } from '@/supafund/core/enums/SetupScreen';
import { useSetup } from '@/supafund/core/hooks/useSetup';

import { useGetBridgeRequirementsParams } from '@/supafund/ui/components/SetupPage/Create/hooks/useGetBridgeRequirementsParams';

const BRIDGE_FROM_MESSAGE =
  'The bridged amount covers all funds required to create your account and run your agent, including fees. No further funds will be needed.';

export const SetupBridgeOnboarding = () => {
  const { goto: gotoSetup } = useSetup();

  // Bridging is supported only for Ethereum at the moment.
  const getBridgeRequirementsParams = useGetBridgeRequirementsParams(
    AllEvmChainIdMap.Ethereum,
  );

  const handlePrevStep = useCallback(() => {
    gotoSetup(SetupScreen.SetupEoaFunding);
  }, [gotoSetup]);

  return (
    <Bridge
      enabledStepsAfterBridging={['masterSafeCreationAndTransfer']}
      bridgeFromDescription={BRIDGE_FROM_MESSAGE}
      getBridgeRequirementsParams={getBridgeRequirementsParams}
      onPrevBeforeBridging={handlePrevStep}
    />
  );
};
