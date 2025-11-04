import { useContext, useMemo } from 'react';

import {
  STAKING_PROGRAM_ADDRESS,
  STAKING_PROGRAMS,
} from '@/supafund/core/config/stakingPrograms';
import { StakingProgramContext } from '@/supafund/core/providers/StakingProgramProvider';
import { Address } from '@/supafund/core/types/Address';
import { Nullable } from '@/supafund/core/types/Util';

import { useServices } from './useServices';

/**
 * Hook to get the staking program and its metadata.
 */
export const useStakingProgram = () => {
  const {
    isActiveStakingProgramLoaded,
    activeStakingProgramId,
    defaultStakingProgramId,
    selectedStakingProgramId,
    setDefaultStakingProgramId,
  } = useContext(StakingProgramContext);
  const { selectedAgentConfig } = useServices();

  const allStakingProgramsMeta = useMemo(() => {
    return STAKING_PROGRAMS[selectedAgentConfig.evmHomeChainId];
  }, [selectedAgentConfig.evmHomeChainId]);

  const allStakingProgramNameAddressPair =
    STAKING_PROGRAM_ADDRESS[selectedAgentConfig.evmHomeChainId];

  const activeStakingProgramMeta = useMemo(() => {
    if (!isActiveStakingProgramLoaded) return null;
    if (!activeStakingProgramId) return null;
    if (!allStakingProgramsMeta) return null;

    return allStakingProgramsMeta[activeStakingProgramId];
  }, [
    isActiveStakingProgramLoaded,
    allStakingProgramsMeta,
    activeStakingProgramId,
  ]);

  const activeStakingProgramAddress: Nullable<Address> = useMemo(() => {
    if (!activeStakingProgramId) return null;
    return (
      allStakingProgramNameAddressPair?.[activeStakingProgramId] ?? null
    );
  }, [allStakingProgramNameAddressPair, activeStakingProgramId]);

  const defaultStakingProgramMeta = useMemo(() => {
    if (!defaultStakingProgramId) return null;
    return (
      STAKING_PROGRAMS[selectedAgentConfig.evmHomeChainId]?.[
        defaultStakingProgramId
      ] ?? null
    );
  }, [defaultStakingProgramId, selectedAgentConfig.evmHomeChainId]);

  const selectedStakingProgramMeta = useMemo(() => {
    if (!selectedStakingProgramId) return null;
    return (
      STAKING_PROGRAMS[selectedAgentConfig.evmHomeChainId]?.[
        selectedStakingProgramId
      ] ?? null
    );
  }, [selectedAgentConfig.evmHomeChainId, selectedStakingProgramId]);

  return {
    // active staking program
    isActiveStakingProgramLoaded,
    activeStakingProgramId,
    activeStakingProgramAddress,
    activeStakingProgramMeta,

    // default staking program
    defaultStakingProgramId,
    defaultStakingProgramMeta,
    setDefaultStakingProgramId,

    // selected staking program id
    selectedStakingProgramId,
    selectedStakingProgramMeta,

    // all staking programs
    allStakingProgramIds: Object.keys(
      allStakingProgramNameAddressPair ?? {},
    ),
    allStakingProgramAddress: Object.values(
      allStakingProgramNameAddressPair ?? {},
    ),
    allStakingProgramsMeta,
  };
};
