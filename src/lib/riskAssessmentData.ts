/**
 * 心理健康风险评估系统 - 基于专业数据模型
 * 10个年龄段分层评估，包含CES-D量表、U形变量检测、风险因子识别
 */

// ========== 年龄段定义 ==========
export interface AgeGroup {
  id: string;
  label: string;
  age: string;
  emoji: string;
  desc: string;
  proxy: boolean; // 是否需要代答
  questionCount: number;
}

export const AGE_GROUPS: AgeGroup[] = [
  { id: "under_3_proxy", label: "婴幼儿", age: "0-3岁", emoji: "🌰", desc: "启蒙萌芽期", proxy: true, questionCount: 16 },
  { id: "age_4_6_proxy", label: "学龄前", age: "4-6岁", emoji: "🌱", desc: "好奇探索期", proxy: true, questionCount: 18 },
  { id: "age_7_12_proxy", label: "儿童", age: "7-12岁", emoji: "🌿", desc: "快乐成长期", proxy: true, questionCount: 20 },
  { id: "age_13_17_self", label: "青少年", age: "13-17岁", emoji: "🍀", desc: "探索自我期", proxy: false, questionCount: 22 },
  { id: "age_18_25_self", label: "青年", age: "18-25岁", emoji: "🌻", desc: "追梦拼搏期", proxy: false, questionCount: 20 },
  { id: "age_26_35_self", label: "壮年", age: "26-35岁", emoji: "🌳", desc: "事业家庭期", proxy: false, questionCount: 22 },
  { id: "age_36_44_self", label: "中年", age: "36-44岁", emoji: "🍂", desc: "沉淀积累期", proxy: false, questionCount: 22 },
  { id: "age_45_59_self", label: "壮年后期", age: "45-59岁", emoji: "🏔️", desc: "智慧从容期", proxy: false, questionCount: 20 },
  { id: "age_60_74_self", label: "长者", age: "60-74岁", emoji: "🌅", desc: "安享生活期", proxy: false, questionCount: 20 },
  { id: "age_75plus_self", label: "高龄长者", age: "75岁以上", emoji: "🕊️", desc: "宁静致远期", proxy: false, questionCount: 15 },
];

// ========== 问题定义 ==========
export interface QuestionOption {
  value: number;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  options: QuestionOption[];
  direction: "keep" | "reverse" | "u_shape";
  uShapeRange?: [number, number]; // U形变量的正常范围
}

