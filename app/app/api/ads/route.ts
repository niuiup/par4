import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Инициализация Supabase (серверные ключи!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------
//   GET /api/ads
// ---------------------------
// Параметры:
//   city=Калининград
//   rooms=1 | 2 | studio | null
//   price_min=20000
//   price_max=50000
//   limit=20
//   cursor=12345 (ID последней записи)
// ---------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Фильтры клиента
    const city = searchParams.get("city");
    const rooms = searchParams.get("rooms");
    const priceMin = searchParams.get("price_min");
    const priceMax = searchParams.get("price_max");
    const limit = Number(searchParams.get("limit")) || 20;
    const cursor = searchParams.get("cursor"); // ID предыдущей записи

    // ---------------------------
    // БАЗОВЫЙ ЗАПРОС
    // ---------------------------
    let query = supabase
      .from("ads")
      .select("*")
      .eq("is_published", true)
      .order("id", { ascending: false }) // порядок важен для курсора
      .limit(limit);

    // ---------------------------
    // ПРИМЕНЕНИЕ ФИЛЬТРОВ
    // ---------------------------

    if (city && city !== "Все города") {
      query = query.eq("city", city);
    }

    if (rooms) {
      if (rooms === "studio") {
        query = query.ilike("rooms", "%studio%");
      } else {
        query = query.eq("rooms", rooms);
      }
    }

    if (priceMin) query = query.gte("price", Number(priceMin));
    if (priceMax) query = query.lte("price", Number(priceMax));

    // ---------------------------
    // ПАГИНАЦИЯ ЧЕРЕЗ КУРСОР
    // ---------------------------
    if (cursor) {
      query = query.lt("id", cursor);
    }

    // ---------------------------
    // ВЫПОЛНЕНИЕ ЗАПРОСА
    // ---------------------------
    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Если объявлений нет — отдаём пусто
    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [],
        nextCursor: null,
      });
    }

    // Новый курсор = последний ID в пачке
    const nextCursor = data[data.length - 1].id;

    return NextResponse.json({
      data,
      nextCursor,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
