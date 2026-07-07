import { useState } from "react";
import { motion } from "motion/react";
import { 
  Save, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight,
} from "lucide-react";
import { Settings } from "../types";

interface SettingsScreenProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onImportBackup: (backupJson: string) => boolean;
  onExportBackup: () => string;

  // Cloud sync actions (manual)
  isAutoSync: boolean;
  onUploadToCloud: () => Promise<{ success: boolean; message: string }>;
  onDownloadFromCloud: () => Promise<{ success: boolean; message: string }>;
  onToggleAutoSync: (enabled: boolean) => void;

  // Auth Props
  session?: any;
  onLogout?: () => void;
  isGuestMode?: boolean;
  syncError?: string | null;
}

export default function SettingsScreen({
  settings,
  onSaveSettings,
  onImportBackup,
  onExportBackup,
  isAutoSync,
  onUploadToCloud,
  onDownloadFromCloud,
  onToggleAutoSync,
  session,
  onLogout,
  isGuestMode,
  syncError,
}: SettingsScreenProps) {
  const [budget, setBudget] = useState(settings.calorieBudget);
  const [waterGoal, setWaterGoal] = useState(settings.waterGoalMl);
  const [weight, setWeight] = useState(settings.weightKg);
  const [hairInterval, setHairInterval] = useState(settings.hairWashIntervalDays);

  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  const [showExportArea, setShowExportArea] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isSyncingAction, setIsSyncingAction] = useState(false);
  const [showPassword] = useState(false);

  const handleSave = () => {
    onSaveSettings({
      calorieBudget: Number(budget) || 1800,
      waterGoalMl: Number(waterGoal) || 2000,
      weightKg: Number(weight) || 55,
      hairWashIntervalDays: Number(hairInterval) || 2,
    });
    showToast("设置保存成功");
  };

  const handleExport = () => {
    const backupStr = onExportBackup();
    setExportData(backupStr);
    setShowExportArea(true);
    showToast("备份生成成功，已自动选中");
  };

  const handleImport = () => {
    if (!importData.trim()) {
      showToast("请先粘贴有效的备份文本");
      return;
    }
    const ok = onImportBackup(importData);
    if (ok) {
      showToast("导入成功，记录已加载");
      setImportData("");
    } else {
      showToast("导入失败，文本格式可能不正确");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 2200);
  };

  const handleManualUpload = async () => {
    setIsSyncingAction(true);
    try {
      const res = await onUploadToCloud();
      if (res.success) {
        showToast("本地记录已全量同步备份至云端");
      } else {
        showToast(res.message);
      }
    } catch (e) {
      showToast("网络连接失败");
    } finally {
      setIsSyncingAction(false);
    }
  };

  const handleManualDownload = async () => {
    if (!window.confirm("确定要从云端重新拉取数据吗？这会覆盖本地未同步的最新更改。")) {
      return;
    }
    setIsSyncingAction(true);
    try {
      const res = await onDownloadFromCloud();
      if (res.success) {
        showToast("已成功从云端重新同步所有历史记录");
      } else {
        showToast(res.message);
      }
    } catch (e) {
      showToast("网络连接失败");
    } finally {
      setIsSyncingAction(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-8"
      id="screen-settings-wrapper"
    >
      {/* Account Info Card */}
      {session && (
        <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-brand-ink flex items-center gap-1.5 border-b border-brand-line/50 pb-2">
            <ShieldCheck className="w-4.5 h-4.5 text-brand-accent" />
            <span>👤 账号信息</span>
          </h3>
          <div className="flex justify-between items-center py-1">
            <div>
              <span className="text-[10px] text-brand-ink-soft block font-semibold uppercase tracking-wider">当前账号</span>
              <span className="text-sm font-semibold text-brand-ink block font-mono mt-0.5 break-all">
                {isGuestMode ? "游客模式 (未绑定邮箱)" : session.user.email}
              </span>
              <span className="text-[10px] text-brand-ink-soft block mt-0.5">
                ☁️ 数据已自动同步至 Supabase 云端数据库
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 bg-brand-alert-soft hover:bg-brand-alert/15 text-brand-alert border border-brand-alert/20 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ml-3"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>退出登录</span>
              </button>
            )}
          </div>

          {isGuestMode && (
            <p className="text-[10px] text-brand-alert leading-relaxed">
              ⚠️ 您当前使用的是游客模式，数据随时可能丢失。请退出并注册一个正式的邮箱账号以安全保存数据。
            </p>
          )}

          {syncError && (
            <div className="p-3 bg-brand-alert-soft border border-brand-alert/20 text-brand-alert rounded-xl text-xs mt-2">
              <p className="font-bold">❌ 数据库同步发生错误：</p>
              <p className="font-mono text-[10px] mt-1 bg-white/70 p-2 rounded-lg border border-brand-line/50 break-all select-all">{syncError}</p>
            </div>
          )}

          {/* Manual Sync Controls */}
          {session && !isGuestMode && (
            <div className="pt-2 border-t border-brand-line/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-ink block">自动云端实时同步</span>
                  <span className="text-[10px] text-brand-ink-soft block">每次记录修改后自动同步至云端</span>
                </div>
                <button
                  onClick={() => onToggleAutoSync(!isAutoSync)}
                  className="text-brand-accent focus:outline-hidden"
                >
                  {isAutoSync ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-brand-ink-soft" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleManualUpload}
                  disabled={isSyncingAction}
                  className="flex items-center justify-center gap-1.5 bg-brand-surface border border-brand-line hover:bg-brand-bg text-brand-ink font-semibold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-accent" />
                  <span>{isSyncingAction ? "同步中..." : "手动上传云端"}</span>
                </button>
                <button
                  onClick={handleManualDownload}
                  disabled={isSyncingAction}
                  className="flex items-center justify-center gap-1.5 bg-brand-surface border border-brand-line hover:bg-brand-bg text-brand-ink font-semibold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isSyncingAction ? "刷新中..." : "从云端拉取覆盖"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Input Card */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-brand-ink flex items-center gap-1.5 border-b border-brand-line/50 pb-2">
          <span>🧁 个性化参数</span>
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-1">
            <div className="flex-1 pr-4">
              <label htmlFor="setBudget" className="text-sm font-semibold text-brand-ink block">
                每日卡路里预算
              </label>
              <span className="text-[11px] text-brand-ink-soft block mt-0.5 leading-tight">
                用来计算饮食与运动折算后的剩余摄入空间 (kcal)
              </span>
            </div>
            <input
              type="number"
              id="setBudget"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-24 bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-sm text-brand-ink text-right font-mono font-medium focus:outline-hidden"
            />
          </div>

          <div className="flex justify-between items-center py-1 border-t border-brand-line/40">
            <div className="flex-1 pr-4">
              <label htmlFor="setWater" className="text-sm font-semibold text-brand-ink block">
                每日饮水目标
              </label>
              <span className="text-[11px] text-brand-ink-soft block mt-0.5 leading-tight">
                每日建议补充的水分量 (ml)
              </span>
            </div>
            <input
              type="number"
              id="setWater"
              value={waterGoal}
              onChange={(e) => setWaterGoal(Number(e.target.value))}
              className="w-24 bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-sm text-brand-ink text-right font-mono font-medium focus:outline-hidden"
            />
          </div>

          <div className="flex justify-between items-center py-1 border-t border-brand-line/40">
            <div className="flex-1 pr-4">
              <label htmlFor="setWeight" className="text-sm font-semibold text-brand-ink block">
                个人体重
              </label>
              <span className="text-[11px] text-brand-ink-soft block mt-0.5 leading-tight">
                用于根据运动 MET 系数和时间计算卡路里消耗 (kg)
              </span>
            </div>
            <input
              type="number"
              id="setWeight"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              step="0.5"
              className="w-24 bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-sm text-brand-ink text-right font-mono font-medium focus:outline-hidden"
            />
          </div>

          <div className="flex justify-between items-center py-1 border-t border-brand-line/40">
            <div className="flex-1 pr-4">
              <label htmlFor="setHair" className="text-sm font-semibold text-brand-ink block">
                洗头清洁周期
              </label>
              <span className="text-[11px] text-brand-ink-soft block mt-0.5 leading-tight">
                超过设定天数没洗头，主页状态卡片会变为警示状态 (天)
              </span>
            </div>
            <input
              type="number"
              id="setHair"
              value={hairInterval}
              onChange={(e) => setHairInterval(Number(e.target.value))}
              className="w-24 bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-sm text-brand-ink text-right font-mono font-medium focus:outline-hidden"
            />
          </div>
        </div>

        <button
          id="saveSettingsBtn"
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-1.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-xs active:scale-98"
        >
          <Save className="w-4 h-4" />
          <span>保存设置</span>
        </button>
      </div>

      {/* Backup and Restore */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-wider text-brand-ink-soft uppercase flex items-center gap-2">
          <span>本地文本备份与恢复</span>
          <span className="flex-1 h-[1px] bg-brand-line"></span>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
          <p className="text-xs text-brand-ink-soft leading-relaxed">
            您也可以随时导出物理文本代码进行手工备份：
          </p>

          <div className="space-y-2">
            <button
              id="exportBtn"
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-1.5 bg-brand-accent-soft hover:bg-brand-accent-soft/80 text-brand-accent font-semibold text-xs py-2.5 rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
              <span>导出本地文本代码</span>
            </button>

            {showExportArea && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 pt-1"
              >
                <label className="text-[10px] text-brand-ink-soft font-mono font-medium block">
                  ↓ 请复制下方文本，妥善保存
                </label>
                <textarea
                  readOnly
                  value={exportData}
                  rows={4}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-[10px] font-mono text-brand-ink-soft resize-none focus:outline-hidden"
                />
              </motion.div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-brand-line/40">
            <label className="text-[10px] text-brand-ink-soft font-mono font-medium block">
              ↓ 粘贴之前导出的备份文本，点击导入
            </label>
            <textarea
              placeholder="在此粘贴备份文本..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={4}
              className="w-full bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-[10px] font-mono text-brand-ink resize-none focus:outline-hidden"
            />
            <button
              id="importBtn"
              onClick={handleImport}
              className="w-full flex items-center justify-center gap-1.5 bg-brand-surface border border-brand-line hover:bg-brand-bg text-brand-ink font-semibold text-xs py-2.5 rounded-xl transition-all"
            >
              <Upload className="w-4 h-4 text-brand-accent" />
              <span>导入并覆盖本地数据</span>
            </button>
          </div>
        </div>
      </div>

      {/* Local Toast */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-ink text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg z-50 whitespace-nowrap"
        >
          {toastMsg}
        </motion.div>
      )}
    </motion.div>
  );
}
