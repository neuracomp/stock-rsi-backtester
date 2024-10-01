import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  const { ticker, interval, startDate, endDate } = req.query;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);

    const queryOptions = {
      period1,
      period2,
      interval,
    };

    const result = await yahooFinance.historical(ticker, queryOptions);

    if (!result || result.length === 0) {
      return res.status(400).json({
        error: `No data fetched for ticker "${ticker}". Please check the ticker symbol or date range.`,
      });
    }

    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch data from Yahoo Finance.',
      details: error.message,
    });
  }
}
