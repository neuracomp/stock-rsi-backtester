// utils/rsi.js

export function calculateRSI(data, window = 14) {
  const rsi = [];
  let gains = [];
  let losses = [];

  for (let i = 1; i < data.length; i++) {
    const delta = data[i].close - data[i - 1].close;
    if (delta > 0) {
      gains.push(delta);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(-delta);
    }

    if (gains.length > window) {
      gains.shift();
      losses.shift();
    }

    if (i < window) {
      rsi.push(null); // Not enough data to calculate RSI
      continue;
    }

    const averageGain = gains.reduce((a, b) => a + b, 0) / window;
    const averageLoss = losses.reduce((a, b) => a + b, 0) / window;

    const rs = averageLoss === 0 ? 100 : averageGain / averageLoss;
    const rsiValue = 100 - 100 / (1 + rs);
    rsi.push(rsiValue);
  }

  return rsi;
}

export function calculateStrategyReturns(data, entryRSI, exitRSI, window) {
  const rsi = calculateRSI(data, window);
  const strategyReturns = [];
  let position = 0; // 0: Neutral, 1: Long

  for (let i = 0; i < data.length; i++) {
    if (rsi[i] !== null) {
      if (rsi[i] < entryRSI && position === 0) {
        position = 1; // Enter long
      } else if (rsi[i] > exitRSI && position === 1) {
        position = 0; // Exit long
      }
    }

    // Calculate daily return
    const dailyReturn = i === 0 ? 0 : (data[i].close - data[i - 1].close) / data[i - 1].close;

    // Strategy return is daily return if in position
    const strategyReturn = position === 1 ? dailyReturn : 0;
    strategyReturns.push(strategyReturn);
  }

  // Calculate cumulative returns
  let cumulativeStrategyReturn = 0;
  let cumulativeBuyHoldReturn = 0;
  const cumulativeStrategyReturns = [];
  const cumulativeBuyHoldReturns = [];

  for (let i = 0; i < strategyReturns.length; i++) {
    cumulativeStrategyReturn = (1 + cumulativeStrategyReturn) * (1 + strategyReturns[i]) - 1;
    cumulativeBuyHoldReturn = (1 + cumulativeBuyHoldReturn) * (1 + (i === 0 ? 0 : (data[i].close - data[i - 1].close) / data[i - 1].close)) - 1;

    cumulativeStrategyReturns.push(cumulativeStrategyReturn);
    cumulativeBuyHoldReturns.push(cumulativeBuyHoldReturn);
  }

  return {
    rsi,
    strategyReturns,
    cumulativeStrategyReturns,
    cumulativeBuyHoldReturns,
  };
}

export function optimizeRSI(data, startDate, endDate) {
  const windowRange = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
  const entryRSIRange = [25, 30, 35, 40, 45];
  const exitRSIRange = [55, 60, 65, 70, 75, 80, 85, 90, 95];

  let bestParams = {
    entryRSI: null,
    exitRSI: null,
    window: null,
    return: -Infinity,
  };

  for (let window of windowRange) {
    for (let entryRSI of entryRSIRange) {
      for (let exitRSI of exitRSIRange) {
        if (exitRSI <= entryRSI) continue; // Exit RSI should be greater than Entry RSI
        const strategy = calculateStrategyReturns(data, entryRSI, exitRSI, window);
        const finalReturn = strategy.cumulativeStrategyReturns[strategy.cumulativeStrategyReturns.length - 1];

        if (finalReturn > bestParams.return) {
          bestParams = {
            entryRSI,
            exitRSI,
            window,
            return: finalReturn,
          };
        }
      }
    }
  }

  return bestParams;
}
