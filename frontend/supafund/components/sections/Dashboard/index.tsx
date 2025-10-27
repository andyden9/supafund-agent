import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Spin, Tabs, Typography } from 'antd';
import { useMemo } from 'react';

import { MiddlewareDeploymentStatus } from '@/client';
import { GoToMainPageButton } from '@/components/Pages/GoToMainPageButton';
import { CardFlex } from '@/components/styled/CardFlex';
import { AgentType } from '@/enums/Agent';
import { Pages } from '@/enums/Pages';
import { usePageState } from '@/hooks/usePageState';
import { useService } from '@/hooks/useService';
import { useServices } from '@/hooks/useServices';
import { useSupafundData } from '@/supafund/hooks/useSupafundData';

import { ActivityTab } from './components/ActivityTab';
import { DashboardHeader } from './components/DashboardHeader';
import { MetricsSection } from './components/MetricsSection';
import { OpportunitiesTab } from './components/OpportunitiesTab';
import { PositionsTab } from './components/PositionsTab';

const { Title } = Typography;
const { TabPane } = Tabs;

interface SupafundDashboardProps {
  hideBackButton?: boolean;
}

export const SupafundDashboard = ({
  hideBackButton = false,
}: SupafundDashboardProps) => {
  const { goto } = usePageState();
  const { selectedAgentConfig, selectedAgentType, selectedService } =
    useServices();
  const { deploymentStatus } = useService(selectedService?.service_config_id);
  const { metrics, opportunities, positions, activities, isLoading } =
    useSupafundData();

  const isSupafundAgent = useMemo(
    () => selectedAgentType === AgentType.Supafund,
    [selectedAgentType],
  );

  const isAgentRunning = useMemo(
    () => deploymentStatus === MiddlewareDeploymentStatus.DEPLOYED,
    [deploymentStatus],
  );

  if (!isSupafundAgent) {
    return (
      <CardFlex $noBorder $padding="16px">
        <Card>
          <Title level={4}>Supafund Dashboard</Title>
          <Typography.Text type="secondary">
            This dashboard is only available for Supafund agents.
          </Typography.Text>
          <div style={{ marginTop: '20px' }}>
            <GoToMainPageButton />
          </div>
        </Card>
      </CardFlex>
    );
  }

  return (
    <CardFlex $noBorder style={{ overflowX: 'hidden' }}>
      {!hideBackButton && (
        <div style={{ marginBottom: '20px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => goto(Pages.SwitchAgent)}
            type="text"
            style={{
              padding: '4px 8px',
              color: '#666',
              fontSize: '14px',
            }}
          >
            Switch Agent
          </Button>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <DashboardHeader
          agentName={selectedAgentConfig.displayName}
          onConfigClick={() => goto(Pages.SupafundConfiguration)}
        />
      </div>

      <Spin spinning={isLoading}>
        <div style={{ marginBottom: '24px' }}>
          <MetricsSection metrics={metrics} />
        </div>

        <Card
          style={{
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <Tabs
            defaultActiveKey="opportunities"
            size="large"
            tabBarStyle={{
              marginBottom: '20px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <TabPane tab="Opportunities" key="opportunities">
              {isAgentRunning ? (
                <OpportunitiesTab opportunities={opportunities} />
              ) : (
                <Empty
                  description="Start your agent to see market opportunities"
                  style={{ padding: '40px 0' }}
                />
              )}
            </TabPane>
            <TabPane tab="Positions" key="positions">
              <PositionsTab positions={positions} />
            </TabPane>
            <TabPane tab="Activity" key="activity">
              <ActivityTab activities={activities} />
            </TabPane>
          </Tabs>
        </Card>
      </Spin>
    </CardFlex>
  );
};
