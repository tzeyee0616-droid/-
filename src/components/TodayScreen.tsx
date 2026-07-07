import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Droplet, 
  Sparkles, 
  Flame, 
  CheckCircle, 
  Camera, 
  Calendar, 
  Scale, 
  CupSoda, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Check, 
  X,
  PlusCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  Lock,
  Unlock
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";
import { DayLog, Settings, GumPhoto, BeverageEntry, TodoItem } from "../types";
import Mascot from "./Mascot";

interface TodayScreenProps {
  dateStr: string;
  dayLog: DayLog;
  settings: Settings;
  hairLast: string | null;
  gumPhoto: GumPhoto | null;
  recentWeights: { date: string; weight: number }[];
  onUpdateWeight: (weight: number) => void;
  onAddBeverage: (bev: { desc: string; ml: number; cal: number; sugar: string }) => void;
  onDeleteBeverage: (id: string) => void;
  onAddWater: (ml: number) => void;
  onDeleteWaterLog: (index: number) => void;
  onLogHairWash: () => void;
  onNavigateToGum: () => void;
  onSelectDate: (date: string) => void;
  todos: TodoItem[];
  onAddTodo: (text: string, category: "appointment" | "exam" | "general", dateStr: string, timeStr: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

const BEV_PRESETS = [
  { name: "冰美式", ml: 350, cal: 10, sugar: "无糖" },
  { name: "冰拿铁", ml: 350, cal: 120, sugar: "无糖" },
  { name: "珍珠奶茶", ml: 500, cal: 360, sugar: "半糖" },
  { name: "水果茶", ml: 500, cal: 220, sugar: "微糖" },
  { name: "经典可乐", ml: 330, cal: 140, sugar: "全糖" },
  { name: "无糖汽水", ml: 330, cal: 0, sugar: "无糖" }
];

// Custom cute Nian Gao data dot for weight chart
const CustomDot = (props: any) => {
  const { cx, cy } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 100 100" style={{ filter: "drop-shadow(0px 1px 2px rgba(141, 116, 102, 0.25))" }}>
      {/* Puffy body */}
      <path 
        d="M 20 70 C 10 70, 10 50, 20 40 C 22 25, 45 20, 50 25 C 60 18, 80 25, 82 42 C 92 48, 92 68, 82 72 C 78 80, 25 80, 20 70 Z" 
        fill="#FFFFFF" 
        stroke="#4E3629" 
        strokeWidth="6" 
        strokeLinejoin="round"
      />
      {/* Toast patch */}
      <path d="M 58 28 C 64 24, 76 28, 77 36 C 74 38, 62 38, 58 28 Z" fill="#F3D5B5" />
      {/* Blush cheeks */}
      <circle cx="28" cy="49" r="6" fill="#FFA5A5" opacity="0.9" />
      <circle cx="72" cy="49" r="6" fill="#FFA5A5" opacity="0.9" />
      {/* Smiling curve eyes */}
      <path d="M 31 45 Q 36 39 41 45" stroke="#4E3629" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <path d="M 59 45 Q 64 39 69 45" stroke="#4E3629" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      {/* Mouth */}
      <path d="M 46 52 Q 50 56 54 52" stroke="#4E3629" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
};

// Custom cute active bouncing/singing Nian Gao dot
const CustomActiveDot = (props: any) => {
  const { cx, cy } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <svg x={cx - 13} y={cy - 13} width={26} height={26} viewBox="0 0 100 100" style={{ filter: "drop-shadow(0px 2px 4px rgba(141, 116, 102, 0.35))" }}>
      {/* Puffy body */}
      <path 
        d="M 20 70 C 10 70, 10 50, 20 40 C 22 25, 45 20, 50 25 C 60 18, 80 25, 82 42 C 92 48, 92 68, 82 72 C 78 80, 25 80, 20 70 Z" 
        fill="#FCF4E8" 
        stroke="#4E3629" 
        strokeWidth="6" 
        strokeLinejoin="round"
      />
      {/* Toast patch */}
      <path d="M 58 28 C 64 24, 76 28, 77 36 C 74 38, 62 38, 58 28 Z" fill="#F3D5B5" />
      {/* Blush cheeks */}
      <circle cx="28" cy="49" r="6" fill="#FFA5A5" opacity="0.9" />
      <circle cx="72" cy="49" r="6" fill="#FFA5A5" opacity="0.9" />
      {/* Excited eyes */}
      <path d="M 31 45 Q 36 39 41 45" stroke="#4E3629" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M 59 45 Q 64 39 69 45" stroke="#4E3629" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Excited open mouth */}
      <path d="M 45 52 Q 50 58 55 52 Z" fill="#D36350" stroke="#4E3629" strokeWidth="4.5" />
    </svg>
  );
};

// --- ACHIEVEMENT SYSTEM TYPES & DATA ---
interface Badge {
  id: string;
  name: string;
  category: "water" | "checkin" | "gum" | "meal" | "exercise";
  target: number;
  description: string;
  colorClass: string;
  celebrateText: string;
}

const BADGES_CATALOG: Badge[] = [
  {
    id: "water_1",
    name: "水润小年糕",
    category: "water",
    target: 2,
    description: "连续饮水 2 天",
    colorClass: "from-blue-50 to-blue-100 border-blue-200 text-blue-800",
    celebrateText: "吨吨吨！连续喝水2天的你，就像水嘟嘟的小年糕一样充满弹性、水莹盈的！✨"
  },
  {
    id: "water_2",
    name: "水桶大年糕",
    category: "water",
    target: 5,
    description: "连续饮水 5 天",
    colorClass: "from-teal-50 to-teal-100 border-teal-200 text-teal-800",
    celebrateText: "超级蓄水池！连续5天吨吨吨，年糕肚子都喝得鼓鼓啦，为你点赞！💧"
  },
  {
    id: "water_3",
    name: "波塞冬年糕",
    category: "water",
    target: 10,
    description: "连续饮水 10 天",
    colorClass: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800",
    celebrateText: "海王加冕！连续10天保持充沛的水分，你已经掌握了水的终极奥义！🔱"
  },
  {
    id: "checkin_1",
    name: "萌芽小年糕",
    category: "checkin",
    target: 3,
    description: "连续打卡 3 天",
    colorClass: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800",
    celebrateText: "哇！连续3天记录生活，小年糕的脑瓜上冒出了嫩绿的小芽，自律在悄悄生长！🌱"
  },
  {
    id: "checkin_2",
    name: "闪耀银勋章",
    category: "checkin",
    target: 7,
    description: "连续打卡 7 天",
    colorClass: "from-slate-50 to-slate-100 border-slate-200 text-slate-800",
    celebrateText: "太棒了！整整一周的坚持，小年糕全身闪烁着纯净的银色光芒，自律之星！🥈"
  },
  {
    id: "checkin_3",
    name: "至尊金皇冠",
    category: "checkin",
    target: 15,
    description: "连续打卡 15 天",
    colorClass: "from-amber-50 to-amber-100 border-amber-200 text-amber-800",
    celebrateText: "无可匹敌！15天的毅力与坚持，金色的皇冠和耀眼的光环属于卓越自律的你！👑"
  },
  {
    id: "gum_1",
    name: "洁白牙齿卫士",
    category: "gum",
    target: 3,
    description: "累计牙龈记录 3 天",
    colorClass: "from-rose-50 to-rose-100 border-rose-200 text-rose-800",
    celebrateText: "白白净净！累计拍摄3次牙龈照片，小年糕也正拿着大牙刷刷牙，牙龈亮晶晶！🦷"
  },
  {
    id: "gum_2",
    name: "金盾守护天使",
    category: "gum",
    target: 7,
    description: "累计牙龈记录 7 天",
    colorClass: "from-red-50 to-red-100 border-red-200 text-red-800",
    celebrateText: "坚固防线！累计7次牙龈状况对比，你的牙龈防线已如黄金盾牌般不可摧毁！🛡️"
  },
  {
    id: "meal_1",
    name: "见习小厨神",
    category: "meal",
    target: 5,
    description: "累计饮食记录 5 餐",
    colorClass: "from-orange-50 to-orange-100 border-orange-200 text-orange-800",
    celebrateText: "嚼嚼嚼... 累计记录5次饮食摄入，戴上厨师帽的小年糕已经在研究明天的健康菜谱啦！🍳"
  },
  {
    id: "exercise_1",
    name: "元气铁人年糕",
    category: "exercise",
    target: 3,
    description: "累计运动记录 3 次",
    colorClass: "from-fuchsia-50 to-fuchsia-100 border-fuchsia-200 text-fuchsia-800",
    celebrateText: "呼哈！累计打卡3次运动消耗，戴上运动发带，小年糕陪你一起流汗、健康满分！🏋️"
  }
];

function TrophySvg({ id, unlocked }: { id: string; unlocked: boolean }) {
  // Common body shape of Nian Gao
  const nianGaoBody = (
    <path 
      d="M 25 75 
         C 15 75, 15 55, 25 45 
         C 27 30, 48 25, 53 30 
         C 63 23, 83 30, 85 47
         C 95 53, 95 73, 85 77
         C 81 85, 30 85, 25 75 Z" 
      fill={unlocked ? "#FFFFFF" : "#CBD5E1"} 
      stroke="#4E3629" 
      strokeWidth="3.2" 
      strokeLinejoin="round"
    />
  );

  const blush = unlocked && (
    <>
      <circle cx="33" cy="54" r="4" fill="#FFA5A5" opacity="0.8" />
      <circle cx="77" cy="54" r="4" fill="#FFA5A5" opacity="0.8" />
    </>
  );

  const eyes = (
    <>
      <path d="M 36 50 Q 41 45 46 50" stroke="#4E3629" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M 64 50 Q 69 45 74 50" stroke="#4E3629" strokeWidth="2.8" strokeLinecap="round" fill="none" />
    </>
  );

  const smileMouth = (
    <path d="M 51 56 Q 55 60 59 56" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  );

  const toastPatch = unlocked && (
    <path 
      d="M 62 33 
         C 67 29, 78 33, 79 40
         C 76 42, 65 42, 62 33 Z" 
      fill="#F3D5B5" 
      opacity="0.8"
    />
  );

  // Render based on achievement ID
  switch (id) {
    case "water_1": // 水润小年糕 (2 days)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Water Drop Cup in background */}
          <path d="M 15 45 C 15 15, 85 15, 85 45 C 85 75, 50 95, 50 95 C 50 95, 15 75, 15 45 Z" fill={unlocked ? "rgba(130, 178, 206, 0.25)" : "rgba(226, 232, 240, 0.3)"} stroke={unlocked ? "#82B2CE" : "#94A3B8"} strokeWidth="2" strokeDasharray={unlocked ? "" : "3 3"} />
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {smileMouth}
          {unlocked ? (
            <circle cx="55" cy="70" r="5" fill="#82B2CE" opacity="0.9" />
          ) : (
            <circle cx="55" cy="70" r="5" fill="#94A3B8" opacity="0.5" />
          )}
        </svg>
      );
    case "water_2": // 水桶大年糕 (5 days)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {unlocked ? (
            <rect x="15" y="60" width="70" height="30" rx="6" fill="#D3A27F" stroke="#4E3629" strokeWidth="2.8" />
          ) : (
            <rect x="15" y="60" width="70" height="30" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.8" />
          )}
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {/* Straw mouth */}
          <line x1="55" y1="56" x2="48" y2="64" stroke={unlocked ? "#E89F3E" : "#94A3B8"} strokeWidth="4" strokeLinecap="round" />
          {unlocked && (
            <path d="M 22 75 L 78 75" stroke="#4E3629" strokeWidth="1.5" />
          )}
        </svg>
      );
    case "water_3": // 波塞冬年糕 (10 days)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Waves */}
          <path d="M 10 75 Q 30 65 50 75 T 90 75" fill="none" stroke={unlocked ? "#82B2CE" : "#94A3B8"} strokeWidth="3" />
          {nianGaoBody}
          {toastPatch}
          {blush}
          {/* Cool sunglasses for Neptune */}
          {unlocked ? (
            <>
              <rect x="30" y="44" width="18" height="10" rx="3" fill="#1E293B" />
              <rect x="52" y="44" width="18" height="10" rx="3" fill="#1E293B" />
              <line x1="48" y1="49" x2="52" y2="49" stroke="#1E293B" strokeWidth="3" />
            </>
          ) : (
            eyes
          )}
          {smileMouth}
          {/* Gold Trident */}
          <path d="M 82 25 L 82 85 M 76 33 L 88 33 M 76 25 L 76 33 M 88 25 L 88 33" stroke={unlocked ? "#F59E0B" : "#94A3B8"} strokeWidth="3.2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "checkin_1": // 萌芽小年糕 (3 days)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {smileMouth}
          {/* Clover Sprout on head */}
          <path d="M 53 30 Q 53 18 53 14" stroke={unlocked ? "#10B981" : "#94A3B8"} strokeWidth="3" strokeLinecap="round" fill="none" />
          {unlocked ? (
            <>
              <path d="M 53 14 Q 45 10 53 14 Q 61 10 53 14" fill="#10B981" />
              <circle cx="53" cy="14" r="1.5" fill="#34D399" />
            </>
          ) : (
            <circle cx="53" cy="14" r="2.5" fill="#94A3B8" />
          )}
        </svg>
      );
    case "checkin_2": // 闪耀银勋章 (7 days)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Silver Wing patterns */}
          <path d="M 10 50 Q 20 40 25 50 T 15 65 Z" fill={unlocked ? "#E2E8F0" : "#F1F5F9"} stroke="#4E3629" strokeWidth="2" />
          <path d="M 90 50 Q 80 40 75 50 T 85 65 Z" fill={unlocked ? "#E2E8F0" : "#F1F5F9"} stroke="#4E3629" strokeWidth="2" />
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {smileMouth}
          {/* Silver medal star on belly */}
          <polygon points="53,58 55,64 61,64 56,68 58,74 53,70 48,74 50,68 45,64 51,64" fill={unlocked ? "#94A3B8" : "#CBD5E1"} stroke="#4E3629" strokeWidth="1.5" />
        </svg>
      );
    case "checkin_3": // 至尊金皇冠 (15 days)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Glowing Halo */}
          <circle cx="53" cy="50" r="38" fill="none" stroke={unlocked ? "#F59E0B" : "#E2E8F0"} strokeWidth="2" strokeDasharray="6 6" style={{ transformOrigin: "53px 50px" }} />
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {smileMouth}
          {/* Royal Gold Crown */}
          <path d="M 38 31 L 43 18 L 53 25 L 63 18 L 68 31 Z" fill={unlocked ? "#FBBF24" : "#94A3B8"} stroke="#4E3629" strokeWidth="2.5" />
          {unlocked && (
            <>
              <circle cx="43" cy="18" r="2.5" fill="#EF4444" />
              <circle cx="53" cy="25" r="2.5" fill="#3B82F6" />
              <circle cx="63" cy="18" r="2.5" fill="#EF4444" />
            </>
          )}
        </svg>
      );
    case "gum_1": // 洁白牙齿卫士 (3 photos)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {nianGaoBody}
          {toastPatch}
          {blush}
          {/* Extremely wide funny teeth smile */}
          {unlocked ? (
            <path d="M 40 50 Q 53 58 66 50 Z" fill="#FFFFFF" stroke="#4E3629" strokeWidth="2.5" />
          ) : (
            smileMouth
          )}
          {eyes}
          {/* Giant toothbrush */}
          <path d="M 12 70 L 12 35 M 8 35 L 16 35 L 16 45 L 8 45 Z" fill={unlocked ? "#3B82F6" : "#94A3B8"} stroke="#4E3629" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "gum_2": // 黄金盾牌守护者 (7 photos)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {smileMouth}
          {/* Golden Shield in front */}
          <path d="M 68 55 C 68 55, 88 55, 88 65 C 88 78, 68 88, 68 88 C 68 88, 48 78, 48 65 C 48 55, 68 55, 68 55 Z" fill={unlocked ? "#F59E0B" : "#CBD5E1"} stroke="#4E3629" strokeWidth="2.5" />
          {unlocked && (
            <path d="M 68 60 L 68 82 M 56 68 L 80 68" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      );
    case "meal_1": // 见习小厨神 (5 meals)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {nianGaoBody}
          {toastPatch}
          {blush}
          {eyes}
          {smileMouth}
          {/* Fluffy white chef hat */}
          <path d="M 33 34 C 28 34, 25 24, 35 20 C 40 10, 60 10, 65 20 C 75 24, 72 34, 67 34 Z" fill={unlocked ? "#FFFFFF" : "#E2E8F0"} stroke="#4E3629" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="36" y="29" width="28" height="6" fill={unlocked ? "#F3F4F6" : "#CBD5E1"} stroke="#4E3629" strokeWidth="2" />
        </svg>
      );
    case "exercise_1": // 元气铁人 (3 exercises)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Red sweatband */}
          {nianGaoBody}
          <rect x="33" y="32" width="36" height="7" rx="2" fill={unlocked ? "#EF4444" : "#94A3B8"} stroke="#4E3629" strokeWidth="2" />
          {toastPatch}
          {blush}
          {/* Determined eyes */}
          <path d="M 34 49 L 42 51 M 64 51 L 72 49" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
          {smileMouth}
          {/* Tiny barbell at bottom */}
          <path d="M 20 85 L 80 85" stroke="#4E3629" strokeWidth="3" />
          <rect x="12" y="78" width="8" height="14" rx="2" fill={unlocked ? "#475569" : "#94A3B8"} stroke="#4E3629" strokeWidth="2" />
          <rect x="80" y="78" width="8" height="14" rx="2" fill={unlocked ? "#475569" : "#94A3B8"} stroke="#4E3629" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TodayScreen({
  dateStr,
  dayLog,
  settings,
  hairLast,
  gumPhoto,
  recentWeights,
  onUpdateWeight,
  onAddBeverage,
  onDeleteBeverage,
  onAddWater,
  onDeleteWaterLog,
  onLogHairWash,
  onNavigateToGum,
  onSelectDate,
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}: TodayScreenProps) {
  // Calendar states
  const [viewYear, setViewYear] = useState<number>(() => {
    const [y] = dateStr.split("-").map(Number);
    return y || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const [, m] = dateStr.split("-").map(Number);
    return (m ? m - 1 : new Date().getMonth());
  });

  // Keep calendar month in sync with global date selection
  useEffect(() => {
    if (dateStr) {
      const [y, m] = dateStr.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [dateStr]);

  // Load recorded dates indicators
  const [recordedDates, setRecordedDates] = useState<Record<string, {
    hasWater?: boolean;
    hasFood?: boolean;
    hasExercise?: boolean;
    hasWeight?: boolean;
    hasHairWash?: boolean;
    hasGumPhoto?: boolean;
    hasBeverage?: boolean;
  }>>({});

  useEffect(() => {
    const dates: Record<string, {
      hasWater?: boolean;
      hasFood?: boolean;
      hasExercise?: boolean;
      hasWeight?: boolean;
      hasHairWash?: boolean;
      hasGumPhoto?: boolean;
      hasBeverage?: boolean;
    }> = {};

    // 1. Scan localStorage daylogs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dt_day:")) {
        const dStr = key.substring("dt_day:".length);
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val) as DayLog;
            const record: any = {};
            let hasAny = false;
            if (parsed.waterMl && parsed.waterMl > 0) {
              record.hasWater = true;
              hasAny = true;
            }
            if (parsed.food && parsed.food.length > 0) {
              record.hasFood = true;
              hasAny = true;
            }
            if (parsed.exercise && parsed.exercise.length > 0) {
              record.hasExercise = true;
              hasAny = true;
            }
            if (parsed.weightKg && parsed.weightKg > 0) {
              record.hasWeight = true;
              hasAny = true;
            }
            if (parsed.beverages && parsed.beverages.length > 0) {
              record.hasBeverage = true;
              hasAny = true;
            }
            if (hasAny) {
              dates[dStr] = { ...dates[dStr], ...record };
            }
          }
        } catch (e) {
          console.error("Error parsing local storage day log:", e);
        }
      }
    }

    // 2. Scan gum photo index
    try {
      const rawGumIndex = localStorage.getItem("dt_gum-index");
      if (rawGumIndex) {
        const parsedGum = JSON.parse(rawGumIndex) as string[];
        if (Array.isArray(parsedGum)) {
          parsedGum.forEach((dStr) => {
            dates[dStr] = { ...dates[dStr], hasGumPhoto: true };
          });
        }
      }
    } catch (e) {
      console.error("Error parsing gum index:", e);
    }

    // 3. Mark hair wash day
    if (hairLast) {
      dates[hairLast] = { ...dates[hairLast], hasHairWash: true };
    }

    // 4. Mark weight dates from recentWeights too
    if (recentWeights && recentWeights.length > 0) {
      recentWeights.forEach((item) => {
        dates[item.date] = { ...dates[item.date], hasWeight: true };
      });
    }

    setRecordedDates(dates);
  }, [dateStr, dayLog, hairLast, recentWeights]);

  // Generate monthly grid cells
  const getLocalDateStr = (date: Date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const generateCalendarCells = () => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Previous month trailing
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dateStr: dStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dStr === getLocalDateStr(),
        isSelected: dStr === dateStr,
      });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const m = viewMonth + 1;
      const dStr = `${viewYear}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        dateStr: dStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dStr === getLocalDateStr(),
        isSelected: dStr === dateStr,
      });
    }

    // Next month leading
    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let i = 1; i <= remaining; i++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dStr = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        dateStr: dStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dStr === getLocalDateStr(),
        isSelected: dStr === dateStr,
      });
    }

    return cells;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const calendarCells = generateCalendarCells();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // --- ACHIEVEMENTS STATISTICS CALCULATION ---
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const achievementsStats = useMemo(() => {
    const checkedDates = new Set<string>();
    const waterDates = new Set<string>();
    let totalMealsCount = 0;
    let totalExercisesCount = 0;

    // Scan localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dt_day:")) {
        const dStr = key.substring("dt_day:".length);
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val) as DayLog;
            let hasCheckIn = false;
            if (parsed.waterMl && parsed.waterMl > 0) {
              waterDates.add(dStr);
              hasCheckIn = true;
            }
            if (parsed.food && parsed.food.length > 0) {
              totalMealsCount += parsed.food.length;
              hasCheckIn = true;
            }
            if (parsed.exercise && parsed.exercise.length > 0) {
              totalExercisesCount += parsed.exercise.length;
              hasCheckIn = true;
            }
            if (parsed.weightKg && parsed.weightKg > 0) {
              hasCheckIn = true;
            }
            if (hasCheckIn) {
              checkedDates.add(dStr);
            }
          }
        } catch (e) {
          console.error("Error parsing local storage day log for achievements:", e);
        }
      }
    }

    // Scan gum photos
    try {
      const rawGumIndex = localStorage.getItem("dt_gum-index");
      if (rawGumIndex) {
        const parsedGum = JSON.parse(rawGumIndex) as string[];
        if (Array.isArray(parsedGum)) {
          parsedGum.forEach((dStr) => {
            checkedDates.add(dStr);
          });
        }
      }
    } catch (e) {
      console.error("Error parsing gum index for achievements:", e);
    }

    // Hair wash last
    if (hairLast) {
      checkedDates.add(hairLast);
    }

    // Helper to calculate longest consecutive streak
    const getLongestStreak = (dateSet: Set<string>): number => {
      if (dateSet.size === 0) return 0;
      const sorted = Array.from(dateSet).sort();
      let maxStreak = 1;
      let currentStreak = 1;

      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] + "T00:00:00");
        const curr = new Date(sorted[i] + "T00:00:00");
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      return maxStreak;
    };

    // Helper to calculate current consecutive streak up to current date
    const getCurrentStreak = (dateSet: Set<string>): number => {
      if (dateSet.size === 0) return 0;
      const todayStr = getLocalDateStr(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateStr(yesterday);

      if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
        return 0; // Streak is broken
      }

      const sorted = Array.from(dateSet).sort();
      let currentStreak = 1;
      let startIdx = sorted.length - 1;
      
      // If today isn't checked but yesterday is, start from yesterday
      if (!dateSet.has(todayStr) && dateSet.has(yesterdayStr)) {
        startIdx = sorted.indexOf(yesterdayStr);
      }

      for (let i = startIdx; i > 0; i--) {
        const curr = new Date(sorted[i] + "T00:00:00");
        const prev = new Date(sorted[i - 1] + "T00:00:00");
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      return currentStreak;
    };

    const longestCheckInStreak = getLongestStreak(checkedDates);
    const activeCheckInStreak = getCurrentStreak(checkedDates);
    const maxCheckIn = Math.max(longestCheckInStreak, activeCheckInStreak);

    const longestWaterStreak = getLongestStreak(waterDates);
    const activeWaterStreak = getCurrentStreak(waterDates);
    const maxWater = Math.max(longestWaterStreak, activeWaterStreak);

    // Gum Photos count
    let gumCount = 0;
    try {
      const indexStr = localStorage.getItem("dt_gum-index");
      if (indexStr) {
        const parsed = JSON.parse(indexStr);
        if (Array.isArray(parsed)) gumCount = parsed.length;
      }
    } catch (e) {}

    return {
      maxCheckIn,
      maxWater,
      gumCount,
      mealCount: totalMealsCount,
      exerciseCount: totalExercisesCount,
    };
  }, [dayLog, hairLast, dateStr]);

  // Helper to calculate badge status and percentage
  const getBadgeProgress = (badge: Badge) => {
    let current = 0;
    if (badge.category === "water") {
      current = achievementsStats.maxWater;
    } else if (badge.category === "checkin") {
      current = achievementsStats.maxCheckIn;
    } else if (badge.category === "gum") {
      current = achievementsStats.gumCount;
    } else if (badge.category === "meal") {
      current = achievementsStats.mealCount;
    } else if (badge.category === "exercise") {
      current = achievementsStats.exerciseCount;
    }
    const percent = Math.min(100, Math.round((current / badge.target) * 100));
    return { current, target: badge.target, percent, unlocked: current >= badge.target };
  };

  // Calculate unlocked count
  const unlockedBadgesCount = BADGES_CATALOG.filter(b => getBadgeProgress(b).unlocked).length;

  // Calorie calculations
  const eaten = dayLog.food.reduce((sum, f) => sum + f.cal, 0);
  const burned = dayLog.exercise.reduce((sum, e) => sum + e.cal, 0);
  const net = eaten - burned;
  const remaining = settings.calorieBudget - net;
  const overBudget = remaining < 0;

  const caloriePercent = Math.min(100, Math.max(0, (net / settings.calorieBudget) * 100));
  const waterPercent = Math.min(100, Math.round((dayLog.waterMl / settings.waterGoalMl) * 100));

  // Weight Log state
  const [weightInput, setWeightInput] = useState<string>("");
  const [isWeightEditing, setIsWeightEditing] = useState<boolean>(false);
  const [showWeightChart, setShowWeightChart] = useState<boolean>(false);

  // Sync weight from current log or settings fallback
  useEffect(() => {
    if (dayLog.weightKg) {
      setWeightInput(String(dayLog.weightKg));
    } else {
      setWeightInput("");
    }
  }, [dayLog.weightKg, dateStr]);

  // Beverage Form State
  const [showBevForm, setShowBevForm] = useState<boolean>(false);
  const [bevName, setBevName] = useState<string>("");
  const [bevMl, setBevMl] = useState<number>(350);
  const [bevCal, setBevCal] = useState<number>(0);
  const [bevSugar, setBevSugar] = useState<string>("半糖");

  // Todo form state
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<"appointment" | "exam" | "general">("general");
  const [newTodoDate, setNewTodoDate] = useState(dateStr);
  const [newTodoTime, setNewTodoTime] = useState("");

  useEffect(() => {
    setNewTodoDate(dateStr);
  }, [dateStr]);

  // Weekly summary states
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [weeklySummaryData, setWeeklySummaryData] = useState<{
    startDateLabel: string;
    endDateLabel: string;
    totalCalories: number;
    avgCalories: number;
    loggedFoodDays: number;
    totalWater: number;
    avgWater: number;
    loggedWaterDays: number;
    totalBeverages: number;
    weights: { label: string; value: number | null }[];
    firstWeight: number | null;
    lastWeight: number | null;
    weightChange: number | null;
  } | null>(null);

  // Helper to generate the weekly report
  const handleShowWeeklySummary = () => {
    const current = new Date(dateStr + "T00:00:00");
    const day = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const weekDaysList: string[] = [];
    const weekLabels: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = getLocalDateStr(d);
      weekDaysList.push(dStr);
      
      const daysOfWeek = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      weekLabels.push(daysOfWeek[i]);
    }

    let totalCalories = 0;
    let loggedFoodDays = 0;
    let totalWater = 0;
    let loggedWaterDays = 0;
    let totalBeverages = 0;
    const weights: { label: string; value: number | null }[] = [];
    let firstWeight: number | null = null;
    let lastWeight: number | null = null;

    weekDaysList.forEach((dStr, idx) => {
      // Day log from localstorage
      const key = `dt_day:${dStr}`;
      const raw = localStorage.getItem(key);
      let dayLogParsed: DayLog | null = null;
      if (raw) {
        try {
          dayLogParsed = JSON.parse(raw);
        } catch (e) {}
      }

      // Calories
      if (dayLogParsed?.food && dayLogParsed.food.length > 0) {
        const c = dayLogParsed.food.reduce((sum, f) => sum + f.cal, 0);
        totalCalories += c;
        loggedFoodDays++;
      }

      // Water
      if (dayLogParsed?.waterMl) {
        totalWater += dayLogParsed.waterMl;
        if (dayLogParsed.waterMl > 0) {
          loggedWaterDays++;
        }
      }

      // Beverages
      if (dayLogParsed?.beverages) {
        totalBeverages += dayLogParsed.beverages.length;
      }

      // Weight (either from dayLog or from recentWeights or from local storage key)
      let w: number | null = null;
      if (dayLogParsed?.weightKg) {
        w = dayLogParsed.weightKg;
      } else {
        const found = recentWeights.find(item => item.date === dStr);
        if (found) w = found.weight;
      }

      weights.push({ label: weekLabels[idx], value: w });
      if (w !== null) {
        if (firstWeight === null) firstWeight = w;
        lastWeight = w;
      }
    });

    const avgCalories = loggedFoodDays > 0 ? Math.round(totalCalories / loggedFoodDays) : 0;
    const avgWater = loggedWaterDays > 0 ? Math.round(totalWater / loggedWaterDays) : 0;

    setWeeklySummaryData({
      startDateLabel: weekDaysList[0].substring(5), // MM-DD
      endDateLabel: weekDaysList[6].substring(5), // MM-DD
      totalCalories,
      avgCalories,
      loggedFoodDays,
      totalWater,
      avgWater,
      loggedWaterDays,
      totalBeverages,
      weights,
      firstWeight,
      lastWeight,
      weightChange: (firstWeight !== null && lastWeight !== null) ? Math.round((lastWeight - firstWeight) * 10) / 10 : null
    });
    setShowWeeklySummary(true);
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    onAddTodo(newTodoText.trim(), newTodoCategory, newTodoDate, newTodoTime);
    setNewTodoText("");
    setNewTodoTime("");
  };

  const handleToggleTodo = (id: string) => {
    onToggleTodo(id);
  };

  const handleDeleteTodo = (id: string) => {
    onDeleteTodo(id);
  };

  const handleApplyPreset = (preset: typeof BEV_PRESETS[0]) => {
    setBevName(preset.name);
    setBevMl(preset.ml);
    setBevCal(preset.cal);
    setBevSugar(preset.sugar);
  };

  const handleWeightSave = () => {
    const parsed = parseFloat(weightInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateWeight(parsed);
      setIsWeightEditing(false);
    }
  };

  const adjustWeight = (diff: number) => {
    const base = parseFloat(weightInput) || dayLog.weightKg || settings.weightKg || 55;
    const nextVal = Math.round((base + diff) * 10) / 10;
    setWeightInput(String(nextVal));
    onUpdateWeight(nextVal);
  };

  const handleAddCustomBeverage = () => {
    if (!bevName.trim()) return;
    onAddBeverage({
      desc: bevName.trim(),
      ml: bevMl,
      cal: bevCal,
      sugar: bevSugar
    });
    // Reset Form
    setBevName("");
    setBevMl(350);
    setBevCal(0);
    setBevSugar("半糖");
    setShowBevForm(false);
  };

  let hairDaysText = "还没记录过";
  let hairUrgent = false;
  if (hairLast) {
    const diff = Math.round(
      (new Date(dateStr).getTime() - new Date(hairLast).getTime()) / 86400000
    );
    hairDaysText = diff <= 0 ? "今天洗过了" : `距上次洗头已 ${diff} 天`;
    hairUrgent = diff >= settings.hairWashIntervalDays;
  }

  // Format date display
  const [, m, d] = dateStr.split("-");
  const formattedDate = `${m}月${d}日`;

  // Recharts Pie Chart Data Setup
  const targetMet = dayLog.waterMl >= settings.waterGoalMl;
  const pieData = targetMet
    ? [
        { name: "已饮用", value: settings.waterGoalMl, color: "#82B2CE" },
        { name: "超出目标", value: dayLog.waterMl - settings.waterGoalMl, color: "#E89F3E" },
      ]
    : [
        { name: "已饮用", value: dayLog.waterMl, color: "#82B2CE" },
        { name: "剩余目标", value: Math.max(0, settings.waterGoalMl - dayLog.waterMl), color: "#F1E5D8" },
      ];

  // Weight Line Chart data processing
  const chartData = recentWeights.slice(-7).map(item => {
    const [, itemM, itemD] = item.date.split("-");
    return {
      dateLabel: `${itemM}/${itemD}`,
      "体重(kg)": item.weight
    };
  });

  const beverages = dayLog.beverages || [];
  const totalBevMl = beverages.reduce((sum, b) => sum + b.ml, 0);
  const totalBevCal = beverages.reduce((sum, b) => sum + b.cal, 0);

  // Dynamic mascot state based on day progress
  const getMascotState = () => {
    const exercises = dayLog.exercise || [];
    const foods = dayLog.food || [];
    const water = dayLog.waterMl || 0;

    // 1. Over budget calories
    if (overBudget) {
      return {
        expression: "heavy" as const,
        text: "呀！今天吃的热量稍微超出预算啦～ 没关系，年糕陪你做会儿拉伸，或者明天继续加油！"
      };
    }

    // 2. Completed all todos today
    if (dayTodos.length > 0 && dayTodos.every(t => t.isCompleted)) {
      return {
        expression: "excited" as const,
        text: "哇噻！今日计划和提醒竟然全部完成了！你太棒太有效率了，年糕给你送上满分小红花！🌸✨"
      };
    }

    // 3. Logged exercise today
    if (exercises.length > 0) {
      const totalExCal = exercises.reduce((sum, e) => sum + e.cal, 0);
      return {
        expression: "exercising" as const,
        text: `呼哈呼哈！今天坚持了运动，共消耗了 ${totalExCal} kcal！小年糕在旁边为你加油，感觉我们都变结实了呢！🏋️‍♂️`
      };
    }

    // 4. Low water warning (user logged other things but zero/low water)
    if (water < 200 && (foods.length > 0 || exercises.length > 0 || dayLog.weightKg)) {
      return {
        expression: "worried" as const,
        text: "年糕摸了摸肚子，感觉身上干瘪瘪的……你今天是不是忘记喝白开水啦？快去喝一杯补充水分吧！💧"
      };
    }

    // 5. Drinking beverage
    if (beverages.length > 0) {
      return {
        expression: "drinking" as const,
        text: `吨吨吨... 今天喝了 ${beverages.length} 次饮料（共 ${totalBevMl}ml），摄入热量 ${totalBevCal} kcal！好好喝，但也要记得多喝白开水哦～🥤`
      };
    }

    // 6. Logged food today (eating)
    if (foods.length > 0) {
      return {
        expression: "eating" as const,
        text: `嚼嚼嚼…… 今天的伙食真香！你记录了 ${foods.length} 顿饮食。按时吃饭的小伙伴，年糕最喜欢了！🍙`
      };
    }

    // 7. Reached water goal
    if (water >= settings.waterGoalMl) {
      return {
        expression: "happy" as const,
        text: "太棒了！今日喝水目标达成！感觉整只年糕都变得水灵灵、Q弹饱满，超级健康！"
      };
    }

    // 8. Hair washed today
    if (hairLast && (new Date(dateStr).getTime() - new Date(hairLast).getTime() <= 0)) {
      return {
        expression: "excited" as const,
        text: "哇！今天洗了香喷喷的头发，简直是全宇宙最干净、最清爽的小香香年糕！🌸"
      };
    }

    // 9. Late night mode (22:00 to 05:00)
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
      return {
        expression: "sleeping" as const,
        text: "哈啊～ 已经很晚了，小年糕开始犯困打瞌睡啦…… 快点睡觉吧，熬夜对身体和皮肤都不好哦，晚安！💤"
      };
    }

    return {
      expression: "greeting" as const,
      text: "嗨！我是小年糕！今天也要按时记录、好好吃饭，让年糕陪你见证自律可爱的每一天吧！"
    };
  };

  const dayTodos = todos
    .filter(t => t.dateStr === dateStr)
    .sort((a, b) => {
      if (!a.timeStr && !b.timeStr) return 0;
      if (!a.timeStr) return 1;
      if (!b.timeStr) return -1;
      return a.timeStr.localeCompare(b.timeStr);
    });

  const mascotState = getMascotState();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-8"
      id="screen-today-wrapper"
    >
      {/* Compact Interactive Month Calendar Component */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-3xs space-y-3" id="cozy-calendar-card">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm font-bold text-brand-ink flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-accent" />
            <span>{viewYear}年 {viewMonth + 1}月</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-brand-accent-soft rounded-lg text-brand-ink-soft hover:text-brand-ink transition-all active:scale-90 cursor-pointer"
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const todayStr = getLocalDateStr();
                onSelectDate(todayStr);
              }}
              className="px-2 py-0.5 text-[10px] font-bold bg-brand-accent-soft text-brand-accent hover:bg-brand-accent/20 rounded-md transition-all active:scale-95 cursor-pointer"
            >
              今天
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-brand-accent-soft rounded-lg text-brand-ink-soft hover:text-brand-ink transition-all active:scale-90 cursor-pointer"
              title="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 text-center border-b border-brand-line/40 pb-1.5">
          {weekDays.map((day, idx) => (
            <span
              key={day}
              className={`text-[10px] font-bold font-mono tracking-wider ${
                idx === 0 || idx === 6 ? "text-brand-alert/70" : "text-brand-ink-soft"
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center">
          {calendarCells.map((cell, idx) => {
            const hasRecord = recordedDates[cell.dateStr];
            const hasWater = hasRecord?.hasWater;
            const hasFoodWeightEx = hasRecord?.hasFood || hasRecord?.hasWeight || hasRecord?.hasExercise;
            const hasHairWash = hasRecord?.hasHairWash;
            const hasGumPhoto = hasRecord?.hasGumPhoto;
            const hasBeverage = hasRecord?.hasBeverage;

            // Get todos for this specific cell date
            const cellTodos = todos.filter(t => t.dateStr === cell.dateStr);
            const hasAppointment = cellTodos.some(t => t.category === "appointment");
            const hasExam = cellTodos.some(t => t.category === "exam");
            const hasGeneralTodo = cellTodos.some(t => t.category === "general");

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                onClick={() => {
                  onSelectDate(cell.dateStr);
                }}
                className={`relative py-1 flex flex-col items-center justify-center rounded-xl transition-all focus:outline-hidden cursor-pointer ${
                  !cell.isCurrentMonth
                    ? "opacity-30 hover:opacity-60"
                    : "opacity-100"
                } ${
                  cell.isSelected
                    ? "bg-brand-accent text-white font-bold shadow-xs active:scale-95"
                    : cell.isToday
                    ? "border border-brand-accent/50 text-brand-accent hover:bg-brand-accent-soft font-semibold"
                    : "text-brand-ink hover:bg-brand-accent-soft/50 font-medium"
                }`}
                style={{ minHeight: "40px" }}
              >
                {/* Beverage absolute icon */}
                {hasBeverage && (
                  <span className="absolute top-0.5 right-0.5 text-[8px] leading-none z-10 pointer-events-none" title="喝了饮料">
                    🥤
                  </span>
                )}

                {/* Day number */}
                <span className="text-xs font-mono leading-none z-10 mt-0.5">{cell.dayNum}</span>

                {/* Micro indicators container */}
                <div className="h-1.5 flex flex-wrap justify-center gap-0.5 mt-0.5 min-h-[6px] w-full max-w-[90%]">
                  {hasWater && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-[#82B2CE]"
                      }`}
                    />
                  )}
                  {hasFoodWeightEx && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-[#E89F3E]"
                      }`}
                    />
                  )}
                  {hasHairWash && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-[#EC4899]"
                      }`}
                    />
                  )}
                  {hasGumPhoto && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-[#D36350]"
                      }`}
                    />
                  )}
                  {hasAppointment && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-purple-500"
                      }`}
                    />
                  )}
                  {hasExam && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-indigo-500"
                      }`}
                    />
                  )}
                  {hasGeneralTodo && (
                    <span 
                      className={`w-1 h-1 rounded-full ${
                        cell.isSelected ? "bg-white" : "bg-emerald-500"
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center justify-center gap-x-2.5 gap-y-1.5 pt-1.5 border-t border-brand-line/40 text-[9px] font-medium text-brand-ink-soft flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#82B2CE]" />
            <span>饮水</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E89F3E]" />
            <span>饮食/运动/体重</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
            <span>洗头</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D36350]" />
            <span>牙龈照片</span>
          </span>
          <span className="flex items-center gap-0.5">
            <span>🥤</span>
            <span>饮料</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>约会/预约</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>考试/重大</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>日常待办</span>
          </span>
        </div>

        {/* Weekly Report Button */}
        <div className="pt-2 border-t border-brand-line/30">
          <button
            onClick={handleShowWeeklySummary}
            className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/95 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer border border-brand-accent/10"
          >
            ✨ 生成本周健康总结报告 📊
          </button>
        </div>
      </div>

      {/* Cozy Nian Gao Mascot Speech Bubble Banner */}
      <Mascot expression={mascotState.expression} text={mascotState.text} />

      {/* Today's To-Dos and Important Reminders Card */}
      <div id="todos-card" className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-3xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-1.5 font-semibold">
            <CheckCircle className="w-4 h-4 text-brand-accent shrink-0" />
            <span>{formattedDate} · 备忘待办与提醒</span>
          </div>
          <span className="text-[10px] bg-brand-accent-soft text-brand-accent px-2 py-0.5 rounded-full font-medium">
            共 {dayTodos.length} 项
          </span>
        </div>

        {/* Form to add a todo */}
        <div className="space-y-2.5 bg-brand-bg/50 p-2.5 rounded-xl border border-brand-line/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTodo();
              }}
              placeholder="添加重要事情（如：final考试、约会等）"
              className="flex-1 bg-brand-surface border border-brand-line rounded-lg px-2.5 py-1.5 text-xs text-brand-ink placeholder:text-brand-ink-soft/60 focus:outline-hidden focus:border-brand-accent transition-all"
            />
            <button
              onClick={handleAddTodo}
              className="bg-brand-accent hover:bg-brand-accent/90 text-white font-bold p-2 rounded-lg transition-all active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
              title="添加提醒"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Category selection and DateTime Pickers */}
          <div className="flex flex-col gap-2 border-t border-brand-line/30 pt-2.5">
            {/* Category selection pill tabs */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-ink-soft flex-wrap">
              <span>分类标签:</span>
              <button
                onClick={() => setNewTodoCategory("general")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  newTodoCategory === "general"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold"
                    : "bg-brand-surface border-brand-line/60 hover:bg-brand-bg"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>日常待办</span>
              </button>
              <button
                onClick={() => setNewTodoCategory("appointment")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  newTodoCategory === "appointment"
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-600 font-bold"
                    : "bg-brand-surface border-brand-line/60 hover:bg-brand-bg"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>约会/预约</span>
              </button>
              <button
                onClick={() => setNewTodoCategory("exam")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  newTodoCategory === "exam"
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 font-bold"
                    : "bg-brand-surface border-brand-line/60 hover:bg-brand-bg"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>考试/重大</span>
              </button>
            </div>

            {/* Date and Time custom selection */}
            <div className="flex items-center gap-2 text-[10px] font-semibold text-brand-ink-soft">
              <div className="flex items-center gap-1 flex-1">
                <span className="shrink-0">选择日期:</span>
                <input
                  type="date"
                  value={newTodoDate}
                  onChange={(e) => setNewTodoDate(e.target.value)}
                  className="flex-1 min-w-0 bg-brand-surface border border-brand-line rounded-md px-1.5 py-0.5 font-mono text-[10px] text-brand-ink focus:outline-hidden focus:border-brand-accent cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1 flex-1">
                <span className="shrink-0">设定时间:</span>
                <input
                  type="time"
                  value={newTodoTime}
                  onChange={(e) => setNewTodoTime(e.target.value)}
                  className="flex-1 min-w-0 bg-brand-surface border border-brand-line rounded-md px-1.5 py-0.5 font-mono text-[10px] text-brand-ink focus:outline-hidden focus:border-brand-accent cursor-pointer"
                />
                {newTodoTime && (
                  <button
                    onClick={() => setNewTodoTime("")}
                    className="text-[9px] text-brand-alert hover:underline shrink-0 ml-0.5 cursor-pointer"
                    title="清除时间"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Todo list items */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          {dayTodos.length > 0 ? (
            dayTodos.map((todo) => {
              const isGeneral = todo.category === "general";
              const isAppt = todo.category === "appointment";
              const catColor = isGeneral ? "bg-emerald-500" : isAppt ? "bg-purple-500" : "bg-indigo-500";
              const catLabel = isGeneral ? "待办" : isAppt ? "预约" : "重要";
              const catBadgeBg = isGeneral ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : isAppt ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";

              return (
                <div
                  key={todo.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-brand-bg/30 border border-brand-line/40 hover:border-brand-line transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        todo.isCompleted
                          ? "bg-brand-accent border-brand-accent text-white"
                          : "border-brand-line hover:border-brand-accent bg-brand-surface"
                      }`}
                    >
                      {todo.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    {/* Category dot */}
                    <span className={`w-1.5 h-1.5 rounded-full ${catColor} shrink-0`} title={catLabel} />

                    {/* Optional custom timeStr display */}
                    {todo.timeStr && (
                      <span className="text-[10px] font-mono font-bold bg-brand-accent-soft text-brand-accent px-1 py-0.2 rounded-md shrink-0 border border-brand-accent/15" title="设定时间">
                        ⏰ {todo.timeStr}
                      </span>
                    )}

                    {/* Text */}
                    <span
                      className={`text-xs text-brand-ink truncate leading-tight flex-1 ${
                        todo.isCompleted ? "line-through text-brand-ink-soft/50" : ""
                      }`}
                    >
                      {todo.text}
                    </span>

                    {/* Category Label badge */}
                    <span className={`text-[9px] px-1 py-0.2 rounded-md border font-semibold shrink-0 ${catBadgeBg}`}>
                      {catLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-brand-ink-soft hover:text-brand-alert p-1 rounded-md hover:bg-brand-bg transition-colors shrink-0 cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 border border-dashed border-brand-line/60 rounded-xl">
              <span className="text-xl">🍵</span>
              <p className="text-[11px] text-brand-ink-soft mt-1">
                今天没有任何提醒或待办哦～
              </p>
              <p className="text-[9px] text-brand-ink-soft/60 mt-0.5">
                在上方添加你的考试、预约或待办吧，日历上会亮起小彩色圆点噢！
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nian Gao Achievements Hall Card */}
      <div id="achievements-card" className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-3xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-1.5 font-semibold">
            <Award className="w-4 h-4 text-brand-accent shrink-0 animate-pulse" />
            <span>年糕成就勋章殿堂</span>
          </div>
          <div className="flex items-center gap-1 bg-brand-accent-soft/80 text-brand-accent px-2 py-0.5 rounded-lg text-[10px] font-bold font-serif border border-brand-accent/15">
            <span>已解锁:</span>
            <span>{unlockedBadgesCount}</span>
            <span>/</span>
            <span>{BADGES_CATALOG.length}</span>
            <span className="text-[10px]">🏆</span>
          </div>
        </div>

        {/* Horizontal scrollable row of badges */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-brand-line scrollbar-track-transparent">
          {BADGES_CATALOG.map((badge) => {
            const { current, target, unlocked } = getBadgeProgress(badge);
            return (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="flex flex-col items-center text-center shrink-0 w-16 group cursor-pointer focus:outline-hidden"
              >
                {/* Trophy Svg container */}
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 border transition-all duration-300 relative ${
                    unlocked 
                      ? "bg-gradient-to-b from-brand-accent-soft/30 to-brand-accent-soft/70 border-brand-line shadow-2xs group-hover:scale-105" 
                      : "bg-slate-50 border-slate-200 opacity-50 grayscale group-hover:opacity-75"
                  }`}
                >
                  <TrophySvg id={badge.id} unlocked={unlocked} />
                  
                  {/* Small absolute lock/unlock indicator in corner */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border shadow-3xs ${
                    unlocked ? "bg-brand-accent text-white border-white" : "bg-slate-300 text-slate-500 border-slate-200"
                  }`}>
                    {unlocked ? (
                      <Sparkles className="w-2.5 h-2.5" />
                    ) : (
                      <Lock className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                {/* Badge Name */}
                <span className={`text-[9px] mt-1.5 font-bold truncate w-full ${
                  unlocked ? "text-brand-ink" : "text-brand-ink-soft/70"
                }`}>
                  {badge.name}
                </span>

                {/* Micro progress text */}
                <span className="text-[8px] font-mono font-medium text-brand-ink-soft/60 leading-none mt-0.5">
                  {current}/{target}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Dialog Modal */}
      <AnimatePresence>
        {selectedBadge && (() => {
          const { current, target, percent, unlocked } = getBadgeProgress(selectedBadge);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 backdrop-blur-xs p-4"
              onClick={() => setSelectedBadge(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 10, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-brand-surface border border-brand-line rounded-3xl max-w-xs w-full p-5 shadow-2xl relative space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-accent-soft text-brand-ink-soft hover:text-brand-ink transition-colors cursor-pointer"
                  title="关闭"
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                {/* Header / Category tag */}
                <div className="flex flex-col items-center text-center space-y-2 pt-1">
                  <span className={`px-2 py-0.5 text-[8px] tracking-wider uppercase font-bold rounded-full border ${
                    unlocked 
                      ? "bg-brand-accent-soft text-brand-accent border-brand-accent/25" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {selectedBadge.category === "water" && "💧 饮水成就"}
                    {selectedBadge.category === "checkin" && "📅 打卡成就"}
                    {selectedBadge.category === "gum" && "🦷 牙龈记录"}
                    {selectedBadge.category === "meal" && "🍳 饮食记录"}
                    {selectedBadge.category === "exercise" && "🏋️ 运动记录"}
                  </span>
                  
                  {/* Huge Trophy Icon */}
                  <div className={`w-28 h-28 flex items-center justify-center p-2 rounded-full relative ${
                    unlocked ? "bg-gradient-to-b from-brand-accent-soft/20 to-brand-accent-soft/50" : "bg-slate-50 opacity-65"
                  }`}>
                    <TrophySvg id={selectedBadge.id} unlocked={unlocked} />
                    
                    {unlocked && (
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="absolute inset-0 bg-brand-accent-soft/20 rounded-full -z-10"
                      />
                    )}
                  </div>

                  <h3 className="font-serif text-base font-bold text-brand-ink leading-tight">
                    {selectedBadge.name}
                  </h3>
                  
                  <p className="text-[11px] text-brand-ink-soft">
                    解锁要求: {selectedBadge.description}
                  </p>
                </div>

                {/* Progress bar section */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-semibold text-brand-ink-soft leading-none">
                    <span>当前进度</span>
                    <span>{current} / {target} {selectedBadge.category === "water" || selectedBadge.category === "checkin" || selectedBadge.category === "gum" ? "天" : "次"}</span>
                  </div>
                  <div className="w-full bg-brand-bg border border-brand-line/60 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        unlocked ? "bg-brand-accent" : "bg-slate-400"
                      }`}
                    />
                  </div>
                </div>

                {/* Speech Bubble / Celebration Dialog from Mascot */}
                <div className={`p-3 rounded-2xl relative border text-xs leading-relaxed ${
                  unlocked 
                    ? "bg-brand-accent-soft/30 border-brand-line/50 text-brand-ink" 
                    : "bg-slate-50/50 border-slate-200/60 text-slate-500 italic text-center"
                }`}>
                  {unlocked ? (
                    <p className="font-medium text-[11px]">
                      {selectedBadge.celebrateText}
                    </p>
                  ) : (
                    <p className="text-[10px] font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>继续记录，陪着小年糕解锁这个勋章吧！加油～</span>
                    </p>
                  )}
                  {/* Speech bubble triangle pointer */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 border-l border-b rotate-45 -z-10 ${
                    unlocked ? "bg-brand-accent-soft/30 border-brand-line/50" : "bg-slate-50 border-slate-200"
                  }`} style={{ top: "-5px" }} />
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Calories Budget Card */}
      <div id="calorie-card" className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs">
        <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-2 mb-2 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
          <span>热量余额</span>
        </div>
        
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-serif text-4xl font-bold text-brand-ink tracking-tight">
            {remaining}
          </span>
          <span className="text-sm font-medium text-brand-ink-soft ml-1">
            kcal 还能吃
          </span>
        </div>

        <div className="flex justify-between items-center text-xs text-brand-ink-soft mt-3 pt-3 border-t border-brand-line/50 font-mono">
          <span>已摄入 {eaten} kcal</span>
          <span>运动消耗 {burned} kcal</span>
        </div>

        <div className="h-2.5 bg-brand-accent-soft rounded-full mt-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${caloriePercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full transition-colors duration-300 ${
              overBudget ? "bg-brand-alert" : "bg-brand-accent"
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-brand-ink-soft/75 mt-1.5 font-mono">
          <span>0%</span>
          <span>预算: {settings.calorieBudget} kcal</span>
          <span>100%</span>
        </div>
      </div>

      {/* Weight Tracker Card */}
      <div id="weight-card" className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
            <span>今日体重</span>
          </div>
          {chartData.length > 0 && (
            <button
              onClick={() => setShowWeightChart(!showWeightChart)}
              className="text-xs flex items-center gap-1 text-brand-accent hover:underline font-medium"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{showWeightChart ? "收起趋势" : "查看趋势图"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {dayLog.weightKg ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl font-bold text-brand-ink">
                  {dayLog.weightKg}
                </span>
                <span className="text-sm font-semibold text-brand-ink-soft">kg</span>
                <span className="ml-2 text-[10px] bg-brand-accent-soft text-brand-accent font-semibold px-1.5 py-0.5 rounded-sm">
                  今日已录入
                </span>
              </div>
            ) : (
              <div>
                <span className="text-brand-ink-soft text-sm block font-medium">今天还没称重哦</span>
                <span className="text-xs text-brand-ink-soft/70 block mt-0.5">默认值: {settings.weightKg} kg</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick adjust weight buttons */}
            <button
              onClick={() => adjustWeight(-0.5)}
              className="p-1 text-brand-ink-soft hover:text-brand-ink hover:bg-brand-bg rounded-lg transition-all"
              title="-0.5 kg"
            >
              <MinusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => adjustWeight(-0.1)}
              className="px-2 py-1 text-xs border border-brand-line rounded-lg text-brand-ink-soft hover:text-brand-ink hover:bg-brand-bg transition-all"
              title="-0.1 kg"
            >
              -0.1
            </button>

            {isWeightEditing ? (
              <div className="flex items-center gap-1 border border-brand-accent rounded-lg p-0.5 bg-brand-bg">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleWeightSave()}
                  className="w-14 text-xs font-mono font-bold text-center bg-transparent border-none p-1 text-brand-ink focus:outline-hidden"
                  placeholder={String(settings.weightKg)}
                  autoFocus
                />
                <button
                  onClick={handleWeightSave}
                  className="p-1 bg-brand-accent text-brand-surface rounded-md hover:opacity-90"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setWeightInput(String(dayLog.weightKg || settings.weightKg));
                  setIsWeightEditing(true);
                }}
                className="px-3 py-1.5 bg-brand-accent-soft hover:bg-brand-accent/25 text-brand-accent border border-brand-accent/30 rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                {dayLog.weightKg ? "修改" : "记录体重"}
              </button>
            )}

            <button
              onClick={() => adjustWeight(0.1)}
              className="px-2 py-1 text-xs border border-brand-line rounded-lg text-brand-ink-soft hover:text-brand-ink hover:bg-brand-bg transition-all"
              title="+0.1 kg"
            >
              +0.1
            </button>
            <button
              onClick={() => adjustWeight(0.5)}
              className="p-1 text-brand-ink-soft hover:text-brand-ink hover:bg-brand-bg rounded-lg transition-all"
              title="+0.5 kg"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weight trend visualizer */}
        <AnimatePresence>
          {showWeightChart && chartData.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-brand-line/50 pt-3"
            >
              <div className="text-[10px] text-brand-ink-soft mb-2 flex justify-between font-mono">
                <span>最近 {chartData.length} 次称重趋势 (kg)</span>
                <span>目标: 维持健康</span>
              </div>
              <div className="w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 12, left: -25, bottom: 5 }}>
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="#8D7466" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#8D7466" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#F1E5D8", color: "#4E3629", borderRadius: "12px", boxShadow: "0 2px 8px rgba(78, 54, 41, 0.08)" }}
                      labelStyle={{ color: "#8D7466", fontSize: "10px", fontWeight: "bold" }}
                      itemStyle={{ color: "#E89F3E", fontSize: "11px", fontWeight: "bold" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="体重(kg)" 
                      stroke="#E89F3E" 
                      strokeWidth={3} 
                      dot={<CustomDot />}
                      activeDot={<CustomActiveDot />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Beverages Tracker Card */}
      <div id="beverage-card" className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fca5a5]"></span>
            <span>今日饮料</span>
          </div>
          {totalBevMl > 0 && (
            <span className="text-xs font-mono font-medium text-brand-ink-soft bg-brand-bg border border-brand-line px-2 py-0.5 rounded-lg">
              共 {totalBevMl}ml · {totalBevCal} kcal
            </span>
          )}
        </div>

        {/* Beverage Entries List */}
        {beverages.length > 0 ? (
          <div className="divide-y divide-brand-line/40 max-h-48 overflow-y-auto pr-1">
            {beverages.map((bev) => (
              <div key={bev.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-brand-ink truncate">
                      🥤 {bev.desc}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-brand-ink-soft bg-brand-bg px-1.5 py-0.5 border border-brand-line rounded-md shrink-0">
                      {bev.sugar}
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-ink-soft font-mono flex items-center gap-2 mt-0.5">
                    <span>{bev.ml} ml</span>
                    <span>•</span>
                    <span className="text-[#fca5a5]">{bev.cal} kcal</span>
                    <span className="text-brand-ink-soft/40">•</span>
                    <span>{bev.time}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteBeverage(bev.id)}
                  className="p-1.5 text-brand-ink-soft hover:text-brand-alert hover:bg-brand-alert-soft/20 rounded-lg transition-all shrink-0 ml-2"
                  title="删除此项"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs text-brand-ink-soft/75">
              今天还没喝过饮料 🥤，多喝水更健康哦。
            </p>
          </div>
        )}

        {/* Quick presets & action button */}
        <div className="space-y-3">
          {!showBevForm ? (
            <button
              onClick={() => setShowBevForm(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-[#fca5a5]/10 hover:bg-[#fca5a5]/20 text-[#fca5a5] border border-[#fca5a5]/25 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>添加饮料记录</span>
            </button>
          ) : (
            <div className="bg-brand-bg/50 border border-brand-line rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line/60 pb-2">
                <h4 className="text-xs font-bold text-brand-ink">新建饮料记录</h4>
                <button
                  onClick={() => setShowBevForm(false)}
                  className="text-brand-ink-soft hover:text-brand-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Preset Badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-brand-ink-soft tracking-wider">
                  快速模板：
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BEV_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="text-[11px] font-medium bg-brand-surface border border-brand-line hover:border-brand-accent text-brand-ink px-2.5 py-1 rounded-lg transition-all active:scale-95"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-brand-ink-soft uppercase">饮料名称</label>
                  <input
                    type="text"
                    value={bevName}
                    onChange={(e) => setBevName(e.target.value)}
                    placeholder="例如：生椰拿铁、经典奶茶"
                    className="w-full text-xs rounded-lg p-2 border border-brand-line bg-brand-surface"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-ink-soft uppercase">容量 (ml)</label>
                  <input
                    type="number"
                    value={bevMl || ""}
                    onChange={(e) => setBevMl(parseInt(e.target.value) || 0)}
                    className="w-full text-xs rounded-lg p-2 border border-brand-line bg-brand-surface font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-ink-soft uppercase">热量 (kcal)</label>
                  <input
                    type="number"
                    value={bevCal === 0 ? "0" : bevCal || ""}
                    onChange={(e) => setBevCal(parseInt(e.target.value) || 0)}
                    className="w-full text-xs rounded-lg p-2 border border-brand-line bg-brand-surface font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-brand-ink-soft uppercase block">糖分选项</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["无糖", "微糖", "半糖", "全糖"].map((sugarOpt) => (
                      <button
                        key={sugarOpt}
                        type="button"
                        onClick={() => setBevSugar(sugarOpt)}
                        className={`text-[11px] py-1.5 border rounded-lg transition-all ${
                          bevSugar === sugarOpt
                            ? "bg-brand-accent text-brand-surface border-brand-accent font-bold"
                            : "bg-brand-surface text-brand-ink border-brand-line hover:border-brand-ink-soft"
                        }`}
                      >
                        {sugarOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preset capacities */}
              <div className="flex gap-1 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setBevMl(250)}
                  className="text-[10px] font-mono bg-brand-surface border border-brand-line px-1.5 py-0.5 rounded-sm hover:text-brand-ink text-brand-ink-soft"
                >
                  250ml
                </button>
                <button
                  type="button"
                  onClick={() => setBevMl(350)}
                  className="text-[10px] font-mono bg-brand-surface border border-brand-line px-1.5 py-0.5 rounded-sm hover:text-brand-ink text-brand-ink-soft"
                >
                  350ml
                </button>
                <button
                  type="button"
                  onClick={() => setBevMl(500)}
                  className="text-[10px] font-mono bg-brand-surface border border-brand-line px-1.5 py-0.5 rounded-sm hover:text-brand-ink text-brand-ink-soft"
                >
                  500ml
                </button>
                <button
                  type="button"
                  onClick={() => setBevMl(700)}
                  className="text-[10px] font-mono bg-brand-surface border border-brand-line px-1.5 py-0.5 rounded-sm hover:text-brand-ink text-brand-ink-soft"
                >
                  700ml
                </button>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-brand-line/50">
                <button
                  type="button"
                  onClick={() => setShowBevForm(false)}
                  className="px-3 py-1.5 border border-brand-line rounded-lg text-xs font-semibold text-brand-ink-soft hover:bg-brand-bg"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!bevName.trim()}
                  onClick={handleAddCustomBeverage}
                  className="px-3 py-1.5 bg-brand-accent text-brand-surface rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  添加记录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Water Tracker Card */}
      <div id="water-card" className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs">
        <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-2 mb-2 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>喝水进度</span>
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-3xl font-bold text-brand-ink">
                {dayLog.waterMl}
              </span>
              <span className="text-xs font-medium text-brand-ink-soft">
                / {settings.waterGoalMl} ml
              </span>
            </div>
            <p className="text-xs text-brand-ink-soft leading-relaxed mt-1">
              {targetMet 
                ? "目标达成！今日水分非常充足 💧" 
                : `距离今天目标还剩 ${Math.max(0, settings.waterGoalMl - dayLog.waterMl)} ml`}
            </p>
          </div>

          {/* Recharts Pie Chart visualizer */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center bg-brand-bg/40 rounded-xl border border-brand-line p-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={36}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-mono font-bold text-cyan-400">{waterPercent}%</span>
              <span className="text-[7px] text-brand-ink-soft tracking-wider scale-90">饮水</span>
            </div>
          </div>
        </div>

        <div className="h-2 bg-cyan-950/40 rounded-full mt-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${waterPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-cyan-400 rounded-full"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5 mt-4">
          <button
            id="water-100"
            onClick={() => onAddWater(100)}
            className="flex flex-col items-center justify-center py-2 px-1 border border-brand-line/60 rounded-xl hover:bg-cyan-950/20 hover:border-cyan-400 transition-all duration-150 group active:scale-95 cursor-pointer"
          >
            <Droplet className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-brand-ink">+100ml</span>
          </button>
          <button
            id="water-200"
            onClick={() => onAddWater(200)}
            className="flex flex-col items-center justify-center py-2 px-1 border border-brand-line/60 rounded-xl hover:bg-cyan-950/20 hover:border-cyan-400 transition-all duration-150 group active:scale-95 cursor-pointer"
          >
            <Droplet className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-brand-ink">+200ml</span>
          </button>
          <button
            id="water-350"
            onClick={() => onAddWater(350)}
            className="flex flex-col items-center justify-center py-2 px-1 border border-brand-line/60 rounded-xl hover:bg-cyan-950/20 hover:border-cyan-400 transition-all duration-150 group active:scale-95 cursor-pointer"
          >
            <Droplet className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-brand-ink">+350ml</span>
          </button>
          <button
            id="water-600"
            onClick={() => onAddWater(600)}
            className="flex flex-col items-center justify-center py-2 px-1 border border-brand-line/60 rounded-xl hover:bg-cyan-950/20 hover:border-cyan-400 transition-all duration-150 group active:scale-95 cursor-pointer"
          >
            <Droplet className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-brand-ink">+600ml</span>
          </button>
        </div>

        {/* List of today's water entries with cancel button */}
        {dayLog.waterLogs && dayLog.waterLogs.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-brand-line/40 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-brand-ink-soft font-bold">
              <span>今日饮水记录 (可点击 ✕ 撤销相应记录)</span>
              <span>共 {dayLog.waterLogs.length} 次</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-brand-line scrollbar-track-transparent">
              {dayLog.waterLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/15 rounded-md text-[10px] font-mono font-bold text-brand-ink transition-all"
                >
                  <span className="text-cyan-400">💧</span>
                  <span>{log.ml}ml</span>
                  <span className="text-[9px] text-brand-ink-soft/60 font-normal">({log.time})</span>
                  <button
                    onClick={() => onDeleteWaterLog(index)}
                    className="ml-1 p-0.5 text-brand-ink-soft/70 hover:text-brand-alert hover:bg-brand-alert-soft/25 rounded-sm transition-all cursor-pointer"
                    title="撤销此记录"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hair Wash Card */}
      <div id="hair-card" className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs">
        <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-2 mb-2 font-medium">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hairUrgent ? "bg-brand-alert" : "bg-brand-accent"
            }`}
          />
          <span>头发清洁</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="font-semibold text-lg text-brand-ink">
              {hairDaysText}
            </span>
            {hairUrgent && (
              <p className="text-[11px] text-brand-alert font-medium mt-0.5">
                超过设定的洗头间隔，该洗头啦！
              </p>
            )}
          </div>
          <button
            id="hair-wash-btn"
            onClick={onLogHairWash}
            className="flex items-center gap-1 bg-brand-accent hover:bg-brand-accent/90 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>今天洗了</span>
          </button>
        </div>
      </div>

      {/* Gum Photo Card */}
      <div id="gum-card" className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs">
        <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-2 mb-2 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
          <span>牙龈照片追踪</span>
        </div>

        {gumPhoto ? (
          <div className="flex gap-4 items-center mt-2 bg-brand-accent-soft/30 p-2.5 rounded-xl border border-brand-line/40">
            <img
              src={gumPhoto.image}
              alt="Today's Gum"
              className="w-14 h-14 rounded-lg object-cover border border-brand-line shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <span className="flex items-center gap-1 text-xs text-brand-accent font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>今天已拍摄照片</span>
              </span>
              <p className="text-xs text-brand-ink-soft truncate mt-1 italic">
                {gumPhoto.note ? `“${gumPhoto.note}”` : "无备注"}
              </p>
            </div>
            <button
              onClick={onNavigateToGum}
              className="text-xs font-semibold text-brand-accent hover:underline shrink-0"
            >
              查看
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-xs text-brand-ink-soft leading-relaxed mb-3">
              拍摄牙龈照片，每日追踪比对牙龈微小变化（如出血、红肿消退）。
            </p>
            <button
              id="go-gum-btn"
              onClick={onNavigateToGum}
              className="w-full flex items-center justify-center gap-1.5 bg-brand-accent-soft hover:bg-brand-accent-soft/80 text-brand-accent font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>还没拍照 · 去拍照</span>
            </button>
          </div>
        )}
      </div>

      {/* Weekly Health Summary Modal Dialog */}
      <AnimatePresence>
        {showWeeklySummary && weeklySummaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeeklySummary(false)}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-brand-surface border-2 border-[#EADAC9] rounded-3xl shadow-xl p-5 overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Cute top decoration banner */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-accent via-amber-400 to-brand-accent/80" />

              {/* Header */}
              <div className="text-center pb-3 border-b border-brand-line/60">
                <span className="text-2xl">📊</span>
                <h3 className="font-serif text-lg font-bold text-brand-ink mt-1">小年糕的本周健康总结报告</h3>
                <p className="font-mono text-[10px] text-brand-ink-soft bg-brand-accent-soft px-3 py-1.5 rounded-full inline-block mt-1 font-semibold">
                  统计周期: {weeklySummaryData.startDateLabel} ~ {weeklySummaryData.endDateLabel}
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-0.5 select-none">
                {/* 1. Calories Card */}
                <div className="p-3 bg-brand-bg/40 rounded-2xl border border-brand-line/50 space-y-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-brand-ink-soft">
                    <span className="flex items-center gap-1">⚡️ 卡路里日均摄入</span>
                    <span className="font-mono text-brand-ink">{weeklySummaryData.loggedFoodDays} 天有记录</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-serif text-2xl font-bold text-brand-ink">{weeklySummaryData.avgCalories}</span>
                    <span className="text-xs text-brand-ink-soft">kcal / 日均</span>
                  </div>
                  <div className="text-[11px] text-brand-ink-soft leading-relaxed flex items-center gap-1 bg-white/50 p-1.5 rounded-lg border border-brand-line/30 mt-1">
                    {weeklySummaryData.avgCalories <= settings.calorieBudget ? (
                      <>
                        <span className="text-xs">🍏</span>
                        <span>日均摄入控制在预算内（预算 {settings.calorieBudget} kcal），非常健康！</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs">🍪</span>
                        <span>日均稍微超出预算（预算 {settings.calorieBudget} kcal），下周适当控制或多动动噢～</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Water Card */}
                <div className="p-3 bg-brand-bg/40 rounded-2xl border border-brand-line/50 space-y-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-brand-ink-soft">
                    <span className="flex items-center gap-1">💧 本周总饮水量</span>
                    <span className="font-mono text-brand-ink">{weeklySummaryData.loggedWaterDays} 天喝过水</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-serif text-2xl font-bold text-cyan-500">{weeklySummaryData.totalWater}</span>
                    <span className="text-xs text-brand-ink-soft">ml (日均 {weeklySummaryData.avgWater} ml)</span>
                  </div>
                  <div className="text-[11px] text-brand-ink-soft leading-relaxed flex items-center gap-1 bg-white/50 p-1.5 rounded-lg border border-brand-line/30 mt-1">
                    {weeklySummaryData.avgWater >= settings.waterGoalMl ? (
                      <>
                        <span className="text-xs">🌊</span>
                        <span>日均饮水超标达成！整只年糕都水水润润的～</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs">🥛</span>
                        <span>日均比设定的目标（{settings.waterGoalMl}ml）少了一些，记得多灌水哦！</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Weight Card */}
                <div className="p-3 bg-brand-bg/40 rounded-2xl border border-brand-line/50 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-brand-ink-soft flex items-center gap-1">
                    <span>⚖️ 体重趋势分析</span>
                  </div>
                  {weeklySummaryData.firstWeight !== null && weeklySummaryData.lastWeight !== null ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-brand-ink font-semibold">
                        <span>首称: {weeklySummaryData.firstWeight} kg</span>
                        <span>尾称: {weeklySummaryData.lastWeight} kg</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/50 p-1.5 rounded-lg border border-brand-line/30">
                        <span className="text-[11px] text-brand-ink-soft">本周体重总体变化:</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          weeklySummaryData.weightChange === null || weeklySummaryData.weightChange === 0
                            ? "bg-brand-accent-soft text-brand-accent"
                            : weeklySummaryData.weightChange > 0
                            ? "bg-red-500/10 text-red-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {weeklySummaryData.weightChange === null || weeklySummaryData.weightChange === 0
                            ? "无波动"
                            : weeklySummaryData.weightChange > 0
                            ? `+${weeklySummaryData.weightChange} kg`
                            : `${weeklySummaryData.weightChange} kg`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-brand-ink-soft italic">
                      本周暂无称重记录，下一周称个重记录一下吧 ⚖️
                    </p>
                  )}
                </div>

                {/* 4. Sweet Beverage Card */}
                <div className="p-3 bg-brand-bg/40 rounded-2xl border-2 border-brand-accent/25 space-y-1 bg-brand-accent-soft/10">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-brand-ink-soft">
                    <span className="flex items-center gap-1">🥤 甜甜饮料红线指标</span>
                    <span className="text-brand-accent font-bold">限额: 1杯/周</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-serif text-2xl font-bold text-brand-accent">{weeklySummaryData.totalBeverages}</span>
                    <span className="text-xs text-brand-ink-soft">杯 / 本周已饮</span>
                  </div>

                  {/* Dialogue evaluation */}
                  <div className="bg-brand-surface border border-brand-line/80 p-2.5 rounded-xl text-xs text-brand-ink mt-2 leading-relaxed flex items-start gap-2 relative">
                    <span className="text-lg shrink-0 pt-0.5">🍰</span>
                    <div>
                      <p className="font-bold text-brand-ink mb-0.5 text-[11px]">小年糕叮嘱：</p>
                      {weeklySummaryData.totalBeverages === 0 ? (
                        <p className="text-[11px] text-brand-ink-soft">
                          🌟 哇塞！太不可思议了！你这周一杯饮料都没喝！小年糕对你的自控力佩服得五体投地！给你一个超级黄金熊抱！🧸🏆✨
                        </p>
                      ) : weeklySummaryData.totalBeverages === 1 ? (
                        <p className="text-[11px] text-brand-ink-soft">
                          🎉 太棒了！刚好喝了1杯饮料，完美遵守了“每周最多一杯”的约定！小年糕奖励你一朵可爱的小红花！🌹✨
                        </p>
                      ) : (
                        <p className="text-[11px] text-brand-ink-soft">
                          ⚠️ 哎呀呀！这周喝了 <span className="text-red-500 font-bold">{weeklySummaryData.totalBeverages}杯</span>。虽然甜甜的饮料很好喝，但为了健康，下周我们一定要努力控制在1杯以内，拉勾勾！🤙🥤
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-3 border-t border-brand-line/60">
                <button
                  onClick={() => setShowWeeklySummary(false)}
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer text-center"
                >
                  和年糕拉勾勾 🤙
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
