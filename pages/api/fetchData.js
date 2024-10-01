// pages/api/fetchData.js

import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  const { ticker, interval, startDate, endDate } = req.query;

  // Basic input validation
  if (!ticker || !interval || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required query parameters: ticker, interval, startDate, endDate.' });
  }

  try {
    // Define the interval mapping for Yahoo Finance
    const intervalMap = {
      '1m': '1m',
      '2m': '2m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '60m': '60m',
      '90m': '90m',
      '1h': '60m',
      '1d': '1d',
      '5d': '5d',
      '1wk': '1wk',
      '1mo': '1mo',
      '3mo': '3mo',
    };

    const yahooInterval = intervalMap[interval] || '1d';

    // Fetch historical data
    const queryOptions = {
      period1: startDate, // YYYY-MM-DD
      period2: endDate,   // YYYY-MM-DD
      interval: yahooInterval,
      events: 'history',
    };

    const result = await yahooFinance.historical(ticker, queryOptions);

    if (!result || result.length === 0) {
      return res.status(400).json({ error: `No data fetched for ticker "${ticker}". Please check the ticker symbol or date range.` });
    }

    // Format data
    const formattedData = result.map(entry => ({
      date: new Date(entry.date),
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
      adjustedClose: entry.adjClose,
      volume: entry.volume,
    }));

    // Sort data by date ascending
    formattedData.sort((a, b) => a.date - b.date);

    res.status(200).json({ data: formattedData });
  } catch (error) {
    console.error(`Error fetching data for ticker "${ticker}":`, error);

    // Handle specific Yahoo Finance errors
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: `Ticker "${ticker}" not found.` });
    }

    // Generic server error
    res.status(500).json({ error: 'Failed to fetch data from Yahoo Finance.', details: error.message });
  }
}
