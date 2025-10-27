import { Button, Card, Empty, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface Position {
  id: string;
  market: string;
  direction: 'YES' | 'NO';
  entryPrice: number;
  currentPrice: number;
  size: number;
  pnl: number;
  pnlPercentage: number;
  timeRemaining: string;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
}

interface PositionsTabProps {
  positions: Position[];
}

export const PositionsTab: React.FC<PositionsTabProps> = ({ positions }) => {
  if (positions.length === 0) {
    return (
      <Empty description="No active positions" style={{ padding: '40px 0' }} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {positions.map((position) => {
        const pnlColor = position.pnl >= 0 ? '#3f8600' : '#cf1322';
        const pnlPrefix = position.pnl >= 0 ? '+' : '';
        
        return (
          <Card 
            key={position.id} 
            style={{ 
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              transition: 'all 0.2s ease-in-out'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Market title with direction tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <Text 
                  strong 
                  style={{ 
                    fontSize: '15px', 
                    flex: 1, 
                    lineHeight: '22px',
                    fontWeight: 500
                  }}
                  ellipsis={{ tooltip: position.market }}
                >
                  {position.market}
                </Text>
                <Tag 
                  color={position.direction === 'YES' ? 'green' : 'red'} 
                  style={{ 
                    margin: 0,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  {position.direction}
                </Tag>
              </div>
              
              {/* Price info */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '16px',
                padding: '12px 0',
                borderTop: '1px solid #f5f5f5',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Entry Price</Text>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>${position.entryPrice.toFixed(2)}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Current Price</Text>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>${position.currentPrice.toFixed(2)}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Position Size</Text>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>${position.size.toFixed(2)}</Text>
                </div>
              </div>
              
              {/* P&L and time remaining */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ 
                    color: pnlColor, 
                    fontSize: '15px', 
                    fontWeight: 'bold' 
                  }}>
                    {pnlPrefix}${position.pnl.toFixed(2)} ({pnlPrefix}{position.pnlPercentage.toFixed(1)}%)
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {position.timeRemaining}
                  </Text>
                  <Button 
                    type="link" 
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
            </div>
          </Card>
        );
      })}
    </div>
  );
};
