import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  ExternalLink,
  ClipboardList,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// 真实数据库中需要关注的 severity 值
const RISK_SEVERITIES = [
  "中度抑郁", "中度焦虑", "中等风险", 
  "高风险", "重度抑郁", "重度焦虑", 
  "严重", "危机", "需关注"
];

interface RiskAlert {
  id: string;
  user_id: string;
  severity: string;
  total_score: number;
  scale_type: string;
  created_at: string;
  display_name?: string;
}

export default function AdminRiskCenter() {
  const navigate = useNavigate();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async (): Promise<RiskAlert[]> => {
      // Step 1: 获取所有风险测评
      const { data: assessments } = await supabase
        .from("assessment_results")
        .select("id, user_id, severity, total_score, scale_type, created_at")
        .in("severity", RISK_SEVERITIES)
        .order("created_at", { ascending: false });

      if (!assessments || assessments.length === 0) return [];

      // Step 2: 获取相关用户的 display_name
      const userIds = [...new Set(assessments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name])
      );

      // Step 3: 合并数据
      return assessments.map(a => ({
        ...a,
        display_name: profileMap.get(a.user_id) || "匿名用户"
      }));
    }
  });

  // 根据 severity 返回对应的颜色等级
  function getSeverityColor(severity: string) {
    if (["高风险", "重度抑郁", "重度焦虑", "严重", "危机"].includes(severity)) {
      return { bg: "bg-red-500/[0.08]", border: "border-red-500/30", text: "text-red-500", dot: "from-red-500/30 to-rose-500/30" };
    }
    if (["中度抑郁", "中度焦虑", "中等风险"].includes(severity)) {
      return { bg: "bg-orange-500/[0.05]", border: "border-orange-500/25", text: "text-orange-500", dot: "from-orange-500/30 to-amber-500/30" };
    }
    return { bg: "bg-yellow-500/[0.05]", border: "border-yellow-500/25", text: "text-yellow-600", dot: "from-yellow-500/30 to-amber-400/30" };
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            异常预警中心
          </h3>
          <p className="text-muted-foreground text-sm mt-1">系统已自动识别出心理测评得分异常的学生名单（真实数据）</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="搜索姓名或学号..." 
                    className="pl-10 pr-4 py-2 rounded-xl bg-card border border-border/40 text-sm focus:outline-none focus:border-primary/40 w-64"
                />
            </div>
            <button className="p-2.5 rounded-xl border border-border/40 bg-card hover:bg-border/20 transition-colors">
                <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
      </div>

      {/* 数据统计条 */}
      <div className="flex items-center gap-4 text-xs">
        <div className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 font-bold">
          🚨 共 {alerts?.length || 0} 条预警
        </div>
        <div className="text-muted-foreground">
          数据来源: Supabase · assessment_results 表 · 实时读取
        </div>
      </div>

      {/* 预警列表渲染 */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
             [1,2,3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-card/20 animate-pulse border border-border/40" />
             ))
        ) : alerts?.length === 0 ? (
            <div className="p-12 text-center bg-card/10 rounded-3xl border border-dashed border-border/40">
                <p className="text-muted-foreground">🎉 目前无紧急风险事件，所有已知测评均在健康范围内。</p>
            </div>
        ) : (
            alerts?.map((alert, index) => {
                const colors = getSeverityColor(alert.severity);
                return (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-5 rounded-2xl border ${colors.border} ${colors.bg} transition-colors group flex items-center justify-between`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.dot} flex items-center justify-center font-bold ${colors.text}`}>
                                {alert.display_name?.charAt(0) || "U"}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{alert.display_name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${colors.text} bg-current/10`}>
                                      {alert.severity}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(alert.created_at).toLocaleString("zh-CN")}
                                    </span>
                                    <span className={`flex items-center gap-1 ${colors.text} font-medium`}>
                                        <AlertCircle className="w-3 h-3" />
                                        {alert.scale_type} · 得分: {alert.total_score}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex flex-col items-end mr-4">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">风险等级</span>
                                <span className={`text-xs ${colors.text} font-bold tracking-wider`}>{alert.severity}</span>
                            </div>
                            <button 
                                onClick={() => navigate(`/admin/users/${alert.user_id}`)}
                                className="p-3 rounded-xl bg-card border border-border/40 hover:border-red-500/30 transition-all text-muted-foreground hover:text-red-500"
                                title="查看学生档案"
                             >
                                <ClipboardList className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => navigate(`/admin/users/${alert.user_id}`)}
                                className="p-3 rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                title="立即进行危机访谈"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                );
            })
        )}
      </div>

      {/* 底部操作提示 */}
      <div className="mt-8 p-6 rounded-3xl bg-secondary/30 border border-border/40 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-primary/10">
            <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
            <h5 className="font-bold text-sm mb-1">干预室指南</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
                所有标红名单建议在 24 小时内由心理辅导主任发起初次访谈。
                点击"访谈"按钮将自动进入该学生的深度心理画像页面。
            </p>
        </div>
      </div>
    </div>
  );
}
