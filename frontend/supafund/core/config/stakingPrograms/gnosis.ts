import { Contract as MulticallContract } from 'ethers-multicall';

import { STAKING_TOKEN_PROXY_ABI } from '@/abis/stakingTokenProxy';
import { AgentType } from '@/supafund/core/enums/Agent';
import { EvmChainId } from '@/supafund/core/enums/Chain';
import { STAKING_PROGRAM_IDS } from '@/supafund/core/enums/StakingProgram';
import { TokenSymbol } from '@/supafund/core/enums/Token';
import { Address } from '@/supafund/core/types/Address';

import { GNOSIS_STAKING_PROGRAMS_ACTIVITY_CHECKERS } from '../activityCheckers';
import { MECHS, MechType } from '../mechs';
import { StakingProgramMap } from '.';

const SUPAFUND_CONTRACT_ADDRESS =
  '0x2540Ea7b11a557957a913E7Ef314A9aF28472c08';

export const GNOSIS_STAKING_PROGRAMS_CONTRACT_ADDRESSES: Record<
  string,
  Address
> = {
  [STAKING_PROGRAM_IDS.SupafundTest]: SUPAFUND_CONTRACT_ADDRESS,
} as const;

export const GNOSIS_STAKING_PROGRAMS: StakingProgramMap = {
  [STAKING_PROGRAM_IDS.SupafundTest]: {
    chainId: EvmChainId.Gnosis,
    name: 'Supafund Agent test',
    agentsSupported: [AgentType.Supafund],
    stakingRequirements: {
      [TokenSymbol.OLAS]: 2, // display hint; min deposit 1 -> total stake ~2
    },
    mechType: MechType.Agent,
    mech: MECHS[EvmChainId.Gnosis][MechType.Agent].contract,
    activityChecker:
      GNOSIS_STAKING_PROGRAMS_ACTIVITY_CHECKERS[
        STAKING_PROGRAM_IDS.SupafundTest
      ],
    contract: new MulticallContract(
      GNOSIS_STAKING_PROGRAMS_CONTRACT_ADDRESSES[
        STAKING_PROGRAM_IDS.SupafundTest
      ],
      STAKING_TOKEN_PROXY_ABI,
    ),
  },
} as const;
