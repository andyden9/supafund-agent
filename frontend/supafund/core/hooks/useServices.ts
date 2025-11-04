import { useContext } from 'react';

import { ServicesContext } from '@/supafund/core/providers/ServicesProvider';

export const useServices = () => useContext(ServicesContext);
