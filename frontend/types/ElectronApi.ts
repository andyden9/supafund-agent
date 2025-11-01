import { AgentType } from '@/enums/Agent';

import { BackupWalletType } from './BackupWallet';
import { Nullable } from './Util';

type AgentSettings = {
  isInitialFunded: boolean;
};

export type ElectronStore = {
  // Global settings
  environmentName?: string;
  lastSelectedAgentType?: AgentType;
  knownVersion?: string;
  [key: string]: unknown;

  // First time user settings
  firstStakingRewardAchieved?: boolean;
  firstRewardNotificationShown?: boolean;
  agentEvictionAlertShown?: boolean;

  // Each agent has its own settings
  [AgentType.Supafund]?: AgentSettings;
  lastProvidedBackupWallet?: {
    address: Nullable<string>;
    type: BackupWalletType;
  };
};

export type ElectronTrayIconStatus =
  | 'low-gas'
  | 'running'
  | 'paused'
  | 'logged-out';
