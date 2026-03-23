import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // 状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [className, setClassName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Step 1: 尝试登录 (邮箱 + 密码)
        const { error } = await signIn(email, password);
        if (error) throw error;

        // Step 2: 登录成功后，额外匹配“姓名”
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, school_name, college_name, class_name")
            .eq("user_id", user.id)
            .single();
          
          if (profile && profile.display_name !== displayName) {
             await supabase.auth.signOut();
             throw new Error("姓名匹配失败，请检查姓名输入是否正确");
          }
        }

        toast.success("欢迎回来，明禾心灵专家");
        navigate("/admin/overview");
      } else {
        // 注册 (姓名 + 邮箱 + 密码 + 学校 + 学院 + 班级)
        const { error } = await signUp(email, password, displayName, className, collegeName, schoolName);
        if (error) throw error;
        toast.success("注册成功！您可以直接登录");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "认证失败，请检查输入");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[560px] z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl shadow-primary/20 mb-6"
          >
            <div className="w-full h-full bg-[#0a0a0a] rounded-[22px] flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary fill-primary/10" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">明禾心灵花园</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isLogin ? "智慧心理管理后台 · 加密身份匹配登录" : "开启您的数字心理辅导员之旅"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/20 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 专家身份匹配：姓名 + 邮箱 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">真实姓名</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      required
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="如何称呼您？"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">电子邮箱</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      required
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="专家工作邮箱"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">认证密码</label>
                {isLogin && <button type="button" className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors">忘记密码？</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pb-2 border-y border-white/5 py-4 my-2"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">所属学校</label>
                    <div className="relative group">
                       <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                       <input 
                          required
                          type="text" 
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="例如：吉林工商学院"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">所属学院</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                          required
                          type="text" 
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          placeholder="例如：工商管理学院"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">所属班级</label>
                      <div className="relative group">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                          required
                          type="text" 
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder="例如：25408"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">访问密码</label>
                {isLogin && <button type="button" className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors">忘记密码？</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-70 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "验证并进入后台" : "立即加入明禾花园"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
             <div className="flex items-center gap-4 text-muted-foreground/20">
                <div className="h-px flex-1 bg-current" />
                <span className="text-[10px] font-black uppercase tracking-widest">secure access</span>
                <div className="h-px flex-1 bg-current" />
             </div>
             
             <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
             >
                {isLogin ? "还没有账号？" : "已有专家账号？"}
                <span className="text-primary font-bold">{isLogin ? "立即申请注册" : "点击返回登录"}</span>
             </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/40">
           <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              AES-256 Encrypted
           </div>
           <div className="w-1 h-1 rounded-full bg-current" />
           <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              AI Powered Support
           </div>
        </div>
      </motion.div>
    </div>
  );
}
