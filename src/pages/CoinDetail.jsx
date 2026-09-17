import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CoinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchCoin = async () => {
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${id}`
        );

        setCoin(response.data);
        const chartResponse = await axios.get(
  `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
  {
    params: {
      vs_currency: "usd",
      days: 7,
    },
  }
);

const formattedData = chartResponse.data.prices.map(
  ([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString("tr-TR"),
    price: price,
  })
);

setChartData(formattedData);
      } catch (error) {
        console.error("Coin detayları alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoin();
  }, [id]);

  if (loading) {
    return <div className="loading">Coin bilgileri yükleniyor...</div>;
  }

  if (!coin) {
    return <div className="loading">Coin bulunamadı.</div>;
  }

  const price =
    coin.market_data?.current_price?.usd;

  const change =
    coin.market_data?.price_change_percentage_24h;

  const marketCap =
    coin.market_data?.market_cap?.usd;

  const high24h =
    coin.market_data?.high_24h?.usd;

  const low24h =
    coin.market_data?.low_24h?.usd;

  return (
    <div className="app">

      <button
        className="back-button"
        onClick={() => navigate("/")}
      >
        ← Geri Dön
      </button>

      <div className="detail-header">

        <div className="coin-detail-name">

          <img
            src={coin.image?.large}
            alt={coin.name}
          />

          <div>
            <h1>{coin.name}</h1>

            <p>
              {coin.symbol?.toUpperCase()}
            </p>
          </div>

        </div>

        <div className="detail-price">
          ${price?.toLocaleString()}
        </div>

      </div>

      <div className="detail-stats">

        <div className="stat-card">
          <span>24 Saat Değişim</span>

          <strong
            className={
              change >= 0
                ? "positive"
                : "negative"
            }
          >
            {change >= 0 ? "▲" : "▼"}{" "}
            {change?.toFixed(2)}%
          </strong>
        </div>

        <div className="stat-card">
          <span>Market Cap</span>

          <strong>
            ${marketCap?.toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span>24 Saatlik En Yüksek</span>

          <strong>
            ${high24h?.toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span>24 Saatlik En Düşük</span>

          <strong>
            ${low24h?.toLocaleString()}
          </strong>
        </div>

      </div>

     <div className="chart-card">
  <h2>Son 7 Gün</h2>

  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={chartData}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip
        formatter={(value) => [
          `$${Number(value).toLocaleString()}`,
          "Fiyat",
        ]}
      />

      <Line
        type="monotone"
        dataKey="price"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

    </div>
  );
}

export default CoinDetail;