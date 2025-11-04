import {
  MiddlewareDeploymentStatus,
  MiddlewareServiceResponse,
} from '@/supafund/core/client';

export type Service = MiddlewareServiceResponse & {
  deploymentStatus?: MiddlewareDeploymentStatus;
};
