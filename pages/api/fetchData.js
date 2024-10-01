// pages/api/fetchData.js

import axios from 'axios';

export default async function handler(req, res) {
  const { ticker, interval, startDate, endDate } = req.query;
  const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

  try {
    let functionType = 'TIME_SERIES_DAILY_ADJUSTED';
    let adjustedInterval = 'daily';

    if (interval.endsWith('min')) {
      // Alpha Vantage provides intraday data with specific intervals
      const minute = interval.replace('m', '');
      functionType = 'TIME_SERIES_INTRADAY';
      adjustedInterval = `${minute}min`;
    }

    const url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${ticker}&interval=${adjustedInterval}&outputsize=full&apikey=${API_KEY}`;

    const response = await axios.get(url);
    const data = response.data;

    let timeSeries = {};

    if (functionType === 'TIME_SERIES_DAILY_ADJUSTED') {
      timeSeries = data['Time Series (Daily)'];
    } else if (functionType === 'TIME_SERIES_INTRADAY') {
      timeSeries = data[`Time Series (${adjustedInterval})`];
    }

    if (!timeSeries) {
      return res.status(400).json({ error: 'Invalid data fetched. Please check your inputs.' });
    }

    // Convert data to array of objects
    const formattedData = Object.keys(timeSeries).map((date) => ({
      date: new Date(date),
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      adjustedClose: parseFloat(timeSeries[date]['5. adjusted close']),
      volume: parseInt(timeSeries[date]['6. volume']),
    }));

    // Sort data by date ascending
    formattedData.sort((a, b) => a.date - b.date);

    // Filter data between startDate and endDate
    const filteredData = formattedData.filter(
      (item) => item.date >= new Date(startDate) && item.date <= new Date(endDate)
    );

    res.status(200).json({ data: filteredData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage.' });
  }
}
