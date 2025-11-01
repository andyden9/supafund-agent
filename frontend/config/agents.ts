import { MiddlewareChain } from '@/client';
import { AgentType } from '@/enums/Agent';
import { EvmChainId } from '@/enums/Chain';
import { SupafundService } from '@/service/agents/Supafund';
import { AgentConfig } from '@/types/Agent';

export const AGENT_CONFIG: {
  [key in AgentType]: AgentConfig;
} = {
  [AgentType.Supafund]: {
    isAgentEnabled: true,
    requiresSetup: true,
    name: 'Supafund Agent',
    evmHomeChainId: EvmChainId.Gnosis,
    middlewareHomeChainId: MiddlewareChain.GNOSIS,
    requiresAgentSafesOn: [EvmChainId.Gnosis],
    requiresMasterSafesOn: [EvmChainId.Gnosis],
    serviceApi: SupafundService,
    displayName: 'Supafund agent',
    description:
      'Predicts whether emerging projects will achieve key milestones, providing detailed AI-powered analysis of exciting new projects.',
    hasExternalFunds: false,
  },
};
