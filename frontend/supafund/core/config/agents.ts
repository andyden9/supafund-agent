import { MiddlewareChain } from '@/supafund/core/client';
import { AgentType } from '@/supafund/core/enums/Agent';
import { EvmChainId } from '@/supafund/core/enums/Chain';
import { SupafundService } from '@/supafund/core/services/agents/Supafund';
import { AgentConfig } from '@/supafund/core/types/Agent';

export const AGENT_CONFIG: Partial<Record<AgentType, AgentConfig>> = {
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
