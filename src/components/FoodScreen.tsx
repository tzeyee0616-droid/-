import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Trash2, ChevronRight, FileText, AlertCircle, Plus, Camera, X } from "lucide-react";
import { FoodEntry, Settings, PresetFood, ExerciseEntry } from "../types";
import Mascot from "./Mascot";

interface FoodScreenProps {
  dateStr: string;
  foodEntries: FoodEntry[];
  exerciseEntries: ExerciseEntry[];
  settings: Settings;
  onAddFood: (entry: Omit<FoodEntry, "id" | "time">) => void;
  onDeleteFood: (id: string) => void;
}

const FOOD_PRESETS: PresetFood[] = [
  { key: "chickenrice", label: "鸡饭", cal: 600 },
  { key: "kwayteow", label: "炒粿条", cal: 700 },
  { key: "nasilemak", label: "椰浆饭（基础）", cal: 400 },
  { key: "friednoodle", label: "炒面/炒米粉", cal: 500 },
  { key: "wontonmee", label: "云吞面", cal: 450 },
  { key: "rojak", label: "啰惹 Rojak", cal: 350 },
  { key: "friedchicken", label: "炸鸡一块", cal: 250 },
  { key: "rice", label: "白饭一碗", cal: 200 },
  { key: "egg", label: "煎蛋一个", cal: 90 },
  { key: "roastmeat", label: "烧腊饭", cal: 550 },
  { key: "tehtarik", label: "拉茶", cal: 150 },
  { key: "milktea", label: "奶茶", cal: 220 },
  { key: "soymilk", label: "豆浆（无糖）", cal: 80 },
  { key: "bread", label: "面包一片", cal: 80 },
  { key: "custom", label: "其他（自定义）", cal: null },
];

