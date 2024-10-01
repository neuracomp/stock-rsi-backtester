import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const Chart = () => {
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/fetchData?ticker=SPY&interval=1d&startDate=2023-01-01&endDate=2024-01-01');
        const data = response.data.data;

        setChartData({
          labels: data.map(entry => entry.date),
          datasets: [
            {
              label: 'SPY Price',
              data: data.map(entry => entry.close),
              borderColor: 'rgba(75,192,192,1)',
              fill: false,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return <Line data={chartData} />;
};

export default Chart;
