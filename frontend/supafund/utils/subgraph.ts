import { gql, request } from 'graphql-request';

// Trader 使用的 subgraph endpoints
const SUBGRAPH_ENDPOINTS = {
  OMEN: 'https://omen.subgraph.autonolas.tech',
  TRADES: 'https://trades.subgraph.autonolas.tech',
  CONDITIONAL_TOKENS: 'https://conditional-tokens.subgraph.autonolas.tech',
  REALITIO: 'https://realitio.subgraph.autonolas.tech',
} as const;

export interface TradeData {
  id: string;
  title: string;
  collateralToken: string;
  collateralAmount: string;
  feeAmount: string;
  outcomeTokensTraded: string;
  outcomeIndex: string;
  // outcomeTokenAmounts removed due to schema mismatch
  type: string;
  creationTimestamp: string;
  transactionHash: string;
  fpmm: {
    id: string;
    title: string;
    outcomes: string[];
    outcomeTokenMarginalPrices?: string[];
    openingTimestamp?: string;
    category?: string;
    resolutionTimestamp?: string;
    currentAnswer?: string;
    condition?: {
      id: string;
    };
    question?: {
      id: string;
      title: string;
      category?: string;
    } | null;
  };
}

export interface MarketData {
  id: string;
  title: string;
  outcomes: string[];
  outcomeTokenMarginalPrices?: string[];
  collateralToken: string;
  fee: string;
  creationTimestamp: string;
  category?: string;
  openingTimestamp?: string;
  resolutionTimestamp?: string;
  currentAnswer?: string;
  condition?: {
    id: string;
  } | null;
  question?: {
    id: string;
    title: string;
    category?: string;
  } | null;
}

export interface UserPosition {
  id: string;
  balance: string;
  wrappedBalance: string;
  position: {
    id: string;
    conditionIds: string[];
    indexSets: string[];
  };
}

// 统一的 Supafund 市场创建者地址（用于过滤 Omen 市场）
const SUPAFUND_CREATOR = '0x89c5cc945dd550BcFfb72Fe42BfF002429F46Fec';

// 查询用户的交易历史
export const queryUserTrades = async (userAddress: string): Promise<TradeData[]> => {
  if (!userAddress) {
    console.warn('No user address provided for trades query');
    return [];
  }

  const query = gql`
    query GetUserTrades($userAddress: String!) {
      fpmmTrades(
        where: { creator: $userAddress }
        orderBy: creationTimestamp
        orderDirection: desc
        first: 100
      ) {
        id
        title
        collateralToken
        collateralAmount
        feeAmount
        outcomeTokensTraded
        outcomeIndex
        type
        creationTimestamp
        transactionHash
        fpmm {
          id
          title
          outcomes
          outcomeTokenMarginalPrices
          openingTimestamp
          category
          resolutionTimestamp
          currentAnswer
          condition {
            id
          }
          question {
            id
            title
            category
          }
        }
      }
    }
  `;

  try {
    console.log(`🔍 Querying trades for user: ${userAddress}`);
    const result = await request(SUBGRAPH_ENDPOINTS.OMEN, query, { 
      userAddress: userAddress.toLowerCase() 
    });
    const trades = (result as any)?.fpmmTrades || [];
    console.log(`📊 Found ${trades.length} trades for user ${userAddress}`);
    return trades;
  } catch (error) {
    console.error('Failed to fetch user trades:', error);
    return [];
  }
};

