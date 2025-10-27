import { PropsWithChildren, useCallback, useEffect, useRef } from 'react';

import { MiddlewareDeploymentStatus } from '@/client';
import { useElectronApi } from '@/hooks/useElectronApi';
import { useRewardContext } from '@/hooks/useRewardContext';
import { useServices } from '@/hooks/useServices';

const Notifications = {
  AgentEarned:
    "Your agent earned its rewards! It's now idle and will resume working next epoch.",
};

export const SystemNotificationTriggers = ({ children }: PropsWithChildren) => {
  const electronApi = useElectronApi();
  const { selectedService } = useServices();
  const { isEligibleForRewards } = useRewardContext();

  const prevIsEligibleForRewards = useRef<boolean>();

  // Notify the user when the agent earns rewards
  const handleAgentEarned = useCallback(() => {
    if (!electronApi.showNotification) return;

    // ignore if agent is not running
    if (
      selectedService?.deploymentStatus !== MiddlewareDeploymentStatus.DEPLOYED
    )
      return;
    // ignore if eligibility is not yet defined
    if (isEligibleForRewards === undefined) return;
    // ignore if agent was previously eligible and is still eligible
    if (prevIsEligibleForRewards.current && isEligibleForRewards) return;
    // ignore if eligibility has not changed
    if (prevIsEligibleForRewards.current === isEligibleForRewards) return;

    // show notification when agent becomes eligible for rewards
    // (and was not previously eligible)
    if (isEligibleForRewards && prevIsEligibleForRewards.current === false) {
      electronApi.showNotification(Notifications.AgentEarned);
    }

    prevIsEligibleForRewards.current = isEligibleForRewards;
  }, [electronApi, isEligibleForRewards, selectedService?.deploymentStatus]);

  useEffect(() => {
    if (!electronApi.showNotification) return;
    // Show notification when agent earns rewards
    handleAgentEarned();
  }, [electronApi, handleAgentEarned, isEligibleForRewards]);

  return children;
};
