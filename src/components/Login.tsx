import { useState } from "react";
import { Key, Lock, X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onClose, onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.token);
        onClose();
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "大门紧闭：密码输入错误。");
      }
    } catch (error) {
      setErrorMsg("服务器连接失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
      {/* Background shadow overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Centered Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-sm rounded-none border border-stone-300 bg-white p-6 shadow-xl z-10"
        id="login-dialog"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-none text-stone-400 hover:text-stone-950 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
 
        {/* Headline */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-stone-100 text-stone-900 border border-stone-250 shadow-xs mb-3">
            <Lock className="h-4.5 w-4.5" />
          </div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-stone-950">
            管理员验证
          </h2>
          <p className="font-serif text-stone-600 text-xs mt-1 leading-relaxed italic">
            仅能由 Panda AI 博客主理人特邀访问后台。
          </p>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">验证密码</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-stone-400">
                <Key className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入写作主厨密码..."
                className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white py-2 pl-10 pr-4 text-xs font-semibold uppercase tracking-wider placeholder-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden transition-all"
                id="input-login-password"
              />
            </div>
          </div>
 
          {errorMsg && (
            <div className="flex items-start space-x-2 rounded-none bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-100">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
 

 
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-none bg-stone-950 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-stone-850 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
            id="btn-login-submit"
          >
            {isLoading ? "验证中..." : "开启写作通道"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
