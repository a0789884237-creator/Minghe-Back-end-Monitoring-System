import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Activity,
  FileText,
  Clock,
  ArrowUpDown,
  UserCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// ==========================================
// 学生档案 - 列表页
// 真实数据来源: profiles + assessment_results + emotion_states
// ==========================================

interface StudentProfile {
  user_id: string;
  display_name: string | null;
  life_stage: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  // 聚合数据
  assessmentCount: number;
  latestSeverity: string | null;
  latestAnxiety: number | null;
  lastActiveAt: string | null;
}

export default function AdminStudents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "risk" | "recent">("recent");

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async (): Promise<StudentProfile[]> => {
      // Step 0: 获取当前登录者的角色和班级
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("role, class_name, college_name, school_name")
        .eq("user_id", user.id)
        .single();
      
      const role = (currentUserProfile as any)?.role;
      const userClass = (currentUserProfile as any)?.class_name;
      const userCollege = (currentUserProfile as any)?.college_name;
      const userSchool = (currentUserProfile as any)?.school_name;

      // Step 1: 拉取 profiles (根据角色过滤)
      let query = (supabase
        .from("profiles")
        .select("*")
        .eq("role", "user")) as any;

      // 老师身份：三重组织边界锁定
      if (role === "teacher") {
        if (userSchool) query = query.eq("school_name", userSchool);
        if (userCollege) query = query.eq("college_name", userCollege);
        if (userClass) query = query.eq("class_name", userClass);
      }

      const { data: profiles, error: profilesError } = await query.order("created_at", { ascending: false });

      if (profilesError || !profiles || profiles.length === 0) return [];

      const studentIds = (profiles as any[]).map((p: any) => p.user_id);

      // Step 2: 拉取这些学生的测评结果
      const { data: assessments } = await supabase
        .from("assessment_results")
        .select("user_id, severity, created_at")
        .in("user_id", studentIds)
        .order("created_at", { ascending: false }) as any;

      // Step 3: 拉取这些学生的情绪数据
      const { data: emotions } = await supabase
        .from("emotion_states")
        .select("user_id, anxiety_score, created_at")
        .in("user_id", studentIds)
        .order("created_at", { ascending: false }) as any;

      // Step 4: 按 user_id 聚合
      const assessmentMap = new Map<string, { count: number; latestSeverity: string; latestAt: string }>();
      assessments?.forEach(a => {
        const existing = assessmentMap.get(a.user_id);
        if (!existing) {
          assessmentMap.set(a.user_id, {
            count: 1,
            latestSeverity: a.severity,
            latestAt: a.created_at,
          });
        } else {
          existing.count++;
        }
      });

      const emotionMap = new Map<string, { latestAnxiety: number; latestAt: string }>();
      emotions?.forEach(e => {
        if (!emotionMap.has(e.user_id)) {
          emotionMap.set(e.user_id, {
            latestAnxiety: e.anxiety_score || 0,
            latestAt: e.created_at,
          });
        }
      });

      // Step 5: 合并
      return (profiles as any[]).map(p => {
        const agg = assessmentMap.get(p.user_id);
        const emo = emotionMap.get(p.user_id);
        return {
          ...p,
          role: p.role || "user",
          assessmentCount: agg?.count || 0,
          latestSeverity: agg?.latestSeverity || null,
          latestAnxiety: emo?.latestAnxiety ?? null,
          lastActiveAt: agg?.latestAt || emo?.latestAt || p.created_at,
        };
      });
    },
    refetchInterval: 60000,
  });

  // 搜索过滤
  const filtered = students?.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.display_name?.toLowerCase().includes(term) ||
      s.user_id.toLowerCase().includes(term) ||
      s.life_stage?.toLowerCase().includes(term)
    );
  }) || [];

  // 排序
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return (a.display_name || "").localeCompare(b.display_name || "");
    if (sortBy === "risk") return getRiskScore(b.latestSeverity) - getRiskScore(a.latestSeverity);
    return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
  });

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            学生档案库
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            共 {students?.length || 0} 名注册学生 · 数据来源: Supabase 实时读取
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索姓名 / ID / 阶段..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-card border border-border/40 text-sm focus:outline-none focus:border-primary/40 w-64"
            />
          </div>
          <div className="flex rounded-xl border border-border/40 overflow-hidden">
            {(["recent", "name", "risk"] as const).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-2 text-xs font-bold transition-colors ${
                  sortBy === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-border/20"
                }`}
              >
                {key === "recent" ? "最近" : key === "name" ? "姓名" : "风险"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 统计摘要卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="总学生数" value={students?.length || 0} icon={Users} color="text-blue-500" />
        <StatCard label="有测评记录" value={students?.filter(s => s.assessmentCount > 0).length || 0} icon={FileText} color="text-emerald-500" />
        <StatCard label="有情绪记录" value={students?.filter(s => s.latestAnxiety !== null).length || 0} icon={Activity} color="text-amber-500" />
        <StatCard label="需关注" value={students?.filter(s => getRiskScore(s.latestSeverity) >= 2).length || 0} icon={Filter} color="text-red-500" />
      </div>

      {/* 学生列表 */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-card/20 animate-pulse border border-border/40" />
          ))
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center bg-card/10 rounded-3xl border border-dashed border-border/40">
            <UserCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">未找到匹配的学生记录</p>
          </div>
        ) : (
          sorted.map((student, index) => (
            <motion.div
              key={student.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => navigate(`/admin/users/${student.user_id}`)}
              className="p-4 md:p-5 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm hover:border-primary/40 hover:bg-card/40 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* 头像 */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(student.latestSeverity)}`}>
                  {student.display_name?.charAt(0) || "U"}
                </div>

                {/* 基本信息 */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{student.display_name || "未命名用户"}</span>
                    {student.latestSeverity && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getSeverityBadge(student.latestSeverity)}`}>
                        {student.latestSeverity}
                      </span>
                    )}
                    {student.life_stage && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                        {student.life_stage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {student.assessmentCount} 次测评
                    </span>
                    {student.latestAnxiety !== null && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        焦虑指数: {student.latestAnxiety.toFixed(2)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {student.lastActiveAt
                        ? timeAgo(student.lastActiveAt)
                        : "无活动"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧箭头 */}
              <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 辅助组件和函数
// ==========================================

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function getRiskScore(severity: string | null): number {
  if (!severity) return 0;
  const high = ["高风险", "重度抑郁", "重度焦虑", "严重", "危机"];
  const mid = ["中度抑郁", "中度焦虑", "中等风险"];
  const low = ["需关注", "轻度焦虑", "轻度抑郁", "低风险"];
  if (high.includes(severity)) return 3;
  if (mid.includes(severity)) return 2;
  if (low.includes(severity)) return 1;
  return 0;
}

function getAvatarColor(severity: string | null): string {
  const risk = getRiskScore(severity);
  if (risk >= 3) return "bg-red-500/20 text-red-500";
  if (risk >= 2) return "bg-orange-500/20 text-orange-500";
  if (risk >= 1) return "bg-yellow-500/20 text-yellow-600";
  return "bg-primary/10 text-primary";
}

function getSeverityBadge(severity: string): string {
  const risk = getRiskScore(severity);
  if (risk >= 3) return "bg-red-500/10 text-red-500";
  if (risk >= 2) return "bg-orange-500/10 text-orange-500";
  if (risk >= 1) return "bg-yellow-500/10 text-yellow-600";
  return "bg-emerald-500/10 text-emerald-500";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 月前`;
}
