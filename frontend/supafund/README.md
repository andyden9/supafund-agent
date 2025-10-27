# Supafund Module

This module contains all UI components, hooks, and utilities specific to the Supafund agent.

## Architecture

The Supafund module is completely isolated from other agents to prevent coupling:

- **Service Layer** (`@/service/agents/Supafund.ts`): Continues to inherit from `StakedAgentService` for shared blockchain logic
- **UI Layer** (this module): Completely independent, all components are self-contained

## Structure

```
supafund/
├── components/
│   ├── pages/              # Top-level page components
│   │   ├── SupafundMainPage.tsx
│   │   ├── SupafundSetupPage.tsx
│   │   └── SupafundUpdatePage.tsx
│   ├── sections/           # Major UI sections
│   │   ├── Dashboard/
│   │   ├── Configuration/
│   │   ├── MainSettings/
│   │   ├── SetupForm/
│   │   ├── UpdateSetup/
│   │   └── Header/
│   └── shared/             # Shared within Supafund only
├── hooks/                  # Supafund-specific hooks
│   └── useSupafundData.ts
├── utils/                  # Supafund utilities
│   ├── subgraph.ts
│   └── dataProcessor.ts
├── config/                 # UI configuration
├── types/                  # Type definitions
├── assets/                 # Static assets (icons, images)
└── index.ts               # Public API

```

## Usage

### In Routing Layer

```typescript
import { SupafundMainPage, SupafundSetupPage, SupafundUpdatePage } from '@/supafund';

// In pages/index.tsx
if (selectedAgentType === AgentType.Supafund) {
  switch (currentPage) {
    case Pages.Main:
      return <SupafundMainPage />;
    case Pages.Setup:
      return <SupafundSetupPage />;
    case Pages.UpdateAgent:
      return <SupafundUpdatePage />;
  }
}
```

### Direct Component Usage

```typescript
import { SupafundDashboard, useSupafundData } from '@/supafund';

const MyComponent = () => {
  const { metrics, opportunities } = useSupafundData();
  return <SupafundDashboard />;
};
```

## Key Principles

1. **UI Isolation**: All UI code is self-contained in this module
2. **Service Inheritance**: Service layer continues to inherit shared blockchain logic
3. **No Cross-Contamination**: Modifications to Supafund UI do not affect other agents
4. **Clear Boundaries**: All imports from this module go through `@/supafund`

## Development

When adding new features:

1. Keep all UI components within this module
2. Use `@/supafund` import path when referencing from outside
3. Maintain the page/section/shared component hierarchy
4. Export new public APIs through `index.ts`

## Dependencies

- **Internal**: Uses shared components from `@/components` for basic UI elements
- **External**: Standard React, Ant Design, etc.
- **Service**: References `@/service/agents/Supafund` for service operations
