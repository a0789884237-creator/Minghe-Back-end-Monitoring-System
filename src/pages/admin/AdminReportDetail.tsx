import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Calendar, 
  User, 
  PieChart, 
  FileText, 
  Activity,
  Heart,
  Moon,
  Users,
  AlertTriangle,
  Download,
  Share2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading } = useQuery({
    queryKey: ["admin-report-detail", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_results")
        .select(`
          *,
          profiles:user_id (display_name, life_stage)
        `)
        .eq("id", reportId!)
        .single();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!reportId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-pulse">
        <div className="text-muted-foreground">正在调取云端测评密档...</div>
      </div>
    );
  }

  const severity = report?.severity || "正常";
  const isHighRisk = ["高风险", "重度抑郁", "重度焦虑", "严重", "危机"].includes(severity);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          返回列表
        </button>
        <div className="flex items-center gap-2">
           <button className="p-2 rounded-xl border border-border/40 hover:bg-card transition-colors text-muted-foreground">
              <Download className="w-4 h-4" />
           </button>
           <button className="p-2 rounded-xl border border-border/40 hover:bg-card transition-colors text-muted-foreground">
              <Share2 className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="p-10 rounded-[40px] border border-border/40 bg-card/20 backdrop-blur-2xl relative overflow-hidden">
         {/* Status Watermark */}
         <div className="absolute -top-10 -right-10 opacity-5">
            <ShieldAlert className="w-64 h-64" />
         </div>

         <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
               <div className="space-y-2">
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit">
                    Psychological Report
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">心理素质测评报告</h2>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                     <Calendar className="w-4 h-4" />
                     测评时间: {new Date(report?.created_at).toLocaleString("zh-CN")}
                  </p>
               </div>
               
               <div className={cn(
                  "p-6 rounded-3xl border text-center min-w-[160px]",
                  isHighRisk ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
               )}>
                  <p className="text-[10px] uppercase font-bold opacity-60 mb-1">风险评级</p>
                  <p className="text-2xl font-black">{severity}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/20 pt-10">
               {/* User Info Section */}
               <div className="space-y-6">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">个人画像基准</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-3xl bg-white/5 border border-border/20">
                        <User className="w-4 h-4 text-primary mb-2" />
                        <p className="text-[10px] text-muted-foreground uppercase">真实姓名/昵称</p>
                        <p className="font-bold">{report?.profiles?.display_name || "匿名学员"}</p>
                     </div>
                     <div className="p-4 rounded-3xl bg-white/5 border border-border/20">
                        <PieChart className="w-4 h-4 text-primary mb-2" />
                        <p className="text-[10px] text-muted-foreground uppercase">成长阶段</p>
                        <p className="font-bold">{report?.profiles?.life_stage || "未填写"}</p>
                     </div>
                  </div>
               </div>

               {/* Score Section */}
               <div className="space-y-6">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">核心指数量化</h4>
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">量表: {report?.scale_type || "综合测评"}</span>
                        <span className="text-xs font-bold text-primary">Score: {report?.total_score || 0}</span>
                     </div>
                     <div className="h-3 w-full bg-border/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(report?.total_score / 100) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary" 
                        />
                     </div>
                     <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
                        基于大规模人群常模，该得分反映了被试在相应维度的偏离程度。
                     </p>
                  </div>
               </div>
            </div>

            {/* AI Summary Section */}
            <div className="mt-10 p-8 rounded-[36px] bg-white/[0.03] border border-border/20">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                     <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold">AI 智能临床诊断建议</h4>
               </div>
               <div className="text-sm text-foreground/80 leading-relaxed space-y-4">
                  {report?.ai_summary ? (
                    <p className="whitespace-pre-wrap">{report.ai_summary}</p>
                  ) : (
                    <p className="italic text-muted-foreground">该测评暂无深度 AI 诊断摘要。可能是在离线状态下进行的测评。</p>
                  )}
               </div>
            </div>

            {/* Dimension Details (Mocked if not in DB, but logic reserved) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
               <DimensionCard icon={Heart} label="情绪调节" score="85" color="text-rose-400" />
               <DimensionCard icon={Moon} label="睡眠质量" score="42" color="text-indigo-400" />
               <DimensionCard icon={Users} label="社会支持" score="78" color="text-amber-400" />
            </div>

            {/* Management Notes */}
            <div className="mt-10 p-6 rounded-3xl border border-red-500/20 bg-red-500/[0.02]">
               <h5 className="text-xs font-black uppercase text-red-500 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" /> 
                  管理干预核查清单
               </h5>
               <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                  <li>被试是否存在显著的睡眠剥夺（得分 {"<"} 40）</li>
                  <li>主要负面因子的持续时间是否超过 14 天</li>
                  <li>社会支持系统是否足以缓冲压力事件</li>
               </ul>
            </div>
         </div>
      </div>
    </div>
  );
}

function DimensionCard({ icon: Icon, label, score, color }: any) {
  return (
    <div className="p-5 rounded-3xl border border-border/20 bg-card/10 flex flex-col items-center text-center">
       <div className={cn("p-2 rounded-xl bg-white/5 mb-3", color)}>
          <Icon className="w-5 h-5" />
       </div>
       <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
       <p className="text-xl font-black mt-1">{score}</p>
    </div>
  );
}
