import { createClient } from "@supabase/supabase-js";

// 请在脚本中填入您的 Supabase Service Role Key 才能查询 auth.users 
const SUPABASE_URL = "https://bfulclzhplppkkosfegn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "PASTE_YOUR_SERVICE_ROLE_KEY_HERE"; 

async function checkAdminStatus() {
  if (SUPABASE_SERVICE_ROLE_KEY === "PASTE_YOUR_SERVICE_ROLE_KEY_HERE") {
     console.log("--------------------------------------------------");
     console.log("错误: 请先填入您的 Supabase Service Role Key！");
     console.log("位置: Supabase 控制台 -> Settings -> API -> service_role");
     console.log("--------------------------------------------------");
     return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("正在调取云端权限档案...");
  
  // 1. 获取所有用户
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth 查询失败:", authError.message);
    return;
  }

  // 2. 获取所有档案
  const { data: profiles, error: dbError } = await supabase
    .from("profiles")
    .select("user_id, display_name, role");
  
  if (dbError) {
    console.error("数据库查询失败:", dbError.message);
    return;
  }

  console.log("\n--- 权限校验报告 ---");
  
  const targetEmails = ["1279710455@qq.com"];
  const targetNames = ["1"];

  profiles?.forEach(p => {
    const authUser = users.find(u => u.id === p.user_id);
    const email = authUser?.email || "N/A";
    const name = p.display_name || "N/A";
    const isAdmin = p.role === "admin";

    if (targetEmails.includes(email) || targetNames.includes(name)) {
      console.log(`用户: [${name}] | 邮箱: [${email}] | 当前角色: [${p.role}] | ${isAdmin ? "✅ 已是管理员" : "❌ 非管理员"}`);
    }
  });

  console.log("--------------------\n");
}

checkAdminStatus();
