import { createClient } from "@supabase/supabase-js";
import { DayLog, GumPhoto, Settings, TodoItem } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zrpxxurqjetawiuyggdb.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_i2Lwa80oXFJiFYcD0TOKbg_yLu7llkr";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function ensureSupabaseSession(): Promise<void> {
  const { data: existingSession, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (existingSession.session) return;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(
      `${error.message}. Enable Anonymous sign-ins in Supabase: Authentication > Sign In / Providers > Anonymous.`
    );
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export interface UserProfileData {
  userId: string;
  settings: Settings;
  hairLast: string | null;
  gumDatesIndex: string[];
  todos?: TodoItem[];
  updatedAt: string;
}

function toProfileData(userId: string, row: any): UserProfileData {
  return {
    userId,
    settings: row.settings,
    hairLast: row.hair_last,
    gumDatesIndex: row.gum_dates_index || [],
    todos: row.todos || [],
    updatedAt: row.updated_at,
  };
}

export async function saveProfileToCloud(
  userId: string,
  data: Omit<UserProfileData, "userId" | "updatedAt">
): Promise<void> {
  await ensureSupabaseSession();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      settings: data.settings,
      hair_last: data.hairLast,
      gum_dates_index: data.gumDatesIndex || [],
      todos: data.todos || [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function loadProfileFromCloud(userId: string): Promise<UserProfileData | null> {
  await ensureSupabaseSession();
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? toProfileData(userId, data) : null;
}

export async function saveDayLogToCloud(userId: string, dateStr: string, log: DayLog): Promise<void> {
  await ensureSupabaseSession();
  const { error } = await supabase.from("day_logs").upsert(
    {
      user_id: userId,
      date_str: dateStr,
      log,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date_str" }
  );
  if (error) throw error;
}

export async function loadDayLogFromCloud(userId: string, dateStr: string): Promise<DayLog | null> {
  await ensureSupabaseSession();
  const { data, error } = await supabase
    .from("day_logs")
    .select("log")
    .eq("user_id", userId)
    .eq("date_str", dateStr)
    .maybeSingle();
  if (error) throw error;
  return data?.log || null;
}

export async function loadAllDayLogsFromCloud(userId: string): Promise<Record<string, DayLog>> {
  await ensureSupabaseSession();
  const { data, error } = await supabase.from("day_logs").select("date_str, log").eq("user_id", userId);
  if (error) throw error;

  return (data || []).reduce<Record<string, DayLog>>((result, row) => {
    result[row.date_str] = row.log as DayLog;
    return result;
  }, {});
}

export async function saveGumPhotoToCloud(userId: string, dateStr: string, photo: GumPhoto): Promise<void> {
  await ensureSupabaseSession();
  const { error } = await supabase.from("gum_photos").upsert(
    {
      user_id: userId,
      date_str: dateStr,
      image: photo.image,
      note: photo.note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date_str" }
  );
  if (error) throw error;
}

export async function loadGumPhotoFromCloud(userId: string, dateStr: string): Promise<GumPhoto | null> {
  await ensureSupabaseSession();
  const { data, error } = await supabase
    .from("gum_photos")
    .select("image, note")
    .eq("user_id", userId)
    .eq("date_str", dateStr)
    .maybeSingle();
  if (error) throw error;
  return data ? { image: data.image, note: data.note || "" } : null;
}

export async function deleteGumPhotoFromCloud(userId: string, dateStr: string): Promise<void> {
  await ensureSupabaseSession();
  const { error } = await supabase.from("gum_photos").delete().eq("user_id", userId).eq("date_str", dateStr);
  if (error) throw error;
}
