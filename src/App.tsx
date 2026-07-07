import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CalendarDays, 
  Smile, 
  Flame, 
  Utensils, 
  Settings as SettingsIcon, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from "lucide-react";

import { Settings, DayLog, FoodEntry, ExerciseEntry, GumPhoto, BeverageEntry, TodoItem } from "./types";
import TodayScreen from "./components/TodayScreen";
import GumScreen from "./components/GumScreen";
import ExerciseScreen from "./components/ExerciseScreen";
import FoodScreen from "./components/FoodScreen";
import SettingsScreen from "./components/SettingsScreen";
import AuthScreen from "./components/AuthScreen";
import { 
  saveProfileToCloud, 
  loadProfileFromCloud, 
  saveDayLogToCloud, 
  loadDayLogFromCloud,
  saveGumPhotoToCloud, 
  deleteGumPhotoFromCloud,
  loadGumPhotoFromCloud,
  loadAllDayLogsFromCloud,
  supabase
} from "./lib/supabase";

// Constants
const STORAGE_PREFIX = "dt_";

// Helper functions for date formatting
function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getFormattedTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Default states
const DEFAULT_SETTINGS: Settings = {
  calorieBudget: 1800,
  waterGoalMl: 2000,
  weightKg: 55,
  hairWashIntervalDays: 2,
};

