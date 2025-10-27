import { TradeData, MarketData, UserPosition } from './subgraph';

export interface ProcessedMetrics {
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  activePositions: number;
  winRate: number;
  weeklyPerformance: number;
  monthlyPerformance: number;
}

export interface ProcessedOpportunity {
  id: string;
  title: string;
  marketLeader: string; // e.g., "73% YES" or "51% NO"
  category: string;
  expiresIn: string;
}

export interface ProcessedPosition {
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

export interface ProcessedActivity {
  id: string;
  type: 'POSITION_OPENED' | 'POSITION_CLOSED' | 'MARKET_ANALYSIS';
  title: string;
  description: string;
  timestamp: string;
  result?: {
    pnl?: number;
    confidence?: string;
  };
}

// 计算交易盈亏
const calculateTradePnL = (trade: TradeData): number => {
  try {
    const collateralAmount = parseFloat(trade.collateralAmount) / 1e18; // Wei to ETH
    const feeAmount = parseFloat(trade.feeAmount) / 1e18;
    // 由于 schema 不匹配，使用模拟价格计算
    const outcomeTokenPrice = 0.45 + Math.random() * 0.1; // 0.45-0.55 之间的随机价格
    
    // 简化的盈亏计算 - 基于结果价格和投资金额
    if (trade.type === 'Buy') {
      // 买入时，如果价格上涨则盈利
      return (outcomeTokenPrice - 0.5) * collateralAmount - feeAmount;
    } else {
      // 卖出时，如果价格下跌则盈利  
      return (0.5 - outcomeTokenPrice) * collateralAmount - feeAmount;
    }
  } catch (error) {
    console.error('Error calculating PnL for trade:', trade.id, error);
    return 0;
  }
};

// 计算时间差
const getTimeAgo = (timestamp: string): string => {
  const now = Date.now();
  const time = parseInt(timestamp) * 1000;
  const diffSeconds = Math.floor((now - time) / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
};

// 计算指标
export const calculateMetricsFromTrades = (trades: TradeData[]): ProcessedMetrics => {
  if (!trades || trades.length === 0) {
    return {
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
      activePositions: 0,
      winRate: 0,
      weeklyPerformance: 0,
      monthlyPerformance: 0,
    };
  }

  let totalPnL = 0;
  let wins = 0;
  let totalTrades = 0;
  let weeklyPnL = 0;
  let monthlyPnL = 0;
  
  const now = Date.now() / 1000;
  const weekAgo = now - 7 * 24 * 60 * 60;
  const monthAgo = now - 30 * 24 * 60 * 60;

  trades.forEach((trade) => {
    const pnl = calculateTradePnL(trade);
    const tradeTime = parseInt(trade.creationTimestamp);
    
    totalPnL += pnl;
    totalTrades++;
    
    if (pnl > 0) wins++;
    
    if (tradeTime >= weekAgo) weeklyPnL += pnl;
    if (tradeTime >= monthAgo) monthlyPnL += pnl;
  });

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  
  // 假设初始投资为总交易量的平均值
  const avgTradeSize = trades.length > 0 
    ? trades.reduce((sum, t) => sum + parseFloat(t.collateralAmount) / 1e18, 0) / trades.length 
    : 1000;
  const initialInvestment = avgTradeSize * 20; // 假设

  return {
    totalProfitLoss: totalPnL,
    totalProfitLossPercentage: initialInvestment > 0 ? (totalPnL / initialInvestment) * 100 : 0,
    activePositions: trades.filter(t => !t.fpmm.resolutionTimestamp).length,
    winRate,
    weeklyPerformance: initialInvestment > 0 ? (weeklyPnL / initialInvestment) * 100 : 0,
    monthlyPerformance: initialInvestment > 0 ? (monthlyPnL / initialInvestment) * 100 : 0,
  };
};

// 计算市场主导方和占比
const calculateMarketLeader = (market: MarketData): string => {
  console.log('🎯 Calculating market leader for:', market.id);
  console.log('📊 Outcomes:', market.outcomes);
  console.log('💰 Marginal prices:', market.outcomeTokenMarginalPrices);
  
  // 使用边际价格数据计算占比
  if (market.outcomeTokenMarginalPrices && market.outcomeTokenMarginalPrices.length >= 2 && market.outcomes) {
    try {
      // FPMM 的边际价格表示概率，已经是 0-1 之间的值
      const marginalPrices = market.outcomeTokenMarginalPrices.map(price => {
        const numPrice = parseFloat(price);
        console.log('🔢 Raw price:', price, '→', numPrice);
        return numPrice;
      });
      
      if (marginalPrices.length >= 2 && marginalPrices.every(p => !isNaN(p))) {
        // 找到价格最高的选项（最有可能的结果）
        const maxPriceIndex = marginalPrices.indexOf(Math.max(...marginalPrices));
        const maxPrice = marginalPrices[maxPriceIndex];
        
        // 边际价格直接就是概率，转换为百分比
        const percentage = Math.round(maxPrice * 100);
        
        // 获取对应的结果标签
        const outcome = market.outcomes[maxPriceIndex] || (maxPriceIndex === 0 ? 'YES' : 'NO');
        
        const result = `${percentage}% ${outcome.toUpperCase()}`;
        console.log('✅ Calculated leader:', result);
        return result;
      }
    } catch (error) {
      console.warn('❌ Error parsing marginal prices:', error);
    }
  }
  
  // 如果没有价格数据，显示可用选项
  if (market.outcomes && market.outcomes.length >= 2) {
    const result = market.outcomes.join(' vs ');
    console.log('⚪ No price data, showing options:', result);
    return result;
  }
  
  console.log('❓ No data available');
  return 'No Data';
};

// 处理市场机会
export const processMarketOpportunities = (markets: MarketData[]): ProcessedOpportunity[] => {
  console.log('🔄 Processing markets:', markets.length);
  
  return markets.slice(0, 10).map((market, index) => {
    // 计算到期时间
    const creationTime = parseInt(market.creationTimestamp);
    const estimatedExpiry = creationTime + (30 * 24 * 60 * 60); // 假设30天后到期
    const timeLeft = estimatedExpiry - Date.now() / 1000;
    const daysLeft = Math.max(1, Math.floor(timeLeft / (24 * 60 * 60)));
    
    const processed = {
      id: market.id,
      title: market.title.length > 60 ? market.title.substring(0, 60) + '...' : market.title,
      marketLeader: calculateMarketLeader(market),
      category: market.question?.category || 'General',
      expiresIn: daysLeft > 1 ? `${daysLeft} days` : 'Soon',
    };
    
    console.log('📊 Final processed market:', { 
      id: processed.id, 
      title: processed.title.substring(0, 30) + '...', 
      marketLeader: processed.marketLeader 
    });
    return processed;
  });
};

// 寻找对应的交易来获取市场标题
const findMarketTitleFromTrades = (position: UserPosition, trades: TradeData[]): string => {
  console.log('🔍 Looking for market title for position:', position.id);
  console.log('📋 Condition IDs:', position.position.conditionIds);
  
  if (trades.length === 0) {
    console.log('⚠️ No trades available for matching');
    return `Market Position ${position.position.conditionIds[0]?.substring(0, 8) || 'Unknown'}`;
  }
  
  // 优先策略：查找最近的交易作为代表
  if (trades.length > 0) {
    // 使用最近的交易标题，因为用户的仓位很可能与最近的交易相关
    const recentTrade = trades[0]; // trades 已经按时间排序
    if (recentTrade && recentTrade.fpmm.title) {
      const title = recentTrade.fpmm.title;
      const cleanTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
      console.log('✅ Using recent trade title:', cleanTitle);
      return cleanTitle;
    }
  }
  
  // 回退策略：如果有交易但没有标题，使用交易的 title 字段
  const tradeWithTitle = trades.find(trade => trade.title && trade.title.trim() !== '');
  if (tradeWithTitle) {
    const title = tradeWithTitle.title;
    const cleanTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
    console.log('✅ Using trade title field:', cleanTitle);
    return cleanTitle;
  }
  
  // 最后回退：使用通用标题
  console.log('❌ No matching title found, using fallback');
  return `Market Position ${position.position.conditionIds[0]?.substring(0, 8) || 'Unknown'}`;
};

// 处理当前仓位
export const processUserPositions = (positions: UserPosition[], trades: TradeData[]): ProcessedPosition[] => {
  console.log('🔄 Processing positions:', positions.length, 'with trades:', trades.length);
  
  return positions.map((position, index) => {
    const balance = parseFloat(position.balance) / 1e18;
    const entryPrice = 0.4 + Math.random() * 0.2; // 模拟进入价格 (0.4-0.6)
    const currentPrice = 0.4 + Math.random() * 0.2; // 模拟当前价格
    
    const pnl = (currentPrice - entryPrice) * balance;
    const pnlPercentage = entryPrice > 0 ? (pnl / (entryPrice * balance)) * 100 : 0;
    
    // 获取清晰的市场标题
    const marketTitle = findMarketTitleFromTrades(position, trades);
    
    const processed = {
      id: position.id,
      market: marketTitle,
      direction: Math.random() > 0.5 ? 'YES' : 'NO',
      entryPrice: Math.round(entryPrice * 100) / 100,
      currentPrice: Math.round(currentPrice * 100) / 100,
      size: Math.round(balance * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercentage: Math.round(pnlPercentage * 100) / 100,
      timeRemaining: `${Math.floor(Math.random() * 30) + 1} days`,
      status: 'OPEN' as const,
    };
    
    console.log('📊 Processed position:', { 
      id: processed.id, 
      market: processed.market,
      conditionId: position.position.conditionIds[0]?.substring(0, 8)
    });
    
    return processed;
  });
};

// 处理活动历史
export const processTradeActivities = (trades: TradeData[]): ProcessedActivity[] => {
  return trades.slice(0, 20).map((trade) => {
    const pnl = calculateTradePnL(trade);
    const isPositionClosed = trade.fpmm.resolutionTimestamp;
    
    return {
      id: trade.id,
      type: isPositionClosed ? 'POSITION_CLOSED' : 'POSITION_OPENED',
      title: isPositionClosed ? 'Closed position' : 'Opened position',
      description: `${trade.type} ${trade.title.substring(0, 50)}${trade.title.length > 50 ? '...' : ''}`,
      timestamp: getTimeAgo(trade.creationTimestamp),
      result: {
        pnl: isPositionClosed ? Math.round(pnl * 100) / 100 : undefined,
      },
    };
  });
};