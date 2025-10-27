import { ControlOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';

import { Pages } from '@/enums/Pages';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { usePageState } from '@/hooks/usePageState';

const { Text } = Typography;

export const AgentSettingsButton = () => {
  const { goto } = usePageState();

  const isAgentSettingsEnabled = useFeatureFlag('agent-settings');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goto(Pages.UpdateAgentTemplate);
  };

  return (
    <Tooltip
      arrow={false}
      title={
        isAgentSettingsEnabled ? null : (
          <Text className="text-sm">
            The agent cannot be configured at the moment
          </Text>
        )
      }
      overlayInnerStyle={{ width: 'max-content' }}
      placement="bottomLeft"
    >
      <Button
        type="text"
        size="small"
        disabled={!isAgentSettingsEnabled}
        onClick={handleClick}
        icon={<ControlOutlined />}
        style={{
          color: isAgentSettingsEnabled ? '#666' : '#ccc',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
        }}
      />
    </Tooltip>
  );
};
