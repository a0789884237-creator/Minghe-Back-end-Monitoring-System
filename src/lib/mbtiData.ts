// MBTI Personality Test - 70 Questions (Chinese Version)
// Based on Myers-Briggs Type Indicator standard questionnaire
// Source: http://www.lrjj.cn/encrm1.0/public/upload/MBTI-personality-test.pdf

export type MBTIDimension = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export interface MBTIQuestion {
  no: number;
  question: string;
  answerOptions: [
    { type: "A"; answer: string; score: MBTIDimension },
    { type: "B"; answer: string; score: MBTIDimension }
  ];
}

export interface MBTIResult {
  type: string; // e.g. "INTJ"
  name: string;
  nickname: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  careers: string[];
  dimensions: {
    E: number; I: number;
    S: number; N: number;
    T: number; F: number;
    J: number; P: number;
  };
}

// 70 standard MBTI questions - Chinese version
export const mbtiQuestions: MBTIQuestion[] = [
  // === E/I 维度 (外向/内向) - Questions about energy source ===
  { no: 1, question: "在社交聚会中，你通常：", answerOptions: [{ type: "A", answer: "与很多人交流，包括陌生人", score: "E" }, { type: "B", answer: "只与少数熟悉的人交流", score: "I" }] },
  { no: 2, question: "你更倾向于认为自己是：", answerOptions: [{ type: "A", answer: "一个善于社交的人", score: "E" }, { type: "B", answer: "一个比较内敛的人", score: "I" }] },
  { no: 3, question: "在一群人中，你通常：", answerOptions: [{ type: "A", answer: "主动介绍自己", score: "E" }, { type: "B", answer: "等别人来介绍自己", score: "I" }] },
  { no: 4, question: "下班/放学后，你更愿意：", answerOptions: [{ type: "A", answer: "和朋友一起活动", score: "E" }, { type: "B", answer: "独自休息或做自己的事", score: "I" }] },
  { no: 5, question: "你通常更喜欢：", answerOptions: [{ type: "A", answer: "在人群中获得能量", score: "E" }, { type: "B", answer: "在独处中恢复能量", score: "I" }] },
  { no: 6, question: "在讨论中，你倾向于：", answerOptions: [{ type: "A", answer: "边说边想", score: "E" }, { type: "B", answer: "想好了再说", score: "I" }] },
  { no: 7, question: "你更享受：", answerOptions: [{ type: "A", answer: "广泛的社交圈", score: "E" }, { type: "B", answer: "少数深入的友谊", score: "I" }] },
  { no: 8, question: "在工作/学习中，你更喜欢：", answerOptions: [{ type: "A", answer: "团队合作完成任务", score: "E" }, { type: "B", answer: "独立完成任务", score: "I" }] },
  { no: 9, question: "别人通常认为你：", answerOptions: [{ type: "A", answer: "容易了解和相处", score: "E" }, { type: "B", answer: "需要时间才能了解", score: "I" }] },
  { no: 10, question: "当你感到压力时，你更倾向于：", answerOptions: [{ type: "A", answer: "找人倾诉", score: "E" }, { type: "B", answer: "自己默默消化", score: "I" }] },

  // === S/N 维度 (感觉/直觉) - Questions about information gathering ===
  { no: 11, question: "你更关注：", answerOptions: [{ type: "A", answer: "当前实际发生的事情", score: "S" }, { type: "B", answer: "未来可能发生的事情", score: "N" }] },
  { no: 12, question: "你认为自己更：", answerOptions: [{ type: "A", answer: "注重细节和事实", score: "S" }, { type: "B", answer: "注重整体和概念", score: "N" }] },
  { no: 13, question: "你更信任：", answerOptions: [{ type: "A", answer: "实际经验", score: "S" }, { type: "B", answer: "直觉灵感", score: "N" }] },
  { no: 14, question: "你更喜欢的老师/领导是：", answerOptions: [{ type: "A", answer: "用事实和数据说话的", score: "S" }, { type: "B", answer: "用理论和愿景激励的", score: "N" }] },
  { no: 15, question: "你在解决问题时更倾向于：", answerOptions: [{ type: "A", answer: "使用已被验证的方法", score: "S" }, { type: "B", answer: "寻找全新的解决方案", score: "N" }] },
  { no: 16, question: "你更容易注意到：", answerOptions: [{ type: "A", answer: "具体的细节变化", score: "S" }, { type: "B", answer: "事物之间的关联和模式", score: "N" }] },
  { no: 17, question: "在学习新事物时，你更喜欢：", answerOptions: [{ type: "A", answer: "循序渐进、按部就班", score: "S" }, { type: "B", answer: "先了解全局再填充细节", score: "N" }] },
  { no: 18, question: "你认为更重要的是：", answerOptions: [{ type: "A", answer: "脚踏实地", score: "S" }, { type: "B", answer: "富有想象力", score: "N" }] },
  { no: 19, question: "在描述一件事时，你更倾向于：", answerOptions: [{ type: "A", answer: "准确描述具体发生了什么", score: "S" }, { type: "B", answer: "用比喻和类比来表达", score: "N" }] },
  { no: 20, question: "你更欣赏的人是：", answerOptions: [{ type: "A", answer: "务实可靠的人", score: "S" }, { type: "B", answer: "富有创意的人", score: "N" }] },

  // === T/F 维度 (思维/情感) - Questions about decision making ===
  { no: 21, question: "做决定时，你更看重：", answerOptions: [{ type: "A", answer: "逻辑分析和客观事实", score: "T" }, { type: "B", answer: "个人价值观和他人感受", score: "F" }] },
  { no: 22, question: "你觉得更重要的是做到：", answerOptions: [{ type: "A", answer: "公正公平", score: "T" }, { type: "B", answer: "体贴关怀", score: "F" }] },
  { no: 23, question: "当朋友犯错时，你更倾向于：", answerOptions: [{ type: "A", answer: "直接指出问题所在", score: "T" }, { type: "B", answer: "先安慰再委婉提醒", score: "F" }] },
  { no: 24, question: "在争论中，你更看重：", answerOptions: [{ type: "A", answer: "论点的逻辑性", score: "T" }, { type: "B", answer: "不伤害对方的感情", score: "F" }] },
  { no: 25, question: "你认为更大的缺点是：", answerOptions: [{ type: "A", answer: "过于感性和优柔寡断", score: "T" }, { type: "B", answer: "过于理性和缺乏同情", score: "F" }] },
  { no: 26, question: "在评价别人时，你更注重：", answerOptions: [{ type: "A", answer: "他们的能力和成就", score: "T" }, { type: "B", answer: "他们的为人和品格", score: "F" }] },
  { no: 27, question: "你觉得好的领导应该：", answerOptions: [{ type: "A", answer: "基于能力和绩效做决策", score: "T" }, { type: "B", answer: "关注团队和谐和成员感受", score: "F" }] },
  { no: 28, question: "你更容易被什么打动：", answerOptions: [{ type: "A", answer: "有说服力的逻辑推理", score: "T" }, { type: "B", answer: "真挚的情感表达", score: "F" }] },
  { no: 29, question: "在团队中，你更愿意担当：", answerOptions: [{ type: "A", answer: "问题解决者的角色", score: "T" }, { type: "B", answer: "团队协调者的角色", score: "F" }] },
  { no: 30, question: "面对困难决定时：", answerOptions: [{ type: "A", answer: "用头脑分析利弊", score: "T" }, { type: "B", answer: "跟随内心感觉", score: "F" }] },

  // === J/P 维度 (判断/感知) - Questions about lifestyle ===
  { no: 31, question: "你更喜欢：", answerOptions: [{ type: "A", answer: "事先做好计划", score: "J" }, { type: "B", answer: "随机应变", score: "P" }] },
  { no: 32, question: "在截止日期前，你通常：", answerOptions: [{ type: "A", answer: "提前完成任务", score: "J" }, { type: "B", answer: "在最后期限附近完成", score: "P" }] },
  { no: 33, question: "你的工作/学习空间通常：", answerOptions: [{ type: "A", answer: "整齐有序", score: "J" }, { type: "B", answer: "有创意的混乱", score: "P" }] },
  { no: 34, question: "旅行时，你更喜欢：", answerOptions: [{ type: "A", answer: "详细规划行程", score: "J" }, { type: "B", answer: "随兴而行", score: "P" }] },
  { no: 35, question: "你更喜欢的生活方式是：", answerOptions: [{ type: "A", answer: "有规律、可预测的", score: "J" }, { type: "B", answer: "灵活、充满变化的", score: "P" }] },
  { no: 36, question: "当计划突然改变时，你：", answerOptions: [{ type: "A", answer: "会感到不安和烦躁", score: "J" }, { type: "B", answer: "觉得这是有趣的变化", score: "P" }] },
  { no: 37, question: "你在做事时更看重：", answerOptions: [{ type: "A", answer: "结果和完成度", score: "J" }, { type: "B", answer: "过程和体验", score: "P" }] },
  { no: 38, question: "你更喜欢哪种工作方式：", answerOptions: [{ type: "A", answer: "按照清单逐项完成", score: "J" }, { type: "B", answer: "同时处理多个任务", score: "P" }] },
  { no: 39, question: "在做购物决定时，你通常：", answerOptions: [{ type: "A", answer: "事先做好研究和比较", score: "J" }, { type: "B", answer: "凭感觉和当下心情", score: "P" }] },
  { no: 40, question: "你更倾向于：", answerOptions: [{ type: "A", answer: "尽早做出决定", score: "J" }, { type: "B", answer: "保持选项开放", score: "P" }] },

  // === 混合维度题 (交叉验证) ===
  // E/I
  { no: 41, question: "周末你更愿意：", answerOptions: [{ type: "A", answer: "参加聚会或社交活动", score: "E" }, { type: "B", answer: "在家看书或看电影", score: "I" }] },
  { no: 42, question: "你获取信息的方式更多是通过：", answerOptions: [{ type: "A", answer: "与人交谈", score: "E" }, { type: "B", answer: "阅读和思考", score: "I" }] },
  { no: 43, question: "你更容易：", answerOptions: [{ type: "A", answer: "在行动中思考", score: "E" }, { type: "B", answer: "在思考后行动", score: "I" }] },
  { no: 44, question: "你对电话/消息的态度：", answerOptions: [{ type: "A", answer: "喜欢接打电话聊天", score: "E" }, { type: "B", answer: "更喜欢发文字消息", score: "I" }] },
  { no: 45, question: "在新环境中，你通常：", answerOptions: [{ type: "A", answer: "很快融入并活跃起来", score: "E" }, { type: "B", answer: "先观察再慢慢适应", score: "I" }] },

  // S/N
  { no: 46, question: "你觉得自己更像：", answerOptions: [{ type: "A", answer: "一个现实主义者", score: "S" }, { type: "B", answer: "一个理想主义者", score: "N" }] },
  { no: 47, question: "阅读时，你更喜欢：", answerOptions: [{ type: "A", answer: "实用性的内容（指南、教程）", score: "S" }, { type: "B", answer: "想象力丰富的内容（小说、科幻）", score: "N" }] },
  { no: 48, question: "你更看重一个人的：", answerOptions: [{ type: "A", answer: "实际行动和结果", score: "S" }, { type: "B", answer: "想法和潜力", score: "N" }] },
  { no: 49, question: "在工作中，你更擅长：", answerOptions: [{ type: "A", answer: "处理具体、明确的任务", score: "S" }, { type: "B", answer: "构思新的创意和方案", score: "N" }] },
  { no: 50, question: "你更常思考：", answerOptions: [{ type: "A", answer: "\"这实际上是怎样的\"", score: "S" }, { type: "B", answer: "\"这可能会变成什么样\"", score: "N" }] },

  // T/F
  { no: 51, question: "你更看重哪种品质：", answerOptions: [{ type: "A", answer: "真实和诚实", score: "T" }, { type: "B", answer: "善良和体贴", score: "F" }] },
  { no: 52, question: "当别人向你诉苦时：", answerOptions: [{ type: "A", answer: "想帮他们分析问题、找到解决方案", score: "T" }, { type: "B", answer: "想先表示理解和情感支持", score: "F" }] },
  { no: 53, question: "在人际冲突中，你更倾向于：", answerOptions: [{ type: "A", answer: "坚持原则和道理", score: "T" }, { type: "B", answer: "维护关系和感情", score: "F" }] },
  { no: 54, question: "你觉得更可惜的是：", answerOptions: [{ type: "A", answer: "浪费了一个好机会", score: "T" }, { type: "B", answer: "伤害了一段好关系", score: "F" }] },
  { no: 55, question: "你做选择时更依赖：", answerOptions: [{ type: "A", answer: "客观的数据和分析", score: "T" }, { type: "B", answer: "对人的影响和感受", score: "F" }] },

  // J/P
  { no: 56, question: "你的日常生活更：", answerOptions: [{ type: "A", answer: "有固定的作息规律", score: "J" }, { type: "B", answer: "随心所欲、不太固定", score: "P" }] },
  { no: 57, question: "面对多个任务时：", answerOptions: [{ type: "A", answer: "制定优先级清单并执行", score: "J" }, { type: "B", answer: "看心情和灵感决定先做什么", score: "P" }] },
  { no: 58, question: "你更倾向于：", answerOptions: [{ type: "A", answer: "把事情尽快确定下来", score: "J" }, { type: "B", answer: "等等看还有什么可能", score: "P" }] },
  { no: 59, question: "你的衣柜/书架通常：", answerOptions: [{ type: "A", answer: "分类整理得井井有条", score: "J" }, { type: "B", answer: "大致知道东西在哪就行", score: "P" }] },
  { no: 60, question: "对于规则和制度：", answerOptions: [{ type: "A", answer: "认为应该严格遵守", score: "J" }, { type: "B", answer: "觉得可以灵活变通", score: "P" }] },

  // === 深度交叉题 ===
  { no: 61, question: "你更喜欢的表达方式：", answerOptions: [{ type: "A", answer: "当面交流，即时回应", score: "E" }, { type: "B", answer: "书面表达，深思熟虑", score: "I" }] },
  { no: 62, question: "你更看重：", answerOptions: [{ type: "A", answer: "实际的可行性", score: "S" }, { type: "B", answer: "创新的可能性", score: "N" }] },
  { no: 63, question: "你认为好的批评应该是：", answerOptions: [{ type: "A", answer: "直接了当、对事不对人", score: "T" }, { type: "B", answer: "委婉温和、顾及面子", score: "F" }] },
  { no: 64, question: "你在出门前：", answerOptions: [{ type: "A", answer: "会确认带齐所有需要的东西", score: "J" }, { type: "B", answer: "拿上钥匙手机就走", score: "P" }] },
  { no: 65, question: "在长途旅行中：", answerOptions: [{ type: "A", answer: "喜欢和旅伴聊天", score: "E" }, { type: "B", answer: "更想戴耳机听音乐/看风景", score: "I" }] },
  { no: 66, question: "你更信赖：", answerOptions: [{ type: "A", answer: "有据可查的资料和数据", score: "S" }, { type: "B", answer: "自己的第六感和预感", score: "N" }] },
  { no: 67, question: "处理棘手问题时：", answerOptions: [{ type: "A", answer: "保持冷静客观地分析", score: "T" }, { type: "B", answer: "考虑所有人的感受和立场", score: "F" }] },
  { no: 68, question: "你的理想假期是：", answerOptions: [{ type: "A", answer: "精心安排好的充实行程", score: "J" }, { type: "B", answer: "没有计划的自由探索", score: "P" }] },
  { no: 69, question: "你更欣赏：", answerOptions: [{ type: "A", answer: "条理清晰、一步步来的做法", score: "S" }, { type: "B", answer: "打破常规、跳跃性的思维", score: "N" }] },
  { no: 70, question: "当需要做一个重要决定时：", answerOptions: [{ type: "A", answer: "列出利弊清单理性分析", score: "T" }, { type: "B", answer: "倾听内心声音和价值判断", score: "F" }] },
];

