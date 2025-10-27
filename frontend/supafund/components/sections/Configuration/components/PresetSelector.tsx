import { Button, Card, Col, Row, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface SupafundWeights {
  founder_team: number;
  market_opportunity: number;
  technical_analysis: number;
  social_sentiment: number;
  tokenomics: number;
}

interface PresetSelectorProps {
  currentWeights: SupafundWeights;
  onSelect: (weights: SupafundWeights) => void;
  onReset: () => void;
}

const presetConfigurations = {
  balanced: {
    name: 'Balanced',
    description: 'Equal weight across all factors',
    weights: {
      founder_team: 20,
      market_opportunity: 20,
      technical_analysis: 20,
      social_sentiment: 20,
      tokenomics: 20,
    },
  },
  technical: {
    name: 'Technical Focus',
    description: 'Emphasizes code quality and development',
    weights: {
      founder_team: 15,
      market_opportunity: 15,
      technical_analysis: 40,
      social_sentiment: 15,
      tokenomics: 15,
    },
  },
  fundamental: {
    name: 'Fundamental Focus',
    description: 'Focuses on team and market opportunity',
    weights: {
      founder_team: 35,
      market_opportunity: 35,
      technical_analysis: 15,
      social_sentiment: 10,
      tokenomics: 5,
    },
  },
  social: {
    name: 'Social Driven',
    description: 'Prioritizes community and sentiment',
    weights: {
      founder_team: 20,
      market_opportunity: 15,
      technical_analysis: 15,
      social_sentiment: 35,
      tokenomics: 15,
    },
  },
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentWeights,
  onSelect,
  onReset,
}) => {
  return (
    <div>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: '16px' }}
      >
        <Text strong>Quick Presets</Text>
        <Button size="small" type="link" onClick={onReset}>
          Reset to Default
        </Button>
      </Row>
      <Row gutter={[8, 8]}>
        {Object.entries(presetConfigurations).map(([key, preset]) => (
          <Col xs={12} sm={6} key={key}>
            <Card
              hoverable
              size="small"
              onClick={() => onSelect(preset.weights)}
              style={{
                cursor: 'pointer',
                borderColor:
                  JSON.stringify(currentWeights) ===
                  JSON.stringify(preset.weights)
                    ? '#1890ff'
                    : undefined,
                backgroundColor:
                  JSON.stringify(currentWeights) ===
                  JSON.stringify(preset.weights)
                    ? '#e6f7ff'
                    : undefined,
              }}
            >
              <Text strong style={{ fontSize: '14px', display: 'block' }}>
                {preset.name}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {preset.description}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
