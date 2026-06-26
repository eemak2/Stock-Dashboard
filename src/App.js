import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function StockDashboard() {
  const [stocks, setStocks] = useState([
    { symbol: 'TTMI', picker: 'Person 1', color: 'bg-blue-100 border-blue-400' },
    { symbol: 'ASTS', picker: 'Person 2', color: 'bg-green-100 border-green-400' },
    { symbol: 'RTX', picker: 'Person 3', color: 'bg-purple-100 border-purple-400' },
    { symbol: 'AMAT', picker: 'Person 4', color: 'bg-red-100 border-red-400' },
  ]);

  const [data, setData] = useState({});
  const [startPrices, setStartPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString());
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ttmiStartPrices');
    if (saved) {
      setStartPrices(JSON.parse(saved));
    }
  }, []);

  const fetchStockData = async (symbol) => {
    try {
      const apiKey = 'OPHB0U6WH19G8QA6';
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`
      );
      const result = await response.json();

      if (result['Time Series Daily']) {
        const timeSeries = result['Time Series Daily'];
        const dates = Object.keys(timeSeries).sort().reverse();
        
        const last60Days = dates.slice(0, 60);
        const closes = last60Days.map(date => parseFloat(timeSeries[date]['4. close']));
        
        const ma60 = closes.length >= 60 
          ? (closes.reduce((a, b) => a + b, 0) / 60).toFixed(2)
          : closes.length > 0
          ? (closes.reduce((a, b) => a + b, 0) / closes.length).toFixed(2)
          : 'N/A';

        const currentPrice = parseFloat(timeSeries[dates[0]]['4. close']).toFixed(2);
        
        let startPrice = startPrices[symbol];
        if (!startPrice) {
          startPrice = currentPrice;
          const updated = { ...startPrices, [symbol]: startPrice };
          setStartPrices(updated);
          localStorage.setItem('ttmiStartPrices', JSON.stringify(updated));
        }

        const changeFromStart = (currentPrice - startPrice).toFixed(2);
        const changePercentFromStart = ((changeFromStart / startPrice) * 100).toFixed(2);

        return {
          symbol,
          currentPrice,
          startPrice,
          changeFromStart,
          changePercentFromStart,
          ma60,
          aboveMA: parseFloat(currentPrice) > parseFloat(ma60),
          lastUpdated: new Date().toLocaleTimeString(),
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      return null;
    }
  };

  const updateAllStocks = async () => {
    setLoading(true);
    const results = {};
    for (const stock of stocks) {
      const stockData = await fetchStockData(stock.symbol);
      if (stockData) results[stock.symbol] = stockData;
      await new Promise(r => setTimeout(r, 200));
    }
    setData(results);
    setStartDate(new Date().toLocaleDateString());
    setLoading(false);
  };

useEffect(() => {
  updateAllStocks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const handleSymbolChange = (index, newSymbol) => {
    const updated = [...stocks];
    updated[index].symbol = newSymbol.toUpperCase();
    setStocks(updated);
  };

  const handlePickerChange = (index, newPicker) => {
    const updated = [...stocks];
    updated[index].picker = newPicker;
    setStocks(updated);
  };

  const saveAndRefresh = () => {
    setEditMode(false);
    updateAllStocks();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Stock Picks Showdown</h1>
          <p className="text-slate-400">
            Started: {startDate} | Last updated: {Object.values(data)[0]?.lastUpdated || 'Never'}
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={updateAllStocks}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            {editMode ? 'Cancel' : 'Edit Picks'}
          </button>
          {editMode && (
            <button
              onClick={saveAndRefresh}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Save & Refresh
            </button>
          )}
        </div>

        {editMode && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Edit Stock Picks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stocks.map((stock, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={stock.symbol}
                      onChange={(e) => handleSymbolChange(idx, e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
                      placeholder="e.g., AAPL"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Picker</label>
                    <input
                      type="text"
                      value={stock.picker}
                      onChange={(e) => handlePickerChange(idx, e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
                      placeholder="Your name"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stocks.map((stock, idx) => {
            const stockData = data[stock.symbol];

            return (
              <div
                key={idx}
                className={`border-2 rounded-lg p-6 ${stock.color} backdrop-blur`}
              >
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stock.symbol}</h3>
                  <p className="text-sm text-gray-700">{stock.picker}</p>
                </div>

                {stockData ? (
                  <>
                    <div className="mb-3 pb-3 border-b border-gray-300">
                      <p className="text-xs text-gray-700 font-medium">Starting Price (Today)</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${stockData.startPrice}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-700 font-medium">Current Price</p>
                      <p className="text-3xl font-bold text-gray-900">
                        ${stockData.currentPrice}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {parseFloat(stockData.changePercentFromStart) >= 0 ? (
                          <TrendingUp className="text-green-600" size={18} />
                        ) : (
                          <TrendingDown className="text-red-600" size={18} />
                        )}
                        <span className={parseFloat(stockData.changePercentFromStart) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {stockData.changeFromStart} ({stockData.changePercentFromStart}%)
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-300 pt-3 mb-3">
                      <p className="text-xs text-gray-700 font-medium">60-Day Moving Avg</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${stockData.ma60}
                      </p>
                      <p className={`text-xs mt-1 font-bold ${
                        stockData.aboveMA ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {stockData.aboveMA ? '▲ Above MA' : '▼ Below MA'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-700 text-sm">Loading...</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(data).length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Leaderboard (% Since Start)</h2>
            <div className="space-y-3">
              {stocks
                .map(stock => ({
                  ...stock,
                  ...data[stock.symbol],
                }))
                .filter(s => s.changePercentFromStart !== undefined)
                .sort((a, b) => parseFloat(b.changePercentFromStart) - parseFloat(a.changePercentFromStart))
                .map((stock, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-700 p-4 rounded">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{idx + 1}. {stock.picker}</p>
                      <p className="text-sm text-slate-400">{stock.symbol} • Started: ${stock.startPrice} → ${stock.currentPrice}</p>
                    </div>
                    <p className={`text-lg font-bold text-right ${
                      parseFloat(stock.changePercentFromStart) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stock.changePercentFromStart}%
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-slate-500 text-sm space-y-2">
          <p className="font-semibold text-red-400">Stock prices are delayed 15-20 minutes</p>
          <p className="text-xs">Starting prices locked when first loaded, reload page to reset</p>
        </div>
      </div>
    </div>
  );
}
