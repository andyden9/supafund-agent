import { Button, Card, Typography } from 'antd';
import { isEqual, omitBy } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';

import { Pages } from '@/supafund/core/enums/Pages';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';
import { Nullable } from '@/supafund/core/types/Util';

import { UpdateAgentCard } from '@/supafund/ui/components/UpdateAgentPage/UpdateAgentCard';
import { UpdateAgentContext } from '@/supafund/ui/components/UpdateAgentPage/context/UpdateAgentProvider';

const { Title, Text } = Typography;

export interface SupafundFormValues {
  weights: {
    founder_team: number;
    market_opportunity: number;
    technical_analysis: number;
    social_sentiment: number;
    tokenomics: number;
  };
  apiEndpoint: string;
  minEdgeThreshold: number;
  riskTolerance: number;
}

export const SupafundUpdateSetup = () => {
  const { goto } = usePageState();
  const { selectedService } = useServices();
  const {
    unsavedModal,
    form,
    isEditing,
    confirmUpdateModal: confirmModal,
  } = useContext(UpdateAgentContext);

  const initialValues = useMemo<Nullable<SupafundFormValues>>(() => {
    if (!selectedService?.env_variables) return null;

    const envEntries = Object.entries(selectedService.env_variables);
    const values = envEntries.reduce((acc, [key, { value }]) => {
      if (key === 'SUPAFUND_WEIGHTS') {
        try {
          acc.weights = JSON.parse(value);
        } catch {
          acc.weights = {
            founder_team: 20,
            market_opportunity: 20,
            technical_analysis: 20,
            social_sentiment: 20,
            tokenomics: 20,
          };
        }
      } else if (key === 'SUPAFUND_API_ENDPOINT') {
        acc.apiEndpoint = value;
      } else if (key === 'MIN_EDGE_THRESHOLD') {
        acc.minEdgeThreshold = parseInt(value) || 5;
      } else if (key === 'RISK_TOLERANCE') {
        acc.riskTolerance = parseInt(value) || 5;
      }
      return acc;
    }, {} as SupafundFormValues);

    return values;
  }, [selectedService]);

  const handleClickBack = useCallback(() => {
    const unsavedFields = omitBy(
      form?.getFieldsValue(),
      (value) => value === undefined || value === '',
    );
    const hasUnsavedChanges = !isEqual(unsavedFields, initialValues);

    if (hasUnsavedChanges) {
      unsavedModal.openModal();
    } else {
      goto(Pages.Main);
    }
  }, [initialValues, form, unsavedModal, goto]);

  const onSubmit = useCallback(async () => {
    confirmModal.openModal();
  }, [confirmModal]);

  if (!initialValues) return null;

  return (
    <UpdateAgentCard onClickBack={handleClickBack}>
      <Card>
        <Title level={4}>Supafund Agent Configuration</Title>
        <Text type="secondary">
          Update your Supafund agent configuration settings.
        </Text>
        
        <div style={{ marginTop: '24px' }}>
          <Text>
            Current configuration values are loaded from your service environment variables.
          </Text>
          
          {initialValues && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>Current Weights:</Text>
              <ul style={{ marginTop: '8px' }}>
                <li>Founder Team: {initialValues.weights.founder_team}%</li>
                <li>Market Opportunity: {initialValues.weights.market_opportunity}%</li>
                <li>Technical Analysis: {initialValues.weights.technical_analysis}%</li>
                <li>Social Sentiment: {initialValues.weights.social_sentiment}%</li>
                <li>Tokenomics: {initialValues.weights.tokenomics}%</li>
              </ul>
              
              <div style={{ marginTop: '16px' }}>
                <Text strong>Risk Settings:</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>Min Edge Threshold: {initialValues.minEdgeThreshold}%</li>
                  <li>Risk Tolerance: {initialValues.riskTolerance}/10</li>
                  {initialValues.apiEndpoint && (
                    <li>API Endpoint: {initialValues.apiEndpoint}</li>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '24px' }}>
            {isEditing ? (
              <Button type="primary" onClick={onSubmit}>
                Save Configuration
              </Button>
            ) : (
              <Text type="secondary">
                Click &ldquo;Edit Agent&rdquo; to modify these settings.
              </Text>
            )}
          </div>
        </div>
      </Card>
    </UpdateAgentCard>
  );
};