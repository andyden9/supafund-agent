import { MarketData, TradeData, UserPosition } from './subgraph';

const WEI_DECIMALS = 1e18;
const MIN_TOKEN_BALANCE = 1e-6;

const sanitizeWhitespace = (value: string): string =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

const sanitizeMarketTitle = (title?: string | null): string => {
  if (!title) return 'Untitled market';
  const [headline] = title.split('<contextStart>');
  const cleaned = sanitizeWhitespace(headline);
  return cleaned.length > 0 ? cleaned : 'Untitled market';
};

const sanitizeOutcomeLabel = (label: string, fallbackIndex: number): string => {
  const cleaned = sanitizeWhitespace(label);
  if (cleaned.length === 0) {
    return fallbackIndex === 0 ? 'YES' : fallbackIndex === 1 ? 'NO' : `Outcome ${fallbackIndex}`;
  }
  return cleaned;
};

const truncateText = (value: string, maxLength = 140): string => {
  if (value.length <= maxLength) return value;
  return `${value.substring(0, maxLength - 1).trimEnd()}…`;
};

const COLLATERAL_METADATA: Record<
  string,
  {
    symbol: string;
    usdPegged: boolean;
  }
> = {
  '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d': { symbol: 'XDAI', usdPegged: true },
  '0x0000000000000000000000000000000000000000': { symbol: 'ETH', usdPegged: false },
};

const getCollateralMetadata = (address?: string | null) => {
  if (!address) {
    return { symbol: 'Collateral', usdPegged: false };
  }
  const match = COLLATERAL_METADATA[address.toLowerCase()];
  if (match) {
    return match;
  }
  return { symbol: 'Collateral', usdPegged: false };
};

const fromWei = (value?: string | null): number => {
  if (!value) return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric / WEI_DECIMALS;
};

const round = (value: number, decimals = 2): number => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const nowInSeconds = (): number => Math.floor(Date.now() / 1000);

