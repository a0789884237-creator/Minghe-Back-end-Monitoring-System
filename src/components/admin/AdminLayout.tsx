import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  LogOut,
  Menu,
  School,
  GraduationCap,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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

  // 获取当前专家个人资料
  const { data: profile } = useQuery({
    queryKey: ["current-expert-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data as any;
    }
  });

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

          <div className="p-4 border-t border-border/40 space-y-4">
            {/* Persistent Profile Card in Sidebar */}
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center border border-white/10 shadow-lg">
                    <span className="font-black text-white text-sm">{(profile?.display_name?.[0] || "A").toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                     <span className="text-xs font-black text-foreground truncate">{profile?.display_name || "专家号"}</span>
                     <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">
                        {profile?.role === 'admin' ? "系统架构师" : "专业咨询师"}
                     </span>
                  </div>
               </div>

               <div className="h-px bg-border/40 w-full" />

               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium group">
                     <School className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors" />
                     <span className="truncate">{profile?.school_name || "未绑定学校"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium group">
                     <Building2 className="w-3 h-3 text-accent/60 group-hover:text-accent transition-colors" />
                     <span className="truncate">{profile?.college_name || "未绑定学院"}</span>
                  </div>
                  {profile?.class_name && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium group">
                       <GraduationCap className="w-3 h-3 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
                       <span className="truncate">{profile.class_name} 专家组</span>
                    </div>
                  )}
               </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              退出账号
            </button>
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <header className="h-16 px-4 md:px-8 border-b border-border/40 flex items-center justify-between bg-card/20 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Trigger */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
                      <Menu className="w-5 h-5 text-primary" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72 bg-card/95 backdrop-blur-xl border-r-border/40">
                    <div className="flex flex-col h-full font-sans">
                      <div className="p-6 border-b border-border/40">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <h1 className="font-display font-bold text-lg tracking-tight">明禾管理台</h1>
                        </div>
                      </div>
                      <nav className="flex-1 p-4 space-y-1">
                        {MENU_ITEMS.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                              location.pathname === item.path 
                                ? "bg-primary text-primary-foreground" 
                                : "text-muted-foreground hover:bg-primary/10"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        ))}
                      </nav>
                      <div className="p-4 border-t border-border/40 space-y-4">
                         {/* Profile Card also in Mobile Menu */}
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <span className="font-black text-white">{(profile?.display_name?.[0] || "A").toUpperCase()}</span>
                              </div>
                              <div className="flex flex-col truncate">
                                 <span className="text-sm font-black text-foreground">{profile?.display_name || "专家号"}</span>
                                 <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {profile?.role === 'admin' ? "系统架构师" : "专业咨询师"}
                                 </span>
                              </div>
                           </div>
                           <div className="space-y-1 ml-1">
                             <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                               <School className="w-3 h-3 text-primary/70" /> {profile?.school_name}
                             </p>
                             <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                               <Building2 className="w-3 h-3 text-accent/70" /> {profile?.college_name}
                             </p>
                           </div>
                        </div>
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <LogOut className="w-4 h-4" />
                          退出账号
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <h2 className="text-sm font-semibold text-foreground capitalize tracking-wide truncate max-w-[80px] md:max-w-none">
                {MENU_ITEMS.find(i => i.path === location.pathname)?.label || "管理控制台"}
              </h2>

              <div className="h-4 w-px bg-border hidden sm:block mx-1 md:mx-2" />

              {/* 机构信息全景（学院、学校） */}
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                 {profile?.school_name && (
                   <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] md:text-[11px] font-bold text-primary transition-all hover:bg-primary/10 truncate max-w-[100px] md:max-w-[200px]">
                      <School className="w-3 h-3" />
                      {profile.school_name}
                   </div>
                 )}
                 {profile?.college_name && (
                   <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-[10px] md:text-[11px] font-bold text-accent transition-all hover:bg-accent/10 truncate max-w-[100px] md:max-w-[200px]">
                      <Building2 className="w-3 h-3" />
                      {profile.college_name}
                   </div>
                 )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 text-xs">
              <div className="hidden sm:flex flex-col items-end max-w-[120px]">
                 <span className="font-black text-foreground tracking-tight truncate w-full text-right">{profile?.display_name || "专家号"}</span>
                 <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">
                    {profile?.role === 'admin' ? "ARCHITECTURE" : "COUNSELOR"}
                 </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center border border-white/10 shadow-lg shadow-primary/20">
                <span className="font-black text-white text-sm">{(profile?.display_name?.[0] || "A").toUpperCase()}</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <section className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
