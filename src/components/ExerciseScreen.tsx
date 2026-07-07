import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Trash2, Trophy, Clock, FileText, ChevronRight, AlertCircle } from "lucide-react";
import { ExerciseEntry, Settings, PresetExercise } from "../types";
import Mascot from "./Mascot";

interface ExerciseScreenProps {
  dateStr: string;
  exerciseEntries: ExerciseEntry[];
  settings: Settings;
  onAddExercise: (entry: Omit<ExerciseEntry, "id" | "time">) => void;
  onDeleteExercise: (id: string) => void;
}

const EXERCISE_PRESETS: PresetExercise[] = [
  { key: "jumprope", label: "跳绳", met: 11 },
  { key: "jog", label: "慢跑", met: 7 },
  { key: "walk", label: "快走", met: 4.3 },
  { key: "cycle", label: "骑车", met: 6 },
  { key: "aerobics", label: "健身操/操课", met: 6.5 },
  { key: "hiit", label: "HIIT高强度间歇", met: 8 },
  { key: "swim", label: "游泳", met: 7 },
  { key: "weights", label: "力量训练", met: 5 },
  { key: "stairs", label: "爬楼梯", met: 8 },
  { key: "yoga", label: "瑜伽/伸展", met: 2.8 },
  { key: "custom", label: "其他（自定义强度）", met: null },
];

