import { ethers } from 'ethers';

import { MiddlewareChain, ServiceTemplate } from '@/supafund/core/client';
import { EnvProvisionMap as EnvProvisionType } from '@/supafund/core/constants/envVariables';
import { AgentType } from '@/supafund/core/enums/Agent';
import { STAKING_PROGRAM_IDS } from '@/supafund/core/enums/StakingProgram';
import { parseEther } from '@/supafund/core/utils/numberFormatters';

// Use DEV_RPC or fallback to localhost for development
const DEFAULT_RPC =
  process.env.DEV_RPC || process.env.GNOSIS_RPC || 'http://localhost:8545';

// Prefix for KPI description used across middleware service definitions
export const KPI_DESC_PREFIX = '[Pearl service]';

/**
 * Base Supafund environment variables
 * (Derived from the original Predict Trader template to preserve middleware compatibility)
 */
const BASE_SUPAFUND_ENV_VARIABLES: ServiceTemplate['env_variables'] = {
  GNOSIS_LEDGER_RPC: {
    name: 'Gnosis ledger RPC',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  STAKING_CONTRACT_ADDRESS: {
    name: 'Staking contract address',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  MECH_MARKETPLACE_CONFIG: {
    name: 'Mech marketplace configuration',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  MECH_ACTIVITY_CHECKER_CONTRACT: {
    name: 'Mech activity checker contract',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  MECH_CONTRACT_ADDRESS: {
    name: 'Mech contract address',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  MECH_REQUEST_PRICE: {
    name: 'Mech request price',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  USE_MECH_MARKETPLACE: {
    name: 'Use Mech marketplace',
    description: '',
    value: '',
    provision_type: EnvProvisionType.COMPUTED,
  },
  TOOLS_ACCURACY_HASH: {
    name: 'Tools accuracy hash',
    description: '',
    value: 'QmWgsqncF22hPLNTyWtDzVoKPJ9gmgR1jcuLL5t31xyzzr',
    provision_type: EnvProvisionType.FIXED,
  },
  ACC_INFO_FIELDS_REQUESTS: {
    name: 'Acc info fields requests',
    description: '',
    value: 'nr_responses',
    provision_type: EnvProvisionType.FIXED,
  },
  MECH_INTERACT_ROUND_TIMEOUT_SECONDS: {
    name: 'Mech interact round timeout',
    description: '',
    value: '900',
    provision_type: EnvProvisionType.FIXED,
  },
  STORE_PATH: {
    name: 'Store path',
    description: '',
    value: 'persistent_data/',
    provision_type: EnvProvisionType.COMPUTED,
  },
  LOG_DIR: {
    name: 'Log directory',
    description: '',
    value: 'benchmarks/',
    provision_type: EnvProvisionType.COMPUTED,
  },
  IRRELEVANT_TOOLS: {
    name: 'Irrelevant tools',
    description: '',
    value:
      '["native-transfer","prediction-online-lite","claude-prediction-online-lite","prediction-online-sme-lite","prediction-request-reasoning-lite","prediction-request-reasoning-claude-lite","prediction-offline-sme","deepmind-optimization","deepmind-optimization-strong","openai-gpt-3.5-turbo","openai-gpt-3.5-turbo-instruct","openai-gpt-4","openai-text-davinci-002","openai-text-davinci-003","prediction-online-sum-url-content","prediction-online-summarized-info","stabilityai-stable-diffusion-512-v2-1","stabilityai-stable-diffusion-768-v2-1","stabilityai-stable-diffusion-v1-5","stabilityai-stable-diffusion-xl-beta-v2-2-2","prediction-url-cot-claude","prediction-url-cot"]',
    provision_type: EnvProvisionType.FIXED,
  },
  GENAI_API_KEY: {
    name: 'Gemini API Key',
    description: 'Gemini API key to allow the agent to use Gemini',
    value: '',
    provision_type: EnvProvisionType.USER,
  },
};

/**
 * Supafund Service Template
 * A specialized prediction market agent for evaluating startup and crypto project milestones
 */
export const SUPAFUND_SERVICE_TEMPLATE: ServiceTemplate = {
  agentType: AgentType.Supafund,
  name: 'Supafund Agent',
  hash: 'bafybeieb2t5mmrzm6jq5mzt626oxo4n66z7ifylzu3acbrlo4oor5y22se',
  description: `${KPI_DESC_PREFIX} Predicts whether emerging projects will achieve key milestones, providing detailed AI-powered analysis`,
  image:
    'https://www.supafund.xyz/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flight.71a38e21.png&w=64&q=75',
  service_version: 'v0.27.3',
  agent_release: {
    is_aea: true,
    repository: {
      owner: 'valory-xyz',
      name: 'trader',
      version: 'v0.27.3',
    },
  },
  home_chain: MiddlewareChain.GNOSIS,
  configurations: {
    [MiddlewareChain.GNOSIS]: {
      staking_program_id: STAKING_PROGRAM_IDS.SupafundTest,
      nft: 'bafybeig64atqaladigoc3ds4arltdu63wkdrk3gesjfvnfdmz35amv7faq',
      rpc: DEFAULT_RPC,
      agent_id: 71,
      cost_of_bond: +parseEther(0.001),
      monthly_gas_estimate: +parseEther(1),
      fund_requirements: {
        [ethers.constants.AddressZero]: {
          agent: +parseEther(0.1),
          safe: +parseEther(5),
        },
      },
    },
  },
  env_variables: {
    ...BASE_SUPAFUND_ENV_VARIABLES,
    RPC_0: {
      name: 'Gnosis RPC (RPC_0)',
      description: 'RPC endpoint used by the ledger connection inside the container',
      value: '',
      provision_type: EnvProvisionType.USER,
    },
    SUPAFUND_WEIGHTS: {
      name: 'Supafund agent weights configuration',
      description:
        'JSON string with weights for: founder_team, market_opportunity, technical_analysis, social_sentiment, tokenomics',
      value:
        '{"founder_team":20,"market_opportunity":20,"technical_analysis":20,"social_sentiment":20,"tokenomics":20}',
      provision_type: EnvProvisionType.USER,
    },
    SUPAFUND_API_ENDPOINT: {
      name: 'Supafund API endpoint',
      description: 'API endpoint for Supafund backend services',
      value: '',
      provision_type: EnvProvisionType.USER,
    },
    SUPAFUND_MARKET_CREATORS: {
      name: 'Supafund market creator addresses',
      description: 'List of addresses that create Supafund prediction markets',
      value: '["0xf765a1FE2E15d0246430CCE854D2c923a85AF388"]',
      provision_type: EnvProvisionType.FIXED,
    },
    CREATOR_PER_SUBGRAPH: {
      name: 'Market creators per subgraph',
      description: 'JSON mapping of subgraph names to creator addresses',
      value: '{"omen_subgraph":["0xf765a1FE2E15d0246430CCE854D2c923a85AF388"]}',
      provision_type: EnvProvisionType.FIXED,
    },
    PRIORITY_MECH_ADDRESS: {
      name: 'Priority Mech contract address',
      description: 'Preferred mech to prioritise when using the marketplace.',
      value: '0x552cEA7Bc33CbBEb9f1D90c1D11D2C6daefFd053',
      provision_type: EnvProvisionType.USER,
    },
    PRIORITY_MECH_SERVICE_ID: {
      name: 'Priority Mech service ID',
      description: 'Service ID corresponding to the priority mech.',
      value: '975',
      provision_type: EnvProvisionType.USER,
    },
    USE_MULTI_BETS_MODE: {
      name: 'Use multi bets mode',
      description: 'Enable multiple concurrent bets mode.',
      value: 'true',
      provision_type: EnvProvisionType.FIXED,
    },
    ENABLE_POSITION_REVIEW: {
      name: 'Enable position review',
      description: 'Toggle additional review round for positions.',
      value: 'false',
      provision_type: EnvProvisionType.FIXED,
    },
    TRADING_STRATEGY: {
      name: 'Trading strategy',
      description: 'Core trading strategy used by the agent.',
      value: 'bet_amount_per_threshold',
      provision_type: EnvProvisionType.FIXED,
    },
    SUBGRAPH_API_KEY: {
      name: 'Subgraph API key',
      description:
        'Subgraph API key can be obtained at https://thegraph.com/studio/apikeys/',
      value: '',
      provision_type: EnvProvisionType.USER,
    },
    CONDITIONAL_TOKENS_SUBGRAPH_URL: {
      name: 'Conditional tokens subgraph URL',
      description: '',
      value:
        'https://gateway-arbitrum.network.thegraph.com/api/{SUBGRAPH_API_KEY}/subgraphs/id/7s9rGBffUTL8kDZuxvvpuc46v44iuDarbrADBFw5uVp2',
      provision_type: EnvProvisionType.COMPUTED,
    },
    NETWORK_SUBGRAPH_URL: {
      name: 'Network subgraph URL',
      description: '',
      value:
        'https://gateway-arbitrum.network.thegraph.com/api/{SUBGRAPH_API_KEY}/subgraphs/id/FxV6YUix58SpYmLBwc9gEHkwjfkqwe1X5FJQjn8nKPyA',
      provision_type: EnvProvisionType.COMPUTED,
    },
    OMEN_SUBGRAPH_URL: {
      name: 'Omen subgraph URL',
      description: '',
      value:
        'https://gateway-arbitrum.network.thegraph.com/api/{SUBGRAPH_API_KEY}/subgraphs/id/9fUVQpFwzpdWS9bq5WkAnmKbNNcoBwatMR4yZq81pbbz',
      provision_type: EnvProvisionType.COMPUTED,
    },
    REALITIO_SUBGRAPH_URL: {
      name: 'Realitio subgraph URL',
      description: '',
      value:
        'https://gateway-arbitrum.network.thegraph.com/api/{SUBGRAPH_API_KEY}/subgraphs/id/E7ymrCnNcQdAAgLbdFWzGE5mvr5Mb5T9VfT43FqA7bNh',
      provision_type: EnvProvisionType.COMPUTED,
    },
    TRADES_SUBGRAPH_URL: {
      name: 'Trades subgraph URL',
      description: '',
      value:
        'https://gateway-arbitrum.network.thegraph.com/api/{SUBGRAPH_API_KEY}/subgraphs/id/9fUVQpFwzpdWS9bq5WkAnmKbNNcoBwatMR4yZq81pbbz',
      provision_type: EnvProvisionType.COMPUTED,
    },
    OPENING_MARGIN: {
      name: 'Opening margin',
      description:
        'Time buffer (in seconds) before market opens to start analyzing. Set to 3600 (1 hour) for short-term markets.',
      value: '3600',
      provision_type: EnvProvisionType.FIXED,
    },
    MIN_EDGE_THRESHOLD: {
      name: 'Minimum edge threshold',
      description: 'Minimum edge percentage required to place a bet',
      value: '5',
      provision_type: EnvProvisionType.USER,
    },
    RISK_TOLERANCE: {
      name: 'Risk tolerance',
      description: 'Risk tolerance level (1-10)',
      value: '5',
      provision_type: EnvProvisionType.USER,
    },
    LANGUAGES: {
      name: 'Languages',
      description: 'Supported languages for prediction markets',
      value: '["en"]',
      provision_type: EnvProvisionType.FIXED,
    },
    OPEN_AUTONOMY_TM_WRITE_TO_LOG: {
      name: 'Open Autonomy TM Write to Log',
      description: '',
      value: 'false',
      provision_type: EnvProvisionType.FIXED,
    },
  },
} as const;

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  SUPAFUND_SERVICE_TEMPLATE,
] as const;

export const getServiceTemplates = (): ServiceTemplate[] => SERVICE_TEMPLATES;

export const getServiceTemplate = (
  templateHash: string,
): ServiceTemplate | undefined =>
  SERVICE_TEMPLATES.find((template) => template.hash === templateHash);