const DEFAULT_DAY_LOG: DayLog = {
  food: [],
  exercise: [],
  waterMl: 0,
  waterLogs: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"today" | "gum" | "exercise" | "food" | "settings">("today");
  const [dateStr, setDateStr] = useState<string>(getLocalDateStr());
  
  // Storage states
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hairLast, setHairLast] = useState<string | null>(null);
  const [dayLog, setDayLog] = useState<DayLog>(DEFAULT_DAY_LOG);
  const [gumDatesIndex, setGumDatesIndex] = useState<string[]>([]);
  const [todayGumPhoto, setTodayGumPhoto] = useState<GumPhoto | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Sync States
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);

  // Auth States
  const [session, setSession] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncId = session?.user?.id || "";

  // UI Toast
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    const id = setTimeout(() => {
      setToastMsg("");
    }, 2200);
    return () => clearTimeout(id);
  };

  // 1. Initial State Loading from LocalStorage
  useEffect(() => {
    // Load Settings
    const rawSettings = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (rawSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    // Load Hair wash log
    const rawHair = localStorage.getItem(`${STORAGE_PREFIX}hairwash-last`);
    setHairLast(rawHair);

    // Load Gum dates index
    const rawIndex = localStorage.getItem(`${STORAGE_PREFIX}gum-index`);
    if (rawIndex) {
      try {
        setGumDatesIndex(JSON.parse(rawIndex));
      } catch (e) {
        setGumDatesIndex([]);
      }
    } else {
      setGumDatesIndex([]);
    }

    const storedAutoSync = localStorage.getItem(`${STORAGE_PREFIX}auto-sync`);
    if (storedAutoSync !== null) {
      setIsAutoSync(storedAutoSync === "true");
    }

    // Load Todos
    const rawTodos = localStorage.getItem(`${STORAGE_PREFIX}todo-list`);
    if (rawTodos) {
      try {
        setTodos(JSON.parse(rawTodos));
      } catch (e) {
        setTodos([]);
      }
    }
  }, []);

  // Auth state listener & sync handlers
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        if (session.user.is_anonymous) {
          setIsGuestMode(true);
        } else {
          setIsGuestMode(false);
          handlePostLoginSync(session);
        }
      }
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        if (newSession.user.is_anonymous) {
          setIsGuestMode(true);
        } else {
          setIsGuestMode(false);
          handlePostLoginSync(newSession);
        }
      } else {
        setIsGuestMode(false);
      }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostLoginSync = async (userSession: any) => {
    const userId = userSession.user.id;
    try {
      setSyncError(null);
      const profile = await loadProfileFromCloud(userId);

      if (profile) {
        // Returning user - load profile
        setSettings(profile.settings);
        localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(profile.settings));

        setHairLast(profile.hairLast);
        if (profile.hairLast) {
          localStorage.setItem(`${STORAGE_PREFIX}hairwash-last`, profile.hairLast);
        } else {
          localStorage.removeItem(`${STORAGE_PREFIX}hairwash-last`);
        }

        setGumDatesIndex(profile.gumDatesIndex || []);
        localStorage.setItem(`${STORAGE_PREFIX}gum-index`, JSON.stringify(profile.gumDatesIndex || []));

        setTodos(profile.todos || []);
        localStorage.setItem(`${STORAGE_PREFIX}todo-list`, JSON.stringify(profile.todos || []));

        // Load all day logs
        const dayLogs = await loadAllDayLogsFromCloud(userId);

        // Clear local day logs first
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${STORAGE_PREFIX}day:`)) {
            localStorage.removeItem(key);
          }
        }

        // Save downloaded day logs to localStorage
        Object.keys(dayLogs).forEach((dStr) => {
          localStorage.setItem(`${STORAGE_PREFIX}day:${dStr}`, JSON.stringify(dayLogs[dStr]));
        });

        if (dayLogs[dateStr]) {
          setDayLog(dayLogs[dateStr]);
        } else {
          setDayLog(DEFAULT_DAY_LOG);
        }

        // Clear local gum photos to free browser memory and fetch them dynamically
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${STORAGE_PREFIX}gum-photo:`)) {
            localStorage.removeItem(key);
          }
        }
        setTodayGumPhoto(null);
        showToast("已成功载入您的云端数据 ✨");
      } else {
        // New user - upload current local profile to cloud
        await saveProfileToCloud(userId, {
          settings,
          hairLast,
          gumDatesIndex,
          todos,
        });

        // Upload any other local logs/photos to the cloud
        await uploadAllLocalDataToCloud(userId);
        showToast("已同步您的本地数据至云端 ✨");
      }
    } catch (e: any) {
      console.error("Post-login sync error:", e);
      setSyncError(`登录同步失败: ${e.message || String(e)}`);
      showToast("数据同步失败，已恢复本地模式");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSettings(DEFAULT_SETTINGS);
      setHairLast(null);
      setDayLog(DEFAULT_DAY_LOG);
      setGumDatesIndex([]);
      setTodayGumPhoto(null);
      setTodos([]);

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      setIsGuestMode(false);
      showToast("已成功退出登录");
    } catch (e) {
      console.error("Logout error:", e);
      showToast("退出登录失败");
    }
  };

  const [recentWeights, setRecentWeights] = useState<{ date: string; weight: number }[]>([]);

  const loadRecentWeights = () => {
    const weights: { date: string; weight: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}day:`)) {
        const dStr = key.replace(`${STORAGE_PREFIX}day:`, "");
        try {
          const log = JSON.parse(localStorage.getItem(key) || "{}");
          if (log && typeof log.weightKg === "number") {
            weights.push({ date: dStr, weight: log.weightKg });
          }
        } catch (e) {
          // ignore
        }
      }
    }
    weights.sort((a, b) => a.date.localeCompare(b.date));
    setRecentWeights(weights);
  };

  // 2. Load DayLog whenever dateStr changes
  useEffect(() => {
    const userId = session?.user?.id;
    const rawDay = localStorage.getItem(`${STORAGE_PREFIX}day:${dateStr}`);
    if (rawDay) {
      try {
        setDayLog({ ...DEFAULT_DAY_LOG, ...JSON.parse(rawDay) });
      } catch (e) {
        setDayLog(DEFAULT_DAY_LOG);
      }
    } else {
      setDayLog(DEFAULT_DAY_LOG);
      if (userId) {
        loadDayLogFromCloud(userId, dateStr).then((cloudLog) => {
          if (cloudLog) {
            setDayLog({ ...DEFAULT_DAY_LOG, ...cloudLog });
            localStorage.setItem(`${STORAGE_PREFIX}day:${dateStr}`, JSON.stringify(cloudLog));
            loadRecentWeights();
          }
        }).catch(err => console.warn("Load daylog from cloud error:", err));
      }
    }

    // Load today's Gum Photo
    const rawGumPhoto = localStorage.getItem(`${STORAGE_PREFIX}gum-photo:${dateStr}`);
    if (rawGumPhoto) {
      try {
        setTodayGumPhoto(JSON.parse(rawGumPhoto));
      } catch (e) {
        setTodayGumPhoto(null);
      }
    } else {
      setTodayGumPhoto(null);
      if (userId) {
        loadGumPhotoFromCloud(userId, dateStr).then((photoData) => {
          if (photoData) {
            setTodayGumPhoto(photoData);
            localStorage.setItem(`${STORAGE_PREFIX}gum-photo:${dateStr}`, JSON.stringify(photoData));
          }
        }).catch(err => console.warn("Load gum photo from cloud error:", err));
      }
    }

    // Load weight trend
    loadRecentWeights();
  }, [dateStr, session]);

  // Save DayLog Helper
  const saveDayLog = (newLog: DayLog) => {
    setDayLog(newLog);
    localStorage.setItem(`${STORAGE_PREFIX}day:${dateStr}`, JSON.stringify(newLog));
    if (session && isAutoSync) {
      saveDayLogToCloud(session.user.id, dateStr, newLog).catch((e) => {
        console.error("Auto sync daylog error:", e);
      });
    }
  };

  const handleUpdateWeight = (weight: number) => {
    const updated = {
      ...dayLog,
      weightKg: weight,
    };
    saveDayLog(updated);
    
    // Also update settings.weightKg as latest fallback weight
    const updatedSettings = {
      ...settings,
      weightKg: weight,
    };
    handleSaveSettings(updatedSettings);
    loadRecentWeights();
    showToast(`体重已记录为 ${weight} kg`);
  };

  const handleAddBeverage = (bev: Omit<BeverageEntry, "id" | "time">) => {
    const updatedBeverages = dayLog.beverages ? [...dayLog.beverages] : [];
    const newBev: BeverageEntry = {
      id: Math.random().toString(36).slice(2, 9),
      time: getFormattedTime(),
      ...bev,
    };

    let updatedFood = [...dayLog.food];
    if (bev.cal > 0) {
      updatedFood.push({
        id: `bev-${newBev.id}`,
        desc: `🥤 饮料: ${bev.desc} (${bev.ml}ml, ${bev.sugar})`,
        cal: bev.cal,
        time: newBev.time,
      });
    }

    const updated = {
      ...dayLog,
      beverages: [...updatedBeverages, newBev],
      food: updatedFood,
    };
    saveDayLog(updated);
    showToast(`已成功记录饮料：${bev.desc}`);
  };

  const handleDeleteBeverage = (id: string) => {
    if (!dayLog.beverages) return;
    const updatedBeverages = dayLog.beverages.filter((b) => b.id !== id);
    const updatedFood = dayLog.food.filter((f) => f.id !== `bev-${id}`);

    const updated = {
      ...dayLog,
      beverages: updatedBeverages,
      food: updatedFood,
    };
    saveDayLog(updated);
    showToast("饮料记录已删除");
  };

  // 3. User Actions handlers

  // Water Logged
  const handleAddWater = (ml: number) => {
    const updated = {
      ...dayLog,
      waterMl: dayLog.waterMl + ml,
      waterLogs: [...(dayLog.waterLogs || []), { time: getFormattedTime(), ml }],
    };
    saveDayLog(updated);
    showToast(`成功记录饮水 +${ml} ml`);
  };

  const handleDeleteWaterLog = (index: number) => {
    const logs = dayLog.waterLogs || [];
    if (index < 0 || index >= logs.length) return;
    const targetLog = logs[index];
    const updatedLogs = logs.filter((_, i) => i !== index);
    const updated = {
      ...dayLog,
      waterMl: Math.max(0, dayLog.waterMl - targetLog.ml),
      waterLogs: updatedLogs,
    };
    saveDayLog(updated);
    showToast(`已成功撤销 ${targetLog.time} 的 ${targetLog.ml}ml 饮水记录`);
  };

  // Hair Wash Logged
  const handleLogHairWash = () => {
    setHairLast(dateStr);
    localStorage.setItem(`${STORAGE_PREFIX}hairwash-last`, dateStr);
    showToast("已成功记录，头发清爽洁净 ✨");
    saveProfile(settings, dateStr, gumDatesIndex, todos);
  };

  // Add Food Entry
  const handleAddFood = (entry: Omit<FoodEntry, "id" | "time">) => {
    const updated = {
      ...dayLog,
      food: [
        ...dayLog.food,
        {
          id: Math.random().toString(36).slice(2, 9),
          time: getFormattedTime(),
          ...entry,
        },
      ],
    };
    saveDayLog(updated);
    showToast(`已添加食物：${entry.desc}`);
  };

  // Delete Food Entry
  const handleDeleteFood = (id: string) => {
    const updated = {
      ...dayLog,
      food: dayLog.food.filter((f) => f.id !== id),
    };
    saveDayLog(updated);
    showToast("饮食记录已删除");
  };

  // Add Exercise Entry
  const handleAddExercise = (entry: Omit<ExerciseEntry, "id" | "time">) => {
    const updated = {
      ...dayLog,
      exercise: [
        ...dayLog.exercise,
        {
          id: Math.random().toString(36).slice(2, 9),
          time: getFormattedTime(),
          ...entry,
        },
      ],
    };
    saveDayLog(updated);
    showToast(`已添加运动：${entry.desc}`);
  };

  // Delete Exercise Entry
  const handleDeleteExercise = (id: string) => {
    const updated = {
      ...dayLog,
      exercise: dayLog.exercise.filter((e) => e.id !== id),
    };
    saveDayLog(updated);
    showToast("运动记录已删除");
  };

  // Helper to save Profile to cloud
  const saveProfile = (
    updatedSettings = settings,
    updatedHair = hairLast,
    updatedIndex = gumDatesIndex,
    updatedTodos = todos
  ) => {
    if (session && isAutoSync) {
      saveProfileToCloud(session.user.id, {
        settings: updatedSettings,
        hairLast: updatedHair,
        gumDatesIndex: updatedIndex,
        todos: updatedTodos,
      }).catch((e) => {
        console.error("Auto sync profile error:", e);
      });
    }
  };

  // Upload all local data to cloud helper
  const uploadAllLocalDataToCloud = async (userId: string) => {
    await saveProfileToCloud(userId, {
      settings,
      hairLast,
      gumDatesIndex,
      todos,
    });

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (key.startsWith(`${STORAGE_PREFIX}day:`)) {
        const dStr = key.replace(`${STORAGE_PREFIX}day:`, "");
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            await saveDayLogToCloud(userId, dStr, parsed);
          }
        } catch (e) {
          console.error("Failed to upload daylog key:", key, e);
        }
      } else if (key.startsWith(`${STORAGE_PREFIX}gum-photo:`)) {
        const dStr = key.replace(`${STORAGE_PREFIX}gum-photo:`, "");
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            await saveGumPhotoToCloud(userId, dStr, parsed);
          }
        } catch (e) {
          console.error("Failed to upload gumphoto key:", key, e);
        }
      }
    }
  };

  // Download all data from cloud helper
  const downloadAllDataFromCloud = async (userId: string) => {
    const profile = await loadProfileFromCloud(userId);
    if (!profile) {
      throw new Error("云端对应的账号配置不存在");
    }

    setSettings(profile.settings);
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(profile.settings));

    setHairLast(profile.hairLast);
    if (profile.hairLast) {
      localStorage.setItem(`${STORAGE_PREFIX}hairwash-last`, profile.hairLast);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}hairwash-last`);
    }

    setGumDatesIndex(profile.gumDatesIndex || []);
    localStorage.setItem(`${STORAGE_PREFIX}gum-index`, JSON.stringify(profile.gumDatesIndex || []));

    setTodos(profile.todos || []);
    localStorage.setItem(`${STORAGE_PREFIX}todo-list`, JSON.stringify(profile.todos || []));

    const dayLogs = await loadAllDayLogsFromCloud(userId);
    
    // Clear local day logs
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}day:`)) {
        localStorage.removeItem(key);
      }
    }

    // Save logs
    Object.keys(dayLogs).forEach((dStr) => {
      localStorage.setItem(`${STORAGE_PREFIX}day:${dStr}`, JSON.stringify(dayLogs[dStr]));
    });

    if (dayLogs[dateStr]) {
      setDayLog(dayLogs[dateStr]);
    } else {
      setDayLog(DEFAULT_DAY_LOG);
    }

    // Clear local gum photos to free up browser quota and fetch dynamically
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}gum-photo:`)) {
        localStorage.removeItem(key);
      }
    }
    setTodayGumPhoto(null);
  };

  // Settings sync props implementation
  const handleEnableSync = async (targetSyncId: string) => {
    return { success: false, message: "此模式已被弃用，系统已启用自动账号同步" };
  };

  const handleGenerateSync = async () => {
    return { success: false, syncId: "", error: "此模式已被弃用，系统已启用自动账号同步" };
  };

  const handleUploadToCloud = async () => {
    if (!session) return { success: false, message: "尚未登录账号" };
    try {
      await uploadAllLocalDataToCloud(session.user.id);
      return { success: true, message: "" };
    } catch (e: any) {
      return { success: false, message: e.message || "上传失败" };
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!session) return { success: false, message: "尚未登录账号" };
    try {
      await downloadAllDataFromCloud(session.user.id);
      return { success: true, message: "" };
    } catch (e: any) {
      return { success: false, message: e.message || "下载并覆盖本地失败" };
    }
  };

  const handleDisableSync = () => {
    // No-op
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setIsAutoSync(enabled);
    localStorage.setItem(`${STORAGE_PREFIX}auto-sync`, String(enabled));
  };

  // Todo handlers
  const handleAddTodo = (text: string, category: "appointment" | "exam" | "general", targetDate?: string, timeStr?: string) => {
    const id = "todo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const newTodo: TodoItem = {
      id,
      dateStr: targetDate || dateStr,
      text: text.trim(),
      category,
      isCompleted: false,
      timeStr: timeStr || ""
    };
    const updated = [...todos, newTodo];
    setTodos(updated);
    localStorage.setItem(`${STORAGE_PREFIX}todo-list`, JSON.stringify(updated));
    saveProfile(settings, hairLast, gumDatesIndex, updated);
  };

  const handleToggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
    setTodos(updated);
    localStorage.setItem(`${STORAGE_PREFIX}todo-list`, JSON.stringify(updated));
    saveProfile(settings, hairLast, gumDatesIndex, updated);
  };

  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    localStorage.setItem(`${STORAGE_PREFIX}todo-list`, JSON.stringify(updated));
    saveProfile(settings, hairLast, gumDatesIndex, updated);
  };

  // Save Gum Photo (Base64)
  const handleSaveGumPhoto = (targetDate: string, photo: GumPhoto) => {
    // 1. Save Photo detail
    localStorage.setItem(`${STORAGE_PREFIX}gum-photo:${targetDate}`, JSON.stringify(photo));
    if (targetDate === dateStr) {
      setTodayGumPhoto(photo);
    }

    // 2. Add to date index if not already present
    let updatedIndex = [...gumDatesIndex];
    if (!updatedIndex.includes(targetDate)) {
      updatedIndex.push(targetDate);
      updatedIndex.sort(); // Keep sorted chronologically
      setGumDatesIndex(updatedIndex);
      localStorage.setItem(`${STORAGE_PREFIX}gum-index`, JSON.stringify(updatedIndex));
    }

    // Sync profile and photo
    saveProfile(settings, hairLast, updatedIndex);
    if (session && isAutoSync) {
      saveGumPhotoToCloud(session.user.id, targetDate, photo).catch((e) => {
        console.error("Auto sync gum photo error:", e);
      });
    }
  };

  // Delete Gum Photo
  const handleDeleteGumPhoto = (targetDate: string) => {
    localStorage.removeItem(`${STORAGE_PREFIX}gum-photo:${targetDate}`);
    if (targetDate === dateStr) {
      setTodayGumPhoto(null);
    }

    const updatedIndex = gumDatesIndex.filter((d) => d !== targetDate);
    setGumDatesIndex(updatedIndex);
    localStorage.setItem(`${STORAGE_PREFIX}gum-index`, JSON.stringify(updatedIndex));
    showToast("牙龈照片已成功删除");

    saveProfile(settings, hairLast, updatedIndex);
    if (session && isAutoSync) {
      deleteGumPhotoFromCloud(session.user.id, targetDate).catch((e) => {
        console.error("Auto sync delete gum photo error:", e);
      });
    }
  };

  // Get Gum Photo by date
  const getGumPhotoByDate = (targetDate: string): GumPhoto | null => {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}gum-photo:${targetDate}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  // Save Settings
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(newSettings));
    saveProfile(newSettings, hairLast, gumDatesIndex);
  };

  // Export all LocalStorage backup prefixed with STORAGE_PREFIX
  const handleExportBackup = (): string => {
    const backup: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const val = localStorage.getItem(key);
        if (val) backup[key] = val;
      }
    }
    return JSON.stringify(backup);
  };

  // Import Backup
  const handleImportBackup = (backupJson: string): boolean => {
    try {
      const data = JSON.parse(backupJson);
      if (typeof data !== "object" || data === null) return false;

      // Validate keys start with STORAGE_PREFIX
      const keys = Object.keys(data);
      if (keys.length === 0) return false;
      
      const isValid = keys.every((k) => k.startsWith(STORAGE_PREFIX));
      if (!isValid) return false;

      // Set items in localStorage
      keys.forEach((key) => {
        localStorage.setItem(key, data[key]);
      });

      // Reload state after importing successfully
      // Trigger Settings reload
      const rawSettings = localStorage.getItem(`${STORAGE_PREFIX}settings`);
      if (rawSettings) setSettings(JSON.parse(rawSettings));
      
      // Trigger Hair wash reload
      const rawHair = localStorage.getItem(`${STORAGE_PREFIX}hairwash-last`);
      setHairLast(rawHair);

      // Trigger Gum Index reload
      const rawIndex = localStorage.getItem(`${STORAGE_PREFIX}gum-index`);
      if (rawIndex) setGumDatesIndex(JSON.parse(rawIndex));

      // Force refresh current DayLog
      const rawDay = localStorage.getItem(`${STORAGE_PREFIX}day:${dateStr}`);
      if (rawDay) setDayLog(JSON.parse(rawDay));

      const rawGumPhoto = localStorage.getItem(`${STORAGE_PREFIX}gum-photo:${dateStr}`);
      if (rawGumPhoto) setTodayGumPhoto(JSON.parse(rawGumPhoto));

      return true;
    } catch (e) {
      return false;
    }
  };

  // Switch Date Helpers
  const stepDate = (days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    setDateStr(getLocalDateStr(d));
  };

  const setDateToToday = () => {
    setDateStr(getLocalDateStr());
  };

  // Active Screen Title Mapping
  const tabTitles = {
    today: "今天记录",
    gum: "牙龈跟踪",
    exercise: "运动消耗",
    food: "饮食摄入",
    settings: "应用设置",
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center font-sans">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-5xl mb-4"
        >
          🧁
        </motion.div>
        <div className="text-sm font-semibold text-brand-ink animate-pulse">正在载入年糕日记...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        onAuthSuccess={(newSession) => {
          setSession(newSession);
          if (newSession.user.is_anonymous) {
            setIsGuestMode(true);
          } else {
            setIsGuestMode(false);
            handlePostLoginSync(newSession);
          }
        }}
        onContinueAsGuest={() => {
          setIsGuestMode(true);
          showToast("已启用本地游客模式");
        }}
      />
    );
  }

  return (
    <div id="app-viewport" className="min-h-screen bg-brand-bg flex flex-col antialiased selection:bg-brand-accent-soft selection:text-brand-accent pb-20">
      {/* Sticky Header Topbar */}
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-md border-b border-brand-line px-4 py-3 flex items-center justify-between shadow-2xs">
        <div>
          <h1 className="font-sans text-base font-bold text-brand-ink tracking-tight flex items-center gap-1.5">
            <span className="text-lg">🧁</span>
            <span className="font-serif text-base font-bold text-brand-ink">年糕日记</span>
            <span className="text-[10px] font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/25 px-2 py-0.5 rounded-full">
              {tabTitles[activeTab]}
            </span>
          </h1>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1.5 bg-brand-surface border border-brand-line/70 rounded-xl px-2 py-1 shadow-3xs">
          <button
            onClick={() => stepDate(-1)}
            className="p-1 hover:bg-brand-bg rounded-lg text-brand-ink transition-colors"
            title="前一天"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="relative flex items-center">
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="font-mono text-xs font-semibold text-brand-ink cursor-pointer bg-transparent border-none p-0 focus:ring-0 focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => stepDate(1)}
            className="p-1 hover:bg-brand-bg rounded-lg text-brand-ink transition-colors"
            title="后一天"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {dateStr !== getLocalDateStr() && (
            <button
              onClick={setDateToToday}
              className="text-[10px] font-bold bg-brand-accent-soft text-brand-accent px-1.5 py-0.5 rounded-md hover:bg-brand-accent/20 transition-all shrink-0 ml-1"
            >
              回今天
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === "today" && (
            <TodayScreen
              key="screen-today"
              dateStr={dateStr}
              dayLog={dayLog}
              settings={settings}
              hairLast={hairLast}
              gumPhoto={todayGumPhoto}
              recentWeights={recentWeights}
              onUpdateWeight={handleUpdateWeight}
              onAddBeverage={handleAddBeverage}
              onDeleteBeverage={handleDeleteBeverage}
              onAddWater={handleAddWater}
              onDeleteWaterLog={handleDeleteWaterLog}
              onLogHairWash={handleLogHairWash}
              onNavigateToGum={() => setActiveTab("gum")}
              onSelectDate={setDateStr}
              todos={todos}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
            />
          )}

          {activeTab === "gum" && (
            <GumScreen
              key="screen-gum"
              dateStr={dateStr}
              gumPhoto={todayGumPhoto}
              gumDatesIndex={gumDatesIndex}
              onSaveGumPhoto={handleSaveGumPhoto}
              onDeleteGumPhoto={handleDeleteGumPhoto}
              getGumPhotoByDate={getGumPhotoByDate}
            />
          )}

          {activeTab === "exercise" && (
            <ExerciseScreen
              key="screen-exercise"
              dateStr={dateStr}
              exerciseEntries={dayLog.exercise}
              settings={settings}
              onAddExercise={handleAddExercise}
              onDeleteExercise={handleDeleteExercise}
            />
          )}

          {activeTab === "food" && (
            <FoodScreen
              key="screen-food"
              dateStr={dateStr}
              foodEntries={dayLog.food}
              exerciseEntries={dayLog.exercise}
              settings={settings}
              onAddFood={handleAddFood}
              onDeleteFood={handleDeleteFood}
            />
          )}

          {activeTab === "settings" && (
            <SettingsScreen
              key="screen-settings"
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onImportBackup={handleImportBackup}
              onExportBackup={handleExportBackup}
              isAutoSync={isAutoSync}
              onUploadToCloud={handleUploadToCloud}
              onDownloadFromCloud={handleDownloadFromCloud}
              onToggleAutoSync={handleToggleAutoSync}
              session={session}
              onLogout={handleLogout}
              isGuestMode={isGuestMode}
              syncError={syncError}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Bar */}
      <nav id="app-footer-nav" className="fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-line/80 px-4 py-2 flex justify-around items-center z-40 max-w-md mx-auto shadow-md">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === "today" ? "text-brand-accent bg-brand-accent-soft/40 font-semibold" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">今天</span>
        </button>

        <button
          onClick={() => setActiveTab("gum")}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === "gum" ? "text-brand-accent bg-brand-accent-soft/40 font-semibold" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          <Smile className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">牙龈</span>
        </button>

        <button
          onClick={() => setActiveTab("exercise")}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === "exercise" ? "text-brand-accent bg-brand-accent-soft/40 font-semibold" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">运动</span>
        </button>

        <button
          onClick={() => setActiveTab("food")}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === "food" ? "text-brand-accent bg-brand-accent-soft/40 font-semibold" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">饮食</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === "settings" ? "text-brand-accent bg-brand-accent-soft/40 font-semibold" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          <SettingsIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">设置</span>
        </button>
      </nav>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-brand-ink text-white px-5 py-2.5 rounded-full text-xs shadow-lg flex items-center gap-2 z-50 whitespace-nowrap"
          >
            <Check className="w-4 h-4 text-brand-accent-soft shrink-0" />
            <span className="font-medium">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
