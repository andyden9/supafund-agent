import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  message,
  Row,
  Slider,
  Space,
  Spin,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { CardFlex } from '@/supafund/ui/components/styled/CardFlex';
import { MiddlewareDeploymentStatus } from '@/supafund/core/client';
import { AgentType } from '@/supafund/core/enums/Agent';
import { Pages } from '@/supafund/core/enums/Pages';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';
import { SupafundService } from '@/supafund/core/services/agents/Supafund';

import { PresetSelector } from './components/PresetSelector';

const { Title, Text } = Typography;

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

export const SupafundConfiguration = () => {
  const { goto } = usePageState();
  const {
    selectedAgentType,
    selectedService,
    overrideSelectedServiceStatus,
  } = useServices();
  const [form] = Form.useForm();
  const [weights, setWeights] = useState<SupafundWeights>(defaultWeights);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isSupafundAgent = selectedAgentType === AgentType.Supafund;

  useEffect(() => {
    const loadConfig = async () => {
      if (!isSupafundAgent) return;

      try {
        const config = await SupafundService.getSupafundConfig();
        setWeights(config.weights);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load configuration:', error);
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [isSupafundAgent]);

  const handleUpdateWeights = (key: keyof SupafundWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
  };

  const handlePresetSelect = (preset: SupafundWeights) => {
    setWeights(preset);
  };

  const handleSave = useCallback(async () => {
    const totalWeight = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    if (totalWeight !== 100) {
      message.error('Total weight must equal 100%');
      return;
    }

    try {
      setIsSaving(true);

      // Update configuration using the new service-sync method
      await SupafundService.updateSupafundWeights(
        weights, 
        selectedService?.service_config_id
      );

      message.success('Configuration saved successfully!');

      // Restart agent to apply new configuration
      if (selectedService?.service_config_id) {
        const restartMessageKey = 'supafund-restart';
        message.loading({
          content: 'Restarting agent to apply new configuration...',
          key: restartMessageKey,
          duration: 0,
        });
        overrideSelectedServiceStatus?.(
          MiddlewareDeploymentStatus.STOPPING,
        );

        try {
          await SupafundService.restartSupafundService(
            selectedService.service_config_id,
          );
          message.success({
            content: 'Agent restarted successfully! New configuration is now active.',
            key: restartMessageKey,
          });
        } catch (restartError) {
          console.error('Restart error:', restartError);
          
          // More detailed error message
          const errorMsg =
            restartError instanceof Error
              ? restartError.message
              : typeof restartError === 'string'
                ? restartError
                : 'Unknown error';
          if (errorMsg.includes('500')) {
            message.error({
              content:
                'Server error during restart. Please check agent logs and try restarting manually.',
              key: restartMessageKey,
            });
          } else if (errorMsg.includes('connection')) {
            message.warning({
              content:
                'Connection issue during restart. Please check if the agent service is running.',
              key: restartMessageKey,
            });
          } else {
            message.warning({
              content: `Configuration saved but restart failed: ${errorMsg}. You may need to restart manually.`,
              key: restartMessageKey,
            });
          }
        } finally {
          overrideSelectedServiceStatus?.(undefined);
        }
      }

      // Navigate back to dashboard after saving
      setTimeout(() => {
        goto(Pages.Main);
      }, 2000);
    } catch (error) {
      message.error('Failed to save configuration');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    weights,
    goto,
    selectedService?.service_config_id,
    overrideSelectedServiceStatus,
  ]);

  if (!isSupafundAgent) {
    return (
      <CardFlex>
        <Card>
          <Title level={4}>Supafund Configuration</Title>
          <Typography.Text type="secondary">
            This configuration is only available for Supafund agents.
          </Typography.Text>
          <div style={{ marginTop: '20px' }}>
            <Button onClick={() => goto(Pages.Main)}>Back to Main</Button>
          </div>
        </Card>
      </CardFlex>
    );
  }

  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const isWeightValid = totalWeight === 100;

  return (
    <CardFlex>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={24}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => goto(Pages.Main)}
          >
            Back to Dashboard
          </Button>
        </Col>
      </Row>

      <Card bodyStyle={{ padding: '0 24px 24px' }}>
        <Title level={3}>Agent Configuration</Title>
        <Text type="secondary">
          Customize your agent&apos;s trading strategy by adjusting the weight
          of each evaluation factor.
        </Text>
      </Card>

      <Spin spinning={isLoading}>
        <Card style={{ marginTop: '16px' }}>
          <PresetSelector
            currentWeights={weights}
            onSelect={handlePresetSelect}
            onReset={() => setWeights(defaultWeights)}
          />

          <Form form={form} layout="vertical" style={{ marginTop: '24px' }}>
            {Object.entries(weights).map(([key, value]) => (
              <Card key={key} size="small" style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Title level={5} style={{ margin: 0 }}>
                        {key
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' & ')}
                      </Title>
                      <Text strong style={{ color: value > 0 ? '#1890ff' : '#d9d9d9' }}>
                        — {value}%
                      </Text>
                    </div>
                    <Text
                      type="secondary"
                      style={{ fontSize: '12px', whiteSpace: 'normal' }}
                    >
                      {
                        weightDescriptions[
                          key as keyof typeof weightDescriptions
                        ]
                      }
                    </Text>
                  </div>
                  <div
                    style={{
                      flex: '2 1 320px',
                      minWidth: '260px',
                      padding: '0 20px',
                    }}
                  >
                    <Slider
                      min={0}
                      max={100}
                      value={value}
                      onChange={val =>
                        handleUpdateWeights(key as keyof SupafundWeights, val)
                      }
                      marks={{
                        0: '0%',
                        50: '50%',
                        100: {
                          style: { transform: 'translateX(-10px)' },
                          label: '100%',
                        },
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </Form>

          <Card
            style={{
              backgroundColor: isWeightValid ? '#f6ffed' : '#fff2e8',
              borderColor: isWeightValid ? '#b7eb8f' : '#ffd591',
            }}
          >
            <Row justify="space-between" align="middle">
              <Text
                style={{
                  color: isWeightValid ? '#52c41a' : '#fa8c16',
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                Total Weight: {totalWeight}%
              </Text>
              <Text
                style={{ color: isWeightValid ? '#52c41a' : '#fa8c16' }}
              >
                {isWeightValid
                  ? '✓ Perfect!'
                  : `${totalWeight > 100 ? 'Reduce' : 'Add'} ${Math.abs(100 - totalWeight)}%`}
              </Text>
            </Row>
          </Card>
        </Card>

        <Row style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                loading={isSaving}
                disabled={!isWeightValid}
                onClick={handleSave}
              >
                Save Configuration
              </Button>
              <Button
                size="large"
                onClick={() => goto(Pages.Main)}
              >
                Cancel
              </Button>
            </Space>
          </Col>
        </Row>
      </Spin>
    </CardFlex>
  );
};
