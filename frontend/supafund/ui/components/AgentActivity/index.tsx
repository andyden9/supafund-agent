import { ApiOutlined, InboxOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Collapse, Flex, Spin, Typography } from 'antd';
import { isEmpty, isNull } from 'lodash';
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { COLOR } from '@/supafund/core/constants/colors';
import { FIVE_SECONDS_INTERVAL } from '@/supafund/core/constants/intervals';
import { REACT_QUERY_KEYS } from '@/supafund/core/constants/react-query-keys';
import { NA } from '@/supafund/core/constants/symbols';
import { BACKEND_URL_V2 } from '@/supafund/core/constants/urls';
import { OnlineStatusContext } from '@/supafund/core/providers/OnlineStatusProvider';
import { useElectronApi } from '@/supafund/core/hooks/useElectronApi';
import { useService } from '@/supafund/core/hooks/useService';
import { useServices } from '@/supafund/core/hooks/useServices';

import { CardTitle } from '../Card/CardTitle';
import { GoToMainPageButton } from '../Pages/GoToMainPageButton';

const { Text } = Typography;

const MIN_HEIGHT = 400;
const ICON_STYLE: CSSProperties = { fontSize: 48, color: COLOR.TEXT_LIGHT };
const CURRENT_ACTIVITY_STYLE: CSSProperties = {
  background: 'linear-gradient(180deg, #FCFCFD 0%, #EEF0F7 100%)',
};

const Container = ({ children }: { children: ReactNode }) => (
  <Flex
    vertical
    gap={16}
    align="center"
    justify="center"
    style={{ height: MIN_HEIGHT }}
  >
    {children}
  </Flex>
);

const Loading = () => (
  <Container>
    <Spin />
  </Container>
);

const ErrorLoadingData = ({ refetch }: { refetch: () => void }) => (
  <Container>
    <ApiOutlined style={ICON_STYLE} />
    <Text type="secondary">Error loading data</Text>
    <Button onClick={refetch}>Try again</Button>
  </Container>
);

const NoData = () => (
  <Container>
    <InboxOutlined style={ICON_STYLE} />
    <Text type="secondary">
      There&apos;s no previous agent activity recorded yet
    </Text>
  </Container>
);

export const AgentActivityPage = () => {
  const electronApi = useElectronApi();
  const { isOnline } = useContext(OnlineStatusContext);

  const { selectedService } = useServices();
  const { isServiceRunning } = useService(selectedService?.service_config_id);
  const serviceConfigId = selectedService?.service_config_id;
  const healthCheck = electronApi?.healthCheck;

  const fetchHealthCheckFromMiddleware = useCallback(async () => {
    if (!serviceConfigId) return { response: null };

    const response = await fetch(
      `${BACKEND_URL_V2}/service/${serviceConfigId}/deployment`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch healthcheck');
    }
    const payload = await response.json();
    return {
      response:
        payload && 'healthcheck' in payload ? payload.healthcheck : null,
    };
  }, [serviceConfigId]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: REACT_QUERY_KEYS.AGENT_ACTIVITY(serviceConfigId),
    queryFn: async () => {
      if (!healthCheck) {
        // In browser builds or when the Electron API is unavailable, fetch from middleware API instead.
        return fetchHealthCheckFromMiddleware();
      }

      const result = await healthCheck();
      if (result && 'error' in result) throw new Error(result.error);
      return result;
    },
    select: (data) => {
      if (!data || !('response' in data) || !data.response) return null;

      // The latest activity should go at the top, so sort the rounds accordingly
      const rounds = [...(data.response?.rounds || [])].reverse();
      const roundsInfo = data.response?.rounds_info;
      return { rounds, roundsInfo };
    },
    enabled:
      isServiceRunning &&
      !!serviceConfigId &&
      (Boolean(healthCheck) || isOnline),
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      if (query.state.error) return false; // Stop refetching when there's an error
      if (healthCheck) return FIVE_SECONDS_INTERVAL;
      return isOnline ? FIVE_SECONDS_INTERVAL : false;
    },
  });

  const activity = useMemo(() => {
    if (isLoading) return <Loading />;
    if (isError) return <ErrorLoadingData refetch={refetch} />;
    if (!isServiceRunning) return <NoData />;
    if (isNull(data) || isEmpty(data)) return <NoData />;

    const items = data.rounds.map((item, index) => {
      const isCurrent = index === 0;
      const currentActivityRoundName = data.roundsInfo?.[item]?.name || item;
      const otherActivityDesc = data.roundsInfo?.[item]?.description || NA;
      return {
        key: `${item}-${index}`,
        label: isCurrent ? (
          <Flex vertical gap={4}>
            <Text type="secondary" className="text-xs">
              Current activity
            </Text>
            <Text className="text-sm loading-ellipses fit-content">
              {currentActivityRoundName}
            </Text>
          </Flex>
        ) : (
          <Text className="text-sm">{currentActivityRoundName}</Text>
        ),
        children: (
          <Text
            type="secondary"
            className="text-sm"
            style={{ marginLeft: '26px' }}
          >
            {otherActivityDesc}
          </Text>
        ),
        style: isCurrent ? CURRENT_ACTIVITY_STYLE : undefined,
      };
    });

    return (
      <Collapse
        items={items}
        bordered={false}
        style={{ background: 'transparent' }}
      />
    );
  }, [data, isError, isLoading, isServiceRunning, refetch]);

  return (
    <Card
      title={<CardTitle title="Agent activity" />}
      bordered={false}
      styles={{ body: { padding: '1px 0 24px' } }}
      extra={<GoToMainPageButton />}
    >
      {activity}
    </Card>
  );
};
