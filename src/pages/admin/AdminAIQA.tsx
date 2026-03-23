import { motion } from "framer-motion";
import { 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCcw,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  Cell
} from "recharts";
import { useAIQAStats } from "@/hooks/admin/useAIQAStats";
import { cn } from "@/lib/utils";

export default function AdminAIQA() {
  const { data: stats, isLoading } = useAIQAStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <RefreshCcw className="w-8 h-8 text-primary/40" />
        </motion.div>
      </div>
    );
  }

  // 雷达图数据
  const radarData = [
    { subject: '共情能力', A: stats?.avgEmpathy || 0, fullMark: 100 },
    { subject: '专业度', A: stats?.avgProfessionalism || 0, fullMark: 100 },
    { subject: '安全性', A: stats?.avgSafety || 0, fullMark: 100 },
    { subject: '知识库利用', A: stats?.avgMemory || 0, fullMark: 100 },
    { subject: '对话流畅度', A: stats?.overallScore || 0, fullMark: 100 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            AI 质量审计中心
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            基于多维指标量化评估 AI 辅导员的对话性能
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold ring-1 ring-emerald-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          全站平均分: {stats?.overallScore}
        </div>
      </div>

      {/* KPI 统计雷达图与分布柱图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-xl">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-primary rounded-full" />
             AI 核心能力图谱
          </h4>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="AI Performance"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-xl">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
             评分区间分布 (Overall Score)
          </h4>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.scoreDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(23,23,23,0.8)', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {stats?.scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 异常诊断列表 (低分对话) */}
      <div className="space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2 px-1">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          需关注的回话诊断 (Score {"<"} 75)
        </h4>
        <div className="grid grid-cols-1 gap-4">
          {stats?.lowScoreEvaluations && stats.lowScoreEvaluations.length > 0 ? (
            stats.lowScoreEvaluations.map((evalItem, idx) => (
              <motion.div 
                key={evalItem.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                className="group p-5 rounded-2xl border border-border/40 bg-card/10 hover:bg-card/30 transition-all flex items-center justify-between"
              >
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                       <Clock className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-sm">诊断记录 #{evalItem.id.slice(-6)}</span>
                         <div className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                            得分: {evalItem.overall_score}
                         </div>
                       </div>
                       <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-3">
                          <span>时间: {new Date(evalItem.created_at).toLocaleString()}</span>
                          <span>序号: 第 {evalItem.message_index} 回合</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                       <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none">主要扣分项</p>
                       <p className="text-xs text-amber-500 font-medium mt-1">共情缺失 / 回复平淡</p>
                    </div>
                    <button className="p-2.5 rounded-xl bg-card border border-border/40 hover:border-primary/40 transition-all">
                       <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                 </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center bg-card/5 rounded-3xl border border-dashed border-border/40">
               <p className="text-muted-foreground text-sm">目前的对话质量均保持在基准线以上 ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
