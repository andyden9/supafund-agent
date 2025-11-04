import { Contract as MulticallContract } from 'ethers-multicall';

import { AgentType } from '@/supafund/core/enums/Agent';
import { EvmChainId } from '@/supafund/core/enums/Chain';
import { STAKING_PROGRAM_IDS, StakingProgramId } from '@/supafund/core/enums/StakingProgram';
import { Address } from '@/supafund/core/types/Address';

import { MechType } from '../mechs';
import {
  GNOSIS_STAKING_PROGRAMS,
  GNOSIS_STAKING_PROGRAMS_CONTRACT_ADDRESSES,
} from './gnosis';

/**
 * Single non-chain specific staking program configuration
 */
export type StakingProgramConfig = {
  chainId: EvmChainId;
  deprecated?: boolean; // hides program from UI unless user is already staked in this program
  name: string;
  agentsSupported: AgentType[];
  stakingRequirements: {
    [tokenSymbol: string]: number;
  };
  contract: MulticallContract;
  mechType?: MechType;
  mech?: MulticallContract;
  activityChecker: MulticallContract;
};

export type StakingProgramMap = {
  [stakingProgramId: string]: StakingProgramConfig;
};

export const STAKING_PROGRAMS: {
  [chainId in EvmChainId]?: StakingProgramMap;
} = {
  [EvmChainId.Gnosis]: GNOSIS_STAKING_PROGRAMS,
};

export const STAKING_PROGRAM_ADDRESS: {
  [chainId in EvmChainId]?: Record<string, Address>;
} = {
  [EvmChainId.Gnosis]: GNOSIS_STAKING_PROGRAMS_CONTRACT_ADDRESSES,
};

export const DEFAULT_STAKING_PROGRAM_IDS: {
  [chainId in EvmChainId]?: StakingProgramId;
} = {
  [EvmChainId.Gnosis]: STAKING_PROGRAM_IDS.SupafundTest,
};
