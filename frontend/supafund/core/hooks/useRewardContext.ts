import { useContext } from 'react';

import { RewardContext } from '@/supafund/core/providers/RewardProvider';

export const useRewardContext = () => useContext(RewardContext);
