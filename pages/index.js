// pages/index.js

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState(null);
  const [historical, setHistorical] = useState([]);
  const [trades, setTrades] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [years, setYears] = useState(1);
  const [rsiWindow, setRsiWindow] = useState(14);
  const [entryThreshold, setEntryThreshold] = useState(30);
  const [exitThreshold, setExitThreshold] = useState(70);

  const fetchStockData = async (e) => {
    e.preventDefault();

    setPrice(null);
    setHistorical([]);
    setTrades([]);
    setStatistics(null);
    setError('');

    if (!ticker) {
      setError('Please enter a stock ticker symbol.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/backtest?symbol=${ticker.toUpperCase()}&years=${years}&rsiWindow=${rsiWindow}&entryThreshold=${entryThreshold}&exitThreshold=${exitThreshold}`
      );
      const data = await response.json();

      if (response.ok) {
        setPrice(data.statistics.totalReturn);
        setHistorical(data.historical);
        setTrades(data.trades);
        setStatistics(data.statistics);
      } else {
        setError(data.error || 'An error occurred.');
      }
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: historical.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: `${ticker.toUpperCase()} Close Price`,
        data: historical.map(entry => entry.close),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
      {
        label: `RSI (${rsiWindow})`,
        data: historical.map(entry => entry.rsi),
        fill: false,
        backgroundColor: 'rgba(153,102,255,0.4)',
        borderColor: 'rgba(153,102,255,1)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Price ($)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'RSI',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${ticker.toUpperCase()} Price and RSI`,
      },
    },
  };

  return (
    <div style={styles.container}>
      <h1>Stock RSI Backtester</h1>

      <form onSubmit={fetchStockData} style={styles.form}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Enter Stock Ticker (e.g., AAPL)"
          style={styles.input}
        />

        <div style={styles.sliderContainer}>
          <label>Years: {years}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            style={styles.slider}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>RSI Window:</label>
          <input
            type="number"
            value={rsiWindow}
            onChange={(e) => setRsiWindow(e.target.value)}
            min="1"
            style={styles.numberInput}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Entry Threshold:</label>
          <input
            type="number"
            value={entryThreshold}
            onChange={(e) => setEntryThreshold(e.target.value)}
            min="0"
            max="100"
            style={styles.numberInput}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Exit Threshold:</label>
          <input
            type="number"
            value={exitThreshold}
            onChange={(e) => setExitThreshold(e.target.value)}
            min="0"
            max="100"
            style={styles.numberInput}
          />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Backtesting...' : 'Run Backtest'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {historical.length > 0 && (
        <div style={styles.chartContainer}>
          <Line data={chartData} options={options} />
        </div>
      )}

      {statistics && (
        <div style={styles.statsContainer}>
          <h2>Backtest Statistics</h2>
          <p>Total Trades: {statistics.totalTrades}</p>
          <p>Winning Trades: {statistics.winningTrades}</p>
          <p>Win Probability: {statistics.winProbability}%</p>
          <p>Total Return: {statistics.totalReturn}%</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  form: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    width: '50%',
  },
  sliderContainer: {
    width: '50%',
  },
  slider: {
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  numberInput: {
    padding: '8px',
    fontSize: '16px',
    width: '60px',
    textAlign: 'center',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  chartContainer: {
    marginTop: '40px',
  },
  statsContainer: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
    textAlign: 'left',
  },
  error: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#ffe0e0',
    borderRadius: '5px',
    color: '#a00',
  },
};