export default function FoodScreen({
  dateStr,
  foodEntries,
  exerciseEntries,
  settings,
  onAddFood,
  onDeleteFood,
}: FoodScreenProps) {
  const [foodKey, setFoodKey] = useState(FOOD_PRESETS[0].key);
  const [customName, setCustomName] = useState("");
  const [portion, setPortion] = useState<number>(1);
  const [calorieVal, setCalorieVal] = useState<number | "">("");
  const [foodImage, setFoodImage] = useState<string | null>(null);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalEaten = foodEntries.reduce((sum, f) => sum + f.cal, 0);
  const totalBurned = exerciseEntries.reduce((sum, e) => sum + e.cal, 0);
  const net = totalEaten - totalBurned;
  const remaining = settings.calorieBudget - net;

  // Auto calculate calories based on preset selection & portion
  useEffect(() => {
    const selected = FOOD_PRESETS.find((f) => f.key === foodKey);
    if (!selected) return;

    if (selected.key === "custom") {
      return; // Do not overwrite for custom
    }

    if (selected.cal !== null) {
      setCalorieVal(Math.round(selected.cal * portion));
    }
  }, [foodKey, portion]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const img = new Image();
      img.onload = () => {
        // Downscale image to fit in localStorage safely
        const maxW = 500;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          setFoodImage(dataUrl);
        }
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    const selected = FOOD_PRESETS.find((f) => f.key === foodKey);
    if (!selected) return;

    const calNum = typeof calorieVal === "number" ? calorieVal : 0;
    if (calNum <= 0) {
      alert("请输入有效的食物卡路里值");
      return;
    }

    let desc = "";
    if (selected.key === "custom") {
      if (!customName.trim()) {
        alert("请填写自定义食物名称");
        return;
      }
      desc = customName.trim();
    } else {
      desc = `${selected.label} × ${portion}份`;
    }

    onAddFood({
      desc,
      cal: calNum,
      image: foodImage || undefined,
    });

    // Reset fields
    setCustomName("");
    setPortion(1);
    setCalorieVal("");
    setFoodImage(null);
  };

  const selectedItem = FOOD_PRESETS.find((f) => f.key === foodKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-8"
      id="screen-food-wrapper"
    >
      {/* Remaining Calorie Budget Card */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs flex justify-between items-end">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center gap-1.5 font-medium">
            <Utensils className="w-3.5 h-3.5 text-brand-accent" />
            <span>今天还能吃</span>
          </div>
          <div className="big-number mt-1.5">
            {remaining}
            <span className="unit">kcal</span>
          </div>
          <div className="text-xs text-brand-ink-soft mt-1">
            已摄入 {totalEaten} kcal · 预算 {settings.calorieBudget}
          </div>
        </div>
        
        <div className="h-full flex items-center justify-center font-mono text-[10px] bg-brand-accent-soft text-brand-accent font-semibold px-2.5 py-1 rounded-lg">
          {remaining >= 0 ? "预算充裕" : "超出预算"}
        </div>
      </div>

      {/* Cute Mascot */}
      <Mascot expression="eating" text="嚼嚼嚼... 今天的伙食是什么样子的呀？快拍照或者记录下来，小年糕会帮你算好热量！" />

      {/* Input Log Card */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-brand-ink flex items-center gap-1.5 border-b border-brand-line/50 pb-2">
          <span>记录饮食</span>
        </h3>

        <div className="space-y-3">
          {/* Select Food Type */}
          <div>
            <label htmlFor="foodType" className="text-xs text-brand-ink-soft font-medium block">
              选择食物
            </label>
            <select
              id="foodType"
              value={foodKey}
              onChange={(e) => {
                setFoodKey(e.target.value);
                if (e.target.value === "custom") {
                  setCalorieVal("");
                }
              }}
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 mt-1 text-sm text-brand-ink focus:outline-hidden"
            >
              {FOOD_PRESETS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label} {f.cal ? `(~${f.cal} kcal)` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Food Name */}
          {foodKey === "custom" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden space-y-1"
            >
              <label htmlFor="foodCustomName" className="text-xs text-brand-ink-soft font-medium block">
                食物名称 / 包含内容
              </label>
              <input
                type="text"
                id="foodCustomName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="例：椰浆饭加多一份炸鸡"
                className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-sm text-brand-ink focus:outline-hidden mt-1"
              />
            </motion.div>
          )}

          {/* Portion Multiplier */}
          {foodKey !== "custom" && (
            <div>
              <label htmlFor="foodPortion" className="text-xs text-brand-ink-soft font-medium block">
                份量倍数 (1 = 一份正常份量)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  id="foodPortion"
                  value={portion}
                  onChange={(e) => setPortion(Math.max(0.1, Number(e.target.value)))}
                  step="0.25"
                  min="0.1"
                  className="w-24 bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 text-sm text-brand-ink focus:outline-hidden font-mono"
                />
                <div className="flex flex-wrap gap-1">
                  {[0.5, 1, 1.5, 2].map((p) => (
                    <button
                      key={`port-${p}`}
                      type="button"
                      onClick={() => setPortion(p)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                        portion === p
                          ? "bg-brand-accent text-white border-brand-accent"
                          : "bg-brand-bg text-brand-ink border-brand-line/60"
                      }`}
                    >
                      {p}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portion Preview Info */}
          {selectedItem && selectedItem.key !== "custom" && (
            <div className="text-xs text-brand-ink-soft bg-brand-accent-soft p-3 rounded-xl border border-brand-line/60">
              {selectedItem.label} × <b>{portion} 份</b> 估算 ≈ <b className="text-brand-ink font-mono">{calorieVal || 0} kcal</b>
            </div>
          )}
          {selectedItem && selectedItem.key === "custom" && (
            <div className="text-xs text-brand-ink-soft bg-brand-accent-soft p-3 rounded-xl border border-brand-line/60">
              自定义食物需要自己填写卡路里。
            </div>
          )}

          {/* Calorie value */}
          <div>
            <label htmlFor="foodCal" className="text-xs text-brand-ink-soft font-medium block">
              卡路里 (kcal)
            </label>
            <input
              type="number"
              id="foodCal"
              value={calorieVal}
              onChange={(e) => setCalorieVal(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2.5 text-sm text-brand-ink focus:outline-hidden mt-1 font-mono font-medium"
            />
          </div>

          {/* Food Photo upload */}
          <div className="space-y-1.5">
            <label className="text-xs text-brand-ink-soft font-medium block">
              上传食物照片（可选）
            </label>
            {foodImage ? (
              <div className="relative w-full aspect-16/9 rounded-xl overflow-hidden border border-brand-line bg-brand-bg/60 flex items-center justify-center group shadow-2xs">
                <img src={foodImage} alt="Food preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFoodImage(null)}
                  className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-black/90 text-white p-1.5 rounded-full transition-all active:scale-90"
                  title="删除照片"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="foodImageInput"
                  className="flex items-center justify-center gap-2 border border-dashed border-brand-line/80 hover:border-brand-accent hover:bg-brand-accent-soft/30 rounded-xl p-3 text-brand-ink-soft hover:text-brand-accent font-medium text-xs cursor-pointer transition-all active:scale-98"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 拍照或从相册选择食物照片</span>
                </label>
                <input
                  type="file"
                  id="foodImageInput"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            id="foodAddBtn"
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-1 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all active:scale-98"
          >
            <span>添加饮食记录</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Card */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-wider text-brand-ink-soft uppercase flex items-center gap-2">
          <span>今天吃了什么</span>
          <span className="flex-1 h-[1px] bg-brand-line"></span>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-xs">
          {foodEntries.length > 0 ? (
            <div className="divide-y divide-brand-line/40">
              <AnimatePresence initial={false}>
                {foodEntries.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {item.image && (
                      <button
                        type="button"
                        onClick={() => setSelectedZoomImage(item.image || null)}
                        className="relative w-11 h-11 rounded-lg overflow-hidden border border-brand-line shrink-0 cursor-zoom-in hover:opacity-90 active:scale-95 transition-all bg-brand-bg flex items-center justify-center"
                        title="点击查看大图"
                      >
                        <img src={item.image} alt={item.desc} className="w-full h-full object-cover" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-sm font-medium text-brand-ink break-words">
                        {item.desc}
                      </p>
                      <span className="text-[10px] text-brand-ink-soft font-mono block mt-1">
                        {item.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm text-brand-accent shrink-0">
                        {item.cal} kcal
                      </span>
                      <button
                        onClick={() => onDeleteFood(item.id)}
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
              <p className="text-sm">今天还没有饮食记录</p>
              <p className="text-[11px] text-brand-ink-soft/70">
                记录你吃过的每一顿饭。在上面选择或自定义输入。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Image Modal Overlay */}
      <AnimatePresence>
        {selectedZoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedZoomImage(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-sm w-full bg-brand-surface border border-brand-line rounded-2xl overflow-hidden p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedZoomImage} alt="Food Zoom" className="w-full h-auto rounded-xl object-contain max-h-[70vh] mx-auto" />
              <button
                type="button"
                onClick={() => setSelectedZoomImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white p-2 rounded-full transition-all"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
