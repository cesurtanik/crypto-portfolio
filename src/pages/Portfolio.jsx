import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
function Portfolio() {
  const [coins, setCoins] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrices, setCurrentPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Coin listesini getir
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "usd",
              order: "market_cap_desc",
              per_page: 50,
              page: 1,
              sparkline: false,
            },
          }
        );

        if (Array.isArray(response.data)) {
          setCoins(response.data);

          localStorage.setItem(
            "availableCoins",
            JSON.stringify(response.data)
          );
        }
      } catch (error) {
        console.error("Coinler alınamadı:", error);

        const savedCoins =
          localStorage.getItem("availableCoins");

        if (savedCoins) {
          try {
            setCoins(JSON.parse(savedCoins));
          } catch {
            setCoins([]);
          }
        }
      }
    };

    fetchCoins();
  }, []);

  // Kayıtlı portföyü getir
  useEffect(() => {
    const savedPortfolio =
      JSON.parse(localStorage.getItem("portfolio")) || [];

    setPortfolio(savedPortfolio);
  }, []);

  // GÜNCEL FİYATLARI GETİR
  // Bu fonksiyon useEffect'in DIŞINDA.
  // Böylece buton da bu fonksiyonu kullanabilir.
  const fetchCurrentPrices = async () => {
    if (portfolio.length === 0) {
      setCurrentPrices({});
      return;
    }

    setLoadingPrices(true);

    try {
      const ids = [
        ...new Set(
          portfolio.map((item) => item.coin)
        ),
      ].join(",");

      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
          params: {
            ids: ids,
            vs_currencies: "usd",
          },
        }
      );

      setCurrentPrices(response.data);
    } catch (error) {
      console.error(
        "Güncel fiyatlar alınamadı:",
        error
      );
    } finally {
      setLoadingPrices(false);
    }
  };

 // Portföy değişince fiyatları getir
useEffect(() => {
  fetchCurrentPrices();
}, [portfolio]);

// Her 60 saniyede bir fiyatları otomatik yenile
useEffect(() => {
  if (portfolio.length === 0) {
    return;
  }

  const interval = setInterval(() => {
    fetchCurrentPrices();
  }, 60000);

  return () => {
    clearInterval(interval);
  };
}, [portfolio]);;

  // Coin ekle
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCoin || !amount || !buyPrice) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    const selectedCoinData = coins.find(
      (coin) => coin.id === selectedCoin
    );

    const newAmount = Number(amount);
    const newBuyPrice = Number(buyPrice);

    // Aynı coin var mı?
    const existingIndex = portfolio.findIndex(
      (item) => item.coin === selectedCoin
    );

    let updatedPortfolio;

    if (existingIndex !== -1) {
      const existingItem =
        portfolio[existingIndex];

      const oldAmount = Number(
        existingItem.amount
      );

      const oldBuyPrice = Number(
        existingItem.buyPrice
      );

      const totalAmount =
        oldAmount + newAmount;

      // Ağırlıklı ortalama alış fiyatı
      const averageBuyPrice =
        (oldAmount * oldBuyPrice +
          newAmount * newBuyPrice) /
        totalAmount;

      const updatedItem = {
        ...existingItem,
        amount: totalAmount,
        buyPrice: averageBuyPrice,
      };

      updatedPortfolio = [...portfolio];

      updatedPortfolio[existingIndex] =
        updatedItem;
    } else {
      const newItem = {
        coin: selectedCoin,
        name:
          selectedCoinData?.name ||
          selectedCoin,
        symbol:
          selectedCoinData?.symbol || "",
        amount: newAmount,
        buyPrice: newBuyPrice,
      };

      updatedPortfolio = [
        ...portfolio,
        newItem,
      ];
    }

    setPortfolio(updatedPortfolio);

    localStorage.setItem(
      "portfolio",
      JSON.stringify(updatedPortfolio)
    );

    setSelectedCoin("");
    setAmount("");
    setBuyPrice("");

    alert("Coin portföye eklendi!");
  };

  // Coin sil
  const handleDelete = (index) => {
    const updatedPortfolio =
      portfolio.filter(
        (_, i) => i !== index
      );

    setPortfolio(updatedPortfolio);

    localStorage.setItem(
      "portfolio",
      JSON.stringify(updatedPortfolio)
    );
  };

  // Toplam yatırım
  const totalInvested =
    portfolio.reduce(
      (total, item) =>
        total +
        Number(item.amount) *
          Number(item.buyPrice),
      0
    );

  // Güncel toplam değer
  const totalCurrentValue =
    portfolio.reduce(
      (total, item) => {
        const currentPrice =
          currentPrices[item.coin]?.usd || 0;

        return (
          total +
          Number(item.amount) *
            currentPrice
        );
      },
      0
    );

  // Toplam kâr / zarar
  const totalProfitLoss =
    totalCurrentValue - totalInvested;

  // Kâr / zarar yüzdesi
  const totalProfitLossPercent =
    totalInvested > 0
      ? (totalProfitLoss /
          totalInvested) *
        100
      : 0;
