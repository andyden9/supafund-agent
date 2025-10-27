import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Grid,
  Input,
  message,
  Progress,
  Row,
  Slider,
  Space,
  Typography,
} from 'antd';
import React, { useCallback, useState } from 'react';

import { ServiceTemplate } from '@/client';
import { FormFlex } from '@/components/styled/FormFlex';
import { SetupScreen } from '@/enums/SetupScreen';
import { useSetup } from '@/hooks/useSetup';
import { usePageState } from '@/hooks/usePageState';
import { Pages } from '@/enums/Pages';

const { Text, Title } = Typography;

interface SupafundAgentFormProps {
  serviceTemplate: ServiceTemplate;
}

interface SupafundWeights {
  founder_team: number;
  market_opportunity: number;
  technical_analysis: number;
  social_sentiment: number;
  tokenomics: number;
}

const defaultWeights: SupafundWeights = {
  founder_team: 20,
  market_opportunity: 20,
  technical_analysis: 20,
  social_sentiment: 20,
  tokenomics: 20,
};

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

const weightDescriptions = {
  founder_team:
    'Evaluates team experience, track record, and domain expertise.',
  market_opportunity:
    'Assesses market size, growth potential, and competitive landscape.',
  technical_analysis:
    'Evaluates code quality, development activity, and innovation.',
  social_sentiment:
    'Measures community engagement, social media presence, and sentiment.',
  tokenomics: 'Analyzes token distribution, utility, and economic model.',
};

