const yahooFinance = require('yahoo-finance2').default;

module.exports = async (req, res) => {
  const symbol = req.query.symbol || 'AAPL';
  try {
    const result = await yahooFinance.historical(symbol, { period1: '1mo' });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
