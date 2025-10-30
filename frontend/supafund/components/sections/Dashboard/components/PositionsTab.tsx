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
  entryValue: number;
  currentValue: number;
  collateralSymbol: string;
  collateralIsStable: boolean;
  marketAddress: string;
}

interface PositionsTabProps {
  positions: Position[];
}

const formatProbability = (value: number): string => {
  if (!Number.isFinite(value)) return '–';
  return `${(value * 100).toFixed(1)}%`;
};

const formatTokenSize = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
};

const formatSigned = (value: number, formatted: string): string =>
  value > 0 ? `+${formatted}` : formatted;

const formatValue = (
  value: number,
  isStable: boolean,
  symbol: string,
): string => {
  const formatted = value.toFixed(2);
  if (isStable) {
    return `$${formatted}`;
  }
  return `${formatted} ${symbol}`;
};

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
        const entryProbability = formatProbability(position.entryPrice);
        const currentProbability = formatProbability(position.currentPrice);
        const tokenSize = formatTokenSize(position.size);
        const pnlValue = formatSigned(position.pnl, position.pnl.toFixed(2));
        const pnlPercentage = `${formatSigned(
          position.pnlPercentage,
          position.pnlPercentage.toFixed(1),
        )}%`;
        const currentValue = formatValue(
          position.currentValue,
          position.collateralIsStable,
          position.collateralSymbol,
        );
        const entryValue = formatValue(
          position.entryValue,
          position.collateralIsStable,
          position.collateralSymbol,
        );
        
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
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>{entryProbability}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Current Price</Text>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>{currentProbability}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Tokens Held</Text>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>{tokenSize}</Text>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Current Value: <span style={{ fontWeight: 500, color: '#141414' }}>{currentValue}</span>
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Cost Basis: <span style={{ fontWeight: 500, color: '#141414' }}>{entryValue}</span>
                </Text>
              </div>
              
              {/* P&L and time remaining */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ 
                    color: pnlColor, 
                    fontSize: '15px', 
                    fontWeight: 'bold' 
                  }}>
                    P&amp;L: {pnlValue} ({pnlPercentage})
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
                    href={`https://dreamathon.supafund.xyz/markets/${position.marketAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
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
