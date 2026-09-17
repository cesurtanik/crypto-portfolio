import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import CoinDetail from "./pages/CoinDetail";
import Portfolio from "./pages/Portfolio";
import "./index.css";

function Dashboard() {
  const navigate = useNavigate();

  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Favorileri yükle
  useEffect(() => {
    const savedFavorites =
      localStorage.getItem("favorites");

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error(
          "Favoriler okunamadı:",
          error
        );
        setFavorites([]);
      }
    }
  }, []);

  // Coinleri getir
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

          // Son başarılı coin listesini sakla
          localStorage.setItem(
            "availableCoins",
            JSON.stringify(response.data)
          );
        }
      } catch (error) {
        console.error(
          "Coin verileri alınamadı:",
          error
        );

        // API çalışmazsa daha önce kaydedilmiş
        // coin listesini kullan
        const savedCoins =
          localStorage.getItem("availableCoins");

        if (savedCoins) {
          try {
            const parsedCoins =
              JSON.parse(savedCoins);

            if (Array.isArray(parsedCoins)) {
              setCoins(parsedCoins);
            }
          } catch (storageError) {
            console.error(
              "Kayıtlı coinler okunamadı:",
              storageError
            );
            setCoins([]);
          }
        }
      }
    };

    fetchCoins();
  }, []);

  // Favori ekle / çıkar
  const toggleFavorite = (coinId) => {
    let updatedFavorites;

    if (favorites.includes(coinId)) {
      updatedFavorites = favorites.filter(
        (id) => id !== coinId
      );
    } else {
      updatedFavorites = [
        ...favorites,
        coinId,
      ];
    }

    setFavorites(updatedFavorites);

    localStorage.setItem(
      "favorites",
      JSON.stringify(updatedFavorites)
    );
  };

  // Arama
  const filteredCoins = coins.filter((coin) => {
    const searchText =
      search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      coin.name
        .toLowerCase()
        .includes(searchText) ||
      coin.symbol
        .toLowerCase()
        .includes(searchText)
    );
  });

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Crypto Portfolio</h1>
          <p>
            Kripto piyasasını takip et
          </p>
        </div>

        <input
          className="search"
          type="text"
          placeholder="Coin ara..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </header>

      <nav className="navbar">
        <button
          onClick={() => {
            setSearch("");
          }}
        >
          🏠 Tüm Coinler
        </button>

        <button
          onClick={() => {
            const favoriteCoins =
              coins.filter((coin) =>
                favorites.includes(coin.id)
              );

            if (favoriteCoins.length === 0) {
              setSearch("__NO_FAVORITES__");
            }
          }}
        >
          ⭐ Favoriler ({favorites.length})
        </button>

        <button
          onClick={() =>
            navigate("/portfolio")
          }
        >
          💰 Portföyüm
        </button>
      </nav>

      {search === "__NO_FAVORITES__" ? (
        <div className="no-results">
          Henüz favori coin eklemediniz.
        </div>
      ) : filteredCoins.length === 0 ? (
        <div className="no-results">
          Coin bulunamadı.
        </div>
      ) : (
        <div className="coin-grid">
          {filteredCoins.map((coin) => {
            const isFavorite =
              favorites.includes(coin.id);

            return (
              <div
                className="coin-card"
                key={coin.id}
                onClick={() =>
                  navigate(`/coin/${coin.id}`)
                }
              >
                <div className="coin-top">
                  <div>
                    <h2>{coin.name}</h2>

                    <span>
                      {coin.symbol.toUpperCase()}
                    </span>
                  </div>

                  <button
                    className={
                      isFavorite
                        ? "favorite favorite-active"
                        : "favorite"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(coin.id);
                    }}
                  >
                    {isFavorite ? "⭐" : "☆"}
                  </button>
                </div>

                <div className="coin-price">
                  $
                  {Number(
                    coin.current_price
                  ).toLocaleString()}
                </div>

                <div
                  className={
                    coin.price_change_percentage_24h >=
                    0
                      ? "coin-change positive"
                      : "coin-change negative"
                  }
                >
                  {coin.price_change_percentage_24h >=
                  0
                    ? "+"
                    : ""}
                  {Number(
                    coin.price_change_percentage_24h
                  ).toFixed(2)}
                  %
                </div>

                <div className="market-cap">
                  Piyasa Değeri: $
                  {Number(
                    coin.market_cap
                  ).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/coin/:id"
          element={<CoinDetail />}
        />

        <Route
          path="/portfolio"
          element={<Portfolio />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;