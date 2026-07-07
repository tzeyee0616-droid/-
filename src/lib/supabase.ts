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

export function generateSyncId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `NG-${part1}-${part2}`;
}

export interface SyncProfileData {
  syncId: string;
  settings: Settings;
  hairLast: string | null;
  gumDatesIndex: string[];
  todos?: TodoItem[];
  updatedAt: string;
}

async function joinSyncProfile(syncId: string): Promise<void> {
  await ensureSupabaseSession();
  const { error } = await supabase.from("sync_members").upsert(
    {
      sync_id: syncId,
    },
    { onConflict: "sync_id,user_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}

async function tryJoinSyncProfile(syncId: string): Promise<boolean> {
  try {
    await joinSyncProfile(syncId);
    return true;
  } catch {
    return false;
  }
}

function toProfileData(row: any): SyncProfileData {
  return {
    syncId: row.sync_id,
    settings: row.settings,
    hairLast: row.hair_last,
    gumDatesIndex: row.gum_dates_index || [],
    todos: row.todos || [],
    updatedAt: row.updated_at,
  };
}

export async function testSupabaseConnection(): Promise<void> {
  await ensureSupabaseSession();
  const { error } = await supabase.from("sync_profiles").select("sync_id").limit(1);
  if (error) throw error;
}

export async function saveProfileToCloud(
  syncId: string,
  data: Omit<SyncProfileData, "syncId" | "updatedAt">
): Promise<void> {
  await ensureSupabaseSession();
  const alreadyJoined = await tryJoinSyncProfile(syncId);
  const { error } = await supabase.from("sync_profiles").upsert(
    {
      sync_id: syncId,
      settings: data.settings,
      hair_last: data.hairLast,
      gum_dates_index: data.gumDatesIndex || [],
      todos: data.todos || [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sync_id" }
  );
  if (error) throw error;
  if (!alreadyJoined) await joinSyncProfile(syncId);
}

export async function loadProfileFromCloud(syncId: string): Promise<SyncProfileData | null> {
  try {
    await joinSyncProfile(syncId);
  } catch {
    return null;
  }
  const { data, error } = await supabase.from("sync_profiles").select("*").eq("sync_id", syncId).maybeSingle();
  if (error) throw error;
  return data ? toProfileData(data) : null;
}

export async function saveDayLogToCloud(syncId: string, dateStr: string, log: DayLog): Promise<void> {
  await joinSyncProfile(syncId);
  const { error } = await supabase.from("day_logs").upsert(
    {
      sync_id: syncId,
      date_str: dateStr,
      log,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sync_id,date_str" }
  );
  if (error) throw error;
}

export async function loadDayLogFromCloud(syncId: string, dateStr: string): Promise<DayLog | null> {
  await joinSyncProfile(syncId);
  const { data, error } = await supabase
    .from("day_logs")
    .select("log")
    .eq("sync_id", syncId)
    .eq("date_str", dateStr)
    .maybeSingle();
  if (error) throw error;
  return data?.log || null;
}

export async function loadAllDayLogsFromCloud(syncId: string): Promise<Record<string, DayLog>> {
  await joinSyncProfile(syncId);
  const { data, error } = await supabase.from("day_logs").select("date_str, log").eq("sync_id", syncId);
  if (error) throw error;

  return (data || []).reduce<Record<string, DayLog>>((result, row) => {
    result[row.date_str] = row.log as DayLog;
    return result;
  }, {});
}

export async function saveGumPhotoToCloud(syncId: string, dateStr: string, photo: GumPhoto): Promise<void> {
  await joinSyncProfile(syncId);
  const { error } = await supabase.from("gum_photos").upsert(
    {
      sync_id: syncId,
      date_str: dateStr,
      image: photo.image,
      note: photo.note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sync_id,date_str" }
  );
  if (error) throw error;
}

export async function loadGumPhotoFromCloud(syncId: string, dateStr: string): Promise<GumPhoto | null> {
  await joinSyncProfile(syncId);
  const { data, error } = await supabase
    .from("gum_photos")
    .select("image, note")
    .eq("sync_id", syncId)
    .eq("date_str", dateStr)
    .maybeSingle();
  if (error) throw error;
  return data ? { image: data.image, note: data.note || "" } : null;
}

export async function deleteGumPhotoFromCloud(syncId: string, dateStr: string): Promise<void> {
  await joinSyncProfile(syncId);
  const { error } = await supabase.from("gum_photos").delete().eq("sync_id", syncId).eq("date_str", dateStr);
  if (error) throw error;
}
