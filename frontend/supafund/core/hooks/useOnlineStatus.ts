import { useContext } from 'react';

import { OnlineStatusContext } from '@/supafund/core/providers/OnlineStatusProvider';

export const useOnlineStatusContext = () => useContext(OnlineStatusContext);
