'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Phone, Info, LayoutTemplate, Filter, X } from 'lucide-react';

// Инициализация Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// Список городов для фильтра (можешь расширить)
const CITIES = ['Все города', 'Калининград', 'Светлогорск', 'Зеленоградск', 'Пионерский', 'Янтарный'];

export default function TelegramApp() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Состояние фильтров ---
  const [showFilters, setShowFilters] = useState(false); // Открыта ли панель
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null); // null, 'studio', '1', '2', '3'
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    // Настройка Telegram Mini App
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      try { tg.setHeaderColor('#ffffff'); } catch (e) {}
    }
    
    // Первая загрузка
    fetchAds();
  }, []);

  async function fetchAds() {
    setLoading(true);
    setShowFilters(false); // Закрываем шторку при поиске

    try {
      // 1. Начало запроса
      let query = supabase
        .from('ads')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // 2. Применяем фильтры, если они выбраны
      
      // Город
      if (selectedCity !== 'Все города') {
        query = query.eq('city', selectedCity);
      }

      // Комнаты
      if (selectedRoom) {
        if (selectedRoom === 'studio') {
          // Ищем вариации написания студии
          query = query.ilike('rooms', '%studio%'); 
        } else {
          // Ищем '1', '2' и т.д.
          query = query.eq('rooms', selectedRoom);
        }
      }

      // Цена ОТ
      if (priceMin) {
        query = query.gte('price', parseInt(priceMin));
      }

      // Цена ДО
      if (priceMax) {
        query = query.lte('price', parseInt(priceMax));
      }

      // Лимит
      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;

      // Удаляем дубликаты
      const uniqueAds = data?.filter((ad, index, self) => 
        index === self.findIndex((t) => t.external_id === ad.external_id)
      );

      setAds(uniqueAds || []);
    } catch (err) {
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  }

  // Сброс фильтров
  const resetFilters = () => {
    setSelectedCity('Все города');
    setSelectedRoom(null);
    setPriceMin('');
    setPriceMax('');
  };

  const formatRooms = (r: string | null) => {
    if (!r) return '';
    if (r.toLowerCase().includes('studio') || r.toLowerCase().includes('студ')) return 'Студия';
    return `${r}-к кв.`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* --- ШАПКА --- */}
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

      {/* --- ПАНЕЛЬ ФИЛЬТРОВ (Выезжает) --- */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4 shadow-md animate-in slide-in-from-top-2">
          
          {/* Город */}
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Город</label>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-blue-500"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Комнаты */}
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Комнаты</label>
            <div className="flex gap-2">
              {[
                { label: 'Студия', val: 'studio' },
                { label: '1', val: '1' },
                { label: '2', val: '2' },
                { label: '3+', val: '3' }
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setSelectedRoom(selectedRoom === item.val ? null : item.val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedRoom === item.val 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Цена */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Цена (руб)</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                placeholder="От" 
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-blue-500"
              />
              <input 
                type="number" 
                placeholder="До" 
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-blue-500"
              />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <button 
              onClick={resetFilters}
              className="flex-1 py-3 text-gray-500 font-medium text-sm hover:text-gray-700"
            >
              Сбросить
            </button>
            <button 
              onClick={fetchAds}
              className="flex-[2] bg-blue-600 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-transform"
            >
              Показать варианты
            </button>
          </div>
        </div>
      )}

      {/* --- СПИСОК (Лоадер или Карточки) --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 text-gray-400 gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-sm">Ищем лучшие варианты...</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center pt-20 px-6">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Ничего не найдено</h3>
          <p className="text-sm text-gray-500">Попробуйте изменить фильтры или сбросить их.</p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 font-medium text-sm">Сбросить фильтры</button>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <p className="text-xs text-gray-400 px-1">Найдено: {ads.length}</p>
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xl font-bold text-slate-900">
                    {ad.price ? `${ad.price.toLocaleString()} ₽` : 'Цена не указана'}
                    {ad.price && <span className="text-sm font-normal text-gray-400">/мес</span>}
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
                </div>
              </div>

              <div className="flex items-start gap-1.5 mb-3">
                <MapPin className="text-gray-400 mt-0.5 min-w-[16px]" size={16} />
                <p className="text-sm text-gray-700 leading-snug">
                  {ad.address || ad.city || 'Район не указан'}
                </p>
              </div>

              {ad.ai_analysis && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info size={14} className="text-purple-500" />
                    <span className="text-xs font-bold text-slate-600">AI Инсайт</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {ad.ai_analysis}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 mt-2">
                {ad.contact_phone ? (
                  <a 
                    href={`tel:${ad.contact_phone}`} 
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Phone size={16} />
                    Позвонить
                  </a>
                ) : (
                  <a 
                    href={`https://t.me/${ad.source_url}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Открыть источник
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
