import { isEqual } from 'lodash';
import { ethers } from 'ethers';
import { formatEther } from 'ethers/lib/utils';

import { STAKING_PROGRAMS } from '@/config/stakingPrograms';
import { PROVIDERS } from '@/constants/providers';
import { EvmChainId } from '@/enums/Chain';
import { StakingProgramId } from '@/enums/StakingProgram';
import { Address } from '@/types/Address';
import {
  ServiceStakingDetails,
  StakingContractDetails,
  StakingRewardsInfo,
} from '@/types/Autonolas';

import {
  ONE_YEAR,
  StakedAgentService,
} from './shared-services/StakedAgentService';

const MECH_REQUESTS_SAFETY_MARGIN = 1;

/**
 * Supafund Service
 * Extends StakedAgentService to provide proper integration with staking programs
 */
type SupafundWeightsConfig = {
  founder_team: number;
  market_opportunity: number;
  technical_analysis: number;
  social_sentiment: number;
  tokenomics: number;
};

const BALANCED_WEIGHTS: SupafundWeightsConfig = {
  founder_team: 20,
  market_opportunity: 20,
  technical_analysis: 20,
  social_sentiment: 20,
  tokenomics: 20,
};

export abstract class SupafundService extends StakedAgentService {
  static getAgentStakingRewardsInfo = async ({
    agentMultisigAddress,
    serviceId,
    stakingProgramId,
    chainId = EvmChainId.Gnosis,
  }: {
    agentMultisigAddress: Address;
    serviceId: number;
    stakingProgramId: StakingProgramId;
    chainId?: EvmChainId;
  }): Promise<StakingRewardsInfo | undefined> => {
    if (!agentMultisigAddress) return;
    if (!serviceId) return;

    const stakingProgramConfig = STAKING_PROGRAMS[chainId][stakingProgramId];

    if (!stakingProgramConfig) throw new Error('Staking program not found');

    const {
      activityChecker,
      contract: stakingTokenProxyContract,
      mech: mechContract,
    } = stakingProgramConfig;

    if (!activityChecker) {
      throw new Error('Activity checker contract is not defined');
    }

    const provider = PROVIDERS[chainId].multicallProvider;

    const contractCalls: any[] = [];

    const shouldFetchMechCount =
      mechContract && typeof mechContract.getRequestsCount === 'function';

    if (shouldFetchMechCount) {
      contractCalls.push(mechContract!.getRequestsCount(agentMultisigAddress));
    }

    contractCalls.push(
      activityChecker.getMultisigNonces(agentMultisigAddress),
      stakingTokenProxyContract.getServiceInfo(serviceId),
      stakingTokenProxyContract.livenessPeriod(),
      activityChecker.livenessRatio(),
      stakingTokenProxyContract.rewardsPerSecond(),
      stakingTokenProxyContract.calculateStakingReward(serviceId),
      stakingTokenProxyContract.minStakingDeposit(),
      stakingTokenProxyContract.tsCheckpoint(),
    );

    const multicallResponse = await provider.all(contractCalls);

    let responseIndex = 0;

    const mechRequestCountRaw = shouldFetchMechCount
      ? multicallResponse[responseIndex++]
      : null;

    const multisigNonces = multicallResponse[responseIndex++];
    const serviceInfo = multicallResponse[responseIndex++];
    const livenessPeriod = multicallResponse[responseIndex++];
    const livenessRatio = multicallResponse[responseIndex++];
    const rewardsPerSecond = multicallResponse[responseIndex++];
    const accruedStakingReward = multicallResponse[responseIndex++];
    const minStakingDeposit = multicallResponse[responseIndex++];
    const tsCheckpoint = multicallResponse[responseIndex++];

    const nowInSeconds = Math.floor(Date.now() / 1000);

    const requiredMechRequests =
      (Math.ceil(Math.max(livenessPeriod, nowInSeconds - tsCheckpoint)) *
        livenessRatio) /
        1e18 +
      MECH_REQUESTS_SAFETY_MARGIN;

    const serviceNonces = Array.isArray(serviceInfo?.[2])
      ? serviceInfo[2]
      : [];
    const lastCheckpointNonceRaw = serviceNonces[1] ?? serviceNonces[0] ?? 0;
    const checkpointNonce =
      typeof lastCheckpointNonceRaw?.toNumber === 'function'
        ? lastCheckpointNonceRaw.toNumber()
        : Number(lastCheckpointNonceRaw ?? 0);

    const fallbackNonceRaw = Array.isArray(multisigNonces)
      ? multisigNonces[0]
      : multisigNonces;
    const fallbackRequestCount =
      typeof fallbackNonceRaw?.toNumber === 'function'
        ? fallbackNonceRaw.toNumber()
        : Number(fallbackNonceRaw ?? 0);

    const mechRequestCount =
      mechRequestCountRaw && typeof mechRequestCountRaw.toNumber === 'function'
        ? mechRequestCountRaw.toNumber()
        : undefined;

    const currentRequestCount =
      mechRequestCount && mechRequestCount > checkpointNonce
        ? mechRequestCount
        : Math.max(mechRequestCount ?? 0, fallbackRequestCount);

    const eligibleRequests = Math.max(
      currentRequestCount - checkpointNonce,
      0,
    );

    const isEligibleForRewards = eligibleRequests >= requiredMechRequests;

    // Compute available rewards for current epoch using BigNumber math
    const secondsSinceCheckpoint = Math.max(
      0,
      nowInSeconds - (typeof tsCheckpoint?.toNumber === 'function'
        ? tsCheckpoint.toNumber()
        : Number(tsCheckpoint)),
    );
    const livenessPeriodSec =
      typeof livenessPeriod?.toNumber === 'function'
        ? livenessPeriod.toNumber()
        : Number(livenessPeriod);
    const effectivePeriodSec = Math.max(livenessPeriodSec, secondsSinceCheckpoint);

    const rpsBN = ethers.BigNumber.from(rewardsPerSecond);
    const availableRewardsForEpoch = Number(
      formatEther(rpsBN.mul(effectivePeriodSec)),
    );

    // Minimum staked amount is double the minimum staking deposit
    const minimumStakedAmount =
      parseFloat(formatEther(ethers.BigNumber.from(minStakingDeposit))) * 2;

    const accruedServiceStakingRewards = parseFloat(
      formatEther(ethers.BigNumber.from(accruedStakingReward)),
    );

    // Return shape compatible with StakingRewardsInfoSchema
    return {
      serviceInfo,
      livenessPeriod,
      livenessRatio,
      rewardsPerSecond,
      isEligibleForRewards,
      availableRewardsForEpoch,
      accruedServiceStakingRewards,
      minimumStakedAmount,
      currentRequestCount,
      checkpointNonce,
      mechRequestCount: currentRequestCount,
      eligibleRequests,
      requiredMechRequests,
      // extra fields (ignored by Zod) for potential Supafund UI usage
      serviceId,
      stakingProgramId,
      stakingProgram: stakingProgramConfig.name,
    } as StakingRewardsInfo & Record<string, unknown>;
  };