// Calculate MBTI type from answers (same logic as reference project)
export function calculateMBTIType(answers: MBTIDimension[]): MBTIResult {
  const counts: Record<MBTIDimension, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach(a => counts[a]++);

  const type = `${counts.E >= counts.I ? "E" : "I"}${counts.S >= counts.N ? "S" : "N"}${counts.T >= counts.F ? "T" : "F"}${counts.J >= counts.P ? "J" : "P"}`;

  const info = MBTI_TYPES[type] || { name: type, nickname: "独特个体", description: "", strengths: [], weaknesses: [], careers: [] };

  return { type, ...info, dimensions: counts };
}

// 16 personality type descriptions (Chinese)
const MBTI_TYPES: Record<string, Omit<MBTIResult, "type" | "dimensions">> = {
  INTJ: {
    name: "INTJ - 建筑师",
    nickname: "独立的战略思想家",
    description: "富有想象力和战略性的思想家，一切皆在计划之中。INTJ是所有人格类型中最独立、最有决心的。他们以高标准要求自己和他人，追求知识和能力。",
    strengths: ["战略思维", "独立自主", "决心坚定", "富有洞察力", "创新能力强"],
    weaknesses: ["过于理性", "可能显得傲慢", "对社交不够重视", "完美主义"],
    careers: ["科学家", "工程师", "战略规划师", "投资分析师", "系统架构师"],
  },
  INTP: {
    name: "INTP - 逻辑学家",
    nickname: "具有创造力的逻辑思考者",
    description: "善于创新的发明家，对知识有着不可抑制的渴望。INTP享受理论和抽象思考，追求用逻辑分析解释一切。",
    strengths: ["分析能力强", "客观公正", "富有创造力", "思维开放", "好奇心强"],
    weaknesses: ["社交较弱", "容易忽视细节", "可能过于理论化", "不善于表达情感"],
    careers: ["程序员", "数学家", "哲学家", "技术分析师", "研究员"],
  },
  ENTJ: {
    name: "ENTJ - 指挥官",
    nickname: "大胆而富有想象力的领导者",
    description: "天生的领导者，充满自信和魅力。ENTJ善于制定长期计划并带领团队实现目标，他们享受挑战并致力于效率。",
    strengths: ["领导力强", "战略性思维", "高效率", "自信果断", "意志坚定"],
    weaknesses: ["可能过于强势", "缺乏耐心", "对情感不够敏感", "过于追求完美"],
    careers: ["CEO", "企业家", "律师", "管理顾问", "项目经理"],
  },
  ENTP: {
    name: "ENTP - 辩论家",
    nickname: "聪明好奇的思想者",
    description: "聪明又好奇的思想家，不会放过任何智力挑战。ENTP喜欢辩论，善于从多角度看问题，享受打破常规。",
    strengths: ["创新思维", "口才好", "适应力强", "知识面广", "善于解决问题"],
    weaknesses: ["可能好争辩", "不够专注", "对细节不耐烦", "可能忽视他人感受"],
    careers: ["创业者", "营销策划", "产品经理", "记者", "咨询顾问"],
  },
  INFJ: {
    name: "INFJ - 提倡者",
    nickname: "安静而神秘的理想主义者",
    description: "安静而神秘，但非常有启发性和不知疲倦的理想主义者。INFJ有强烈的直觉和洞察力，致力于帮助他人实现潜力。",
    strengths: ["洞察力强", "有原则", "富有创造力", "坚定不移", "善解人意"],
    weaknesses: ["过于完美主义", "容易倦怠", "过于敏感", "不擅长冲突"],
    careers: ["心理咨询师", "作家", "教师", "社会工作者", "人力资源"],
  },
  INFP: {
    name: "INFP - 调停者",
    nickname: "诗意而善良的利他主义者",
    description: "诗意、善良的利他主义者，总是热心地为正义事业提供帮助。INFP以强烈的个人价值观为指导，追求内心的和谐与意义。",
    strengths: ["富有同理心", "创造力强", "理想主义", "忠诚正直", "思想开放"],
    weaknesses: ["过于理想化", "自我封闭", "难以做决定", "容易受伤"],
    careers: ["作家", "艺术家", "心理治疗师", "社工", "人文学者"],
  },
  ENFJ: {
    name: "ENFJ - 主人公",
    nickname: "富有魅力的鼓舞人心的领导者",
    description: "充满魅力和同理心的领导者，能够吸引听众。ENFJ天生热情，乐于帮助他人成长和发展。",
    strengths: ["领导力强", "善于沟通", "有同理心", "热情可靠", "有组织力"],
    weaknesses: ["过于理想主义", "过于敏感", "犹豫不决", "过度牺牲自我"],
    careers: ["教育工作者", "人力资源", "公关经理", "培训师", "政治家"],
  },
  ENFP: {
    name: "ENFP - 竞选者",
    nickname: "热情而富有创造力的社交达人",
    description: "热情、有创造力、善于社交的自由精神。ENFP总是能找到微笑的理由，他们的热情和乐观具有感染力。",
    strengths: ["创造力强", "热情洋溢", "善于社交", "适应力强", "乐观向上"],
    weaknesses: ["容易分心", "过于情绪化", "缺乏跟进", "难以集中精力"],
    careers: ["记者", "演员", "创意总监", "公关", "企业家"],
  },
  ISTJ: {
    name: "ISTJ - 物流师",
    nickname: "实际而注重事实的可靠者",
    description: "安静、严肃的人，以彻底性和可靠性赢得成功。ISTJ是最负责任的人格类型之一，他们重视传统和忠诚。",
    strengths: ["可靠负责", "有条理", "注重细节", "意志坚定", "诚实正直"],
    weaknesses: ["固执己见", "不够灵活", "不善表达感情", "过于墨守成规"],
    careers: ["会计师", "审计员", "项目经理", "公务员", "军人"],
  },
  ISFJ: {
    name: "ISFJ - 守卫者",
    nickname: "非常敬业和温暖的守护者",
    description: "非常敬业和温暖的守护者，时刻准备着保护所爱之人。ISFJ是最体贴入微的人格类型，他们默默付出不求回报。",
    strengths: ["可靠忠诚", "耐心细致", "善于观察", "实际务实", "热心助人"],
    weaknesses: ["过于谦虚", "不善于拒绝", "过于敏感", "抗拒变化"],
    careers: ["护士", "教师", "社工", "行政管理", "图书管理员"],
  },
  ESTJ: {
    name: "ESTJ - 总经理",
    nickname: "出色的行政管理者",
    description: "出色的管理者，在管理事物和人员方面无与伦比。ESTJ是传统的捍卫者，重视秩序和组织。",
    strengths: ["组织能力强", "忠诚可靠", "意志坚定", "务实高效", "善于执行"],
    weaknesses: ["固执己见", "不够灵活", "过于看重社会地位", "不善于表达情感"],
    careers: ["企业管理者", "法官", "财务经理", "学校管理者", "军官"],
  },
  ESFJ: {
    name: "ESFJ - 执政官",
    nickname: "极有爱心、善于社交的协调者",
    description: "极有爱心、善于社交的人，总是热心帮助他人。ESFJ天生就善于关心他人，是最具合作精神的人格类型之一。",
    strengths: ["善于社交", "忠诚可靠", "关心他人", "务实能干", "有责任感"],
    weaknesses: ["过于在意他人看法", "不善于处理冲突", "过于传统", "缺乏灵活性"],
    careers: ["销售经理", "护士", "教师", "人事专员", "客户服务"],
  },
  ISTP: {
    name: "ISTP - 鉴赏家",
    nickname: "大胆而实际的实验者",
    description: "大胆而实际的实验者，擅长使用各种工具。ISTP天生好奇，喜欢动手探索和了解事物的运作原理。",
    strengths: ["动手能力强", "善于分析", "适应力强", "理性务实", "独立自主"],
    weaknesses: ["不善于承诺", "不够敏感", "冒险倾向", "不善于长期规划"],
    careers: ["工程师", "技师", "飞行员", "运动员", "消防员"],
  },
  ISFP: {
    name: "ISFP - 探险家",
    nickname: "灵活而有魅力的艺术家",
    description: "灵活、有魅力的艺术家，总是准备好去探索和体验新事物。ISFP温和安静，但内心充满热情和好奇心。",
    strengths: ["艺术感强", "善良敏感", "富有魅力", "想象力丰富", "好奇心强"],
    weaknesses: ["过于敏感", "不善于规划", "容易紧张", "缺乏远见"],
    careers: ["设计师", "音乐家", "摄影师", "时尚顾问", "厨师"],
  },
  ESTP: {
    name: "ESTP - 企业家",
    nickname: "聪明而精力充沛的感知者",
    description: "聪明、精力充沛、善于感知的人，真正享受冒险生活。ESTP是最善于应对即时情况的人格类型。",
    strengths: ["精力充沛", "善于观察", "直率豪爽", "适应力强", "善于社交"],
    weaknesses: ["冲动任性", "缺乏耐心", "冒险倾向", "不善于规划未来"],
    careers: ["企业家", "销售", "运动教练", "急救人员", "侦探"],
  },
  ESFP: {
    name: "ESFP - 表演者",
    nickname: "自发的、精力充沛的表演者",
    description: "自发、精力充沛、热情的人——生活在他们身边永远不会无聊。ESFP是天生的表演者，他们热爱生活中的每一刻。",
    strengths: ["乐观开朗", "善于社交", "实践能力强", "有趣幽默", "适应力强"],
    weaknesses: ["容易分心", "不善于规划", "过于敏感", "容易冲动"],
    careers: ["演员", "活动策划", "导游", "公关", "销售代表"],
  },
};