const parseTimestamp = (value?: string | null): number | undefined => {
  if (!value) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const formatDuration = (seconds: number): string => {
  const absSeconds = Math.abs(seconds);
  const days = Math.floor(absSeconds / 86400);
  const hours = Math.floor((absSeconds % 86400) / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${Math.max(1, Math.floor(absSeconds))}s`;
};

const formatTimeUntil = (timestamp?: number | null): string => {
  if (!timestamp) return 'Unknown';
  const diff = timestamp - nowInSeconds();
  if (diff <= 0) return 'Resolved';
  return `in ${formatDuration(diff)}`;
};

const formatTimeAgo = (timestamp: number): string => {
  const diff = nowInSeconds() - timestamp;
  if (diff >= 0) {
    if (diff < 60) return `${Math.max(1, diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  const futureDiff = Math.abs(diff);
  if (futureDiff < 60) return `in ${Math.max(1, Math.floor(futureDiff))}s`;
  if (futureDiff < 3600) return `in ${Math.floor(futureDiff / 60)}m`;
  if (futureDiff < 86400) return `in ${Math.floor(futureDiff / 3600)}h`;
  return `in ${Math.floor(futureDiff / 86400)}d`;
};

const inferDirection = (outcomeName: string, outcomeIndex: number): 'YES' | 'NO' => {
  const normalized = outcomeName.toLowerCase();
  if (normalized.includes('no')) return 'NO';
  if (normalized.includes('yes')) return 'YES';
  return outcomeIndex === 0 ? 'YES' : 'NO';
};

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
  marketLeader: string;
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
  category?: string;
  entryValue: number;
  currentValue: number;
  collateralSymbol: string;
  collateralIsStable: boolean;
  marketAddress: string;
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

interface AggregatedPositionState {
  key: string;
  marketId: string;
  marketTitle: string;
  outcomeIndex: number;
  outcomeName: string;
  category: string;
  conditionId?: string | null;
  collateralToken?: string | null;
  openingTimestamp?: number;
  resolutionTimestamp?: number;
  currentPrice: number;
  netTokens: number;
  costBasis: number;
  realizedPnL: number;
  realizedPnLWeekly: number;
  realizedPnLMonthly: number;
  winTrades: number;
  closedTrades: number;
  totalFees: number;
  lastTradeTimestamp: number;
}

interface TradeSummary {
  realizedPnL: number;
  price: number;
  tokens: number;
  fee: number;
  type: TradeData['type'];
  outcomeName: string;
  marketTitle: string;
  marketId: string;
  timestamp: number;
}

interface TradeAnalytics {
  aggregations: Map<string, AggregatedPositionState>;
  perTrade: Map<string, TradeSummary>;
}

const buildTradeAnalytics = (trades: TradeData[]): TradeAnalytics => {
  const aggregations = new Map<string, AggregatedPositionState>();
  const perTrade = new Map<string, TradeSummary>();

  if (!trades || trades.length === 0) {
    return { aggregations, perTrade };
  }

  const sortedTrades = [...trades].sort(
    (a, b) => Number(a.creationTimestamp) - Number(b.creationTimestamp)
  );
  const now = nowInSeconds();
  const weekAgo = now - 7 * 24 * 60 * 60;
  const monthAgo = now - 30 * 24 * 60 * 60;

  sortedTrades.forEach(trade => {
    const outcomeIndex = Number(trade.outcomeIndex ?? '0');
    const key = `${trade.fpmm.id}-${outcomeIndex}`;
    const tokens = fromWei(trade.outcomeTokensTraded);
    const collateral = fromWei(trade.collateralAmount);
    const fee = fromWei(trade.feeAmount);
    const tradeTimestamp = Number(trade.creationTimestamp);

    const outcomes = trade.fpmm.outcomes ?? [];
    const fallbackOutcome =
      outcomeIndex === 0 ? 'YES' : outcomeIndex === 1 ? 'NO' : `Outcome ${outcomeIndex}`;
    const rawOutcomeName = outcomes[outcomeIndex] ?? fallbackOutcome;
    const outcomeName = sanitizeOutcomeLabel(rawOutcomeName, outcomeIndex);
    const marketTitle = sanitizeMarketTitle(trade.fpmm.title);

    let aggregation = aggregations.get(key);
    if (!aggregation) {
      aggregation = {
        key,
        marketId: trade.fpmm.id,
        marketTitle,
        outcomeIndex,
        outcomeName,
        category:
          trade.fpmm.category ??
          trade.fpmm.question?.category ??
          'General',
        conditionId: trade.fpmm.condition?.id ?? null,
        collateralToken: trade.fpmm.collateralToken ?? null,
        openingTimestamp: parseTimestamp(trade.fpmm.openingTimestamp),
        resolutionTimestamp: parseTimestamp(trade.fpmm.resolutionTimestamp),
        currentPrice: clamp(
          Number.parseFloat(trade.fpmm.outcomeTokenMarginalPrices?.[outcomeIndex] ?? '0') || 0,
          0,
          1
        ),
        netTokens: 0,
        costBasis: 0,
        realizedPnL: 0,
        realizedPnLWeekly: 0,
        realizedPnLMonthly: 0,
        winTrades: 0,
        closedTrades: 0,
        totalFees: 0,
        lastTradeTimestamp: tradeTimestamp,
      };
      aggregations.set(key, aggregation);
    }

    aggregation.marketTitle = marketTitle;
    aggregation.outcomeName = outcomeName;
    aggregation.collateralToken = trade.fpmm.collateralToken ?? aggregation.collateralToken;

    const marginalPrice = Number.parseFloat(
      trade.fpmm.outcomeTokenMarginalPrices?.[outcomeIndex] ?? ''
    );
    if (!Number.isNaN(marginalPrice)) {
      aggregation.currentPrice = clamp(marginalPrice, 0, 1);
    }

    aggregation.lastTradeTimestamp = Math.max(aggregation.lastTradeTimestamp, tradeTimestamp);
    aggregation.totalFees += fee;

    let realizedPnLForTrade = 0;

    if (tokens > 0) {
      if (trade.type === 'Buy') {
        const totalCost = collateral + fee;
        aggregation.netTokens += tokens;
        aggregation.costBasis += totalCost;
      } else {
        const netProceeds = Math.max(collateral - fee, 0);
        const pricePerToken = tokens > 0 ? netProceeds / tokens : 0;

        const netTokensBefore = aggregation.netTokens;
        const costBasisBefore = aggregation.costBasis;

        const tokensSold = Math.min(tokens, Math.max(netTokensBefore, 0));
        if (tokensSold > 0 && netTokensBefore > 0) {
          const avgCost = costBasisBefore / netTokensBefore;
          const costPortion = avgCost * tokensSold;
          const proceeds = pricePerToken * tokensSold;

          realizedPnLForTrade += proceeds - costPortion;
          aggregation.netTokens = netTokensBefore - tokensSold;
          aggregation.costBasis = Math.max(costBasisBefore - costPortion, 0);
        }

        const remainingTokens = tokens - tokensSold;
        if (remainingTokens > 0) {
          const proceeds = pricePerToken * remainingTokens;
          realizedPnLForTrade += proceeds;
          aggregation.netTokens -= remainingTokens;
          if (aggregation.netTokens <= MIN_TOKEN_BALANCE) {
            aggregation.netTokens = 0;
            aggregation.costBasis = 0;
          }
        }

        aggregation.realizedPnL += realizedPnLForTrade;
        aggregation.closedTrades += 1;
        if (tradeTimestamp >= weekAgo) {
          aggregation.realizedPnLWeekly += realizedPnLForTrade;
        }
        if (tradeTimestamp >= monthAgo) {
          aggregation.realizedPnLMonthly += realizedPnLForTrade;
        }
        if (realizedPnLForTrade > 0) {
          aggregation.winTrades += 1;
        }
      }
    }

    perTrade.set(trade.id, {
      realizedPnL: realizedPnLForTrade,
      price:
        tokens > 0
          ? trade.type === 'Buy'
            ? (collateral + fee) / tokens
            : Math.max(collateral - fee, 0) / tokens
          : 0,
      tokens,
      fee,
      type: trade.type,
      outcomeName: aggregation.outcomeName,
      marketTitle: aggregation.marketTitle,
      marketId: aggregation.marketId,
      timestamp: tradeTimestamp,
    });
  });

  aggregations.forEach(aggregation => {
    if (aggregation.netTokens !== 0 && Math.abs(aggregation.netTokens) <= MIN_TOKEN_BALANCE) {
      aggregation.netTokens = 0;
      aggregation.costBasis = 0;
    }
  });

  return { aggregations, perTrade };
};

const calculateMarketLeader = (market: MarketData): string => {
  const prices =
    market.outcomeTokenMarginalPrices
      ?.map(value => Number.parseFloat(value))
      .filter(price => Number.isFinite(price)) ?? [];

  if (prices.length === 0) return 'No liquidity';

  const maxPrice = Math.max(...prices);
  const leaderIndex = prices.indexOf(maxPrice);
  const outcomes = market.outcomes ?? [];
  const label =
    outcomes[leaderIndex] ??
    (leaderIndex === 0 ? 'YES' : leaderIndex === 1 ? 'NO' : `Outcome ${leaderIndex}`);

  return `${(maxPrice * 100).toFixed(1)}% ${label}`;
};

const computeExpiryLabel = (market: MarketData): string => {
  const now = nowInSeconds();
  const resolutionTs = parseTimestamp(market.resolutionTimestamp);
  if (resolutionTs && resolutionTs <= now) {
    return 'Resolved';
  }

  const openingTs = parseTimestamp(market.openingTimestamp);
  const target = openingTs ?? resolutionTs ?? parseTimestamp(market.creationTimestamp);
  return formatTimeUntil(target);
};

const getOutcomeIndexFromIndexSet = (indexSet?: string): number | undefined => {
  if (!indexSet) return undefined;
  const numeric = Number(indexSet);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  const logValue = Math.log2(numeric);
  const rounded = Math.round(logValue);
  if (Math.abs(logValue - rounded) > 1e-6) {
    return undefined;
  }
  return rounded;
};

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

  const { aggregations } = buildTradeAnalytics(trades);
  const now = nowInSeconds();

  let totalCostBasis = 0;
  let totalCurrentValue = 0;
  let realizedPnL = 0;
  let weeklyPnL = 0;
  let monthlyPnL = 0;
  let wins = 0;
  let closedTrades = 0;

  aggregations.forEach(aggregation => {
    realizedPnL += aggregation.realizedPnL;
    weeklyPnL += aggregation.realizedPnLWeekly;
    monthlyPnL += aggregation.realizedPnLMonthly;
    wins += aggregation.winTrades;
    closedTrades += aggregation.closedTrades;

    if (aggregation.netTokens > MIN_TOKEN_BALANCE) {
      totalCostBasis += aggregation.costBasis;
      totalCurrentValue += aggregation.netTokens * aggregation.currentPrice;
    }
  });

  const totalProfitLoss = realizedPnL + (totalCurrentValue - totalCostBasis);
  const totalProfitLossPercentage =
    totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0;

  const activePositions = Array.from(aggregations.values()).filter(
    aggregation =>
      aggregation.netTokens > MIN_TOKEN_BALANCE &&
      (!aggregation.resolutionTimestamp || aggregation.resolutionTimestamp > now)
  ).length;

  const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;
  const base = totalCostBasis > 0 ? totalCostBasis : undefined;

  const weeklyPerformance = base ? (weeklyPnL / base) * 100 : 0;
  const monthlyPerformance = base ? (monthlyPnL / base) * 100 : 0;

  return {
    totalProfitLoss: round(totalProfitLoss),
    totalProfitLossPercentage: round(totalProfitLossPercentage),
    activePositions,
    winRate: round(winRate),
    weeklyPerformance: round(weeklyPerformance),
    monthlyPerformance: round(monthlyPerformance),
  };
};

export const processMarketOpportunities = (
  markets: MarketData[]
): ProcessedOpportunity[] => {
  if (!markets || markets.length === 0) {
    return [];
  }

  return [...markets]
    .sort((a, b) => Number(b.creationTimestamp) - Number(a.creationTimestamp))
    .slice(0, 10)
    .map(market => {
      const cleanTitle = sanitizeMarketTitle(market.title);
      const truncatedTitle = truncateText(cleanTitle, 80);

      return {
        id: market.id,
        title: truncatedTitle,
        marketLeader: calculateMarketLeader(market),
        category: market.category ?? market.question?.category ?? 'General',
        expiresIn: computeExpiryLabel(market),
      };
    });
};

export const processUserPositions = (
  positions: UserPosition[],
  trades: TradeData[],
  marketsByCondition: Record<string, MarketData> = {},
): ProcessedPosition[] => {
  const { aggregations } = buildTradeAnalytics(trades);
  if (aggregations.size === 0) {
    return [];
  }

  const conditionBalances = new Map<string, number>();
  positions?.forEach(position => {
    const conditionId = position.position.conditionIds?.[0];
    if (!conditionId) return;
    const outcomeIndex = getOutcomeIndexFromIndexSet(position.position.indexSets?.[0]);
    if (outcomeIndex === undefined) return;

    const key = `${conditionId.toLowerCase()}-${outcomeIndex}`;
    const balance = fromWei(position.balance);
    if (balance <= 0) return;

    const current = conditionBalances.get(key) ?? 0;
    conditionBalances.set(key, current + balance);
  });

  const now = nowInSeconds();
  const processed: ProcessedPosition[] = [];

  aggregations.forEach(aggregation => {
    const conditionKey = aggregation.conditionId
      ? `${aggregation.conditionId.toLowerCase()}-${aggregation.outcomeIndex}`
      : undefined;
    const positionBalance = conditionKey ? conditionBalances.get(conditionKey) : undefined;
    const tokensHeld =
      positionBalance !== undefined ? positionBalance : aggregation.netTokens;

    if (tokensHeld <= MIN_TOKEN_BALANCE) {
      return;
    }

    const marketInfo = aggregation.conditionId
      ? marketsByCondition[aggregation.conditionId.toLowerCase()]
      : undefined;
    const resolvedTimestamp =
      parseTimestamp(marketInfo?.resolutionTimestamp) ?? aggregation.resolutionTimestamp;
    const openingTimestamp =
      parseTimestamp(marketInfo?.openingTimestamp) ?? aggregation.openingTimestamp;
    const collateralAddress =
      marketInfo?.collateralToken ?? aggregation.collateralToken ?? undefined;
    const collateralMeta = getCollateralMetadata(collateralAddress);

    const costBasisForHeldTokens =
      aggregation.netTokens > MIN_TOKEN_BALANCE && tokensHeld > 0
        ? aggregation.costBasis * (tokensHeld / aggregation.netTokens)
        : aggregation.costBasis;

    const entryPrice = tokensHeld > 0 ? costBasisForHeldTokens / tokensHeld : 0;
    let currentPrice = aggregation.currentPrice ?? entryPrice;
    const marketPrice = Number.parseFloat(
      marketInfo?.outcomeTokenMarginalPrices?.[aggregation.outcomeIndex] ?? '',
    );
    if (Number.isFinite(marketPrice)) {
      currentPrice = clamp(marketPrice, 0, 1);
    }

    const unrealizedPnL = tokensHeld * (currentPrice - entryPrice);
    const totalPnL = aggregation.realizedPnL + unrealizedPnL;
    const pnlPercentage =
      costBasisForHeldTokens > 0 ? (totalPnL / costBasisForHeldTokens) * 100 : 0;
    const isResolved = resolvedTimestamp !== undefined && resolvedTimestamp <= now;
    const status: ProcessedPosition['status'] = isResolved ? 'CLOSED' : 'OPEN';
    const expiryTimestamp = isResolved
      ? resolvedTimestamp
      : openingTimestamp ?? resolvedTimestamp;
    const timeRemaining = isResolved ? 'Resolved' : formatTimeUntil(expiryTimestamp);
    const cleanTitle = sanitizeMarketTitle(marketInfo?.title ?? aggregation.marketTitle);
    const displayTitle = truncateText(cleanTitle, 120);
    const entryValue = costBasisForHeldTokens;
    const currentValue = tokensHeld * currentPrice;

    processed.push({
      id: aggregation.key,
      market: displayTitle,
      direction: inferDirection(aggregation.outcomeName, aggregation.outcomeIndex),
      entryPrice: round(entryPrice),
      currentPrice: round(currentPrice),
      size: round(tokensHeld, 4),
      pnl: round(totalPnL),
      pnlPercentage: round(pnlPercentage),
      timeRemaining,
      status,
      category: marketInfo?.category ?? aggregation.category,
      entryValue: round(entryValue),
      currentValue: round(currentValue),
      collateralSymbol: collateralMeta.symbol,
      collateralIsStable: collateralMeta.usdPegged,
      marketAddress: aggregation.marketId,
    });
  });

  return processed.sort((a, b) => {
    if (a.status === b.status) {
      return b.pnl - a.pnl;
    }
    return a.status === 'OPEN' ? -1 : 1;
  });
};

export const processTradeActivities = (
  trades: TradeData[],
  marketsByCondition: Record<string, MarketData> = {},
): ProcessedActivity[] => {
  if (!trades || trades.length === 0) {
    return [];
  }

  const { perTrade } = buildTradeAnalytics(trades);

  return [...trades]
    .sort((a, b) => Number(b.creationTimestamp) - Number(a.creationTimestamp))
    .slice(0, 20)
    .map(trade => {
      const summary = perTrade.get(trade.id);
      const tokens = summary?.tokens ?? fromWei(trade.outcomeTokensTraded);
      const price = summary?.price ?? 0;
      const outcomeName =
        summary?.outcomeName ??
        trade.fpmm.outcomes?.[Number(trade.outcomeIndex)] ??
        `Outcome ${trade.outcomeIndex}`;
      const action = trade.type === 'Buy' ? 'Bought' : 'Sold';
      const cleanOutcomeName = sanitizeOutcomeLabel(
        outcomeName,
        Number(trade.outcomeIndex ?? '0'),
      );
      const pnlValue = summary?.realizedPnL ?? 0;
      const hasRealizedPnl = Math.abs(pnlValue) > 0.0001;

      const amountLabel =
        tokens > 0 ? `${round(tokens, 2)} @ ${round(price, 2)}` : 'No size recorded';
      const conditionId = trade.fpmm.condition?.id?.toLowerCase();
      const marketInfo = conditionId ? marketsByCondition[conditionId] : undefined;
      const marketTitle = sanitizeMarketTitle(marketInfo?.title ?? trade.fpmm.title);
      const description = truncateText(`${marketTitle} • ${amountLabel}`, 160);

      return {
        id: trade.id,
        type: trade.type === 'Buy' ? 'POSITION_OPENED' : 'POSITION_CLOSED',
        title: `${action} ${cleanOutcomeName}`,
        description,
        timestamp: formatTimeAgo(Number(trade.creationTimestamp)),
        result: hasRealizedPnl ? { pnl: round(pnlValue) } : undefined,
      };
    });
};