// CES-D 8项量表 (用于13岁以上)
const CESD_QUESTIONS: Question[] = [
  {
    id: "QN406", text: "过去两周内，你感到情绪低落的频率是？",
    category: "情绪状态", direction: "keep",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
  {
    id: "QN407", text: "你觉得做任何事都很费劲吗？",
    category: "情绪状态", direction: "keep",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
  {
    id: "QN411", text: "你的睡眠质量如何？",
    category: "情绪状态", direction: "keep",
    options: [
      { value: 1, label: "几乎没有问题" }, { value: 2, label: "有些时候不好" },
      { value: 3, label: "经常不好" }, { value: 4, label: "大多数时候不好" },
    ],
  },
  {
    id: "QN412", text: "你感到愉快的频率是？",
    category: "情绪状态", direction: "reverse",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
  {
    id: "QN414", text: "你感到孤独的频率是？",
    category: "情绪状态", direction: "keep",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
  {
    id: "QN416", text: "你觉得生活快乐吗？",
    category: "情绪状态", direction: "reverse",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
  {
    id: "QN418", text: "你感到悲伤难过的频率是？",
    category: "情绪状态", direction: "keep",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
  {
    id: "QN420", text: "你是否觉得生活无法继续？",
    category: "情绪状态", direction: "keep",
    options: [
      { value: 1, label: "几乎没有" }, { value: 2, label: "有些时候" },
      { value: 3, label: "经常" }, { value: 4, label: "大多数时候" },
    ],
  },
];

// 主观幸福感
const WELLBEING_QUESTIONS: Question[] = [
  {
    id: "QM2016", text: "总的来说，你觉得自己有多幸福？",
    category: "主观幸福", direction: "reverse",
    options: Array.from({ length: 11 }, (_, i) => ({
      value: i, label: i === 0 ? "0 - 非常不幸福" : i === 5 ? "5 - 一般" : i === 10 ? "10 - 非常幸福" : `${i}`,
    })),
  },
  {
    id: "QM3N", text: "你觉得你的生活有多大意义？",
    category: "主观幸福", direction: "reverse",
    options: Array.from({ length: 11 }, (_, i) => ({
      value: i, label: i === 0 ? "0 - 完全没有" : i === 5 ? "5 - 一般" : i === 10 ? "10 - 非常有意义" : `${i}`,
    })),
  },
  {
    id: "QN12012", text: "你对目前的生活满意吗？",
    category: "主观幸福", direction: "reverse",
    options: [
      { value: 1, label: "很不满意" }, { value: 2, label: "不太满意" },
      { value: 3, label: "一般" }, { value: 4, label: "比较满意" }, { value: 5, label: "非常满意" },
    ],
  },
];

// 健康相关
const HEALTH_QUESTIONS: Question[] = [
  {
    id: "QP201", text: "你认为自己的健康状况如何？",
    category: "健康状况", direction: "keep",
    options: [
      { value: 1, label: "非常健康" }, { value: 2, label: "很健康" },
      { value: 3, label: "比较健康" }, { value: 4, label: "一般" }, { value: 5, label: "不健康" },
    ],
  },
  {
    id: "QP202", text: "与去年相比，你的健康状况有变化吗？",
    category: "健康状况", direction: "keep",
    options: [
      { value: 1, label: "更好了" }, { value: 3, label: "没有变化" }, { value: 5, label: "更差了" },
    ],
  },
];

// 睡眠
const SLEEP_QUESTION: Question = {
  id: "QQ4010", text: "你平均每天睡多少小时？",
  category: "生活习惯", direction: "u_shape",
  uShapeRange: [6, 10],
  options: [
    { value: 4, label: "4小时以下" }, { value: 5, label: "5小时" },
    { value: 6, label: "6小时" }, { value: 7, label: "7小时" },
    { value: 8, label: "8小时" }, { value: 9, label: "9小时" },
    { value: 10, label: "10小时" }, { value: 12, label: "11小时以上" },
  ],
};

// 锻炼
const EXERCISE_QUESTION: Question = {
  id: "QP701N", text: "你锻炼身体的频率是？",
  category: "生活习惯", direction: "u_shape",
  uShapeRange: [2, 6],
  options: [
    { value: 8, label: "从不" }, { value: 1, label: "每月不足1次" },
    { value: 2, label: "每月1次以上" }, { value: 3, label: "每周1-2次" },
    { value: 4, label: "每周3-4次" }, { value: 5, label: "每周5次及以上" },
    { value: 6, label: "每天1次" }, { value: 7, label: "每天两次及以上" },
  ],
};

// 社会地位
const SOCIAL_QUESTIONS: Question[] = [
  {
    id: "QN8011", text: "你觉得你的收入在当地处于什么水平？",
    category: "社会支持", direction: "reverse",
    options: [
      { value: 1, label: "很低" }, { value: 2, label: "较低" },
      { value: 3, label: "中等" }, { value: 4, label: "较高" }, { value: 5, label: "很高" },
    ],
  },
  {
    id: "QN8012", text: "你觉得你的社会地位如何？",
    category: "社会支持", direction: "reverse",
    options: [
      { value: 1, label: "很低" }, { value: 2, label: "较低" },
      { value: 3, label: "中等" }, { value: 4, label: "较高" }, { value: 5, label: "很高" },
    ],
  },
];

// 婚姻状态 (18+)
const MARRIAGE_QUESTION: Question = {
  id: "QEA0", text: "你目前的婚姻状态是？",
  category: "基本信息", direction: "keep",
  options: [
    { value: 1, label: "未婚" }, { value: 2, label: "已婚" },
    { value: 3, label: "同居" }, { value: 4, label: "离婚" }, { value: 5, label: "丧偶" },
  ],
};

// 工作相关 (26+)
const WORK_QUESTIONS: Question[] = [
  {
    id: "QG406", text: "你对目前工作的总体满意度如何？",
    category: "工作状况", direction: "keep",
    options: [
      { value: 1, label: "非常满意" }, { value: 2, label: "满意" },
      { value: 3, label: "一般" }, { value: 4, label: "不满意" }, { value: 5, label: "非常不满意" },
    ],
  },
  {
    id: "QG401", text: "你对工作收入的满意度如何？",
    category: "工作状况", direction: "keep",
    options: [
      { value: 1, label: "非常满意" }, { value: 2, label: "满意" },
      { value: 3, label: "一般" }, { value: 4, label: "不满意" }, { value: 5, label: "非常不满意" },
    ],
  },
];

// 慢性病和住院 (26+)
const CHRONIC_QUESTIONS: Question[] = [
  {
    id: "QP401", text: "过去半年内是否有慢性疾病？",
    category: "健康状况", direction: "keep",
    options: [{ value: 5, label: "否" }, { value: 1, label: "是" }],
  },
  {
    id: "QC401", text: "过去12个月是否因病住院？",
    category: "健康状况", direction: "keep",
    options: [{ value: 5, label: "否" }, { value: 1, label: "是" }],
  },
];

// ADL日常活动能力 (45+)
const ADL_QUESTIONS: Question[] = [
  {
    id: "QQ1011", text: "能否独立去户外活动？",
    category: "日常能力", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "QQ1012", text: "能否独立进餐？",
    category: "日常能力", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "QQ1014", text: "能否独立使用公共交通？",
    category: "日常能力", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "QQ1015", text: "能否独立购物？",
    category: "日常能力", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "QQ1016", text: "能否独立清洁卫生？",
    category: "日常能力", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "QQ1017", text: "能否独立洗衣？",
    category: "日常能力", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
];

// ========== 青少年特有问题 (13-17) ==========
const TEEN_QUESTIONS: Question[] = [
  {
    id: "QEXT004", text: "我很难集中注意力",
    category: "行为表现", direction: "reverse",
    options: [
      { value: 1, label: "非常符合" }, { value: 2, label: "比较符合" },
      { value: 3, label: "一般" }, { value: 4, label: "不太符合" }, { value: 5, label: "非常不符合" },
    ],
  },
  {
    id: "QINT005", text: "我经常感到寂寞",
    category: "行为表现", direction: "reverse",
    options: [
      { value: 1, label: "非常符合" }, { value: 2, label: "比较符合" },
      { value: 3, label: "一般" }, { value: 4, label: "不太符合" }, { value: 5, label: "非常不符合" },
    ],
  },
  {
    id: "QINT007", text: "我经常觉得悲伤难受",
    category: "行为表现", direction: "reverse",
    options: [
      { value: 1, label: "非常符合" }, { value: 2, label: "比较符合" },
      { value: 3, label: "一般" }, { value: 4, label: "不太符合" }, { value: 5, label: "非常不符合" },
    ],
  },
  {
    id: "QINT009", text: "我担心自己在学校表现得不够好",
    category: "行为表现", direction: "reverse",
    options: [
      { value: 1, label: "非常符合" }, { value: 2, label: "比较符合" },
      { value: 3, label: "一般" }, { value: 4, label: "不太符合" }, { value: 5, label: "非常不符合" },
    ],
  },
  {
    id: "QS502", text: "你感到学习压力大吗？",
    category: "学业压力", direction: "reverse",
    options: [
      { value: 1, label: "非常大" }, { value: 2, label: "比较大" },
      { value: 3, label: "一般" }, { value: 4, label: "不太大" }, { value: 5, label: "没有压力" },
    ],
  },
  {
    id: "QM2011", text: "你觉得自己的人缘关系如何？(0-10分)",
    category: "社会支持", direction: "reverse",
    options: Array.from({ length: 11 }, (_, i) => ({
      value: i, label: i === 0 ? "0 - 很差" : i === 5 ? "5 - 一般" : i === 10 ? "10 - 很好" : `${i}`,
    })),
  },
];

// ========== 0-3岁婴幼儿问题 ==========
const INFANT_QUESTIONS: Question[] = [
  {
    id: "WB5", text: "孩子是否已能走路？",
    category: "发育指标", direction: "reverse",
    options: [{ value: 1, label: "能走路" }, { value: 5, label: "不能走路" }],
  },
  {
    id: "WB6", text: "孩子能否说完整句子？",
    category: "发育指标", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WB7", text: "孩子能否数1-10？",
    category: "发育指标", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WB8", text: "孩子能否独立小便？",
    category: "发育指标", direction: "reverse",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WB9", text: "孩子每天看电视/视频多长时间？",
    category: "生活习惯", direction: "u_shape",
    uShapeRange: [0, 3.5],
    options: [
      { value: 0, label: "不看" }, { value: 1, label: "约1小时" },
      { value: 2, label: "约2小时" }, { value: 3, label: "约3小时" },
      { value: 4, label: "4小时以上" }, { value: 6, label: "6小时以上" },
    ],
  },
  {
    id: "WC0", text: "过去一个月孩子是否生病？",
    category: "健康状况", direction: "keep",
    options: [{ value: 5, label: "否" }, { value: 1, label: "是" }],
  },
  {
    id: "WA105A", text: "孩子现在是否吃母乳？",
    category: "喂养方式", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WB202", text: "白天主要由谁照管孩子？",
    category: "照管情况", direction: "keep",
    options: [
      { value: 5, label: "妈妈" }, { value: 4, label: "爸爸" },
      { value: 2, label: "爷爷/奶奶" }, { value: 3, label: "外公/外婆" },
      { value: 6, label: "保姆" }, { value: 1, label: "托儿所" },
    ],
  },
  {
    id: "WB401", text: "过去12个月孩子与父亲同住多长时间？",
    category: "家庭环境", direction: "reverse",
    options: [
      { value: 12, label: "全年" }, { value: 9, label: "大部分时间(9个月)" },
      { value: 6, label: "半年" }, { value: 3, label: "几个月" },
      { value: 1, label: "很少(约1个月)" }, { value: 0, label: "完全没有" },
    ],
  },
  {
    id: "WB402", text: "过去12个月孩子与母亲同住多长时间？",
    category: "家庭环境", direction: "reverse",
    options: [
      { value: 12, label: "全年" }, { value: 9, label: "大部分时间(9个月)" },
      { value: 6, label: "半年" }, { value: 3, label: "几个月" },
      { value: 1, label: "很少(约1个月)" }, { value: 0, label: "完全没有" },
    ],
  },
  {
    id: "WF309A", text: "孩子早晨通常几点起床？",
    category: "作息规律", direction: "u_shape",
    uShapeRange: [6, 9],
    options: [
      { value: 5, label: "5点" }, { value: 6, label: "6点" }, { value: 7, label: "7点" },
      { value: 8, label: "8点" }, { value: 9, label: "9点" }, { value: 10, label: "10点以后" },
    ],
  },
  {
    id: "WF310A", text: "孩子晚上通常几点睡觉？",
    category: "作息规律", direction: "u_shape",
    uShapeRange: [19, 22],
    options: [
      { value: 19, label: "19点" }, { value: 20, label: "20点" }, { value: 21, label: "21点" },
      { value: 22, label: "22点" }, { value: 23, label: "23点" }, { value: 24, label: "24点以后" },
    ],
  },
];

// ========== 4-6岁学龄前问题 ==========
const PRESCHOOL_QUESTIONS: Question[] = [
  {
    id: "WC1", text: "孩子现在是否在上学（幼儿园/学前班）？",
    category: "教育状况", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WG301", text: "家长给孩子读故事的频率是？",
    category: "家庭互动", direction: "reverse",
    options: [
      { value: 1, label: "从不" }, { value: 2, label: "很少" },
      { value: 3, label: "有时" }, { value: 4, label: "经常" }, { value: 5, label: "总是" },
    ],
  },
  {
    id: "WG302", text: "家长给孩子买书的频率是？",
    category: "家庭互动", direction: "reverse",
    options: [
      { value: 1, label: "从不" }, { value: 2, label: "很少" },
      { value: 3, label: "有时" }, { value: 4, label: "经常" }, { value: 5, label: "总是" },
    ],
  },
  {
    id: "WG303", text: "家长带孩子外出游玩的频率是？",
    category: "家庭互动", direction: "reverse",
    options: [
      { value: 1, label: "从不" }, { value: 2, label: "很少" },
      { value: 3, label: "有时" }, { value: 4, label: "经常" }, { value: 5, label: "总是" },
    ],
  },
  {
    id: "WG401", text: "孩子能否进行物品归类？",
    category: "认知发展", direction: "keep",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WG402", text: "孩子能否识数？",
    category: "认知发展", direction: "keep",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WG405", text: "孩子能否理解时间概念（昨天/今天/明天）？",
    category: "认知发展", direction: "keep",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WG408", text: "孩子能否认识10个汉字？",
    category: "认知发展", direction: "keep",
    options: [{ value: 1, label: "能" }, { value: 5, label: "不能" }],
  },
  {
    id: "WB9_preschool", text: "孩子每天看电视/视频多长时间？",
    category: "生活习惯", direction: "u_shape",
    uShapeRange: [0, 4],
    options: [
      { value: 0, label: "不看" }, { value: 1, label: "约1小时" },
      { value: 2, label: "约2小时" }, { value: 3, label: "约3小时" },
      { value: 5, label: "5小时以上" },
    ],
  },
  {
    id: "WC0_preschool", text: "过去一个月孩子是否生病？",
    category: "健康状况", direction: "keep",
    options: [{ value: 5, label: "否" }, { value: 1, label: "是" }],
  },
];

// ========== 7-12岁儿童问题 ==========
const CHILD_QUESTIONS: Question[] = [
  {
    id: "WC1_child", text: "孩子现在是否在上学？",
    category: "教育状况", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WF501", text: "孩子的语文成绩如何？",
    category: "学业表现", direction: "keep",
    options: [
      { value: 1, label: "优" }, { value: 2, label: "良" },
      { value: 3, label: "中" }, { value: 4, label: "差" },
    ],
  },
  {
    id: "WF502", text: "孩子的数学成绩如何？",
    category: "学业表现", direction: "keep",
    options: [
      { value: 1, label: "优" }, { value: 2, label: "良" },
      { value: 3, label: "中" }, { value: 4, label: "差" },
    ],
  },
  {
    id: "WF602M", text: "家长与孩子谈论学校事情的频率？",
    category: "家庭互动", direction: "reverse",
    options: [
      { value: 1, label: "从不" }, { value: 2, label: "很少" },
      { value: 3, label: "偶尔" }, { value: 4, label: "经常" }, { value: 5, label: "很经常" },
    ],
  },
  {
    id: "WF604M", text: "家长检查作业的频率？",
    category: "家庭互动", direction: "reverse",
    options: [
      { value: 1, label: "从不" }, { value: 2, label: "很少" },
      { value: 3, label: "偶尔" }, { value: 4, label: "经常" }, { value: 5, label: "很经常" },
    ],
  },
  {
    id: "WS601", text: "孩子上的是公立学校吗？",
    category: "教育状况", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WT4", text: "孩子是否参加才艺培养？",
    category: "课外活动", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WU1", text: "孩子是否使用电子设备？",
    category: "生活习惯", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WA10", text: "是否要求孩子承担家务？",
    category: "家庭环境", direction: "reverse",
    options: [{ value: 1, label: "是" }, { value: 5, label: "否" }],
  },
  {
    id: "WC0_child", text: "过去一个月孩子是否生病？",
    category: "健康状况", direction: "keep",
    options: [{ value: 5, label: "否" }, { value: 1, label: "是" }],
  },
];

// 性别问题 (13岁以上)
const GENDER_QUESTION: Question = {
  id: "GENDER", text: "你的性别是？",
  category: "基本信息", direction: "keep",
  options: [{ value: 1, label: "男" }, { value: 0, label: "女" }],
};

// ========== 按年龄段组装问题 ==========
export function getQuestionsForAgeGroup(ageGroupId: string): Question[] {
  switch (ageGroupId) {
    case "under_3_proxy":
      return INFANT_QUESTIONS;

    case "age_4_6_proxy":
      return PRESCHOOL_QUESTIONS;

    case "age_7_12_proxy":
      return CHILD_QUESTIONS;

    case "age_13_17_self":
      return [
        GENDER_QUESTION,
        ...CESD_QUESTIONS,
        ...TEEN_QUESTIONS,
        ...WELLBEING_QUESTIONS,
        ...HEALTH_QUESTIONS,
        SLEEP_QUESTION,
        EXERCISE_QUESTION,
      ];

    case "age_18_25_self":
      return [
        GENDER_QUESTION,
        MARRIAGE_QUESTION,
        ...CESD_QUESTIONS,
        ...WELLBEING_QUESTIONS,
        ...HEALTH_QUESTIONS,
        SLEEP_QUESTION,
        EXERCISE_QUESTION,
        ...SOCIAL_QUESTIONS,
      ];

    case "age_26_35_self":
    case "age_36_44_self":
      return [
        GENDER_QUESTION,
        MARRIAGE_QUESTION,
        ...CESD_QUESTIONS,
        ...WELLBEING_QUESTIONS,
        ...HEALTH_QUESTIONS,
        ...CHRONIC_QUESTIONS,
        SLEEP_QUESTION,
        EXERCISE_QUESTION,
        ...WORK_QUESTIONS,
        ...SOCIAL_QUESTIONS,
      ];

    case "age_45_59_self":
      return [
        GENDER_QUESTION,
        MARRIAGE_QUESTION,
        ...CESD_QUESTIONS,
        ...WELLBEING_QUESTIONS,
        ...HEALTH_QUESTIONS,
        ...CHRONIC_QUESTIONS,
        SLEEP_QUESTION,
        EXERCISE_QUESTION,
        ...ADL_QUESTIONS.slice(0, 3),
        ...SOCIAL_QUESTIONS,
      ];

    case "age_60_74_self":
      return [
        GENDER_QUESTION,
        ...CESD_QUESTIONS,
        ...WELLBEING_QUESTIONS,
        ...HEALTH_QUESTIONS,
        ...CHRONIC_QUESTIONS,
        SLEEP_QUESTION,
        ...ADL_QUESTIONS,
      ];

    case "age_75plus_self":
      return [
        GENDER_QUESTION,
        ...CESD_QUESTIONS,
        ...WELLBEING_QUESTIONS,
        ...HEALTH_QUESTIONS,
        SLEEP_QUESTION,
        ...ADL_QUESTIONS,
      ];

    default:
      return [];
  }
}

// ========== 评分算法（复现Python逻辑）==========

// 健康基线
const HEALTHY_BASELINE: Record<string, number> = {
  under_3_proxy: 0.05,
  age_4_6_proxy: 0.08,
  age_7_12_proxy: 0.10,
  age_13_17_self: 0.12,
  age_18_25_self: 0.12,
  age_26_35_self: 0.10,
  age_36_44_self: 0.12,
  age_45_59_self: 0.15,
  age_60_74_self: 0.15,
  age_75plus_self: 0.20,
};

// 大众问卷阈值
const POPULATION_THRESHOLDS: Record<string, number> = {
  under_3_proxy: 0.85,
  age_4_6_proxy: 0.80,
  age_7_12_proxy: 0.75,
  age_13_17_self: 0.70,
  age_18_25_self: 0.75,
  age_26_35_self: 0.70,
  age_36_44_self: 0.70,
  age_45_59_self: 0.70,
  age_60_74_self: 0.70,
  age_75plus_self: 0.60,
};

// Platt缩放参数
const CALIBRATION_PARAMS: Record<string, { alpha: number; beta: number }> = {
  age_18_25_self: { alpha: 1.3, beta: -0.8 },
  age_26_35_self: { alpha: 1.5, beta: -1.2 },
  age_36_44_self: { alpha: 1.4, beta: -1.0 },
  age_75plus_self: { alpha: 2.0, beta: -1.5 },
};

export interface RiskResult {
  riskScore: number; // 0-100
  riskLevel: string;
  riskProbability: number;
  suggestion: string;
  riskFactors: string[];
  cesdScore?: number;
  cesdMax?: number;
  dimensions: { name: string; score: number; maxScore: number; level: string }[];
  isCrisis: boolean;
}

export function calculateRiskScore(
  ageGroupId: string,
  answers: Record<string, number>
): RiskResult {
  const riskFactors: string[] = [];
  const dimensions: RiskResult["dimensions"] = [];

  // 1. CES-D得分计算 (13岁以上)
  let cesdScore: number | undefined;
  let cesdMax: number | undefined;
  const cesdVars = ["QN406", "QN407", "QN411", "QN414", "QN418", "QN420"];
  const cesdReverseVars = ["QN412", "QN416"];
  let cesdSum = 0;
  let cesdCount = 0;

  for (const v of cesdVars) {
    if (answers[v] !== undefined) {
      cesdSum += answers[v] - 1; // 转为0-3
      cesdCount++;
    }
  }
  for (const v of cesdReverseVars) {
    if (answers[v] !== undefined) {
      cesdSum += 3 - (answers[v] - 1); // 反向计分
      cesdCount++;
    }
  }

  if (cesdCount >= 6) {
    cesdScore = cesdSum;
    cesdMax = cesdCount * 3;
    const cesdPct = cesdScore / cesdMax;

    let cesdLevel = "良好";
    if (cesdPct >= 0.7) cesdLevel = "严重";
    else if (cesdPct >= 0.5) cesdLevel = "中度";
    else if (cesdPct >= 0.3) cesdLevel = "轻度";

    dimensions.push({ name: "抑郁症状(CES-D)", score: cesdScore, maxScore: cesdMax, level: cesdLevel });

    if (cesdPct >= 0.5) riskFactors.push(`CES-D抑郁症状${cesdLevel}`);
  }

  // 2. 主观幸福感维度
  let wbScore = 0;
  let wbCount = 0;
  if (answers["QM2016"] !== undefined) { wbScore += (10 - answers["QM2016"]) / 10; wbCount++; }
  if (answers["QM3N"] !== undefined) { wbScore += (10 - answers["QM3N"]) / 10; wbCount++; }
  if (answers["QN12012"] !== undefined) { wbScore += (5 - answers["QN12012"]) / 4; wbCount++; }

  if (wbCount > 0) {
    const wbAvg = wbScore / wbCount;
    const wbScoreNorm = Math.round(wbAvg * 30);
    let wbLevel = "良好";
    if (wbAvg >= 0.7) wbLevel = "严重不足";
    else if (wbAvg >= 0.5) wbLevel = "不足";
    else if (wbAvg >= 0.3) wbLevel = "一般";

    dimensions.push({ name: "主观幸福感", score: wbScoreNorm, maxScore: 30, level: wbLevel });
    if (wbAvg >= 0.6) riskFactors.push("幸福感严重不足");
  }

  // 3. 健康维度
  let healthRisk = 0;
  if (answers["QP201"] !== undefined) {
    const hScore = (answers["QP201"] - 1) / 4;
    healthRisk += hScore;
    if (answers["QP201"] >= 4) riskFactors.push("自评健康状况较差");
  }
  if (answers["QP202"] !== undefined && answers["QP202"] === 5) {
    healthRisk += 0.3;
    riskFactors.push("健康状况恶化");
  }
  if (answers["QP401"] !== undefined && answers["QP401"] === 1) {
    healthRisk += 0.2;
    riskFactors.push("患有慢性疾病");
  }
  if (answers["QC401"] !== undefined && answers["QC401"] === 1) {
    healthRisk += 0.15;
    riskFactors.push("近期住院");
  }
  dimensions.push({
    name: "健康状况",
    score: Math.round(Math.min(1, healthRisk) * 20),
    maxScore: 20,
    level: healthRisk >= 0.6 ? "较差" : healthRisk >= 0.3 ? "一般" : "良好",
  });

  // 4. 睡眠维度 (U形)
  if (answers["QQ4010"] !== undefined) {
    const sleep = answers["QQ4010"];
    let sleepRisk = 0;
    if (sleep < 6) sleepRisk = (6 - sleep) * 0.2;
    else if (sleep > 9) sleepRisk = (sleep - 9) * 0.15;
    if (sleepRisk > 0) riskFactors.push(sleep < 6 ? "睡眠不足" : "睡眠过多");
    dimensions.push({
      name: "睡眠质量",
      score: Math.round(Math.min(1, sleepRisk) * 10),
      maxScore: 10,
      level: sleepRisk >= 0.4 ? "较差" : sleepRisk > 0 ? "一般" : "良好",
    });
  }

  // 5. ADL维度 (45+)
  const adlVars = ["QQ1011", "QQ1012", "QQ1014", "QQ1015", "QQ1016", "QQ1017"];
  let adlDisabled = 0;
  let adlTotal = 0;
  for (const v of adlVars) {
    if (answers[v] !== undefined) {
      adlTotal++;
      if (answers[v] === 5) adlDisabled++;
    }
  }
  if (adlTotal > 0) {
    const adlPct = adlDisabled / adlTotal;
    dimensions.push({
      name: "日常活动能力(ADL)",
      score: adlDisabled,
      maxScore: adlTotal,
      level: adlPct >= 0.5 ? "严重受限" : adlPct > 0 ? "部分受限" : "正常",
    });
    if (adlPct >= 0.5) riskFactors.push("日常活动能力严重受限");
  }

  // 6. 青少年学业压力
  if (answers["QS502"] !== undefined) {
    if (answers["QS502"] <= 2) riskFactors.push("学业压力较大");
  }

  // 7. 工作维度
  if (answers["QG406"] !== undefined && answers["QG406"] >= 4) {
    riskFactors.push("工作满意度低");
  }

  // 8. 社会支持维度
  if (answers["QN8011"] !== undefined && answers["QN8011"] <= 2) {
    riskFactors.push("收入地位较低");
  }

  // ========== 综合风险概率计算（复现Python逻辑）==========
  let baseRisk = HEALTHY_BASELINE[ageGroupId] || 0.12;

  // CES-D影响
  if (cesdScore !== undefined && cesdMax !== undefined) {
    const cesdPct = cesdScore / cesdMax;
    if (cesdPct >= 0.7) baseRisk += 0.45;
    else if (cesdPct >= 0.5) baseRisk += 0.30;
    else if (cesdPct >= 0.3) baseRisk += 0.15;
    else if (cesdPct >= 0.15) baseRisk += 0.05;
  }

  // 幸福感影响
  if (wbCount > 0) {
    const wbAvg = wbScore / wbCount;
    if (wbAvg >= 0.7) baseRisk += 0.20;
    else if (wbAvg >= 0.5) baseRisk += 0.10;
  }

  // 健康影响
  baseRisk += healthRisk * 0.15;

  // 睡眠影响
  if (answers["QQ4010"] !== undefined) {
    const sleep = answers["QQ4010"];
    if (sleep < 5 || sleep > 11) baseRisk += 0.10;
    else if (sleep < 6 || sleep > 10) baseRisk += 0.05;
  }

  // ADL影响
  if (adlTotal > 0) {
    const adlPct = adlDisabled / adlTotal;
    baseRisk += adlPct * 0.20;
  }

  // 风险因子数量影响
  if (riskFactors.length >= 4) baseRisk += 0.10;
  else if (riskFactors.length >= 2) baseRisk += 0.05;

  // 代答问卷（0-12岁）特殊计算
  if (["under_3_proxy", "age_4_6_proxy", "age_7_12_proxy"].includes(ageGroupId)) {
    baseRisk = calculateProxyRisk(ageGroupId, answers, riskFactors);
  }

  // Platt缩放校准
  if (CALIBRATION_PARAMS[ageGroupId]) {
    const params = CALIBRATION_PARAMS[ageGroupId];
    const logit = Math.log(baseRisk / (1 - baseRisk + 1e-10));
    baseRisk = 1 / (1 + Math.exp(-(params.alpha * logit + params.beta)));
  }

  // 贝叶斯收缩 - 积极信号校准
  let positiveScore = 0;
  let totalChecks = 0;
  for (const v of cesdVars) {
    if (answers[v] !== undefined) { totalChecks++; if (answers[v] <= 2) positiveScore++; }
  }
  for (const v of cesdReverseVars) {
    if (answers[v] !== undefined) { totalChecks++; if (answers[v] >= 3) positiveScore++; }
  }
  if (answers["QM2016"] !== undefined) { totalChecks++; if (answers["QM2016"] >= 8) positiveScore++; }
  if (answers["QM3N"] !== undefined) { totalChecks++; if (answers["QM3N"] >= 8) positiveScore++; }
  if (answers["QN12012"] !== undefined) { totalChecks++; if (answers["QN12012"] >= 4) positiveScore++; }

  if (totalChecks >= 5) {
    const positiveRate = positiveScore / totalChecks;
    if (positiveRate > 0.85) {
      const baseline = HEALTHY_BASELINE[ageGroupId] || 0.12;
      const evidenceWeight = Math.max(0.1, Math.min(0.5, (1 - positiveRate) * 5));
      baseRisk = (1 - evidenceWeight) * baseline + evidenceWeight * baseRisk;
    }
  }

  // 75+极端情况
  if (ageGroupId === "age_75plus_self") {
    const adlAll5 = adlTotal >= 5 && adlDisabled === adlTotal;
    const wbAllMin = (answers["QM2016"] !== undefined && answers["QM2016"] <= 1) &&
                     (answers["QM3N"] !== undefined && answers["QM3N"] <= 1) &&
                     (answers["QN12012"] !== undefined && answers["QN12012"] <= 1);
    if (adlAll5 && wbAllMin) baseRisk = Math.max(baseRisk, 0.85);
    else if (adlAll5 || wbAllMin) baseRisk = Math.max(baseRisk, 0.70);
  }

  // 限制范围
  const riskProbability = Math.max(0.01, Math.min(0.99, baseRisk));
  const riskScore = Math.round(riskProbability * 100);

  // 风险等级
  let riskLevel: string;
  let suggestion: string;
  if (riskProbability >= 0.85) {
    riskLevel = "极高风险";
    suggestion = "建议立即咨询专业心理医生，全国心理援助热线：400-161-9995";
  } else if (riskProbability >= 0.70) {
    riskLevel = "高风险";
    suggestion = "建议尽快进行专业心理健康评估";
  } else if (riskProbability >= 0.50) {
    riskLevel = "中等风险";
    suggestion = "建议关注心理健康，适当寻求专业帮助";
  } else if (riskProbability >= 0.30) {
    riskLevel = "低风险";
    suggestion = "目前状况良好，建议保持健康的生活方式";
  } else {
    riskLevel = "正常";
    suggestion = "心理健康状况良好，继续保持积极的生活态度";
  }

  // 危机检测：QN420（生活无法继续）得分 >= 3
  const isCrisis = (answers["QN420"] !== undefined && answers["QN420"] >= 3);

  return {
    riskScore,
    riskLevel,
    riskProbability,
    suggestion,
    riskFactors,
    cesdScore,
    cesdMax,
    dimensions,
    isCrisis,
  };
}

// 代答问卷风险计算（0-12岁）
function calculateProxyRisk(
  ageGroupId: string,
  answers: Record<string, number>,
  riskFactors: string[]
): number {
  let risk = HEALTHY_BASELINE[ageGroupId] || 0.08;

  if (ageGroupId === "under_3_proxy") {
    // 发育指标
    const devVars = ["WB5", "WB6", "WB7", "WB8"];
    let devDelay = 0;
    for (const v of devVars) {
      if (answers[v] === 5) devDelay++;
    }
    if (devDelay >= 3) { risk += 0.25; riskFactors.push("多项发育迟缓"); }
    else if (devDelay >= 1) { risk += 0.10; riskFactors.push("部分发育指标落后"); }

    // 屏幕时间
    if (answers["WB9"] !== undefined && answers["WB9"] > 3.5) {
      risk += 0.08; riskFactors.push("屏幕时间过长");
    }

    // 父母陪伴
    if (answers["WB401"] !== undefined && answers["WB401"] <= 3) {
      risk += 0.10; riskFactors.push("父亲陪伴不足");
    }
    if (answers["WB402"] !== undefined && answers["WB402"] <= 3) {
      risk += 0.12; riskFactors.push("母亲陪伴不足");
    }

    // 生病
    if (answers["WC0"] === 1) { risk += 0.05; }
  }

  if (ageGroupId === "age_4_6_proxy") {
    // 未上学
    if (answers["WC1"] === 5) { risk += 0.15; riskFactors.push("未入学/入园"); }

    // 家庭互动
    const interactionVars = ["WG301", "WG302", "WG303"];
    let lowInteraction = 0;
    for (const v of interactionVars) {
      if (answers[v] !== undefined && answers[v] <= 2) lowInteraction++;
    }
    if (lowInteraction >= 2) { risk += 0.15; riskFactors.push("家庭互动不足"); }

    // 认知发展
    const cogVars = ["WG401", "WG402", "WG405", "WG408"];
    let cogDelay = 0;
    for (const v of cogVars) {
      if (answers[v] === 5) cogDelay++;
    }
    if (cogDelay >= 3) { risk += 0.20; riskFactors.push("认知发展落后"); }
    else if (cogDelay >= 1) { risk += 0.08; riskFactors.push("部分认知指标落后"); }
  }

  if (ageGroupId === "age_7_12_proxy") {
    // 未上学
    if (answers["WC1_child"] === 5) { risk += 0.25; riskFactors.push("学龄儿童失学"); }

    // 成绩
    if (answers["WF501"] !== undefined && answers["WF501"] >= 3) { risk += 0.08; riskFactors.push("语文成绩较差"); }
    if (answers["WF502"] !== undefined && answers["WF502"] >= 3) { risk += 0.08; riskFactors.push("数学成绩较差"); }

    // 家庭互动
    if (answers["WF602M"] !== undefined && answers["WF602M"] <= 2) {
      risk += 0.10; riskFactors.push("亲子交流不足");
    }
  }

  return Math.min(0.95, risk);
}

// 风险等级对应的颜色
export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "极高风险": return "text-destructive";
    case "高风险": return "text-destructive";
    case "中等风险": return "text-[hsl(var(--garden-gold))]";
    case "低风险": return "text-accent";
    case "正常": return "text-primary";
    default: return "text-foreground";
  }
}

export function getRiskBgColor(riskLevel: string): string {
  switch (riskLevel) {
    case "极高风险": return "bg-destructive/10";
    case "高风险": return "bg-destructive/10";
    case "中等风险": return "bg-[hsl(var(--garden-gold))]/10";
    case "低风险": return "bg-accent/10";
    case "正常": return "bg-primary/10";
    default: return "bg-muted";
  }
}

export function getRiskEmoji(riskLevel: string): string {
  switch (riskLevel) {
    case "极高风险": return "🔴";
    case "高风险": return "🟠";
    case "中等风险": return "🟡";
    case "低风险": return "🟢";
    case "正常": return "✅";
    default: return "⚪";
  }
}
