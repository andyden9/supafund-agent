import { Skeleton, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useInterval } from 'usehooks-ts';

import { ONE_MINUTE_INTERVAL } from '@/supafund/core/constants/intervals';
import { UNICODE_SYMBOLS } from '@/supafund/core/constants/symbols';
import { EXPLORER_URL_BY_MIDDLEWARE_CHAIN } from '@/supafund/core/constants/urls';
import { useService } from '@/supafund/core/hooks/useService';
import { useStakingProgram } from '@/supafund/core/hooks/useStakingProgram';
import { getLatestTransaction } from '@/supafund/core/services/Ethers';
import { TransactionInfo } from '@/supafund/core/types/TransactionInfo';
import { Optional } from '@/supafund/core/types/Util';
import { asMiddlewareChain } from '@/supafund/core/utils/middlewareHelpers';
import { getTimeAgo } from '@/supafund/core/utils/time';

const { Text } = Typography;

const Loader = styled(Skeleton.Input)`
  line-height: 1;
  span {
    height: 12px !important;
    margin-top: 2px !important;
  }
`;

type LastTransactionProps = { serviceConfigId: Optional<string> };

/**
 * Displays the last transaction time and link to the transaction on explorer
 * by agent safe.
 */
export const LastTransaction = ({ serviceConfigId }: LastTransactionProps) => {
  const { activeStakingProgramMeta } = useStakingProgram();
  const { serviceSafes } = useService(serviceConfigId);

  const serviceSafe = serviceSafes?.[0];

  const chainId = activeStakingProgramMeta?.chainId;

  const [isFetching, setIsFetching] = useState(true);
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);

  const fetchTransaction = useCallback(async () => {
    if (!serviceSafe?.address) return;
    if (!chainId) return;

    getLatestTransaction(serviceSafe.address, chainId)
      .then((tx) => setTransaction(tx))
      .catch((error) =>
        console.error('Failed to get latest transaction', error),
      )
      .finally(() => setIsFetching(false));
  }, [serviceSafe, chainId]);

  // Poll for the latest transaction
  useInterval(() => fetchTransaction(), ONE_MINUTE_INTERVAL);

  // Fetch the latest transaction on mount
  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  if (isFetching) {
    return <Loader active size="small" />;
  }

  if (!transaction) {
    return (
      <Text type="secondary" className="text-xs">
        No txs recently!
      </Text>
    );
  }

  return (
    <Text type="secondary" className="text-xs" style={{ whiteSpace: 'nowrap' }}>
      Tx:&nbsp;
      <Text
        type="secondary"
        className="text-xs pointer hover-underline"
        style={{ whiteSpace: 'nowrap' }}
        onClick={() =>
          window.open(
            `${EXPLORER_URL_BY_MIDDLEWARE_CHAIN[asMiddlewareChain(chainId)]}/tx/${transaction.hash}`,
          )
        }
      >
        {getTimeAgo(transaction.timestamp)}
      </Text>
      &nbsp;{UNICODE_SYMBOLS.EXTERNAL_LINK}
    </Text>
  );
};
