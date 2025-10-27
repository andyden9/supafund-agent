# Pearl (Olas Operate App) - Frontend

## Overview

Pearl is a cross-platform desktop application for running autonomous agents powered by the OLAS Network. This document provides essential information for AI assistants working with the Pearl frontend codebase.

## Quick Start Commands

```bash
# Install dependencies
yarn install

# Development
yarn dev           # Start development server (http://localhost:3000)
yarn lint          # Run ESLint
yarn test          # Run Jest tests
yarn check         # Run lint + TypeScript type checking

# Build
yarn build         # Production build (requires RPC environment variables)
yarn start         # Start production server
```

## Project Structure

```
frontend/
├── components/          # React components
│   ├── MainPage/       # Main dashboard components
│   ├── SetupPage/      # Agent onboarding components
│   ├── SettingsPage/   # Settings and configuration
│   └── ...
├── config/             # Application configuration
│   ├── agents.ts       # Agent configurations
│   ├── chains/         # Blockchain configurations
│   └── stakingPrograms/# Staking program definitions
├── constants/          # Application constants
│   └── serviceTemplates.ts # Service template definitions
├── context/           # React context providers (15+ providers)
├── enums/             # TypeScript enums
├── hooks/             # Custom React hooks (25+ hooks)
├── pages/             # Next.js pages
├── service/           # Service layer and API integrations
├── styles/            # Global styles
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Technologies

- **Framework**: Next.js 14.2.3 (React 18.3.1)
- **Language**: TypeScript 5.3.x (strict mode)
- **UI Library**: Ant Design 5.14.0
- **Styling**: Styled Components 6.1.8, Sass
- **State Management**: React Context API + React Query
- **Blockchain**: Ethers.js 5.7.2, Ethers Multicall
- **Testing**: Jest + React Testing Library

## Architecture Patterns

### 1. Context Providers
The application uses a multi-layered context architecture for state management:

```typescript
// Main providers hierarchy (see providers/index.tsx)
- ElectronApiProvider
  - StoreProvider
    - SharedProvider
      - MasterWalletProvider
        - ServicesProvider
          - SettingsProvider
            - PageStateProvider
              - OnlineStatusProvider
                - StakingProgramProvider
                  - AgentUiProvider
                    - BalanceProvider
                      - RewardProvider
                        - StakingContractDetailsProvider
                          - ModalProvider
                            - SetupProvider
                              - MessageProvider
```

### 2. Service Templates
Agent configurations are defined in `constants/serviceTemplates.ts`:

```typescript
export const SERVICE_TEMPLATE: ServiceTemplate = {
  agentType: AgentType.PredictTrader,
  name: 'Trader Agent',
  hash: 'bafybei...', // IPFS hash
  configurations: {
    [MiddlewareChain.GNOSIS]: {
      staking_program_id: STAKING_PROGRAM_IDS.PearlBeta,
      // ... chain-specific config
    }
  },
  env_variables: {
    // Environment variable definitions
  }
}
```

### 3. Agent Types
Supported agent types (defined in `enums/Agent.ts`):
- PredictTrader (trader)
- AgentsFun (memeooorr)
- AgentsFunCelo (agents-fun-celo)
- Modius (modius)
- Optimus (optimus)
- Supafund (supafund)

### 4. Multi-Chain Support
The application supports multiple blockchain networks:
- Gnosis (xDai)
- Ethereum Mainnet
- Optimism
- Base
- Mode
- Celo

## Important Files

- **`config/agents.ts`**: Agent configurations and service mappings
- **`constants/serviceTemplates.ts`**: Service template definitions
- **`hooks/useServices.ts`**: Service management hook
- **`context/ServicesProvider.tsx`**: Core service state management
- **`components/SetupPage/`**: Onboarding flow components
- **`components/MainPage/`**: Main dashboard components

## Environment Variables

Required for production builds:
```bash
GNOSIS_RPC=https://...
ETHEREUM_RPC=https://...
OPTIMISM_RPC=https://...
BASE_RPC=https://...
MODE_RPC=https://...
CELO_RPC=https://...
```

## Common Development Tasks

### Adding a New Agent Type

1. Add to `enums/Agent.ts`
2. Create service template in `constants/serviceTemplates.ts`
3. Add to `config/agents.ts` with service implementation
4. Update feature flags in `hooks/useFeatureFlag.ts`
5. Add staking program support in `config/stakingPrograms/`
6. Create agent form component in `components/SetupPage/SetupYourAgent/`

### Working with Services

```typescript
// Access services
const { selectedService, selectedAgentConfig } = useServices();

// Create service
const service = await serviceApi.create(serviceTemplate);

// Deploy service
await serviceApi.deploy(serviceHash);
```

### Using Hooks

```typescript
// Common hooks
import { useServices } from '@/hooks/useServices';
import { useBalanceContext } from '@/hooks/useBalanceContext';
import { usePageState } from '@/hooks/usePageState';
import { useMasterWalletContext } from '@/hooks/useWallet';
```

## TypeScript Configuration

- **Base URL**: `.` (project root)
- **Path Alias**: `@/*` maps to `./`
- **Strict Mode**: Enabled
- **Module**: ESNext with bundler resolution

## Testing

```bash
yarn test                  # Run all tests
yarn test --coverage      # Run with coverage
yarn test --watch         # Watch mode
```

## Build and Deployment

The frontend is built as a static Next.js application and served by the Electron app:

```bash
# Build frontend
yarn build:frontend

# This copies the built files to electron/.next and electron/public
```

## Integration Points

### Electron IPC
The frontend communicates with the Electron backend via:
- `ElectronApiProvider` context
- IPC channels for wallet, service, and store operations

### Backend Services
- Python middleware API for service management
- Direct blockchain interaction via Ethers.js
- IPFS for service metadata

## Recent Changes (Supafund Integration)

The Supafund agent type was recently integrated with:
- New agent type in `enums/Agent.ts`
- Service template in `constants/serviceTemplates.ts`
- Weight configuration UI in `SupafundAgentForm`
- Feature flag support
- Staking program compatibility

## Debugging Tips

1. Check browser console for errors
2. Use React DevTools for component inspection
3. Network tab for API calls to middleware
4. Redux DevTools for React Query cache inspection
5. Check Electron main process logs for IPC issues

## Code Style

- ESLint + Prettier for formatting
- TypeScript strict mode
- Import sorting via `eslint-plugin-simple-import-sort`
- No unused imports via `eslint-plugin-unused-imports`
- Prefer functional components with hooks
- Use Ant Design components for UI consistency

## Security Considerations

- Never commit sensitive data or private keys
- RPC endpoints should use environment variables
- Wallet operations go through Electron IPC
- Service creation requires master wallet signature