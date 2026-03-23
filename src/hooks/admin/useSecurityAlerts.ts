import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SecurityAlert {
  id: string;
  user_id: string;
  content: string;
  risk_level: "low" | "medium" | "high" | "critical" | string;
  risk_score: number;
  status: string;
  created_at: string;
  display_name?: string;
}

export function useSecurityAlerts() {
  return useQuery({
    queryKey: ["admin-security-alerts"],
    queryFn: async (): Promise<SecurityAlert[]> => {
      // 1. 获取所有安全报警
      const { data: alerts } = await supabase
        .from("security_inbox")
        .select("*")
        .order("created_at", { ascending: false });

      if (!alerts || alerts.length === 0) return [];

      // 2. 获取相关用户的 display_name
      const userIds = [...new Set(alerts.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name])
      );

      // 3. 合并数据
      return alerts.map(a => ({
        ...a,
        display_name: profileMap.get(a.user_id) || "匿名用户"
      }));
    },
    refetchInterval: 15000, // 15秒刷新一次，比其他模块更频繁
  });
}
