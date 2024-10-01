// pages/index.js

import { useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { calculateStrategyReturns, optimizeRSI } from '../utils/rsi';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tickers, setTickers] = useState('SPY');
  const [entryRSI, setEntryRSI] = useState(30);
  const [exitRSI, setExitRSI] = useState(70);
  const [window, setWindow] = useState(14);
  const [interval, setInterval] = useState('1d');
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysRange, setDaysRange] = useState(30);
  const [useCalendar, setUseCalendar] = useState(true);
  const [results, setResults] = useState({});
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFetchAndCalculate = async () => {
    setLoading(true);
    const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());
    const selectedStartDate = useCalendar ? startDate : new Date(Date.now() - daysRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const selectedEndDate = useCalendar ? endDate : new Date().toISOString().split('T')[0];

    const newResults = {};

    for (let ticker of tickerList) {
      try {
        const response = await axios.get('/api/fetchData', {
          params: {
            ticker,
            interval,
            startDate: selectedStartDate,
            endDate: selectedEndDate,
          },
        });

        const data = response.data.data;
        if (!data || data.length === 0) {
          alert(`No data fetched for ${ticker}. Please check the ticker symbol or date range.`);
          continue;
        }

        const strategy = calculateStrategyReturns(data, entryRSI, exitRSI, window);
        newResults[ticker] = {
          data,
          strategy,
        };
      } catch (error) {
        console.error(error);
        alert(`Error fetching data for ${ticker}.`);
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());
    const selectedStartDate = useCalendar ? startDate : new Date(Date.now() - daysRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const selectedEndDate = useCalendar ? endDate : new Date().toISOString().split('T')[0];

    const newResults = {};

    for (let ticker of tickerList) {
      try {
        const response = await axios.get('/api/fetchData', {
          params: {
            ticker,
            interval,
            startDate: selectedStartDate,
            endDate: selectedEndDate,
          },
        });

        const data = response.data.data;
        if (!data || data.length === 0) {
          alert(`No data fetched for ${ticker}. Please check the ticker symbol or date range.`);
          continue;
        }

        const bestParams = optimizeRSI(data);
        if (bestParams.entryRSI !== null) {
          const optimizedStrategy = calculateStrategyReturns(data, bestParams.entryRSI, bestParams.exitRSI, bestParams.window);
          newResults[ticker] = {
            data,
            strategy: optimizedStrategy,
            bestParams,
          };
        }
      } catch (error) {
        console.error(error);
        alert(`Error optimizing for ${ticker}.`);
      }
    }

    setResults(newResults);
    setOptimizing(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>RSI Trading Strategy Optimization</h1>
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Tickers (comma separated): </strong></label>
        <input
          type="text"
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          style={{ width: '300px', padding: '5px', marginLeft: '10px' }}
          placeholder="e.g., SPY,AAPL"
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Entry RSI (0-50): </strong></label>
        <input
          type="number"
          min="0"
          max="50"
          value={entryRSI}
          onChange={(e) => setEntryRSI(Number(e.target.value))}
          style={{ width: '60px', padding: '5px', marginLeft: '10px' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Exit RSI (50-100): </strong></label>
        <input
          type="number"
          min="50"
          max="100"
          value={exitRSI}
          onChange={(e) => setExitRSI(Number(e.target.value))}
          style={{ width: '60px', padding: '5px', marginLeft: '10px' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label><strong>RSI Window (10-30): </strong></label>
        <input
          type="number"
          min="10"
          max="30"
          value={window}
          onChange={(e) => setWindow(Number(e.target.value))}
          style={{ width: '60px', padding: '5px', marginLeft: '10px' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Interval: </strong></label>
        <select value={interval} onChange={(e) => setInterval(e.target.value)} style={{ padding: '5px', marginLeft: '10px' }}>
          <option value="1m">1 Minute</option>
          <option value="2m">2 Minute</option>
          <option value="5m">5 Minute</option>
          <option value="15m">15 Minute</option>
          <option value="30m">30 Minute</option>
          <option value="60m">60 Minute</option>
          <option value="90m">90 Minute</option>
          <option value="1h">1 Hour</option>
          <option value="1d">1 Day</option>
          <option value="5d">5 Days</option>
          <option value="1wk">1 Week</option>
          <option value="1mo">1 Month</option>
          <option value="3mo">3 Months</option>
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Use Calendar Inputs: </strong></label>
        <input
          type="checkbox"
          checked={useCalendar}
          onChange={(e) => setUseCalendar(e.target.checked)}
          style={{ marginLeft: '10px' }}
        />
      </div>
      {useCalendar ? (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label><strong>Start Date: </strong></label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '5px', marginLeft: '10px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label><strong>End Date: </strong></label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '5px', marginLeft: '10px' }}
            />
          </div>
        </>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <label><strong>Number of Days: </strong></label>
          <input
            type="number"
            min="1"
            max="60"
            value={daysRange}
            onChange={(e) => setDaysRange(Number(e.target.value))}
            style={{ width: '60px', padding: '5px', marginLeft: '10px' }}
          />
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleFetchAndCalculate} style={{ padding: '10px 20px', marginRight: '10px' }}>
          {loading ? 'Loading...' : 'Show RSI Strategy Graph'}
        </button>
        <button onClick={handleOptimize} disabled={optimizing || loading} style={{ padding: '10px 20px' }}>
          {optimizing ? 'Optimizing...' : 'Optimize RSI'}
        </button>
      </div>

      {/* Display Results */}
      {Object.keys(results).map((ticker) => {
        const result = results[ticker];
        const { data, strategy, bestParams } = result;

        // Prepare data for plotting
        const dates = data.map(d => d.date);
        const closePrices = data.map(d => d.close);
        const rsiValues = strategy.rsi;
        const cumulativeStrategy = strategy.cumulativeStrategyReturns.map(r => r * 100);
        const cumulativeBuyHold = strategy.cumulativeBuyHoldReturns.map(r => r * 100);

        return (
          <div key={ticker} style={{ marginBottom: '50px' }}>
            <h2>{ticker}</h2>
            {bestParams && (
              <div style={{ marginBottom: '20px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                <h3>Optimal Parameters:</h3>
                <p><strong>Entry RSI:</strong> {bestParams.entryRSI}</p>
                <p><strong>Exit RSI:</strong> {bestParams.exitRSI}</p>
                <p><strong>RSI Window:</strong> {bestParams.window}</p>
                <p><strong>Best Cumulative Return:</strong> {(bestParams.return * 100).toFixed(2)}%</p>
              </div>
            )}
            <Plot
              data={[
                {
                  x: dates,
                  y: closePrices,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Close Price',
                  line: { color: 'blue' },
                },
                {
                  x: dates,
                  y: rsiValues,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'RSI',
                  yaxis: 'y2',
                  line: { color: 'orange' },
                },
                {
                  x: dates,
                  y: cumulativeStrategy,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Cumulative Strategy Return',
                  yaxis: 'y3',
                  line: { color: 'green' },
                },
                {
                  x: dates,
                  y: cumulativeBuyHold,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Cumulative Buy & Hold Return',
                  yaxis: 'y3',
                  line: { color: 'red' },
                },
              ]}
              layout={{
                width: 900,
                height: 900,
                title: `${ticker} RSI Trading Strategy Analysis`,
                showlegend: true,
                yaxis: { title: 'Close Price', side: 'left' },
                yaxis2: {
                  title: 'RSI',
                  overlaying: 'y',
                  side: 'right',
                },
                yaxis3: {
                  title: 'Cumulative % Return',
                  side: 'right',
                  anchor: 'free',
                  overlaying: 'y',
                  position: 1.0,
                },
                shapes: [
                  {
                    type: 'line',
                    x0: dates[0],
                    x1: dates[dates.length - 1],
                    y0: entryRSI,
                    y1: entryRSI,
                    line: { color: 'green', dash: 'dash' },
                    yref: 'y2',
                  },
                  {
                    type: 'line',
                    x0: dates[0],
                    x1: dates[dates.length - 1],
                    y0: exitRSI,
                    y1: exitRSI,
                    line: { color: 'red', dash: 'dash' },
                    yref: 'y2',
                  },
                ],
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
