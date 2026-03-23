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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'question' | 'system'>('prompt');

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
                                      <span className="font-bold text-lg">{p.name || '未命名版本'}</span>
                                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground text-[10px] font-bold">v{p.version}</span>
                                      {p.is_active && (
                                         <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">Active</span>
                                      )}
                                   </div>
                                   <p className="text-xs text-muted-foreground mt-1 mb-4 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5" /> 最后修改: {new Date(p.created_at).toLocaleString()}
                                   </p>
                                   <div className="bg-black/40 rounded-xl p-4 border border-border/40 text-[10px] font-mono leading-relaxed text-slate-300 max-h-32 overflow-hidden relative">
                                       {p.content}
                                       <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-1">
                                          <span className="text-white/40 text-[8px] uppercase font-bold">点击进入代码编辑器查看完整内容</span>
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

        {activeTab === 'system' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-20 text-center bg-card/5 rounded-[40px] border border-dashed border-border/40 flex flex-col items-center">
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
