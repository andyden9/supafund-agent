import { StakingProgramStatus } from '@/supafund/core/enums/StakingProgramStatus';

import { Address } from './Address';

export type StakingProgram = {
  name: string;
  rewardsPerWorkPeriod: number;
  requiredOlasForStaking: number;
  isEnoughSlots?: boolean;
  status: StakingProgramStatus;
  contractAddress: Address;
};
