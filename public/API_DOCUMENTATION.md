# 🌿 心灵花园 (Heart Garden) API 文档

## 基本信息

| 项目 | 值 |
|---|---|
| **Base URL** | `https://bfulclzhplppkkosfegn.supabase.co/functions/v1` |
| **协议** | HTTPS |
| **认证方式** | Bearer Token (JWT 或 anon key) |
| **内容类型** | `application/json` |
| **跨域(CORS)** | 已启用，支持所有来源 |

---

## 通用请求头

所有接口均需携带以下 Headers：

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN 或 ANON_KEY>
apikey: <ANON_KEY>
```

| Header | 必填 | 说明 |
|---|---|---|
| `Content-Type` | ✅ | 固定为 `application/json` |
| `Authorization` | ✅ | `Bearer` + 用户JWT token（已登录）或 anon key（未登录） |
| `apikey` | ✅ | 项目的 anon key（公开密钥） |

---

## 通用错误码

| HTTP 状态码 | 含义 |
|---|---|
| `200` | 成功 |
| `429` | 请求过于频繁，请稍后再试 |
| `500` | 服务内部错误 |
| `402` | AI 服务额度不足 |

错误响应格式：
```json
{
  "error": "错误描述信息"
}
```

---

## 1. 💬 AI 对话 — `/chat`

智能心理陪伴对话，支持 SSE 流式输出。具备长期记忆、情绪感知、知识图谱上下文。

### 请求

```
POST /chat
```

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "我今天心情不太好" },
    { "role": "assistant", "content": "发生什么事了吗？" },
    { "role": "user", "content": "工作压力太大了" }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `messages` | `Array<Message>` | ✅ | 对话历史 |
| `messages[].role` | `string` | ✅ | `"user"` 或 `"assistant"` |
| `messages[].content` | `string` | ✅ | 消息内容 |

### 响应

**Content-Type:** `text/event-stream` (SSE 流式)

```
data: {"choices":[{"delta":{"content":"我"}}]}

data: {"choices":[{"delta":{"content":"理解"}}]}

data: {"choices":[{"delta":{"content":"你的感受"}}]}

data: [DONE]
```

每条 SSE 数据格式：
```json
{
  "choices": [
    {
      "delta": {
        "content": "增量文本片段"
      }
    }
  ]
}
```

### 特性

- ✅ 自动加载用户长期记忆（Mem0）
- ✅ 感知情绪变化趋势（Emote-AI 双轴模型）
- ✅ 引用知识图谱（Zep 风格）中的人物/关系
- ✅ 基于 CBT、正念等心理学方法回应
- ✅ 需要已登录用户的 JWT 才能获取个性化上下文

### 调用示例

```javascript
const response = await fetch(
  "https://bfulclzhplppkkosfegn.supabase.co/functions/v1/chat",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer <YOUR_TOKEN>",
      "apikey": "<ANON_KEY>"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "我最近总是失眠" }]
    })
  }
);

// 读取 SSE 流
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // 解析 "data: {...}" 行
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      const json = JSON.parse(line.slice(6));
      const content = json.choices?.[0]?.delta?.content;
      if (content) console.log(content);
    }
  }
}
```

---

## 2. 🌸 情绪分析 — `/analyze-mood`

分析用户输入的心情文本，返回结构化情绪数据，用于花园种植系统。

### 请求

```
POST /analyze-mood
```

**Request Body:**

```json
{
  "content": "今天被老板骂了，觉得很委屈，但是同事安慰了我"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `content` | `string` | ✅ | 用户的心情描述文本 |

### 响应

```json
{
  "mood_type": "sad",
  "bloom_color": "hsl(220, 50%, 60%)",
  "growth_stage": 15,
  "analysis": "虽然有委屈，但同事的温暖让你并不孤单",
  "emoji": "🥺",
  "plant_name": "暖风草"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `mood_type` | `string` | 情绪类型：`happy` / `calm` / `anxious` / `sad` / `angry` / `hopeful` / `grateful` / `lonely` |
| `bloom_color` | `string` | 花朵 HSL 颜色值，如 `hsl(350, 60%, 65%)` |
| `growth_stage` | `number` | 初始成长阶段，范围 `0-30` |
| `analysis` | `string` | 情绪分析和建议，50字以内 |
| `emoji` | `string` | 代表情绪的 emoji |
| `plant_name` | `string` | 为种子取的诗意中文名 |

### 调用示例

```javascript
const response = await fetch(
  "https://bfulclzhplppkkosfegn.supabase.co/functions/v1/analyze-mood",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer <YOUR_TOKEN>",
      "apikey": "<ANON_KEY>"
    },
    body: JSON.stringify({
      content: "今天阳光很好，心情也变好了"
    })
  }
);