const portfolioChartData = portfolio.map((item) => {
  const currentPrice =
    currentPrices[item.coin]?.usd || 0;

  const currentValue =
    Number(item.amount) * currentPrice;

  return {
    name: item.name || item.coin.toUpperCase(),
    value: currentValue,
  };
});
  return (
    <div className="app">

      <h1>Portföyüm</h1>

      {/* FİYAT YENİLE */}
      <button
        type="button"
        onClick={fetchCurrentPrices}
        disabled={loadingPrices}
      >
        {loadingPrices
          ? "Fiyatlar Güncelleniyor..."
          : "🔄 Fiyatları Yenile"}
      </button>
{/* PORTFÖY DAĞILIMI */}
{portfolio.length > 0 && (
  <div className="portfolio-chart">
    <h2>Portföy Dağılımı</h2>

    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={portfolioChartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label
        >
          {portfolioChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} />
          ))}
        </Pie>

        <Tooltip
          formatter={(value) =>
            `$${Number(value).toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}`
          }
        />

        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
)}
      {/* PORTFÖY ÖZETİ */}
      <div className="portfolio-summary">

        <div className="summary-card">
          <span>Toplam Yatırım</span>

          <strong>
            $
            {totalInvested.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}
          </strong>
        </div>

        <div className="summary-card">
          <span>Güncel Değer</span>

          <strong>
            $
            {totalCurrentValue.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}
          </strong>
        </div>

        <div className="summary-card">
          <span>Toplam Kâr / Zarar</span>

          <strong
            className={
              totalProfitLoss >= 0
                ? "positive"
                : "negative"
            }
          >
            {totalProfitLoss >= 0
              ? "+"
              : "-"}
            $
            {Math.abs(
              totalProfitLoss
            ).toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}
          </strong>

          <small
            className={
              totalProfitLoss >= 0
                ? "positive"
                : "negative"
            }
          >
            (
            {totalProfitLossPercent >= 0
              ? "+"
              : ""}
            {totalProfitLossPercent.toFixed(
              2
            )}
            %)
          </small>
        </div>

      </div>

      {/* COIN EKLE */}
      <div className="portfolio-form">

        <h2>Coin Ekle</h2>

        <form onSubmit={handleSubmit}>

          <label>Coin Seç</label>

          <select
            value={selectedCoin}
            onChange={(e) =>
              setSelectedCoin(
                e.target.value
              )
            }
          >
            <option value="">
              Coin seçin
            </option>

            {coins.map((coin) => (
              <option
                key={coin.id}
                value={coin.id}
              >
                {coin.name} (
                {coin.symbol.toUpperCase()})
              </option>
            ))}
          </select>

          <label>Coin Miktarı</label>

          <input
            type="number"
            step="any"
            min="0"
            placeholder="Örn: 0.5"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
          />

          <label>
            Alış Fiyatı (USD)
          </label>

          <input
            type="number"
            step="any"
            min="0"
            placeholder="Örn: 80000"
            value={buyPrice}
            onChange={(e) =>
              setBuyPrice(e.target.value)
            }
          />

          <button type="submit">
            Portföye Ekle
          </button>

        </form>

        {/* PORTFÖYDEKİ COİNLER */}
        <div className="portfolio-list">

          <h2>Portföydeki Coinler</h2>

          {portfolio.length === 0 ? (
            <p>
              Henüz portföyünüzde coin yok.
            </p>
          ) : (
            portfolio.map(
              (item, index) => {

                const currentPrice =
                  currentPrices[
                    item.coin
                  ]?.usd || 0;

                const invested =
                  Number(item.amount) *
                  Number(item.buyPrice);

                const currentValue =
                  Number(item.amount) *
                  currentPrice;

                const profitLoss =
                  currentValue - invested;

                const profitLossPercent =
                  invested > 0
                    ? (profitLoss /
                        invested) *
                      100
                    : 0;

                return (
                  <div
                    className="portfolio-item"
                    key={index}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(index)
                      }
                    >
                      Sil
                    </button>

                    <strong>
                      {item.name ||
                        item.coin.toUpperCase()}
                    </strong>

                    <span>
                      Miktar: {item.amount}
                    </span>

                    <span>
                      Ortalama Alış Fiyatı: $
                      {Number(
                        item.buyPrice
                      ).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>

                    <span>
                      Güncel Fiyat: $
                      {currentPrice.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>

                    <span>
                      Güncel Değer: $
                      {currentValue.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>

                    <span>
                      Kâr / Zarar:{" "}

                      <strong
                        className={
                          profitLoss >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {profitLoss >= 0
                          ? "+"
                          : "-"}
                        $
                        {Math.abs(
                          profitLoss
                        ).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>{" "}

                      (
                      {profitLossPercent >= 0
                        ? "+"
                        : ""}
                      {profitLossPercent.toFixed(
                        2
                      )}
                      %)
                    </span>

                  </div>
                );
              }
            )
          )}

        </div>
      </div>
    </div>
  );
}

export default Portfolio;