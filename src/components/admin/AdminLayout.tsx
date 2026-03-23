import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  Settings,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import heroBanner from "@/assets/hero-banner.jpg";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "系统总览", path: "/admin/overview" },
  { icon: AlertTriangle, label: "风险中心", path: "/admin/alerts" },
  { icon: Users, label: "学生档案", path: "/admin/users" },
  { icon: MessageSquare, label: "AI质量审计", path: "/admin/ai-qa" },
  { icon: ShieldCheck, label: "安全审计", path: "/admin/security" },
  { icon: Settings, label: "系统配置", path: "/admin/settings" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 建立 Supabase WebSocket 实时通道
    const channel = supabase.channel("admin-realtime-global")
      // 监听评估结果表的任何变动（新增、修改）
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessment_results" },
        (payload) => {
          console.log("🔔 [实时预警] 捕获到新的测评数据:", payload);
          // 立即重置所有涉及的缓存池，触发零延迟重绘
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-alerts"] });
          queryClient.invalidateQueries({ queryKey: ["admin-students"] });
          queryClient.invalidateQueries({ queryKey: ["admin-student-assessments"] });
        }
      )
      // 监听情绪状态表的变动
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emotion_states" },
        () => {
          console.log("📈 [实时预警] 捕获到情绪波动");
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-students"] });
          queryClient.invalidateQueries({ queryKey: ["admin-student-emotions"] });
        }
      )
      .subscribe();

    return () => {
      // 组件卸载时销毁 WebSocket 连接，防止内存泄漏
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-xl flex flex-col hidden md:flex">
          <div className="p-6 border-b border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-display font-bold text-lg tracking-tight">明禾管理台</h1>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Campus Mental Health</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                  location.pathname === item.path 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border/40 space-y-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出账号
            </button>
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 px-8 border-b border-border/40 flex items-center justify-between bg-card/20 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-foreground capitalize tracking-wide">
                {MENU_ITEMS.find(i => i.path === location.pathname)?.label || "管理控制台"}
              </h2>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                在线监测中
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">最后更新: {new Date().toLocaleTimeString()}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20">
                <span className="font-bold text-primary">A</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