export default function ExerciseScreen({
  dateStr,
  exerciseEntries,
  settings,
  onAddExercise,
  onDeleteExercise,
}: ExerciseScreenProps) {
  const [typeKey, setTypeKey] = useState(EXERCISE_PRESETS[0].key);
  const [minutes, setMinutes] = useState<number | "">("");
  const [customMet, setCustomMet] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [calorieVal, setCalorieVal] = useState<number | "">("");

  const totalBurned = exerciseEntries.reduce((sum, e) => sum + e.cal, 0);

  // Auto calculate calories based on inputs
  useEffect(() => {
    const selectedPreset = EXERCISE_PRESETS.find((p) => p.key === typeKey);
    if (!selectedPreset) return;

    const minNum = typeof minutes === "number" ? minutes : 0;
    if (minNum <= 0) {
      setCalorieVal("");
      return;
    }

    let met = selectedPreset.met;
    if (selectedPreset.key === "custom") {
      met = typeof customMet === "number" ? customMet : 5;
    }

    if (met !== null) {
      const computedCal = Math.round(met * settings.weightKg * (minNum / 60));
      setCalorieVal(computedCal);
    }
  }, [typeKey, minutes, customMet, settings.weightKg]);

  const handleAdd = () => {
    const selectedPreset = EXERCISE_PRESETS.find((p) => p.key === typeKey);
    if (!selectedPreset) return;

    const minNum = typeof minutes === "number" ? minutes : 0;
    const calNum = typeof calorieVal === "number" ? calorieVal : 0;

    if (minNum <= 0) {
      alert("请输入有效的运动时长");
      return;
    }
    if (calNum <= 0) {
      alert("请输入有效的卡路里数值");
      return;
    }

    let desc = `${selectedPreset.label} ${minNum}分钟`;
    if (note.trim()) {
      desc += ` · ${note.trim()}`;
    }

    onAddExercise({
      desc,
      cal: calNum,
    });

    // Reset inputs
    setMinutes("");
    setNote("");
    setCustomMet("");
    setCalorieVal("");
  };

  const selectedPreset = EXERCISE_PRESETS.find((p) => p.key === typeKey);
  const currentMet = selectedPreset?.key === "custom" ? (typeof customMet === "number" ? customMet : 5) : (selectedPreset?.met || 0);
  const previewCal = calorieVal || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-8"
      id="screen-exercise-wrapper"
    >
      {/* Dynamic Summary Card */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs flex justify-between items-center">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-1.5 font-medium">
            <Flame className="w-3.5 h-3.5 text-brand-alert" />
            <span>今日运动消耗</span>
          </div>
          <div className="big-number mt-1.5">
            {totalBurned}
            <span className="unit">kcal</span>
          </div>
        </div>
        
        {totalBurned > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 bg-brand-alert-soft text-brand-alert rounded-full flex items-center justify-center shadow-xs"
          >
            <Trophy className="w-6 h-6" />
          </motion.div>
        )}
      </div>

      {/* Cute Mascot */}
      <Mascot expression="exercising" text="呼哈呼哈！生命在于运动！流汗不仅能消水肿，还能让年糕变得更Q弹有力量噢，冲鸭！" />

      {/* Input Log Card */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-brand-ink flex items-center gap-1.5 border-b border-brand-line/50 pb-2">
          <span>记录一项运动</span>
        </h3>

        <div className="space-y-3">
          {/* Select Type */}
          <div>
            <label htmlFor="exType" className="text-xs text-brand-ink-soft font-medium block">
              运动类型
            </label>
            <select
              id="exType"
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 mt-1 text-sm text-brand-ink focus:outline-hidden"
            >
              {EXERCISE_PRESETS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} {t.met ? `(MET: ${t.met})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Custom MET values */}
          {typeKey === "custom" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden space-y-1"
            >
              <label htmlFor="exCustomMet" className="text-xs text-brand-ink-soft font-medium block">
                强度 MET 值 (不知道可以填 5 表示中等强度)
              </label>
              <input
                type="number"
                id="exCustomMet"
                value={customMet}
                onChange={(e) => setCustomMet(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="5"
                step="0.5"
                min="0.1"
                className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-sm text-brand-ink focus:outline-hidden mt-1"
              />
            </motion.div>
          )}

          {/* Duration Minutes */}
          <div>
            <label htmlFor="exMinutes" className="text-xs text-brand-ink-soft font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-ink-soft" />
              <span>时长 (分钟)</span>
            </label>
            <input
              type="number"
              id="exMinutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="30"
              min="1"
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 text-sm text-brand-ink focus:outline-hidden mt-1"
            />
          </div>

          {/* Remark/Note */}
          <div>
            <label htmlFor="exNote" className="text-xs text-brand-ink-soft font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-brand-ink-soft" />
              <span>运动说明 / 备注 (可选)</span>
            </label>
            <input
              type="text"
              id="exNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：跟练帕梅拉 / 晨间跑步 / 健身房力量"
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 text-sm text-brand-ink focus:outline-hidden mt-1"
            />
          </div>

          {/* Live Preview Info */}
          {minutes !== "" && minutes > 0 && (
            <div className="text-xs text-brand-ink-soft bg-brand-accent-soft p-3 rounded-xl border border-brand-line/60">
              按体重 <b>{settings.weightKg}kg</b> · MET <b>{currentMet}</b> · <b>{minutes}分钟</b> 估算 ≈ <b className="text-brand-ink font-mono">{previewCal} kcal</b>
            </div>
          )}

          {/* Calorie Manual override */}
          <div>
            <label htmlFor="exCal" className="text-xs text-brand-ink-soft font-medium block">
              消耗卡路里 (自动计算，可手动修改)
            </label>
            <input
              type="number"
              id="exCal"
              value={calorieVal}
              onChange={(e) => setCalorieVal(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 text-sm text-brand-ink focus:outline-hidden mt-1 font-mono font-medium"
            />
          </div>

          {/* Submit button */}
          <button
            id="exAddBtn"
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-1 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all active:scale-98"
          >
            <span>添加运动记录</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Card */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-wider text-brand-ink-soft uppercase flex items-center gap-2">
          <span>今日运动记录</span>
          <span className="flex-1 h-[1px] bg-brand-line"></span>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-xs">
          {exerciseEntries.length > 0 ? (
            <div className="divide-y divide-brand-line/40">
              <AnimatePresence initial={false}>
                {exerciseEntries.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    className="flex justify-between items-center py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-medium text-brand-ink break-words">
                        {item.desc}
                      </p>
                      <span className="text-[10px] text-brand-ink-soft font-mono block mt-1">
                        {item.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm text-brand-alert shrink-0">
                        -{item.cal} kcal
                      </span>
                      <button
                        onClick={() => onDeleteExercise(item.id)}
                        className="text-brand-ink-soft/40 hover:text-brand-alert p-1.5 rounded-lg hover:bg-brand-alert-soft/50 transition-colors shrink-0"
                        title="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8 text-brand-ink-soft space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto text-brand-line" />
              <p className="text-sm">今天还没有记录过运动</p>
              <p className="text-[11px] text-brand-ink-soft/70">
                保持身体活动，在上面输入并点击“添加”。
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
