import { useContext } from 'react';

import { ElectronApiContext } from '@/supafund/core/providers/ElectronApiProvider';

export const useElectronApi = () => useContext(ElectronApiContext);
