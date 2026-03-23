import { motion } from "framer-motion";
import { 
  Settings, 
  Database, 
  Terminal, 
  FileEdit, 
  Save, 
  RotateCcw,
  Plus,
  Trash2,
  Cpu,
  RefreshCw,
  ListRestart,
  Clock
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'question' | 'system' | 'profile'>('prompt');

  // 获取 Prompt 数据
  const { data: prompts, isLoading: isPromptsLoading, refetch: refetchPrompts } = useQuery({
    queryKey: ["admin-prompts"],
    queryFn: async () => {
      const { data } = await supabase.from("prompt_versions").select("*").order("version", { ascending: false });
      return data || [];
    }
  });

  // 获取题库数据
  const { data: questions, isLoading: isQuestionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data } = await supabase.from("question_banks").select("*").order("priority", { ascending: false });
      return data || [];
    }
  });

  // 操作处理逻辑
  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("prompt_versions")
        .update({ is_active: !current })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Prompt 状态已更新");
      refetchPrompts();
    } catch (e: any) {
      toast.error("更新失败: " + e.message);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm("确定要删除此 Prompt 版本吗？此操作不可撤销。")) return;
    try {
      const { error } = await supabase.from("prompt_versions").delete().eq("id", id);
      if (error) throw error;
      toast.success("版本已移除");
      refetchPrompts();
    } catch (e: any) {
      toast.error("删除失败");
    }
  };

  const handleUpdatePriority = async (id: string, current: number) => {
    const next = current >= 10 ? 1 : current + 1;
    try {
      const { error } = await supabase.from("question_banks").update({ priority: next }).eq("id", id);
      if (error) throw error;
      toast.success(`权重已调整为 ${next}`);
      refetchQuestions();
    } catch (e: any) {
      toast.error("调整失败");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-500" />
            系统配置中心
          </h3>
          <p className="text-muted-foreground text-sm mt-1">管理核心业务逻辑、AI 提示词与动态测评策略</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 text-slate-500 rounded-lg text-xs font-black uppercase tracking-widest ring-1 ring-slate-500/20">
          <Terminal className="w-4 h-4" />
          Config Console v2.6
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card/10 rounded-2xl border border-border/40 w-fit">
         {[
           { id: 'prompt', label: 'AI 提示词管理', icon: Cpu },
           { id: 'question', label: '题库策略权重', icon: ListRestart },
           { id: 'profile', label: '个人权限设置', icon: Settings },
           { id: 'system', label: '系统接口监控', icon: Database }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
               activeTab === tab.id 
                 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                 : "text-muted-foreground hover:bg-white/5 hover:text-white"
             )}
           >
             <tab.icon className="w-3.5 h-3.5" />
             {tab.label}
           </button>
         ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'prompt' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h4 className="font-bold text-sm">当前活跃提示词片段</h4>
                 <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4" /> 创建新版本
                 </button>
              </div>

              {isPromptsLoading ? (
                 <div className="h-64 bg-card/10 rounded-3xl animate-pulse border border-border/40" />
              ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {prompts?.map((p) => (
                       <div key={p.id} className="p-6 rounded-3xl border border-border/40 bg-card/20 group hover:border-primary/40 transition-all">
                          <div className="flex items-start justify-between">
                             <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                   <FileEdit className="w-5 h-5" />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg text-foreground">{p.name || '未命名版本'}</span>
                                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold tracking-tight">v{p.version}</span>
                                      {p.is_active && (
                                         <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">Active</span>
                                      )}
                                   </div>
                                   <p className="text-xs text-muted-foreground mt-1 mb-4 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5" /> 最后修改: {new Date(p.created_at).toLocaleString()}
                                   </p>
                                   <div className="bg-slate-900/10 dark:bg-black/40 rounded-xl p-4 border border-border/40 text-[10px] font-mono leading-relaxed text-slate-700 dark:text-slate-300 max-h-32 overflow-hidden relative">
                                       {p.content}
                                       <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/90 dark:from-black/80 to-transparent flex items-end justify-center pb-1">
                                          <span className="text-muted-foreground text-[8px] uppercase font-bold tracking-widest">点击进入代码编辑器查看完整内容</span>
                                       </div>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => handleToggleActive(p.id, p.is_active)}
                                  title={p.is_active ? "下线此版本" : "激活并发布"}
                                  className={cn(
                                    "p-3 rounded-xl border border-border/40 transition-all group-hover:scale-105 active:scale-95",
                                    p.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-card hover:bg-primary/20 hover:text-primary"
                                  )}
                                >
                                   <Save className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePrompt(p.id)}
                                  className="p-3 rounded-xl bg-card border border-border/40 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </motion.div>
        )}

        {activeTab === 'question' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h4 className="font-bold text-sm">动态测评题库 (Smart Injection)</h4>
                 <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 transition-all">
                       <RefreshCw className="w-4 h-4" /> 同步外部库
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20">
                       <Plus className="w-4 h-4" /> 新增题目
                    </button>
                 </div>
              </div>

              <div className="bg-card/10 rounded-[40px] border border-border/40 overflow-hidden">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-border/20 text-muted-foreground font-black uppercase tracking-widest leading-none">
                       <tr>
                          <th className="px-6 py-4">核心问题</th>
                          <th className="px-6 py-4">适用阶段</th>
                          <th className="px-6 py-4">权重 (Priority)</th>
                          <th className="px-6 py-4">激活状态</th>
                          <th className="px-6 py-4 text-right">操作</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                       {questions?.map((q) => (
                          <tr key={q.id} className="hover:bg-white/5 transition-colors group">
                             <td className="px-6 py-5 font-bold text-foreground/90">{q.primary_question}</td>
                             <td className="px-6 py-5">
                                <span className={cn(
                                   "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                   q.life_stage === '大学' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                )}>{q.life_stage}</span>
                             </td>
                             <td className="px-6 py-5">
                                <button 
                                  onClick={() => handleUpdatePriority(q.id, q.priority)}
                                  className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-lg transition-all"
                                >
                                   <div className="flex-1 h-1.5 w-16 bg-border/40 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((q.priority || 0) / 10) * 100}%` }} />
                                   </div>
                                   <span className="font-mono">{q.priority}</span>
                                </button>
                             </td>
                             <td className="px-6 py-5">
                                <div className={cn(
                                   "w-2 h-2 rounded-full",
                                   q.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                                )} />
                             </td>
                             <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-2 rounded-lg bg-white/10 hover:text-primary transition-all"><FileEdit className="w-3.5 h-3.5" /></button>
                                   <button className="p-2 rounded-lg bg-white/10 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </motion.div>
        )}

        {activeTab === 'profile' && (
           <ProfileSettingsSection />
        )}

        {activeTab === 'system' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-20 text-center bg-card/5 rounded-[40px] border border-border/40 flex flex-col items-center">
             <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-slate-500" />
             </div>
             <h5 className="font-bold text-lg mb-1">系统负载监控</h5>
             <p className="text-muted-foreground text-sm max-w-sm">正在实时对接 Supabase Edge Functions 日志流，数据准备就绪后将在此展示 API 响应时间与错误率热力图。</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 内部组件: 个人资料设置 (用于测试权限与隔离)
// ---------------------------------------------------------
function ProfileSettingsSection() {
  const { data: profile, refetch } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data as any;
    }
  });
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const updates = {
      display_name: formData.get("display_name"),
      role: formData.get("role"),
      school_name: formData.get("school_name"),
      college_name: formData.get("college_name"),
      class_name: formData.get("class_name"),
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", user?.id!);
      if (error) throw error;
      toast.success("个人资料与组织归属已更新");
      refetch();
      // 通知全局刷新侧边栏和顶部的身份卡片缓存
      queryClient.invalidateQueries({ queryKey: ["current-expert-profile"] });
    } catch (e: any) {
      toast.error("更新失败: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="p-12 text-center text-muted-foreground">正在加载个人资料...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[40px] border border-border/40 bg-card/20 backdrop-blur-xl max-w-2xl mx-auto shadow-2xl">
      <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
        <div className="p-2 bg-primary/20 rounded-xl"><Settings className="w-4 h-4 text-primary" /></div>
        专家身份与组织归属设置
      </h4>
      <form onSubmit={handleUpdate} className="space-y-6 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-widest">显示名称</label>
            <input 
              name="display_name" 
              defaultValue={profile.display_name} 
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-6 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-widest">系统角色</label>
            <select 
              name="role" 
              defaultValue={profile.role} 
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-6 text-sm text-slate-800 focus:outline-none focus:border-primary/40 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="user">普通学生 (User)</option>
              <option value="teacher">班主任/老师 (Teacher)</option>
              <option value="admin">系统级管理员 (Admin)</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4 pt-2 border-t border-slate-200/50">
           <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-widest">所在学校</label>
            <input 
              name="school_name" 
              defaultValue={(profile as any).school_name} 
              placeholder="例如: 吉林工商学院"
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-6 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-widest">所属学院</label>
              <input 
                name="college_name" 
                defaultValue={(profile as any).college_name} 
                placeholder="例如: 工商管理学院"
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-6 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-widest">所属班级 (数据隔离码)</label>
              <input 
                name="class_name" 
                defaultValue={profile.class_name} 
                placeholder="例如: 25408"
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-6 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 mt-4">
          <p className="text-[11px] text-primary/80 leading-relaxed font-bold italic">
            💡 注意：更改角色或班级后，系统将实时过滤你可见的数据内容。例如设为“老师”并填入班级后，你只能在“学生档案”中看到同班同学。
          </p>
        </div>

        <button 
          disabled={saving}
          type="submit"
          className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存身份变更
        </button>
      </form>
    </motion.div>
  );
}