export const SupafundAgentForm: React.FC<SupafundAgentFormProps> = () => {
  const screens = Grid.useBreakpoint();
  const isXs = !screens.md; // treat < md as small width (Electron window ~480px)
  const { goto } = useSetup();
  const { goto: gotoPage } = usePageState();
  const [form] = Form.useForm();
  const [weights, setWeights] = useState<SupafundWeights>(defaultWeights);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [minEdgeThreshold, setMinEdgeThreshold] = useState(5);
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateWeights = (key: keyof SupafundWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
  };

  const handlePresetSelect = (presetKey: keyof typeof presetConfigurations) => {
    setWeights(presetConfigurations[presetKey].weights);
  };

  const handleProceed = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await form.validateFields();

      // Save configuration to backend
      const config = {
        weights,
        apiEndpoint,
        minEdgeThreshold,
        riskTolerance,
  };

      // TODO: Implement actual backend integration
      // Store in localStorage for now (will be replaced with backend)
      localStorage.setItem('supafund_config', JSON.stringify(config));

      message.success('Supafund agent configuration saved!');
      // After configuring, go directly to Supafund main page
      gotoPage(Pages.Main);
    } catch (error) {
      message.error('Please check your configuration.');
      console.error('Validation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, weights, apiEndpoint, minEdgeThreshold, riskTolerance, gotoPage]);

  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const isWeightValid = totalWeight === 100;
  const isWeightOverLimit = totalWeight > 100;

  return (
    <FormFlex>
      <Form form={form} layout="vertical">
        <Card className="mb-4">
          <Title level={5}>Personalized Trading Strategy</Title>
          <Text>
            The Supafund Agent uses your personal weights to trade on prediction
            markets. Adjust the sliders below to customize your agent&apos;s
            focus areas.
          </Text>
          {!isWeightValid && (
            <div className="mt-4">
              <Text type="danger">
                <ExclamationCircleOutlined /> Total weight must equal 100%
                (currently {totalWeight}%)
              </Text>
            </div>
          )}

          <div className="mt-4 mb-4">
            <Row justify="space-between" align="middle" className="mb-3">
              <Text strong>Quick Presets:</Text>
              <Button
                size="small"
                type="link"
                onClick={() => setWeights(defaultWeights)}
                style={{ padding: 0 }}
              >
                Reset to Default
              </Button>
            </Row>
            <Row gutter={[8, 8]}>
              {Object.entries(presetConfigurations).map(([key, preset]) => (
                <Col xs={12} md={6} key={key}>
                  <Button
                    size="small"
                    onClick={() =>
                      handlePresetSelect(
                        key as keyof typeof presetConfigurations,
                      )
                    }
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '6px 8px',
                      textAlign: 'left',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      whiteSpace: 'normal', // allow wrapping inside button
                      lineHeight: 1.2,
                    }}
                    className="hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: '11px',
                          display: 'block',
                          lineHeight: '1.2',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {preset.name}
                      </Text>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: '9px',
                          lineHeight: '1.2',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          display: 'block',
                        }}
                      >
                        {preset.description}
                      </Text>
                    </div>
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          <div className="mt-6">
            {Object.entries(weights).map(([key, value]) => (
              <Card
                key={key}
                size="small"
                className="mb-4"
                style={{ border: '1px solid #f0f0f0' }}
              >
                <Row gutter={16} align="middle">
                  <Col xs={24} md={7}>
                    <Title
                      level={5}
                      style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}
                    >
                      {key
                        .split('_')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(' & ')}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {
                        weightDescriptions[
                          key as keyof typeof weightDescriptions
                        ]
                      }
                    </Text>
                  </Col>
                  <Col xs={24} md={14} style={isXs ? { marginTop: 8 } : undefined}>
                    <Slider
                      min={0}
                      max={100}
                      value={value}
                      onChange={(val) =>
                        handleUpdateWeights(key as keyof SupafundWeights, val)
                      }
                      marks={{
                        0: '0%',
                        25: '25%',
                        50: '50%',
                        75: '75%',
                        100: '100%',
                      }}
                      tooltip={{ formatter: (val) => `${val}%` }}
                    />
                  </Col>
                  <Col xs={24} md={3} style={{ textAlign: 'center', ...(isXs ? { marginTop: 4 } : {}) }}>
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        color: value > 0 ? '#1890ff' : '#d9d9d9',
                      }}
                    >
                      {value}%
                    </Title>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>

          <div
            className="mt-4 p-4"
            style={{
              backgroundColor: isWeightValid ? '#f6ffed' : '#fff2e8',
              borderRadius: '8px',
              border: `1px solid ${isWeightValid ? '#b7eb8f' : '#ffd591'}`,
            }}
          >
            <Row justify="space-between" align="middle" className="mb-2">
              <Text
                style={{
                  color: isWeightValid ? '#52c41a' : '#fa8c16',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Total Weight: {totalWeight}%
              </Text>
              <Text
                style={{
                  color: isWeightValid ? '#52c41a' : '#fa8c16',
                  fontWeight: 500,
                }}
              >
                {isWeightValid
                  ? '✓ Perfect!'
                  : `Need ${100 - totalWeight}% more`}
              </Text>
            </Row>
            <Progress
              percent={totalWeight}
              status={
                totalWeight === 100
                  ? 'success'
                  : totalWeight > 100
                    ? 'exception'
                    : 'active'
              }
              strokeColor={
                totalWeight === 100
                  ? '#52c41a'
                  : totalWeight > 100
                    ? '#ff4d4f'
                    : '#1890ff'
              }
              showInfo={false}
              strokeWidth={8}
            />
            {totalWeight > 100 && (
              <Text
                type="danger"
                style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}
              >
                Total exceeds 100%. Please reduce some weights.
              </Text>
            )}
          </div>
        </Card>

        <Card className="mb-4">
          <Title level={5}>Advanced Settings</Title>
          <Text type="secondary" className="mb-4 block">
            Fine-tune your agent&apos;s trading behavior and risk parameters.
          </Text>

          <Form.Item
            name="apiEndpoint"
            label={<Text strong>Supafund API Endpoint</Text>}
            help="Leave empty to use default endpoint. Only change if you have a custom Supafund backend."
          >
            <Input
              placeholder="https://api.supafund.ai (optional)"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              size="large"
            />
          </Form.Item>

          <div className="mb-6">
            <Text strong className="block mb-2">
              Minimum Edge Threshold: {minEdgeThreshold}%
            </Text>
            <Text type="secondary" className="block mb-3">
              Your agent will only place bets when it has at least this
              percentage advantage
            </Text>
            <Slider
              min={1}
              max={20}
              value={minEdgeThreshold}
              onChange={setMinEdgeThreshold}
              marks={{ 1: '1%', 5: '5%', 10: '10%', 15: '15%', 20: '20%' }}
              tooltip={{ formatter: (val) => `${val}% edge required` }}
            />
          </div>

          <div className="mb-4">
            <Text strong className="block mb-2">
              Risk Tolerance: {riskTolerance}/10
            </Text>
            <Text type="secondary" className="block mb-3">
              Higher values mean larger position sizes and more aggressive
              trading
            </Text>
            <Slider
              min={1}
              max={10}
              value={riskTolerance}
              onChange={setRiskTolerance}
              marks={
                isXs
                  ? { 1: 'VC', 3: 'C', 5: 'M', 7: 'A', 10: 'VA' }
                  : {
                      1: 'Very Conservative',
                      3: 'Conservative',
                      5: 'Moderate',
                      7: 'Aggressive',
                      10: 'Very Aggressive',
                    }
              }
              tooltip={{
                formatter: (val) => {
                  const levels = [
                    '',
                    'Very Conservative',
                    'Conservative',
                    'Conservative',
                    'Moderate',
                    'Moderate',
                    'Moderate',
                    'Aggressive',
                    'Aggressive',
                    'Very Aggressive',
                    'Very Aggressive',
                  ];
                  return levels[val || 0];
                },
              }}
            />
          </div>
        </Card>

        <div className="sticky-actions">
          <Space direction="horizontal" size="middle">
            <Button
              size="large"
              type="primary"
              disabled={!isWeightValid || isWeightOverLimit || isSubmitting}
              loading={isSubmitting}
              onClick={handleProceed}
            >
              {isSubmitting ? 'Saving configuration...' : 'Proceed'}
            </Button>
            <Button
              size="large"
              disabled={isSubmitting}
              onClick={() => goto(SetupScreen.AgentIntroduction)}
            >
              Back
            </Button>
          </Space>
        </div>
      </Form>
    </FormFlex>
  );
};