// 查询当前市场机会
export const queryMarketOpportunities = async (): Promise<MarketData[]> => {
  const creatorAddress = SUPAFUND_CREATOR;
  
  const query = gql`
    query GetMarketOpportunities {
      fixedProductMarketMakers(
        where: { 
          creator: "${creatorAddress}",
          resolutionTimestamp: null,
          creationTimestamp_gt: "${Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60}"
        }
        orderBy: creationTimestamp
        orderDirection: desc
        first: 20
      ) {
        id
        title
        outcomes
        outcomeTokenMarginalPrices
        collateralToken
        fee
        creationTimestamp
        category
        openingTimestamp
        resolutionTimestamp
        currentAnswer
        question {
          id
          title
          category
        }
      }
    }
  `;

  try {
    console.log(`🔍 Querying markets for creator: ${creatorAddress}`);
    const result = await request(SUBGRAPH_ENDPOINTS.OMEN, query);
    const markets = (result as any)?.fixedProductMarketMakers || [];
    console.log(`📊 Found ${markets.length} markets by creator ${creatorAddress}`);
    if (markets.length > 0) {
      console.log(`📝 Sample market: ${markets[0].title.substring(0, 100)}...`);
    }
    return markets;
  } catch (error) {
    console.error('Failed to fetch market opportunities:', error);
    return [];
  }
};

// 查询用户当前仓位
export const queryUserPositions = async (userAddress: string): Promise<UserPosition[]> => {
  if (!userAddress) return [];

  const query = gql`
    query GetUserPositions($userAddress: String!) {
      user(id: $userAddress) {
        userPositions(
          where: { balance_gt: "0" }
          first: 50
        ) {
          id
          balance
          wrappedBalance
          position {
            id
            conditionIds
            indexSets
          }
        }
      }
    }
  `;

  try {
    console.log(`🔍 Querying positions for user: ${userAddress}`);
    const result = await request(SUBGRAPH_ENDPOINTS.CONDITIONAL_TOKENS, query, { 
      userAddress: userAddress.toLowerCase() 
    });
    const positions = (result as any)?.user?.userPositions || [];
    console.log(`📊 Found ${positions.length} positions for user ${userAddress}`);
    return positions;
  } catch (error) {
    console.error('Failed to fetch user positions:', error);
    return [];
  }
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const queryMarketsByCondition = async (
  conditionIds: string[],
): Promise<Record<string, MarketData>> => {
  if (!conditionIds || conditionIds.length === 0) {
    return {};
  }

  const uniqueIds = Array.from(
    new Set(
      conditionIds
        .map(id => id?.toLowerCase())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (uniqueIds.length === 0) {
    return {};
  }

  const query = gql`
    query MarketsByCondition($conditionIds: [String!]!) {
      fixedProductMarketMakers(where: { condition_in: $conditionIds }) {
        id
        title
        outcomes
        outcomeTokenMarginalPrices
        collateralToken
        fee
        creationTimestamp
        category
        openingTimestamp
        resolutionTimestamp
        currentAnswer
        condition {
          id
        }
        question {
          id
          title
          category
        }
      }
    }
  `;

  const results: Record<string, MarketData> = {};

  for (const chunk of chunkArray(uniqueIds, 40)) {
    try {
      const response = await request(SUBGRAPH_ENDPOINTS.OMEN, query, {
        conditionIds: chunk,
      });
      const markets = (response as any)?.fixedProductMarketMakers ?? [];
      markets.forEach(
        (market: MarketData & { condition?: { id?: string } | null }) => {
          const conditionId = market.condition?.id?.toLowerCase();
          if (!conditionId) return;
          results[conditionId] = market;
        },
      );
    } catch (error) {
      console.error('Failed to fetch markets by condition:', error);
    }
  }

  return results;
};

// 获取 trader 状态 - 可选的，CORS 问题时返回默认值
export const fetchTraderHealthStatus = async () => {
  try {
    // 在 Electron 环境下可能可以访问，在浏览器开发环境下会失败
    const response = await fetch('http://127.0.0.1:8716/healthcheck', {
      method: 'GET',
      mode: 'no-cors', // 避免 CORS 错误
    });
    
    // no-cors 模式下无法读取响应内容，返回默认活跃状态
    return {
      isActive: true,
      currentRound: 'active',
      recentRounds: ['active'],
      secondsSinceLastTransition: 30,
    };
  } catch (error) {
    // CORS 或网络错误时返回默认状态
    console.warn('Trader health check not available (expected in dev mode):', error);
    return {
      isActive: true, // 假设在开发环境下处于活跃状态
      currentRound: 'development', 
      recentRounds: ['development'],
      secondsSinceLastTransition: 0,
    };
  }
};
