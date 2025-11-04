import { SettingOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';

import { AgentType } from '@/supafund/core/enums/Agent';
import { Pages } from '@/supafund/core/enums/Pages';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';

const { Text } = Typography;

export const SupafundSettingsButton = () => {
  const { goto } = usePageState();
  const { selectedAgentType } = useServices();

  const isSupafundAgent = selectedAgentType === AgentType.Supafund;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goto(Pages.SupafundMainSettings);
  };

  if (!isSupafundAgent) {
    return null;
  }

  return (
    <Tooltip
      arrow={false}
      title={<Text className="text-sm">Supafund Agent</Text>}
      overlayInnerStyle={{ width: 'max-content' }}
      placement="bottomLeft"
    >
      <Button
        type="text"
        size="small"
        onClick={handleClick}
        icon={<SettingOutlined />}
        style={{
          color: '#666',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
        }}
      />
    </Tooltip>
  );
};
