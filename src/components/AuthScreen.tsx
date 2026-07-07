import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Sparkles, Eye, EyeOff, CheckCircle } from "lucide-react";
import { signUpWithEmail, signInWithEmail, supabase } from "../lib/supabase";

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
  onContinueAsGuest: () => void;
}

export default function AuthScreen({ onAuthSuccess, onContinueAsGuest }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg("请输入电子邮箱地址");
      return;
    }
    if (!password) {
      setErrorMsg("请输入密码");
      return;
    }
    if (activeTab === "register" && password !== confirmPassword) {
      setErrorMsg("两次输入的密码不一致");
      return;
    }
    if (activeTab === "register" && password.length < 6) {
      setErrorMsg("密码长度不能少于 6 位");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onAuthSuccess(data.session);
        } else {
          setErrorMsg("登录失败，请检查账号密码");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        // Supabase might send email confirmation or sign in directly
        if (data.session) {
          setSuccessMsg("注册并登录成功！");
          setTimeout(() => {
            onAuthSuccess(data.session);
          }, 1000);
        } else if (data.user) {
          setSuccessMsg("注册成功！请检查邮箱进行账号确认（如果开启了邮箱验证），或直接登录。");
          setActiveTab("login");
          setPassword("");
          setConfirmPassword("");
        } else {
          setErrorMsg("注册返回空值，请检查网络或配置");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "请求失败，请稍后重试";
      if (msg.includes("Invalid login credentials")) {
        msg = "邮箱或密码错误，请重新输入";
      } else if (msg.includes("User already registered")) {
        msg = "该邮箱已被注册，请直接登录";
      } else if (msg.includes("Password should be")) {
        msg = "密码不符合安全要求，请输入更复杂的密码";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (data.session) {
        onAuthSuccess(data.session);
      } else {
        onContinueAsGuest();
      }
    } catch (err: any) {
      console.warn("Anonymous sign in failed, entering local guest mode:", err);
      onContinueAsGuest();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-md bg-brand-surface border border-brand-line/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Decorative backdrop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent-soft/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-accent-soft/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

        {/* Logo and title */}
        <div className="text-center mb-8 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block text-4xl mb-2"
          >
            🧁
          </motion.div>
          <h2 className="font-serif text-2xl font-bold text-brand-ink tracking-tight flex items-center justify-center gap-1">
            <span>年糕日记</span>
            <span className="text-xs bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-full font-sans align-middle ml-1">
              云端同步
            </span>
          </h2>
          <p className="text-xs text-brand-ink-soft mt-1">记录美好生活，自动同步云端数据库</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-brand-bg border border-brand-line/50 p-1 rounded-2xl mb-6 relative z-10">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 text-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "login"
                ? "bg-brand-surface text-brand-ink shadow-xs"
                : "text-brand-ink-soft hover:text-brand-ink"
            }`}
          >
            登录账号
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 text-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "register"
                ? "bg-brand-surface text-brand-ink shadow-xs"
                : "text-brand-ink-soft hover:text-brand-ink"
            }`}
          >
            新用户注册
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-brand-alert-soft border border-brand-alert/20 text-brand-alert rounded-xl text-xs font-medium"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium flex items-start gap-1.5"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-brand-ink mb-1.5 ml-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink-soft" />
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full text-xs pl-10 pr-4 py-3 bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-ink mb-1.5 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink-soft" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码（最少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full text-xs pl-10 pr-10 py-3 bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-ink-soft hover:text-brand-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {activeTab === "register" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-1"
            >
              <label className="block text-xs font-semibold text-brand-ink mb-1.5 ml-1">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={activeTab === "register"}
                  disabled={loading}
                  className="w-full text-xs pl-10 pr-10 py-3 bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-brand-accent/10 transition-all flex items-center justify-center gap-1.5 mt-6 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {activeTab === "login" ? "登录账号" : "立即注册"}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center z-10">
          <hr className="border-brand-line/60" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-surface px-3 text-[10px] font-semibold text-brand-ink-soft uppercase tracking-wider">
            或
          </span>
        </div>

        {/* Guest Mode */}
        <div className="text-center relative z-10">
          <button
            type="button"
            onClick={handleGuestClick}
            disabled={loading}
            className="text-xs text-brand-ink hover:text-brand-accent font-semibold underline decoration-brand-line hover:decoration-brand-accent transition-all cursor-pointer"
          >
            以游客身份继续 (本地优先模式)
          </button>
          <p className="text-[10px] text-brand-ink-soft mt-1.5 px-4 leading-relaxed">
            * 游客模式的数据存储于当前浏览器，清理浏览器缓存或更换设备会导致数据丢失，建议注册账号以保障数据安全。
          </p>
        </div>
      </div>
    </div>
  );
}
