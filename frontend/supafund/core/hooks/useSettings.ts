import { useContext } from 'react';

import { SettingsContext } from '@/supafund/core/providers/SettingsProvider';

export const useSettings = () => useContext(SettingsContext);
