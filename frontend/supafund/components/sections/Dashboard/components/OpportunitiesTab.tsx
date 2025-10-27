import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  Tag,
  Typography,
} from 'antd';
import React from 'react';

const { Title, Text } = Typography;

interface Opportunity {
  id: string;
  title: string;
  marketLeader: string; // e.g., "73% YES" or "51% NO"
  category: string;
  expiresIn: string;
}

interface OpportunitiesTabProps {
  opportunities: Opportunity[];
}


export const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  opportunities,
}) => {
  if (opportunities.length === 0) {
    return (
      <Empty
        description="No opportunities available at the moment"
        style={{ padding: '40px 0' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {opportunities.map((opportunity) => (
        <Card
          key={opportunity.id}
          hoverable
          style={{ 
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
            transition: 'all 0.2s ease-in-out'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Header with market leader badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <Title 
                level={5} 
                style={{ 
                  margin: 0, 
                  fontSize: '15px', 
                  flex: 1, 
                  lineHeight: '22px',
                  fontWeight: 500
                }}
                ellipsis={{ rows: 2, tooltip: opportunity.title }}
              >
                {opportunity.title}
              </Title>
              <Tag 
                color={
                  opportunity.marketLeader.includes('%') ? (
                    opportunity.marketLeader.includes('YES') ? 'green' : 'red'
                  ) : 'blue'
                }
                style={{ 
                  margin: 0, 
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 500
                }}
              >
                {opportunity.marketLeader}
              </Tag>
            </div>
            
            {/* Footer with category, expiry and action */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: '1px solid #f5f5f5'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {opportunity.category}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Expires in {opportunity.expiresIn}
                </Text>
              </div>
              <Button 
                type="link" 
                icon={<InfoCircleOutlined />} 
                size="small" 
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '12px',
                  height: 'auto',
                  color: '#666'
                }}
              >
                View
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
