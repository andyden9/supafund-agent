import { useCallback, useEffect, useState } from 'react';

import { EvmChainId } from '@/enums/Chain';
import { WalletType } from '@/enums/Wallet';
import { useServices } from '@/hooks/useServices';
import { useMasterWalletContext } from '@/hooks/useWallet';
import {
  calculateMetricsFromTrades,
  processMarketOpportunities,
  processTradeActivities,
  processUserPositions,
  ProcessedActivity,
  ProcessedMetrics,
  ProcessedOpportunity,
  ProcessedPosition,
} from '../utils/dataProcessor';
import {
  fetchTraderHealthStatus,
  queryMarketOpportunities,
  queryUserPositions,
  queryUserTrades,
} from '../utils/subgraph';

// Legacy interfaces for backward compatibility
interface Metrics extends ProcessedMetrics {}
interface Opportunity extends ProcessedOpportunity {}
interface Position extends ProcessedPosition {}
interface Activity extends ProcessedActivity {}

// 获取实际用于交易的地址 - 优先使用 service wallets
const getTradingAddress = (masterSafes: any[], serviceWallets: any[]): string | null => {
  // 优先尝试使用 service wallets (agent 实际交易地址)
  const gnosisServiceWallet = serviceWallets?.find(
    (wallet) => wallet.type === WalletType.Safe && 
                 'evmChainId' in wallet && 
                 wallet.evmChainId === EvmChainId.Gnosis
  );
  
  if (gnosisServiceWallet?.address) {
    console.log('🎯 Using service wallet for trading:', gnosisServiceWallet.address);
    return gnosisServiceWallet.address;
  }
  
  // 回退到 master safe
  const masterSafe = masterSafes?.find(
    (safe) => safe.evmChainId === EvmChainId.Gnosis
  );
  
  if (masterSafe?.address) {
    console.log('🎯 Using master safe for trading:', masterSafe.address);
    return masterSafe.address;
  }
  
  console.warn('❌ No trading address found');
  return null;
};

export const useSupafundData = () => {
  const { masterSafes } = useMasterWalletContext();
  const { serviceWallets } = useServices();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalProfitLoss: 0,
    totalProfitLossPercentage: 0,
    activePositions: 0,
    winRate: 0,
    weeklyPerformance: 0,
    monthlyPerformance: 0,
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // 获取真实数据
  const loadRealData = useCallback(async () => {
    // 获取交易地址 - 优先使用 service wallet
    const tradingAddress = getTradingAddress(masterSafes || [], serviceWallets || []);
    
    if (!tradingAddress) {
      setError('No trading address found');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      console.log(`🎯 Using trading address: ${tradingAddress}`);

      // 并行获取所有数据
      const [tradesData, marketsData, positionsData, traderStatus] =
        await Promise.all([
          queryUserTrades(tradingAddress),
          queryMarketOpportunities(),
          queryUserPositions(tradingAddress),
          fetchTraderHealthStatus(),
        ]);

      // 处理和计算数据
      const calculatedMetrics = calculateMetricsFromTrades(tradesData);
      const processedOpportunities = processMarketOpportunities(marketsData);
      const processedPositions = processUserPositions(
        positionsData,
        tradesData,
      );
      const processedActivities = processTradeActivities(tradesData);

      // 更新状态
      setMetrics(calculatedMetrics);
      setOpportunities(processedOpportunities);
      setPositions(processedPositions);
      setActivities(processedActivities);

      // trades: tradesData.length,
      // markets: marketsData.length,
      // positions: positionsData.length,
      // traderActive: traderStatus.isActive,
      // });

    } catch (error) {
      console.error('Failed to load Supafund data:', error);
      setError('Failed to load trading data');
      
      // 如果获取真实数据失败，显示空状态而不是模拟数据
      setMetrics({
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0,
        activePositions: 0,
        winRate: 0,
        weeklyPerformance: 0,
        monthlyPerformance: 0,
      });
      setOpportunities([]);
      setPositions([]);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterSafes, serviceWallets]);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  const refetch = () => {
    loadRealData();
  };

  return {
    metrics,
    opportunities,
    positions,
    activities,
    isLoading,
    error,
    refetch,
  };
};
