import { ValueOf } from '@/types/Util';

export const STAKING_PROGRAM_IDS = {
  SupafundTest: 'supafund_test',
} as const;

export type StakingProgramId = ValueOf<typeof STAKING_PROGRAM_IDS>;