const result = await response.json();
console.log(result);
// { mood_type: "happy", bloom_color: "hsl(45, 70%, 60%)", ... }
```

---

## 3. 🧠 记忆提取 — `/extract-memories`

从对话中提取长期记忆、知识图谱实体/关系、情绪状态，并写入数据库。

### 请求

```
POST /extract-memories
```

**Request Body:**

```json
{
  "user_id": "uuid-of-the-user",
  "messages": [
    { "role": "user", "content": "我和小明去了公园，他是我最好的朋友" },
    { "role": "assistant", "content": "听起来你们关系很好呢" },
    { "role": "user", "content": "是的，他总是在我难过的时候陪着我" }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `user_id` | `string` | ✅ | 用户 UUID |
| `messages` | `Array<Message>` | ✅ | 对话历史（取最近8条分析） |
| `messages[].role` | `string` | ✅ | `"user"` 或 `"assistant"` |
| `messages[].content` | `string` | ✅ | 消息内容 |

### 响应

```json
{
  "ok": true,
  "stats": {
    "memories_added": 2,
    "memories_updated": 1,
    "memories_deleted": 0,
    "entities": 2,
    "relations": 1,
    "emotion": true
  }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `ok` | `boolean` | 是否成功 |
| `stats.memories_added` | `number` | 新增记忆条数 |
| `stats.memories_updated` | `number` | 更新记忆条数 |
| `stats.memories_deleted` | `number` | 删除过时记忆条数 |
| `stats.entities` | `number` | 提取的知识图谱实体数 |
| `stats.relations` | `number` | 提取的实体关系数 |
| `stats.emotion` | `boolean` | 是否记录了情绪状态 |

### 内部处理流程

1. **Mem0 记忆操作** — 对比已有记忆，执行 ADD/UPDATE/DELETE
2. **Zep 知识图谱** — 提取人物、地点、事件等实体及关系，upsert 到数据库
3. **Emote-AI 情绪建模** — 计算欲望/焦虑双轴分数、效价、唤醒度，记录情绪状态

### 写入的数据库表

| 表名 | 写入内容 |
|---|---|
| `user_memories` | 长期记忆（分类：emotion/preference/event/health/relationship） |
| `knowledge_entities` | 知识图谱实体（人物/地点/事件/概念） |
| `knowledge_edges` | 实体间关系及权重 |
| `emotion_states` | 情绪状态快照（双轴模型） |

---

## 4. 🛡️ 安全风险检测 — `/security-check`

分析用户提交的可疑信息（诈骗短信、杀猪盘、有害信息等），返回风险评估报告。

### 请求

```
POST /security-check
```

**Request Body:**

```json
{
  "content": "恭喜您中了100万大奖！请点击链接领取：http://fake-link.com，需要先缴纳2000元手续费"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `content` | `string` | ✅ | 待检测的可疑信息内容 |

### 响应

```json
{
  "risk_score": 92,
  "risk_level": "critical",
  "threat_type": "中奖诈骗",
  "analysis": "该信息包含典型的中奖诈骗特征：虚假中奖通知、可疑链接、要求预付费用",
  "tips": [
    "不要点击任何陌生链接",
    "正规活动不会要求预付手续费",
    "可以通过官方渠道核实活动真伪",
    "如已点击链接，立即修改相关密码",
    "可向当地反诈中心举报"
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `risk_score` | `number` | 风险分数 `0-100`，越高越危险 |
| `risk_level` | `string` | 风险等级：`safe` / `low` / `medium` / `high` / `critical` |
| `threat_type` | `string` | 威胁类型（投资诈骗、钓鱼链接、情感操控等） |
| `analysis` | `string` | 详细分析说明 |
| `tips` | `string[]` | 安全建议列表，3-5条 |

### 调用示例

```javascript
const response = await fetch(
  "https://bfulclzhplppkkosfegn.supabase.co/functions/v1/security-check",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer <YOUR_TOKEN>",
      "apikey": "<ANON_KEY>"
    },
    body: JSON.stringify({
      content: "有人加我微信说带我投资，保证月收益30%"
    })
  }
);

const result = await response.json();
console.log(result.risk_level); // "high"
console.log(result.tips);       // ["不要轻信高回报承诺", ...]
```

---

## 数据库表结构参考

### `profiles` — 用户档案
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `display_name` | text | 昵称 |
| `avatar_url` | text | 头像URL |
| `bio` | text | 个人简介 |
| `life_stage` | text | 人生阶段 |
| `garden_level` | int | 花园等级 |
| `total_seeds` | int | 累计种子数 |
| `is_first_login` | bool | 是否首次登录 |

### `plants` — 花园植物
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `mood_type` | text | 情绪类型 |
| `content` | text | 心情内容 |
| `bloom_color` | text | 花朵颜色 |
| `growth_stage` | int | 成长阶段 |
| `ai_analysis` | json | AI分析结果 |
| `is_public` | bool | 是否公开 |

### `chat_conversations` — 对话会话
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `title` | text | 会话标题 |

### `chat_messages` — 聊天消息
| 字段 | 类型 | 说明 |
|---|---|---|
| `conversation_id` | uuid | 所属会话ID |
| `user_id` | uuid | 用户ID |
| `role` | text | `user` / `assistant` |
| `content` | text | 消息内容 |

### `user_memories` — 长期记忆 (Mem0)
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `category` | text | 分类：emotion/preference/event/health/relationship |
| `content` | text | 记忆内容 |
| `importance` | int | 重要性 1-10 |
| `decay_score` | float | 衰减分数 0-1 |
| `access_count` | int | 访问次数 |
| `source` | text | 来源 |

### `emotion_states` — 情绪状态
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `desire_score` | float | 欲望/动机 0-1 |
| `anxiety_score` | float | 焦虑度 0-1 |
| `valence` | float | 效价 -1~1 |
| `arousal` | float | 唤醒度 0-1 |
| `dominant_emotion` | text | 主要情绪 |
| `source` | text | 来源 |

### `knowledge_entities` — 知识图谱实体
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `name` | text | 实体名称 |
| `entity_type` | text | 类型：person/place/event/concept/emotion/activity |
| `mention_count` | int | 提及次数 |
| `attributes` | json | 属性 |

### `knowledge_edges` — 知识图谱关系
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `source_entity` | text | 源实体 |
| `target_entity` | text | 目标实体 |
| `relation` | text | 关系类型 |
| `weight` | float | 权重 |
| `context` | text | 上下文 |

### `security_inbox` — 安全检测记录
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `content` | text | 原始内容 |
| `risk_score` | float | 风险分数 |
| `risk_level` | text | 风险等级 |
| `ai_report` | json | AI报告 |
| `security_tips` | json | 安全建议 |
| `status` | text | 处理状态 |

### `assessment_results` — 心理评估结果
| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | uuid | 用户ID |
| `scale_type` | text | 量表类型 |
| `total_score` | int | 总分 |
| `max_score` | int | 满分 |
| `severity` | text | 严重程度 |
| `answers` | json | 答案详情 |
| `ai_summary` | text | AI总结 |

---

## 注意事项

1. **认证**：所有接口的 `verify_jwt` 已设为 `false`，但 `chat` 接口会通过 JWT 获取用户上下文以提供个性化回复
2. **频率限制**：DeepSeek API 有调用频率限制，遇到 `429` 状态码时请等待后重试
3. **流式响应**：`chat` 接口返回 SSE 流，需要使用 `ReadableStream` 解析
4. **数据写入**：`extract-memories` 使用 Service Role Key 直接写入数据库，不受 RLS 限制
5. **跨域**：所有接口已配置 CORS，支持从任意前端域名调用
