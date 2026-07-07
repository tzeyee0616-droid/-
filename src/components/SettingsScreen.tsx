import { useState } from "react";
import { motion } from "motion/react";
import { 
  Save, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Check, 
  Database, 
  Cloud, 
  CloudRain, 
  Copy, 
  LogOut, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight,
  Sparkles
} from "lucide-react";
import { Settings } from "../types";

interface SettingsScreenProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onImportBackup: (backupJson: string) => boolean;
  onExportBackup: () => string;
  
  // Database Sync Props
  syncId: string;
  isAutoSync: boolean;
  onEnableSync: (syncId: string) => Promise<{ success: boolean; message: string }>;
  onGenerateSync: () => Promise<{ success: boolean; syncId: string; error?: string }>;
  onUploadToCloud: () => Promise<{ success: boolean; message: string }>;
  onDownloadFromCloud: () => Promise<{ success: boolean; message: string }>;
  onDisableSync: () => void;
  onToggleAutoSync: (enabled: boolean) => void;
}

export default function SettingsScreen({
  settings,
  onSaveSettings,
  onImportBackup,
  onExportBackup,
  syncId,
  isAutoSync,
  onEnableSync,
  onGenerateSync,
  onUploadToCloud,
  onDownloadFromCloud,
  onDisableSync,
  onToggleAutoSync,
}: SettingsScreenProps) {
  const [budget, setBudget] = useState(settings.calorieBudget);
  const [waterGoal, setWaterGoal] = useState(settings.waterGoalMl);
  const [weight, setWeight] = useState(settings.weightKg);
  const [hairInterval, setHairInterval] = useState(settings.hairWashIntervalDays);

  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  const [showExportArea, setShowExportArea] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // Sync states
  const [inputSyncId, setInputSyncId] = useState("");
  const [isSyncingAction, setIsSyncingAction] = useState(false);

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

  // Sync actions
  const handleGenerateSyncCode = async () => {
    setIsSyncingAction(true);
    try {
      const res = await onGenerateSync();
      if (res.success) {
        showToast(`云端数据库注册成功！已绑定同步码`);
      } else {
        let displayError = "请稍后重试";
        if (res.error) {
          try {
            const parsed = JSON.parse(res.error);
            if (parsed && parsed.error) {
              displayError = parsed.error;
            } else {
              displayError = res.error;
            }
          } catch {
            displayError = res.error;
          }
        }
        showToast(`开启云端失败: ${displayError}`);
      }
    } catch (e: any) {
      showToast(e?.message ? `连接失败: ${e.message}` : "无法连接至云端服务器，请检查网络");
    } finally {
      setIsSyncingAction(false);
    }
  };

  const handleBindSyncCode = async () => {
    const cleanId = inputSyncId.trim().toUpperCase();
    if (!cleanId) {
      showToast("请先输入有效的同步码");
      return;
    }
    setIsSyncingAction(true);
    try {
      const res = await onEnableSync(cleanId);
      if (res.success) {
        showToast("同步码绑定并拉取数据成功！");
        setInputSyncId("");
      } else {
        showToast(res.message || "找不到对应的同步码");
      }
    } catch (e) {
      showToast("网络请求失败，请稍后再试");
    } finally {
      setIsSyncingAction(false);
    }
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

  const handleCopySyncId = () => {
    navigator.clipboard.writeText(syncId);
    showToast("同步码已成功复制到剪贴板！");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-8"
      id="screen-settings-wrapper"
    >
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

      {/* Cloud Database Sync Card */}
      <div className="bg-brand-surface border border-brand-line rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-brand-ink flex items-center gap-1.5 border-b border-brand-line/50 pb-2">
          <Database className="w-4.5 h-4.5 text-brand-accent" />
          <span>☁️ 云端数据库同步 (防丢失)</span>
        </h3>

        {!syncId ? (
          <div className="space-y-4">
            <p className="text-xs text-brand-ink-soft leading-relaxed">
              觉得纯本地存储容易因为刷机或清缓存而丢失吗？您可以开启 <b>Supabase 云数据库</b>！
              一键生成专属“同步码”，可在多个设备（如手机与电脑）间互通数据、安全持久保存！
            </p>

            <button
              onClick={handleGenerateSyncCode}
              disabled={isSyncingAction}
              className="w-full flex items-center justify-center gap-1.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSyncingAction ? "正在开启云端服务..." : "全新开启：生成我的云端同步码"}</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-brand-line"></div>
              <span className="flex-shrink mx-3 text-[10px] text-brand-ink-soft font-mono">或绑定已有同步码</span>
              <div className="flex-grow border-t border-brand-line"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入以 NG- 开头的同步码"
                value={inputSyncId}
                onChange={(e) => setInputSyncId(e.target.value)}
                className="flex-1 bg-brand-bg border border-brand-line rounded-xl px-3 py-2 text-xs text-brand-ink uppercase placeholder:text-brand-ink-soft/50 font-mono"
              />
              <button
                onClick={handleBindSyncCode}
                disabled={isSyncingAction || !inputSyncId.trim()}
                className="bg-brand-accent-soft text-brand-accent border border-brand-accent/20 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-accent-soft/80 transition-all active:scale-98 disabled:opacity-50"
              >
                绑定拉取
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show active Sync ID */}
            <div className="bg-brand-accent-soft/30 border border-dashed border-brand-accent/30 rounded-2xl p-4 text-center space-y-1.5 relative overflow-hidden">
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider block">我的云端同步码</span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg font-bold text-brand-ink tracking-widest">{syncId}</span>
                <button 
                  onClick={handleCopySyncId}
                  className="p-1.5 bg-white border border-brand-line rounded-lg text-brand-ink-soft hover:text-brand-ink active:scale-90 transition-all shadow-3xs"
                  title="复制同步码"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-brand-ink-soft leading-tight">
                ⚠️ 请妥善保存此代码！在其他设备上输入此码，即可立刻同步所有洗头、卡路里、体重、牙龈照片。
              </p>
            </div>

            {/* Sync Controls */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-brand-line/40">
                <div>
                  <span className="text-xs font-bold text-brand-ink block">自动云端实时同步</span>
                  <span className="text-[10px] text-brand-ink-soft block">本地每次记录修改后自动同步至云端</span>
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

              {/* Manual Backup and Restore buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
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

              <button
                onClick={() => {
                  if (window.confirm("确定要解除绑定吗？这会停止云端同步，但不会删除云端已存储的数据。")) {
                    onDisableSync();
                    showToast("已成功解除云端绑定，回到本地模式");
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 text-brand-alert hover:bg-brand-alert-soft bg-transparent border border-transparent hover:border-brand-alert/10 font-semibold text-xs py-2 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>解除此设备云端绑定</span>
              </button>
            </div>
          </div>
        )}
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

          {/* Export section */}
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
                  id="backupArea"
                  value={exportData}
                  readOnly
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.select();
                    showToast("已自动全选，可以直接复制");
                  }}
                  className="w-full bg-brand-bg border border-brand-line rounded-xl p-3 text-[10px] font-mono text-brand-ink focus:outline-hidden min-h-[90px] resize-y"
                />
                <button
                  onClick={() => setShowExportArea(false)}
                  className="text-xs text-brand-ink-soft hover:text-brand-ink font-medium flex items-center gap-1 mx-auto"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>隐藏备份文本</span>
                </button>
              </motion.div>
            )}
          </div>

          <div className="border-t border-brand-line/40 pt-4 space-y-2">
            <label htmlFor="importArea" className="text-xs font-semibold text-brand-ink block">
              导入本地文本备份
            </label>
            <textarea
              id="importArea"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="将之前导出的备份文本代码，整段粘贴到这里"
              className="w-full bg-brand-bg border border-brand-line rounded-xl p-3 text-[10px] font-mono text-brand-ink focus:outline-hidden min-h-[80px]"
            />
            <button
              id="importBtn"
              onClick={handleImport}
              className="w-full flex items-center justify-center gap-1.5 bg-brand-alert-soft hover:bg-brand-alert-soft/80 text-brand-alert border border-brand-alert/30 font-semibold text-xs py-2.5 rounded-xl transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>导入覆盖本地</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-2 space-y-1">
        <div className="flex items-center justify-center gap-1 text-brand-accent font-medium text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Supabase Auth + Postgres 驱动 · 云端持久存储</span>
        </div>
        <p className="text-[10px] text-brand-ink-soft/70">
          年糕日记支持多终端互联，让每一天的数据都有云端相伴。
        </p>
      </div>

      {/* Floating Status Toast inside settings screen if needed */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-ink text-white px-4 py-2 rounded-full text-xs shadow-lg flex items-center gap-1.5 z-50">
          <Check className="w-3.5 h-3.5 text-brand-accent-soft" />
          <span>{toastMsg}</span>
        </div>
      )}
    </motion.div>
  );
}
