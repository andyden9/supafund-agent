import { Button, message } from 'antd';
import { useCallback } from 'react';

import { MiddlewareDeploymentStatus } from '@/client';
import { AgentProfileSvg } from '@/components/custom-icons/AgentProfile';
import { useYourWallet } from '@/components/YourWalletPage/useYourWallet';
import { MESSAGE_WIDTH } from '@/constants/width';
import { useAgentUi } from '@/context/AgentUiProvider';
import { useService } from '@/hooks/useService';
import { useServices } from '@/hooks/useServices';

type RenderContainerProps = (props: {
  onClick?: () => void;
}) => React.ReactNode;

type AgentProfileProps = {
  renderContainer?: RenderContainerProps;
};

const SUPAFUND_UI_URL = 'http://127.0.0.1:8716';

export const AgentProfile = ({ renderContainer }: AgentProfileProps) => {
  const { serviceSafe } = useYourWallet();
  const { selectedService } = useServices();
  const { goto, show } = useAgentUi();
  const { deploymentStatus } = useService(selectedService?.service_config_id);

  const handleOpenAgentUi = useCallback(async () => {
    if (!goto || !show) {
      message.error('Agent UI browser IPC methods are not available');
      return;
    }

    if (deploymentStatus !== MiddlewareDeploymentStatus.DEPLOYED) {
      message.open({
        type: 'error',
        content: '请先启动 Supafund 代理，然后再尝试打开代理控制台。',
        style: { maxWidth: MESSAGE_WIDTH, margin: '0 auto' },
      });
      return;
    }

    try {
      await goto(SUPAFUND_UI_URL);
      show();
    } catch (error) {
      message.error('打开代理控制台失败');
      console.error(error);
    }
  }, [deploymentStatus, goto, show]);

  if (!serviceSafe?.address) return null;

  const button = (
    <Button
      type="default"
      size="large"
      icon={<AgentProfileSvg />}
      onClick={handleOpenAgentUi}
      style={{ height: '28px', display: 'flex', alignItems: 'center' }}
    />
  );

  if (renderContainer) {
    return renderContainer({ onClick: handleOpenAgentUi });
  }

  return (
    <a onClick={handleOpenAgentUi} className="text-sm" href="#">
      {button}
    </a>
  );
};

export { AgentProfile as AgentProfileButton };
