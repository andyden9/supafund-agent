import { ControlOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

interface DashboardHeaderProps {
  agentName: string;
  onConfigClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  agentName,
  onConfigClick,
}) => {
  return (
    <Card 
      style={{ 
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <Title 
            level={3} 
            style={{ 
              margin: 0,
              marginBottom: '8px',
              fontSize: '24px',
              fontWeight: 600,
              color: '#1a1a1a'
            }}
          >
            {agentName} Dashboard
          </Title>
          <Text 
            type="secondary"
            style={{ 
              fontSize: '14px',
              lineHeight: '20px'
            }}
          >
            Monitor your agent&apos;s performance and trading activities
          </Text>
        </div>
        <div>
          <Button 
            icon={<ControlOutlined />} 
            onClick={onConfigClick}
            title="Configuration"
            type="default"
            size="middle"
            style={{
              height: '36px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </div>
      </div>
    </Card>
  );
};
