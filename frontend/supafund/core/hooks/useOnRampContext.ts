import { useContext } from 'react';

import { OnRampContext } from '@/supafund/core/providers/OnRampProvider';

export const useOnRampContext = () => {
  const context = useContext(OnRampContext);
  if (!context) {
    throw new Error('useOnRampContext must be used within OnRampProvider');
  }
  return context;
};
