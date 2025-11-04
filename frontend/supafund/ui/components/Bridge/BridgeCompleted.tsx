import { Button, Flex, Result } from 'antd';

import { BridgeTransferFlow } from '@/supafund/ui/components/Bridge/BridgeTransferFlow';
import { CardTitle } from '@/supafund/ui/components/Card/CardTitle';
import { GoToMainPageButton } from '@/supafund/ui/components/Pages/GoToMainPageButton';
import { CardFlex } from '@/supafund/ui/components/styled/CardFlex';
import { Pages } from '@/supafund/core/enums/Pages';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { CrossChainTransferDetails } from '@/supafund/core/types/Bridge';

type BridgeCompletedProps = Omit<CrossChainTransferDetails, 'eta'> & {
  completionMessage?: string;
};

/**
 * Final screen displayed when the bridging process is completed.
 * It shows the transfer details and a button to navigate to the wallet balance page.
 */
export const BridgeCompleted = ({
  fromChain,
  toChain,
  transfers,
  completionMessage,
}: BridgeCompletedProps) => {
  const { goto } = usePageState();

  return (
    <CardFlex
      bordered={false}
      title={<CardTitle title="Bridge Completed" />}
      extra={<GoToMainPageButton />}
    >
      <Result
        status="success"
        subTitle={completionMessage || 'Funds have been bridged successfully.'}
        extra={[
          <Flex
            key="bridge-completed"
            gap={24}
            vertical
            style={{ paddingTop: 8 }}
          >
            <BridgeTransferFlow
              fromChain={fromChain}
              toChain={toChain}
              transfers={transfers}
            />
            <Button
              onClick={() => goto(Pages.ManageWallet)}
              size="large"
              style={{ alignSelf: 'center' }}
            >
              See wallet balance
            </Button>
          </Flex>,
        ]}
        style={{ padding: '24px 0' }}
      />
    </CardFlex>
  );
};
