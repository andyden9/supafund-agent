export const STAKING_PROGRAM_IDS = {
  SupafundTest: 'supafund_test',
} as const;

export type StakingProgramId = (typeof STAKING_PROGRAM_IDS)[keyof typeof STAKING_PROGRAM_IDS];
