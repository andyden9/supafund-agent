import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { SetupScreen } from '@/supafund/core/enums/SetupScreen';
import { useSetup } from '@/supafund/core/hooks/useSetup';

export const GoToLoginPageButton = () => {
  const { goto } = useSetup();

  return (
    <Button
      size="large"
      icon={<CloseOutlined />}
      onClick={() => goto(SetupScreen.Welcome)}
    />
  );
};
