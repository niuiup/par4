'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Info, LayoutTemplate, Filter, X } from 'lucide-react';

//
// 🔵 Mini App + API + Pagination Version
//

// Тип данных
type Ad = {
  id: number;
  city: string;
  address: string | null;
  price: number | null;
  rooms: string | null;
  area: number | null;
  contact_phone: string | null;
  ai_analysis: string | null;
  raw_text: string;
  source_url: string;
  external_id: string;
};

const CITIES = [
  'Все города',
  'Калининград',
  'Светлогорск',
  'Зеленоградск',
  'Пионерский',
  'Янтарный',
];

export default function TelegramApp() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 🔵 фильтры
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // -----------------------------
  // INIT (Telegram Mini App)
  // -----------------------------
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      try { tg.setHeaderColor('#ffffff'); } catch (e) {}
    }
    fetchAds(true); // первая загрузка
  }, []);

  // -----------------------------
  // Функция загрузки (первая или новая)
  // -----------------------------
  async function fetchAds(reset = false) {
    if (reset) {
      setLoading(true);
      setCursor(null);
      setAds([]);
      setHasMore(true);
    }

    const params = new URLSearchParams();

    if (selectedCity !== 'Все города') params.set('city', selectedCity);
    if (selectedRoom) params.set('rooms', selectedRoom);
    if (priceMin) params.set('price_min', priceMin);
    if (priceMax) params.set('price_max', priceMax);

    params.set('limit', '20');

    if (!reset && cursor) {
      params.set('cursor', String(cursor));
    }

    const url = `/api/ads?${params.toString()}`;

    const res = await fetch(url);
    const json = await res.json();

    if (reset) setLoading(false);
    else setLoadingMore(false);

    if (json?.data?.length > 0) {
      setAds(prev => [...prev, ...json.data]);
      setCursor(json.nextCursor);
      setHasMore(Boolean(json.nextCursor));
    } else {
      setHasMore(false);
    }
  }

  // -----------------------------
  // Кнопка "Показать ещё"
  // -----------------------------
  function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchAds(false);
  }

  // -----------------------------
  // Сброс фильтров
  // -----------------------------
  const resetFilters = () => {
    setSelectedCity('Все города');
    setSelectedRoom(null);
    setPriceMin('');
    setPriceMax('');
  };

  const formatRooms = (r: string | null) => {
    if (!r) return '';
    if (r.toLowerCase().includes('studio') || r.toLowerCase().includes('студ'))
      return 'Студия';
    return `${r}-к кв.`;
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">

      {/* HEADER */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg text-slate-800">Аренда</h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Filter size={18} />
          <span className="text-sm font-medium">Фильтры</span>
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4 shadow-md animate-in slide-in-from-top-2">
          
          {/* Город */}
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Город</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
            >
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Комнаты */}
          <div className="mb-4">
            <label className="text-xs fontfont-bold text-gray-500 uppercase mb-1 block">Комнаты</label>
            <div className="flex gap-2">
              {[
                { label: 'Студия', val: 'studio' },
                { label: '1', val: '1' },
                { label: '2', val: '2' },
                { label: '3+', val: '3' }
              ].map(item => (
                <button
                  key={item.val}
                  onClick={() => setSelectedRoom(selectedRoom === item.val ? null : item.val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                    selectedRoom === item.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Цена */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Цена</label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="От"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
              />
              <input
                type="number"
                placeholder="До"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetFilters}
              className="flex-1 py-3 text-gray-500 font-medium text-sm"
            >
              Сбросить
            </button>

            <button
              onClick={() => fetchAds(true)}
              className="flex-[2] bg-blue-600 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-blue-200"
            >
              Показать варианты
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 text-gray-400 gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm">Загружаем варианты...</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center pt-20 px-6">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Ничего не найдено</h3>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <p className="text-xs text-gray-400 px-1">Найдено: {ads.length}</p>

          {ads.map(ad => (
            <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">

              {/* PRICE & ROOMS */}
              <div className="text-xl font-bold text-slate-900">
                {ad.price ? `${ad.price.toLocaleString()} ₽` : 'Цена не указана'}
                {ad.price && <span className="text-sm text-gray-400">/мес</span>}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                  {formatRooms(ad.rooms) || 'Квартира'}
                </span>

                {ad.area && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <LayoutTemplate size={12} /> {ad.area} м²
                  </span>
                )}
              </div>

              {/* ADDRESS */}
              <div className="flex items-start gap-1.5 mb-3 mt-2">
                <MapPin className="text-gray-400 mt-0.5" size={16} />
                <p className="text-sm text-gray-700 leading-snug">
                  {ad.address || ad.city || 'Район не указан'}
                </p>
              </div>

              {/* AI INSIGHT */}
              {ad.ai_analysis && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info size={14} className="text-purple-500" />
                    <span className="text-xs font-bold text-slate-600">AI Инсайт</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{ad.ai_analysis}</p>
                </div>
              )}

              {/* ACTION */}
              {ad.contact_phone ? (
                <a
                  href={`tel:${ad.contact_phone}`}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                >
                  <Phone size={16} />
                  Позвонить
                </a>
              ) : (
                <a
                  href={`https://t.me/${ad.source_url}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold text-sm"
                >
                  Открыть источник
                </a>
              )}
            </div>
          ))}

          {/* 🔵 LOAD MORE BUTTON */}
          {hasMore && !loadingMore && (
            <button
              onClick={loadMore}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl mt-4 text-sm font-medium"
            >
              Показать ещё
            </button>
          )}

          {/* LOWER LOADING */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
