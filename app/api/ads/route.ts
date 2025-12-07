import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- Серверный Supabase клиент, безопасный (service_role) ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // важно! только в серверном компоненте
  {
    auth: { persistSession: false }
  }
);

export async function GET(request: Request) {
  const url = new URL(request.url);

  // --- Читаем параметры ---
  const city = url.searchParams.get('city');
  const rooms = url.searchParams.get('rooms');
  const priceMin = url.searchParams.get('price_min');
  const priceMax = url.searchParams.get('price_max');
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const offset = Number(url.searchParams.get('offset') ?? '0');

  // Начало времени измерения
  const started = Date.now();

  // --- Основной запрос ---
  let query = supabase
    .from('ads')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1); // Пагинация

  // --- Фильтры ---
  if (city && city !== 'Все города') {
    query = query.eq('city', city);
  }

  if (rooms) {
    if (rooms === 'studio') {
      query = query.ilike('rooms', '%studio%');
    } else {
      query = query.eq('rooms', rooms);
    }
  }

  if (priceMin) {
    query = query.gte('price', Number(priceMin));
  }

  if (priceMax) {
    query = query.lte('price', Number(priceMax));
  }

  // Выполняем запрос
  const { data, error } = await query;

  const timeMs = Date.now() - started; // Время выполнения

  if (error) {
    return NextResponse.json(
      { error: error.message, time_ms: timeMs },
      { status: 500 }
    );
  }

  // Удаляем дубликаты external_id (на всякий случай)
  const uniqueAds = data?.filter(
    (ad, i, arr) => i === arr.findIndex((x) => x.external_id === ad.external_id)
  );

  return NextResponse.json({
    time_ms: timeMs,
    count: uniqueAds?.length ?? 0,
    items: uniqueAds
  });
}
