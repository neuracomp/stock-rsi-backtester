// pages/api/stock.js

import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Please provide a stock symbol.' });
  }

  try {
    const quote = await yahooFinance.quote(symbol.toUpperCase());

    if (quote && quote.regularMarketPrice) {
      const price = quote.regularMarketPrice;
      return res.status(200).json({ symbol: quote.symbol, price });
    } else {
      return res.status(404).json({ error: 'Stock symbol not found.' });
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return res.status(500).json({ error: 'Failed to fetch stock data.' });
  }
}
