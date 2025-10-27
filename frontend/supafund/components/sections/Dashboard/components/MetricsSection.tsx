import { Card, Col, Row, Statistic, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface Metrics {
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  activePositions: number;
  winRate: number;
  weeklyPerformance: number;
  monthlyPerformance: number;
}

interface MetricsSectionProps {
  metrics: Metrics;
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ metrics }) => {
  const profitLossColor = metrics.totalProfitLoss >= 0 ? '#3f8600' : '#cf1322';

  return (
    <Row gutter={[12, 12]}>
      {/* Top row - Main P&L metric */}
      <Col xs={24}>
        <Card 
          style={{ 
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Statistic
            title={
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                color: '#666'
              }}>
                Total Profit/Loss
              </span>
            }
            value={metrics.totalProfitLoss}
            precision={2}
            valueStyle={{ 
              color: profitLossColor, 
              fontSize: '28px',
              fontWeight: 'bold'
            }}
            prefix="$"
            suffix={
              <span style={{ 
                fontSize: '16px', 
                marginLeft: '12px', 
                color: profitLossColor,
                fontWeight: 'normal'
              }}>
                ({metrics.totalProfitLossPercentage.toFixed(1)}%)
              </span>
            }
          />
        </Card>
      </Col>
      
      {/* Second row - Two key metrics */}
      <Col xs={12}>
        <Card 
          style={{ 
            borderRadius: '8px',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center' }}
        >
          <div style={{ textAlign: 'center' }}>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '13px', 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500
              }}
            >
              Active Positions
            </Text>
            <Text 
              style={{
                color: '#1890ff', 
                fontSize: '22px',
                fontWeight: 'bold'
              }}
            >
              {metrics.activePositions}
            </Text>
          </div>
        </Card>
      </Col>
      <Col xs={12}>
        <Card 
          style={{ 
            borderRadius: '8px',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center' }}
        >
          <div style={{ textAlign: 'center' }}>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '13px', 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500
              }}
            >
              Win Rate
            </Text>
            <Text 
              style={{
                color: metrics.winRate >= 50 ? '#3f8600' : '#cf1322',
                fontSize: '22px',
                fontWeight: 'bold'
              }}
            >
              {metrics.winRate.toFixed(1)}%
            </Text>
          </div>
        </Card>
      </Col>
      
      {/* Third row - Performance metrics */}
      <Col xs={12}>
        <Card 
          style={{ 
            borderRadius: '8px',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '13px', 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500
              }}
            >
              Weekly Performance
            </Text>
            <Text 
              style={{
                color: metrics.weeklyPerformance >= 0 ? '#3f8600' : '#cf1322',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              {metrics.weeklyPerformance >= 0 ? '+' : ''}{metrics.weeklyPerformance.toFixed(1)}%
            </Text>
          </div>
        </Card>
      </Col>
      <Col xs={12}>
        <Card 
          style={{ 
            borderRadius: '8px',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '13px', 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500
              }}
            >
              Monthly Performance
            </Text>
            <Text 
              style={{
                color: metrics.monthlyPerformance >= 0 ? '#3f8600' : '#cf1322',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              {metrics.monthlyPerformance >= 0 ? '+' : ''}{metrics.monthlyPerformance.toFixed(1)}%
            </Text>
          </div>
        </Card>
      </Col>
    </Row>
  );
};
