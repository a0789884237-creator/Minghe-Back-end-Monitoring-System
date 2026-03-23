import { createClient } from "@supabase/supabase-js";

// ⚠️ 请在 Supabase 控制台的 Project Settings -> API 中找到 service_role (secret) key 并替换下方内容
const SUPABASE_URL = "https://bfulclzhplppkkosfegn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "PASTE_YOUR_SERVICE_ROLE_KEY_HERE"; 

const EMAIL_TO_UPGRADE = "1279710455@qq.com";

async function setAdmin() {
  if (SUPABASE_SERVICE_ROLE_KEY === "PASTE_YOUR_SERVICE_ROLE_KEY_HERE") {
     console.log("--------------------------------------------------");
     console.log("错误: 请先填入您的 Supabase Service Role Key！");
     console.log("位置: Supabase 控制台 -> Settings -> API -> service_role");
     console.log("--------------------------------------------------");
     return;
  }

  // 使用 Service Role Key 初始化客户端以绕过一切 RLS 限制
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`正在通过 Auth 系统查找邮箱: ${EMAIL_TO_UPGRADE}...`);
  
  // 1. 获取对应的 User ID
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error("Auth 查询失败 (请确认 Key 是否正确):", authError.message);
    return;
  }

  const targetUser = users.find(u => u.email === EMAIL_TO_UPGRADE);

  if (!targetUser) {
    console.error(`未在系统中找到注册邮箱为 ${EMAIL_TO_UPGRADE} 的用户，请先确保该用户已完成注册。`);
    return;
  }

  console.log(`找到用户 ID: ${targetUser.id}，正在同步更新其管理权限...`);

  // 2. 更新 profiles 表中的 role 字段
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ role: "admin" } as any)
    .eq("user_id", targetUser.id);

  if (dbError) {
    console.error("数据库更新失败:", dbError.message);
  } else {
    console.log("==========================================");
    console.log(`🎉 成功！用户 [${EMAIL_TO_UPGRADE}] 已获得管理员权限。`);
    console.log("==========================================");
  }
}

setAdmin();
