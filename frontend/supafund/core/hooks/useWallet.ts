import { useContext } from 'react';

import { MasterWalletContext } from '@/supafund/core/providers/MasterWalletProvider';

export const useMasterWalletContext = () => useContext(MasterWalletContext);
