export const AgentType = {
  Supafund: 'supafund',
} as const;

export type AgentType = (typeof AgentType)[keyof typeof AgentType];
