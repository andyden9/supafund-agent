import { useContext } from 'react';

import { StoreContext } from '@/supafund/core/providers/StoreProvider';

export const useStore = () => useContext(StoreContext);
