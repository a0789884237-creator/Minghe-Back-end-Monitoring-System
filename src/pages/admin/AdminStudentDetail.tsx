import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserCircle,
  Activity,
  FileText,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
  Shield,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// ==========================================
// 学生详情 - 深度心理画像
// 真实数据来源: profiles + assessment_results + emotion_states
// ==========================================

export default function AdminStudentDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [showAllAssessments, setShowAllAssessments] = useState(false);

  // 1. 获取学生基本信息（带权限校验）
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["admin-student-profile", userId],
    queryFn: async () => {
      // Step 0: 获取当前管理员/老师的权限
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: currentUser } = await supabase
        .from("profiles")
        .select("role, class_name, college_name, school_name")
        .eq("user_id", user.id)
        .single();
      
      const role = (currentUser as any)?.role;
      const userClass = (currentUser as any)?.class_name;
      const userCollege = (currentUser as any)?.college_name;
      const userSchool = (currentUser as any)?.school_name;

      // Step 1: 获取目标学生信息
      const { data: targetProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .single();
      
      if (error || !targetProfile) return null;

      // Step 2: 校验三重组织边界 (如果是老师身份)
      if (role === "teacher") {
        const t = targetProfile as any;
        const isMismatch = 
          (userSchool && t.school_name !== userSchool) ||
          (userCollege && t.college_name !== userCollege) ||
          (userClass && t.class_name !== userClass);

        if (isMismatch) {
          toast.error("越权访问限制：您只能查看所属学校、学院及班级的学生资料");
          navigate("/admin/users");
          return null;
        }
      }

      return targetProfile;
    },
    enabled: !!userId,
  });

  // 2. 获取全部测评记录
  const { data: assessments } = useQuery({
    queryKey: ["admin-student-assessments", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("assessment_results")
        .select("id, severity, total_score, scale_type, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  // 3. 获取情绪轨迹
  const { data: emotions } = useQuery({
    queryKey: ["admin-student-emotions", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("emotion_states")
        .select("anxiety_score, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  // 情绪趋势图数据
  const emotionChartData = emotions?.map(e => ({
    date: new Date(e.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    焦虑指数: e.anxiety_score || 0,
  })) || [];

  // 测评分布统计
  const assessmentStats = (() => {
    const map: Record<string, number> = {};
    assessments?.forEach(a => {
      map[a.severity] = (map[a.severity] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: getBarColor(name),
    }));
  })();

  // 可展示的测评列表
  const visibleAssessments = showAllAssessments
    ? assessments
    : assessments?.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学生列表
      </button>

      {/* 学生信息头 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* 头像 */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {profile?.display_name?.charAt(0) || "U"}
            </span>
          </div>

          {/* 信息 */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {profile?.display_name || "未命名用户"}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <UserCircle className="w-3.5 h-3.5" />
                ID: {userId?.slice(0, 8)}...
              </span>
              {profile?.life_stage && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-muted/40 rounded-full">
                  {profile.life_stage}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                角色: {(profile as any)?.role || "user"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                注册: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("zh-CN") : "未知"}
              </span>
            </div>
            {profile?.bio && (
              <p className="mt-3 text-sm text-muted-foreground/80 italic">
                「{profile.bio}」
              </p>
            )}
          </div>

          {/* KPI 快览 */}
          <div className="flex gap-4">
            <MiniKPI label="测评总数" value={assessments?.length || 0} icon={FileText} />
            <MiniKPI label="情绪记录" value={emotions?.length || 0} icon={Activity} />
            <MiniKPI
              label="最新焦虑"
              value={emotions?.length ? emotions[emotions.length - 1].anxiety_score?.toFixed(2) || "0" : "—"}
              icon={TrendingUp}
            />
          </div>
        </div>
      </motion.div>

      {/* 数据看板区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 焦虑指数趋势图 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-xl"
        >
          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            焦虑指数变化趋势
          </h4>
          {emotionChartData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              暂无情绪数据记录
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emotionChartData}>
                  <defs>
                    <linearGradient id="colorAnxDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis domain={[0, 1]} hide />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(23, 23, 23, 0.8)",
                      borderRadius: "16px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(12px)",
                    }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="焦虑指数"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAnxDetail)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* 测评结果分布 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-xl"
        >
          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-accent rounded-full" />
            测评结果分布
          </h4>
          {assessmentStats.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              暂无测评记录
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={90}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(23, 23, 23, 0.8)",
                      borderRadius: "16px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                    {assessmentStats.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* 测评历史时间线 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
            测评历史时间线
          </h4>
          <span className="text-xs text-muted-foreground">
            共 {assessments?.length || 0} 条记录
          </span>
        </div>

        {visibleAssessments && visibleAssessments.length > 0 ? (
          <div className="space-y-3">
            {visibleAssessments.map((a, idx) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-colors border border-transparent hover:border-border/40 cursor-pointer"
                onClick={() => navigate(`/admin/reports/${a.id}`)}
              >
                {/* 时间轴圆点 */}
                <div className="mt-1 w-3 h-3 rounded-full border-2 border-primary/40 bg-background flex-shrink-0" />

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{a.scale_type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getSeverityStyle(a.severity)}`}>
                      {a.severity}
                    </span>
                    {a.total_score !== null && (
                      <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                        得分: {a.total_score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(a.created_at).toLocaleString("zh-CN")}
                  </div>
                </div>

                <AlertCircle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
              </motion.div>
            ))}

            {/* 展开/收起 */}
            {assessments && assessments.length > 5 && (
              <button
                onClick={() => setShowAllAssessments(!showAllAssessments)}
                className="w-full flex items-center justify-center gap-1 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAllAssessments ? (
                  <>收起 <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>查看全部 {assessments.length} 条记录 <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            该学生暂无测评记录
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ==========================================
// 辅助组件和函数
// ==========================================

function MiniKPI({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="text-center px-4 py-3 rounded-2xl bg-muted/20 border border-border/30">
      <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

function getBarColor(severity: string): string {
  const high = ["高风险", "重度抑郁", "重度焦虑", "严重", "危机"];
  const mid = ["中度抑郁", "中度焦虑", "中等风险"];
  const low = ["需关注", "轻度焦虑", "轻度抑郁", "低风险"];
  if (high.includes(severity)) return "#ef4444";
  if (mid.includes(severity)) return "#f59e0b";
  if (low.includes(severity)) return "#eab308";
  return "#10b981";
}

function getSeverityStyle(severity: string): string {
  const high = ["高风险", "重度抑郁", "重度焦虑", "严重", "危机"];
  const mid = ["中度抑郁", "中度焦虑", "中等风险"];
  const low = ["需关注", "轻度焦虑", "轻度抑郁", "低风险"];
  if (high.includes(severity)) return "bg-red-500/10 text-red-500";
  if (mid.includes(severity)) return "bg-orange-500/10 text-orange-500";
  if (low.includes(severity)) return "bg-yellow-500/10 text-yellow-600";
  return "bg-emerald-500/10 text-emerald-500";
}
