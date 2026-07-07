import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion } from "motion/react";
import { Camera, Image as ImageIcon, Save, Check, FileText, Calendar, Trash2 } from "lucide-react";
import { GumPhoto } from "../types";
import Mascot from "./Mascot";

interface GumScreenProps {
  dateStr: string;
  gumPhoto: GumPhoto | null;
  gumDatesIndex: string[]; // Dates with gum photos
  onSaveGumPhoto: (date: string, photo: GumPhoto) => void;
  onDeleteGumPhoto: (date: string) => void;
  getGumPhotoByDate: (date: string) => GumPhoto | null;
}

export default function GumScreen({
  dateStr,
  gumPhoto,
  gumDatesIndex,
  onSaveGumPhoto,
  onDeleteGumPhoto,
  getGumPhotoByDate,
}: GumScreenProps) {
  const [note, setNote] = useState(gumPhoto?.note || "");
  const [cmpDateA, setCmpDateA] = useState("");
  const [cmpDateB, setCmpDateB] = useState("");
  const [cmpPhotoA, setCmpPhotoA] = useState<GumPhoto | null>(null);
  const [cmpPhotoB, setCmpPhotoB] = useState<GumPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state note with today's photo note if changed externally
  useEffect(() => {
    setNote(gumPhoto?.note || "");
  }, [gumPhoto]);

  // Handle comparing date A selection
  const handleSelectA = (date: string) => {
    setCmpDateA(date);
    if (date) {
      setCmpPhotoA(getGumPhotoByDate(date));
    } else {
      setCmpPhotoA(null);
    }
  };

  // Handle comparing date B selection
  const handleSelectB = (date: string) => {
    setCmpDateB(date);
    if (date) {
      setCmpPhotoB(getGumPhotoByDate(date));
    } else {
      setCmpPhotoB(null);
    }
  };

  // Handle file select & resize to Base64 to fit in localStorage
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      const img = new Image();
      img.onload = () => {
        // Downscale image to fit in 5MB localStorage limit safely
        const maxW = 700;
        const scale = Math.min(1, maxW / img.width);
        
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
          
          // Save photo
          onSaveGumPhoto(dateStr, { image: dataUrl, note: note });
        }
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNote = () => {
    if (gumPhoto) {
      onSaveGumPhoto(dateStr, { ...gumPhoto, note: note });
    }
  };

  // Click on historical thumbnail - automatically puts it in Compare A or B
  const handleThumbClick = (d: string) => {
    if (!cmpDateA) {
      handleSelectA(d);
    } else if (!cmpDateB) {
      handleSelectB(d);
    } else {
      // Toggle replace slot A
      handleSelectA(d);
    }
  };

  // Format date for dropdown (e.g. 2026-07-06 -> 07月06日)
  const formatDropDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${m}月${day}日`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-8"
      id="screen-gum-wrapper"
    >
      {/* Cute Mascot */}
      <Mascot expression="greeting" text="咔嚓！今天记录一下牙龈照片吧。小年糕陪你一起关注口腔健康，比对分析细微变化，守护闪亮笑容！" />

      {/* Photo Capture Section */}
      {gumPhoto ? (
        <div className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-xs space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-brand-ink-soft flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
              <span>今天已拍 · {formatDropDate(dateStr)}</span>
            </span>
            <button
              id="delete-today-photo"
              onClick={() => {
                if (confirm("确定要删除今天拍摄的牙龈照片吗？")) {
                  onDeleteGumPhoto(dateStr);
                }
              }}
              className="text-brand-alert hover:bg-brand-alert-soft/50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除</span>
            </button>
          </div>
          
          <div className="relative group rounded-xl overflow-hidden border border-brand-line shadow-2xs">
            <img
              src={gumPhoto.image}
              alt="Gum"
              className="w-full max-h-72 object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-white text-xs font-mono">
                {dateStr}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-brand-ink-soft font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>今日牙龈备忘（比如：左下侧微痛，刷牙偶有出血）</span>
            </label>
            <textarea
              id="gumNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录牙龈细节，方便日后比对…"
              className="w-full bg-brand-bg border border-brand-line rounded-xl p-3 text-sm text-brand-ink focus:outline-hidden focus:ring-1 focus:ring-brand-accent min-h-[70px]"
            />
            <button
              id="saveNoteBtn"
              onClick={handleSaveNote}
              className="w-full flex items-center justify-center gap-1.5 bg-brand-accent-soft hover:bg-brand-accent-soft/80 text-brand-accent font-semibold text-xs py-2.5 rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
              <span>保存备注</span>
            </button>
          </div>

          <label
            htmlFor="gumFileInput"
            className="flex items-center justify-center gap-2 border border-dashed border-brand-accent hover:bg-brand-accent-soft/50 rounded-xl p-3 text-brand-accent font-semibold text-xs cursor-pointer transition-all active:scale-98"
          >
            <Camera className="w-4 h-4" />
            <span>重新拍摄或从相册上传</span>
          </label>
          <input
            type="file"
            id="gumFileInput"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-brand-surface border border-brand-line rounded-2xl p-6 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-brand-accent-soft text-brand-accent rounded-full flex items-center justify-center mx-auto">
            <Camera className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-brand-ink">
              记录今天的牙龈
            </h3>
            <p className="text-xs text-brand-ink-soft max-w-[280px] mx-auto leading-relaxed">
              每日拍摄对比能及早发现牙龈萎缩、红肿或恢复情况。支持拍照或从相册上传。
            </p>
          </div>
          
          <label
            htmlFor="gumFileInput"
            className="flex items-center justify-center gap-2 border-2 border-dashed border-brand-accent bg-brand-accent-soft hover:bg-brand-accent-soft/80 rounded-2xl p-6 text-brand-accent font-semibold text-sm cursor-pointer transition-all active:scale-98 shadow-2xs"
          >
            <Camera className="w-5 h-5" />
            <span>📷 拍照或从相册选择牙龈照片</span>
          </label>
          <input
            type="file"
            id="gumFileInput"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}

      {/* Compare History */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-wider text-brand-ink-soft uppercase flex items-center gap-2">
          <span>对比历史</span>
          <span className="flex-1 h-[1px] bg-brand-line"></span>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-2 gap-4">
            {/* Compare A */}
            <div className="flex flex-col space-y-2">
              <select
                id="cmpA"
                value={cmpDateA}
                onChange={(e) => handleSelectA(e.target.value)}
                className="w-full bg-brand-bg border border-brand-line rounded-xl px-2.5 py-2 text-xs font-medium text-brand-ink focus:outline-hidden"
              >
                <option value="">选择对比日期 A</option>
                {gumDatesIndex.slice().reverse().map((d) => (
                  <option key={`a-${d}`} value={d}>
                    {formatDropDate(d)} ({d})
                  </option>
                ))}
              </select>
              <div
                id="cmpAImg"
                className="aspect-3/4 border border-brand-line/60 rounded-xl overflow-hidden bg-brand-bg flex items-center justify-center"
              >
                {cmpPhotoA ? (
                  <div className="relative w-full h-full">
                    <img
                      src={cmpPhotoA.image}
                      alt="Compare A"
                      className="w-full h-full object-cover"
                    />
                    {cmpPhotoA.note && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white p-1.5 text-[10px] italic line-clamp-2">
                        {cmpPhotoA.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-brand-ink-soft p-3 text-center">
                    未选择
                  </div>
                )}
              </div>
            </div>

            {/* Compare B */}
            <div className="flex flex-col space-y-2">
              <select
                id="cmpB"
                value={cmpDateB}
                onChange={(e) => handleSelectB(e.target.value)}
                className="w-full bg-brand-bg border border-brand-line rounded-xl px-2.5 py-2 text-xs font-medium text-brand-ink focus:outline-hidden"
              >
                <option value="">选择对比日期 B</option>
                {gumDatesIndex.slice().reverse().map((d) => (
                  <option key={`b-${d}`} value={d}>
                    {formatDropDate(d)} ({d})
                  </option>
                ))}
              </select>
              <div
                id="cmpBImg"
                className="aspect-3/4 border border-brand-line/60 rounded-xl overflow-hidden bg-brand-bg flex items-center justify-center"
              >
                {cmpPhotoB ? (
                  <div className="relative w-full h-full">
                    <img
                      src={cmpPhotoB.image}
                      alt="Compare B"
                      className="w-full h-full object-cover"
                    />
                    {cmpPhotoB.note && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white p-1.5 text-[10px] italic line-clamp-2">
                        {cmpPhotoB.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-brand-ink-soft p-3 text-center">
                    未选择
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Photo Strip / Thumbnails */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-wider text-brand-ink-soft uppercase flex items-center gap-2">
          <span>所有照片记录</span>
          <span className="flex-1 h-[1px] bg-brand-line"></span>
        </div>

        {gumDatesIndex.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
            {gumDatesIndex.slice().reverse().map((d) => {
              const p = getGumPhotoByDate(d);
              if (!p) return null;
              const isSelected = cmpDateA === d || cmpDateB === d;
              return (
                <button
                  key={`thumb-${d}`}
                  onClick={() => handleThumbClick(d)}
                  className={`flex-none text-center focus:outline-hidden focus:ring-1 focus:ring-brand-accent p-1 rounded-xl transition-all ${
                    isSelected ? "bg-brand-accent-soft border border-brand-accent/50" : "hover:bg-brand-line/30"
                  }`}
                >
                  <img
                    src={p.image}
                    alt={d}
                    className="w-16 h-16 rounded-lg object-cover border border-brand-line shadow-3xs"
                  />
                  <div className="text-[10px] font-mono text-brand-ink-soft mt-1">
                    {d.slice(5)}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-brand-surface border border-brand-line rounded-2xl p-6 text-center text-brand-ink-soft text-xs space-y-1">
            <ImageIcon className="w-5 h-5 mx-auto text-brand-line" />
            <p>还没有历史照片记录</p>
            <p className="text-[10px] text-brand-ink-soft/75">
              每天刷完牙拍一张，就能看到健康变化。
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
