import {
  processTradeActivities,
  processUserPositions,
} from '../../utils/dataProcessor';
import { MarketData, TradeData, UserPosition } from '../../utils/subgraph';

const createBaseTrade = (overrides: Partial<TradeData> = {}): TradeData => ({
  id: 'trade-1',
  title: 'Sample trade',
  collateralToken: '0x0',
  collateralAmount: '1000000000000000000',
  feeAmount: '0',
  outcomeTokensTraded: '1000000000000000000',
  outcomeIndex: '0',
  type: 'Buy',
  creationTimestamp: `${Math.floor(Date.now() / 1000) - 60}`,
  transactionHash: '0xhash',
  fpmm: {
    id: 'market-1',
    title: 'Simple Market Question <contextStart>verbose metadata that should be trimmed',
    outcomes: ['Yes', 'No'],
    outcomeTokenMarginalPrices: ['0.55', '0.45'],
    openingTimestamp: `${Math.floor(Date.now() / 1000) + 600}`,
    category: 'example',
    resolutionTimestamp: `${Math.floor(Date.now() / 1000) + 3600}`,
    currentAnswer: null,
    condition: {
      id: '0xcondition',
    },
    question: {
      id: 'question-1',
      title: 'Question title',
      category: 'example',
    },
    ...overrides.fpmm,
  },
  ...overrides,
});

describe('dataProcessor sanitisation', () => {
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    const fixedNow = 1_700_000_000;
    dateNowSpy = jest.spyOn(global.Date, 'now').mockReturnValue(fixedNow * 1000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('sanitises position output with market metadata', () => {
    const trade = createBaseTrade();
    const position: UserPosition = {
      id: 'position-1',
      balance: '1000000000000000000',
      wrappedBalance: '0',
      position: {
        id: 'position-1',
        conditionIds: ['0xcondition'],
        indexSets: ['1'],
      },
    };

    const marketsByCondition: Record<string, MarketData> = {
      '0xcondition': {
        id: 'market-1',
        title: 'Simple Market Question <contextStart>more metadata',
        outcomes: ['Yes', 'No'],
        outcomeTokenMarginalPrices: ['0.60', '0.40'],
        collateralToken: '0x0',
        fee: '0',
        creationTimestamp: `${Math.floor(Date.now() / 1000) - 3600}`,
        category: 'example',
        openingTimestamp: `${Math.floor(Date.now() / 1000) + 600}`,
        resolutionTimestamp: `${Math.floor(Date.now() / 1000) + 3600}`,
        currentAnswer: null,
        condition: {
          id: '0xcondition',
        },
        question: {
          id: 'question-1',
          title: 'Question title',
          category: 'example',
        },
      },
    };

    const positions = processUserPositions(
      [position],
      [trade],
      marketsByCondition,
    );

    expect(positions).toHaveLength(1);
    const [processed] = positions;
    expect(processed.market).toBe('Simple Market Question');
    expect(processed.currentPrice).toBeCloseTo(0.6);
    expect(processed.timeRemaining.startsWith('in')).toBe(true);
    expect(processed.entryValue).toBeCloseTo(1);
    expect(processed.currentValue).toBeCloseTo(0.6);
    expect(processed.collateralSymbol).toBe('Collateral');
    expect(processed.collateralIsStable).toBe(false);
    expect(processed.marketAddress).toBe('market-1');
  });

  it('sanitises activity descriptions and handles future timestamps', () => {
    const futureTrade = createBaseTrade({
      id: 'trade-future',
      creationTimestamp: `${Math.floor(Date.now() / 1000) + 120}`,
    });
    const marketsByCondition: Record<string, MarketData> = {
      '0xcondition': {
        id: 'market-1',
        title: 'Simple Market Question <contextStart>more metadata',
        outcomes: ['Yes', 'No'],
        outcomeTokenMarginalPrices: ['0.60', '0.40'],
        collateralToken: '0x0',
        fee: '0',
        creationTimestamp: `${Math.floor(Date.now() / 1000) - 3600}`,
        category: 'example',
        openingTimestamp: `${Math.floor(Date.now() / 1000) + 600}`,
        resolutionTimestamp: `${Math.floor(Date.now() / 1000) + 3600}`,
        currentAnswer: null,
        condition: {
          id: '0xcondition',
        },
        question: {
          id: 'question-1',
          title: 'Question title',
          category: 'example',
        },
      },
    };

    const activities = processTradeActivities(
      [futureTrade],
      marketsByCondition,
    );

    expect(activities).toHaveLength(1);
    const [activity] = activities;
    expect(activity.description).toContain('Simple Market Question');
    expect(activity.description).not.toContain('<contextStart>');
    expect(activity.timestamp).toBe('in 2m');
  });
});