  /**
   * Validate weights configuration
   */
  static validateWeights = (weights: any): boolean => {
    try {
      if (!weights || typeof weights !== 'object') return false;
      
      const requiredKeys = ['founder_team', 'market_opportunity', 'technical_analysis', 'social_sentiment', 'tokenomics'];
      const hasAllKeys = requiredKeys.every(key => key in weights);
      const allNumbers = Object.values(weights).every(val => typeof val === 'number');
      const totalWeight = Object.values(weights).reduce((sum: number, val: any) => sum + val, 0);
      
      return hasAllKeys && allNumbers && Math.abs(totalWeight - 100) < 0.01;
    } catch {
      return false;
    }
  };

  /**
   * Get Supafund-specific configuration
   */
  static getSupafundConfig = async () => {
    // Try to load from localStorage first (will be replaced with backend)
    const savedConfig = localStorage.getItem('supafund_config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }

    // Return default configuration
    return {
      weights: { ...BALANCED_WEIGHTS },
      minEdgeThreshold: 5,
      riskTolerance: 5,
    };
  };

  /**
   * Update Supafund configuration and sync to service
   */
  static updateSupafundConfig = async (
    config: {
      weights?: SupafundWeightsConfig;
      minEdgeThreshold?: number;
      riskTolerance?: number;
      apiEndpoint?: string;
    },
    serviceConfigId?: string
  ) => {
    // Get current config
    const currentConfig = await SupafundService.getSupafundConfig();

    // Update config
    const updatedConfig = {
      ...currentConfig,
      ...config,
    };

    // Save to localStorage (for backward compatibility)
    localStorage.setItem('supafund_config', JSON.stringify(updatedConfig));

    // Update Service env_variables if serviceConfigId is provided
    if (serviceConfigId) {
      const { ServicesService } = await import('@/service/Services');
      
      const envVariables: Record<string, any> = {};

      // Update weights if provided
      if (config.weights) {
        const weights = config.weights;
        envVariables.SUPAFUND_WEIGHTS = {
          name: 'Supafund agent weights configuration',
          description: 'JSON string with weights for: founder_team, market_opportunity, technical_analysis, social_sentiment, tokenomics',
          value: JSON.stringify(weights),
          provision_type: 'user',
        };
        
        // Update PROMPT_TEMPLATE to include weights in AI analysis
        const promptBase = 'With the given question "@{question}" and the `yes` option represented by `@{yes}` and the `no` option represented by `@{no}`, what are the respective probabilities of `p_yes` and `p_no` occurring?';
        const shouldAppendWeights = !isEqual(weights, BALANCED_WEIGHTS);
        const promptWithWeights = shouldAppendWeights
          ? `${promptBase} Please consider the following weights when analyzing: ${JSON.stringify(weights)}`
          : promptBase;
        
        envVariables.PROMPT_TEMPLATE = {
          name: 'Prompt template with Supafund weights',
          description: 'AI prompt template that includes Supafund analysis weights for decision making',
          value: promptWithWeights,
          provision_type: 'user',
        };
      }

      // Update min edge threshold if provided
      if (config.minEdgeThreshold !== undefined) {
        envVariables.MIN_EDGE_THRESHOLD = {
          name: 'Minimum edge threshold',
          description: 'Minimum edge percentage required to place a bet',
          value: config.minEdgeThreshold.toString(),
          provision_type: 'user',
        };
      }

      // Update risk tolerance if provided
      if (config.riskTolerance !== undefined) {
        envVariables.RISK_TOLERANCE = {
          name: 'Risk tolerance',
          description: 'Risk tolerance level (1-10)',
          value: config.riskTolerance.toString(),
          provision_type: 'user',
        };
      }

      // Update API endpoint if provided
      if (config.apiEndpoint !== undefined) {
        envVariables.SUPAFUND_API_ENDPOINT = {
          name: 'Supafund API endpoint',
          description: 'API endpoint for Supafund backend services',
          value: config.apiEndpoint,
          provision_type: 'user',
        };
      }
      
      await ServicesService.updateService({
        serviceConfigId,
        partialServiceTemplate: {
          env_variables: envVariables
        }
      });
    }

    return updatedConfig;
  };

  /**
   * Update Supafund weights and sync to service (legacy method)
   */
  static updateSupafundWeights = async (
    weights: SupafundWeightsConfig,
    serviceConfigId?: string,
  ) => {
    return SupafundService.updateSupafundConfig({ weights }, serviceConfigId);
  };

  /**
   * Restart Supafund service to apply new configuration
   */
  static restartSupafundService = async (serviceConfigId: string) => {
    const { ServicesService } = await import('@/service/Services');
    
    try {
      // Stop the service first
      console.log('🛑 Stopping service...');
      await ServicesService.stopDeployment(serviceConfigId);
      
      // Wait longer for the service to fully stop
      console.log('⏳ Waiting for service to stop...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Start the service again
      console.log('🚀 Starting service...');
      await ServicesService.startService(serviceConfigId);
      
      console.log('✅ Service restarted successfully');
    } catch (error) {
      console.error('❌ Service restart failed:', error);
      throw new Error(`Failed to restart service: ${error.message}`);
    }
  };

  static getAvailableRewardsForEpoch = async (
    stakingProgramId: StakingProgramId,
    chainId: EvmChainId = EvmChainId.Gnosis,
  ): Promise<bigint | undefined> => {
    const stakingProgramConfig = STAKING_PROGRAMS[chainId][stakingProgramId];
    if (!stakingProgramConfig) return undefined;

    const { contract: stakingTokenProxyContract } = stakingProgramConfig;
    const provider = PROVIDERS[chainId].multicallProvider;

    const contractCalls = [
      stakingTokenProxyContract.rewardsPerSecond(),
      stakingTokenProxyContract.livenessPeriod(), // epoch length
      stakingTokenProxyContract.tsCheckpoint(), // last checkpoint timestamp
    ];

    const multicallResponse = await provider.all(contractCalls);
    const [rewardsPerSecond, livenessPeriod, tsCheckpoint] = multicallResponse;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return BigInt(
      Math.max(
        rewardsPerSecond * livenessPeriod, // expected rewards
        rewardsPerSecond * (nowInSeconds - tsCheckpoint), // incase of late checkpoint
      ),
    );
  };

  static getServiceStakingDetails = async (
    serviceNftTokenId: number,
    stakingProgramId: StakingProgramId,
    chainId: EvmChainId = EvmChainId.Gnosis,
  ): Promise<ServiceStakingDetails> => {
    const stakingProgramConfig = STAKING_PROGRAMS[chainId][stakingProgramId];
    if (!stakingProgramConfig) throw new Error('Staking program not found');

    const { contract: stakingTokenProxyContract } = stakingProgramConfig;
    const provider = PROVIDERS[chainId].multicallProvider;

    const [serviceInfo, minStakingDeposit] = await provider.all([
      stakingTokenProxyContract.getServiceInfo(serviceNftTokenId),
      stakingTokenProxyContract.minStakingDeposit(),
    ]);

    return {
      serviceId: serviceNftTokenId,
      stakingProgramId,
      multisig: serviceInfo[0],
      owner: serviceInfo[1],
      nonces: serviceInfo[2],
      tsStart: serviceInfo[3],
      reward: serviceInfo[4],
      inactivity: serviceInfo[5],
      minStakingDeposit: Number(formatEther(minStakingDeposit)),
    };
  };

  static getStakingContractDetails = async (
    stakingProgramId: StakingProgramId,
    chainId: EvmChainId,
  ): Promise<StakingContractDetails> => {
    const stakingProgramConfig = STAKING_PROGRAMS[chainId][stakingProgramId];
    if (!stakingProgramConfig) throw new Error('Staking program not found');

    const { contract: stakingTokenProxyContract, activityChecker } = stakingProgramConfig;
    const provider = PROVIDERS[chainId].multicallProvider;

    const [
      minStakingDeposit,
      rewardsPerSecond,
      maxNumServices,
      livenessPeriod,
      livenessRatio,
      serviceIds,
    ] = await provider.all([
      stakingTokenProxyContract.minStakingDeposit(),
      stakingTokenProxyContract.rewardsPerSecond(),
      stakingTokenProxyContract.maxNumServices(),
      stakingTokenProxyContract.livenessPeriod(),
      activityChecker.livenessRatio(),
      stakingTokenProxyContract.getServiceIds(),
    ]);

    // Calculate rewards per work period (assuming work period is livenessPeriod)
    const yearlyRewards = ethers.BigNumber.from(rewardsPerSecond).mul(ONE_YEAR);
    const availableRewards = Number(formatEther(yearlyRewards));
    const rewardsPerWorkPeriod = availableRewards / (ONE_YEAR / livenessPeriod);
    
    // Calculate APY (simplified calculation based on minimum stake)
    const minimumStake = Number(formatEther(minStakingDeposit));
    const apy = minimumStake > 0 ? ((availableRewards / minimumStake) * 100) : 0;

    return {
      availableRewards,
      maxNumServices,
      serviceIds: serviceIds || [],
      minimumStakingDuration: livenessPeriod,
      minStakingDeposit: minimumStake,
      apy: Math.round(apy * 100) / 100, // Round to 2 decimal places
      olasStakeRequired: minimumStake,
      rewardsPerWorkPeriod: Math.round(rewardsPerWorkPeriod * 100) / 100,
    };
  };

  async getStakingContractDetails(
    stakingProgramId: StakingProgramId,
    chainId: EvmChainId,
  ): Promise<unknown> {
    return SupafundService.getStakingContractDetails(stakingProgramId, chainId);
  }
}
