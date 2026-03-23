import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIQAStats {
  avgEmpathy: number;
  avgProfessionalism: number;
  avgSafety: number;
  avgMemory: number;
  overallScore: number;
  totalEvaluations: number;
  scoreDistribution: { name: string; value: number }[];
  lowScoreEvaluations: any[];
}

export function useAIQAStats() {
  return useQuery({
    queryKey: ["admin-ai-qa-stats"],
    queryFn: async (): Promise<AIQAStats> => {
      // Step 0: 获取当前管理员/老师个人权限
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未认证");

      const { data: currentUser } = await supabase
        .from("profiles")
        .select("role, class_name, college_name, school_name")
        .eq("user_id", user.id)
        .single();
      
      const role = (currentUser as any)?.role;
      const userClass = (currentUser as any)?.class_name;
      const userCollege = (currentUser as any)?.college_name;
      const userSchool = (currentUser as any)?.school_name;

      // Step 1: 获取目标学生列表 (如果是老师身份，则三重过滤)
      let query = (supabase.from("profiles").select("user_id").eq("role", "user")) as any;
      if (role === "teacher") {
        if (userSchool) query = query.eq("school_name", userSchool);
        if (userCollege) query = query.eq("college_name", userCollege);
        if (userClass) query = query.eq("class_name", userClass);
      }
      const { data: profiles } = await query;
      const targetUserIds = (profiles || []).map(p => p.user_id);

      if (targetUserIds.length === 0) {
        return {
          avgEmpathy: 0,
          avgProfessionalism: 0,
          avgSafety: 0,
          avgMemory: 0,
          overallScore: 0,
          totalEvaluations: 0,
          scoreDistribution: [],
          lowScoreEvaluations: [],
        };
      }

      // Step 2: 获取这些学生的对话 ID
      const { data: convs } = await supabase
        .from("chat_conversations")
        .select("id")
        .in("user_id", targetUserIds);
      
      const targetConvIds = (convs || []).map(c => c.id);

      if (targetConvIds.length === 0) {
         return {
          avgEmpathy: 0,
          avgProfessionalism: 0,
          avgSafety: 0,
          avgMemory: 0,
          overallScore: 0,
          totalEvaluations: 0,
          scoreDistribution: [],
          lowScoreEvaluations: [],
        };
      }

      // Step 3: 获取对应的评价数据
      const { data: evals } = await supabase
        .from("response_evaluations")
        .select("*")
        .in("conversation_id", targetConvIds)
        .order("created_at", { ascending: false });

      if (!evals || evals.length === 0) {
        return {
          avgEmpathy: 0,
          avgProfessionalism: 0,
          avgSafety: 0,
          avgMemory: 0,
          overallScore: 0,
          totalEvaluations: 0,
          scoreDistribution: [],
          lowScoreEvaluations: [],
        };
      }

      const total = evals.length;
      
      // 2. 计算平均分
      const sumEmpathy = evals.reduce((acc, curr) => acc + (curr.empathy_score || 0), 0);
      const sumProf = evals.reduce((acc, curr) => acc + (curr.professionalism_score || 0), 0);
      const sumSafety = evals.reduce((acc, curr) => acc + (curr.safety_score || 0), 0);
      const sumMemory = evals.reduce((acc, curr) => acc + (curr.memory_utilization || 0), 0);
      const sumOverall = evals.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);

      // 3. 统计分布 (0-60, 60-80, 80-100)
      let low = 0, mid = 0, high = 0;
      evals.forEach(e => {
        const score = e.overall_score || 0;
        if (score < 60) low++;
        else if (score < 85) mid++;
        else high++;
      });

      // 4. 获取低分样本 (Overall Score < 75)
      const lowScoreEvaluations = evals
        .filter(e => (e.overall_score || 0) < 75)
        .slice(0, 10);

      return {
        avgEmpathy: Number((sumEmpathy / total).toFixed(1)),
        avgProfessionalism: Number((sumProf / total).toFixed(1)),
        avgSafety: Number((sumSafety / total).toFixed(1)),
        avgMemory: Number((sumMemory / total).toFixed(1)),
        overallScore: Number((sumOverall / total).toFixed(1)),
        totalEvaluations: total,
        scoreDistribution: [
          { name: "优秀 (85-100)", value: high },
          { name: "良好 (60-84)", value: mid },
          { name: "需改进 (<60)", value: low },
        ],
        lowScoreEvaluations,
      };
    },
    refetchInterval: 60000, 
  });
}
