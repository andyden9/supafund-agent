import { Contract as MulticallContract } from 'ethers-multicall';

import { REQUESTER_ACTIVITY_CHECKER_ABI } from '@/abis/requesterActivityChecker';
import { STAKING_PROGRAM_IDS } from '@/supafund/core/enums/StakingProgram';
import { Address } from '@/supafund/core/types/Address';

const getRequesterActivityCheckerContract = (
  address: Address,
): MulticallContract =>
  new MulticallContract(address, REQUESTER_ACTIVITY_CHECKER_ABI);

export const GNOSIS_STAKING_PROGRAMS_ACTIVITY_CHECKERS: Record<
  string,
  MulticallContract
> = {
  [STAKING_PROGRAM_IDS.SupafundTest]: getRequesterActivityCheckerContract(
    '0x5E082F4a01b842f5E8b5b39CE74fa8E6198fCc22',
  ),
} as const;
