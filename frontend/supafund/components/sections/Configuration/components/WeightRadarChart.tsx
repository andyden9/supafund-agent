import { Card, Progress, Space, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface SupafundWeights {
  founder_team: number;
  market_opportunity: number;
  technical_analysis: number;
  social_sentiment: number;
  tokenomics: number;
}

interface WeightRadarChartProps {
  weights: SupafundWeights;
}

const weightLabels = {
  founder_team: 'Founder & Team',
  market_opportunity: 'Market Opportunity',
  technical_analysis: 'Technical Analysis',
  social_sentiment: 'Social Sentiment',
  tokenomics: 'Tokenomics',
};

const getProgressColor = (value: number) => {
  if (value >= 40) return '#52c41a';
  if (value >= 25) return '#1890ff';
  if (value >= 15) return '#faad14';
  return '#8c8c8c';
};

export const WeightRadarChart: React.FC<WeightRadarChartProps> = ({
  weights,
}) => {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {Object.entries(weights).map(([key, value]) => (
        <div key={key}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <Text style={{ fontSize: '13px' }}>
              {weightLabels[key as keyof typeof weightLabels]}
            </Text>
            <Text strong style={{ fontSize: '13px' }}>
              {value}%
            </Text>
          </div>
          <Progress
            percent={value}
            showInfo={false}
            strokeColor={getProgressColor(value)}
            trailColor="#f0f0f0"
            strokeWidth={10}
          />
        </div>
      ))}

      <Card
        size="small"
        style={{ marginTop: '16px', backgroundColor: '#fafafa' }}
      >
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Color Guide:</strong>
          <br />
          <span style={{ color: '#52c41a' }}>● High Priority (≥40%)</span>
          <br />
          <span style={{ color: '#1890ff' }}>● Medium Priority (25-39%)</span>
          <br />
          <span style={{ color: '#faad14' }}>● Low Priority (15-24%)</span>
          <br />
          <span style={{ color: '#8c8c8c' }}>● Minimal Priority (&lt;15%)</span>
        </Text>
      </Card>
    </Space>
  );
};
