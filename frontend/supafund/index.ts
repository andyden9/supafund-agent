/**
 * Supafund Module - Independent UI module for Supafund agent
 *
 * This module contains all Supafund-specific UI components, hooks, and utilities.
 * It is completely isolated from other agents to prevent coupling.
 *
 * The service layer (SupafundService) remains in @/service/agents/Supafund.ts
 * and continues to inherit from StakedAgentService for shared blockchain logic.
 */

// ===== Pages =====
// These are the top-level page components for Supafund
export { SupafundMainPage } from './components/pages/SupafundMainPage';
export { SupafundDashboardPage } from './components/pages/SupafundDashboardPage';
export { SupafundSetupPage } from './components/pages/SupafundSetupPage';
export { SupafundUpdatePage } from './components/pages/SupafundUpdatePage';

// ===== Components =====
// Export major section components that might be used elsewhere
export { SupafundDashboard } from './components/sections/Dashboard';
export { SupafundConfiguration } from './components/sections/Configuration';
export { SupafundMainSettings } from './components/sections/MainSettings';

// ===== Hooks =====
export { useSupafundData } from './hooks/useSupafundData';

// ===== Utils =====
export * from './utils/subgraph';
export * from './utils/dataProcessor';

// ===== Types =====
export type { SupafundFormValues } from './components/sections/UpdateSetup';
