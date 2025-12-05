'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Phone, Info, LayoutTemplate } from 'lucide-react';

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

export default function TelegramApp() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Инициализация Telegram Mini App (через хак as any, чтобы не было ошибок)
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#ffffff');
      } catch (e) {
        console.log('Цвет шапки не поддерживается');
      }
    }
    
    // 2. Загрузка данных
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      // ВАЖНО: используем .from, а не .table
      const { data, error } = await supabase
        .from('ads') 
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

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

  const formatRooms = (r: string | null) => {
    if (!r) return '';
    if (r.toLowerCase().includes('studio') || r.toLowerCase().includes('студ')) return 'Студия';
    return `${r}-к кв.`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Шапка */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg text-gray-900">Аренда 🏠</h1>
        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {ads.length}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 text-gray-400 gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-sm">Загрузка...</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xl font-bold text-slate-900">
                    {ad.price ? `${ad.price.toLocaleString()} ₽` : 'Цена договорная'}
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

            </div>
          ))}
        </div>
      )}
    </div>
  );
}


