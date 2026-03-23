import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  totalAssessments: number;
  highRiskCount: number;
  avgAnxiety: number;
  severityDistribution: { name: string; value: number; color: string }[];
  emotionTrend: { date: string; score: number }[];
}

// ==========================================
// 真实数据库 severity 字段的中文分级映射
// 基于 2026-03-22 从 Supabase 实际拉取的数据
// ==========================================
const SEVERITY_GREEN = ["正常", "无抑郁症状", "ISTJ", "INFP", "ENFJ", "ENTP", "INTJ", "INTP", "ISFJ", "ISFP", "ESTJ", "ESTP", "ESFJ", "ESFP", "ENTJ", "ENFP", "INFJ", "ISTP"];
const SEVERITY_YELLOW = ["低风险", "一般", "轻度焦虑", "轻度抑郁", "需关注"];
const SEVERITY_RED = ["中度抑郁", "中度焦虑", "中等风险", "高风险", "重度抑郁", "重度焦虑", "严重", "危机"];

function classifySeverity(severity: string): "green" | "yellow" | "red" {
  if (SEVERITY_RED.includes(severity)) return "red";
  if (SEVERITY_YELLOW.includes(severity)) return "yellow";
  return "green"; // 默认归入健康
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // 1. 获取用户总数 (从 profiles 表)
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 2. 获取全部测评记录 (assessment_results)
      const { data: assessments } = await supabase
        .from("assessment_results")
        .select("severity, created_at");

      const totalAssessments = assessments?.length || 0;

      // 3. 基于真实中文 severity 进行分级统计
      let greenCount = 0;
      let yellowCount = 0;
      let redCount = 0;

      assessments?.forEach(a => {
        const level = classifySeverity(a.severity || "正常");
        if (level === "green") greenCount++;
        else if (level === "yellow") yellowCount++;
        else redCount++;
      });

      const severityDistribution = [
        { name: "健康/正常", value: greenCount, color: "#10b981" },
        { name: "轻度/需关注", value: yellowCount, color: "#f59e0b" },
        { name: "中度/高危", value: redCount, color: "#ef4444" },
      ];

      // 4. 获取情绪趋势 (emotion_states 表)
      const { data: emotions } = await supabase
        .from("emotion_states")
        .select("anxiety_score, created_at")
        .order("created_at", { ascending: true })
        .limit(100);

      // 5. 计算平均焦虑指数
      const avgAnxiety = emotions?.length
        ? Number(
            (emotions.reduce((acc, curr) => acc + (curr.anxiety_score || 0), 0) / emotions.length).toFixed(2)
          )
        : 0;

      // 6. 取最近 10 条作为趋势图数据
      const emotionTrend = emotions?.slice(-10).map(e => ({
        date: new Date(e.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
        score: e.anxiety_score || 0
      })) || [];

      return {
        totalUsers: userCount || 0,
        totalAssessments,
        highRiskCount: redCount,
        avgAnxiety,
        severityDistribution,
        emotionTrend,
      };
    },
    refetchInterval: 30000, // 每30秒自动刷新
  });
}
