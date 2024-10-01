import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configure axios to retry failed requests
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

export default async function handler(req, res) {
  const { ticker, interval, startDate, endDate } = req.query;

  // Basic input validation
  if (!ticker || !interval || !startDate || !endDate) {
    return res.status(400).json({
      error: 'Missing required query parameters: ticker, interval, startDate, endDate.',
    });
  }

  // Validate date format
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({
      error: 'Invalid date format. Please use YYYY-MM-DD.',
    });
  }

  if (start >= end) {
    return res.status(400).json({
      error: 'startDate must be earlier than endDate.',
    });
  }

  try {
    // Convert date to Unix timestamp (seconds)
    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);

    // Fetch historical data
    const queryOptions = {
      period1,
      period2,
      interval,
    };

    console.log(`Fetching data from Yahoo Finance for ticker: ${ticker}`);

    const result = await yahooFinance.historical(ticker, queryOptions);

    if (!result || result.length === 0) {
      return res.status(400).json({
        error: `No data fetched for ticker "${ticker}". Please check the ticker symbol or date range.`,
      });
    }

    // Format data
    const formattedData = result.map(entry => ({
      date: entry.date,
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
      adjustedClose: entry.adjClose,
      volume: entry.volume,
    }));

    // Sort data by date ascending
    formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Successfully fetched data for ticker: ${ticker}`);

    res.status(200).json({ data: formattedData });
  } catch (error) {
    console.error(`Error fetching data for ticker "${ticker}":`, error);

    // Handle specific Yahoo Finance errors
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        error: `Ticker "${ticker}" not found.`,
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Failed to fetch data from Yahoo Finance.',
      details: error.message,
    });
  }
}
