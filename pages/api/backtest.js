// pages/api/backtest.js

import yahooFinance from 'yahoo-finance2';
import { RSI } from 'technicalindicators';

export default async function handler(req, res) {
  const { symbol, years, rsiWindow, entryThreshold, exitThreshold } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Please provide a stock symbol.' });
  }

  const numYears = parseInt(years) || 1;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - numYears);

  try {
    const queryOptions = { period1: startDate, period2: endDate };
    const historical = await yahooFinance.historical(symbol.toUpperCase(), queryOptions);

    if (!historical || historical.length === 0) {
      return res.status(404).json({ error: 'No historical data found for this symbol.' });
    }

    // Sort data by date ascending
    historical.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Extract closing prices
    const closes = historical.map(entry => entry.close);

    // Calculate RSI using the RSI window as the period
    const rsiValues = RSI.calculate({ period: parseInt(rsiWindow) || 14, values: closes });

    // Align RSI with historical data
    const rsiAligned = historical.slice(rsiValues.length).map((entry, idx) => ({
      date: entry.date,
      close: entry.close,
      rsi: rsiValues[idx],
    }));

    // Backtesting logic
    let position = null;
    let trades = [];

    rsiAligned.forEach(day => {
      if (!position && day.rsi < parseFloat(entryThreshold)) {
        // Buy signal
        position = 'long';
        trades.push({ buy: day.close, sell: null });
      } else if (position === 'long' && day.rsi > parseFloat(exitThreshold)) {
        // Sell signal
        position = null;
        trades[trades.length - 1].sell = day.close;
      }
    });

    // If position is still open at the end, close it
    if (position === 'long') {
      trades[trades.length - 1].sell = rsiAligned[rsiAligned.length - 1].close;
    }

    // Calculate statistics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.sell > trade.buy).length;
    const winProbability = totalTrades ? ((winningTrades / totalTrades) * 100).toFixed(2) : '0.00';
    const totalReturn = trades.reduce((acc, trade) => {
      if (trade.sell) {
        return acc + ((trade.sell - trade.buy) / trade.buy) * 100;
      }
      return acc;
    }, 0).toFixed(2);

    res.status(200).json({
      trades,
      statistics: {
        totalTrades,
        winningTrades,
        winProbability,
        totalReturn,
      },
      historical: rsiAligned,
    });
  } catch (error) {
    console.error('Error during backtesting:', error);
    res.status(500).json({ error: 'Failed to perform backtesting.' });
  }
}
