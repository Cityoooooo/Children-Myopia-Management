/**
 * 儿童近视管理方案匹配 Demo — 规则配置
 *
 * 医学专家调整规则时，原则上只修改本文件。
 * 页面展示、交互逻辑请勿把评分规则写死在 app.js 中。
 */
(function (global) {
var APP_CONFIG = {
  meta: {
    title: "儿童近视管理方案匹配",
    subtitle: "基于当前输入信息，查看不同方案的匹配程度",
    badge: "科普 Demo",
    disclaimer:
      "本结果仅用于近视防控科普及方案理解，不构成诊断或治疗建议。具体方案需由眼科医生结合年龄、近视度数、眼轴变化、角膜及眼健康检查等情况综合评估。",
  },

  inputs: {
    age: {
      id: "age",
      label: "年龄",
      min: 6,
      max: 16,
      step: 1,
      defaultValue: 10,
      unit: "岁",
    },
    diopter: {
      id: "diopter",
      label: "当前近视度数",
      min: 50,
      max: 800,
      step: 25,
      defaultValue: 250,
      unit: "度",
    },
    axialTrend: {
      id: "axialTrend",
      label: "眼轴增长趋势",
      defaultValue: "medium",
      options: [
        { id: "low", label: "低" },
        { id: "medium", label: "中" },
        { id: "high", label: "高" },
      ],
    },
  },

  /**
   * 五星映射：按总分从高到低匹配第一条满足 minScore 的规则。
   * 不在页面展示具体分数，只展示星级。
   */
  starMapping: [
    { minScore: 12, stars: 5 },
    { minScore: 10, stars: 4 },
    { minScore: 8, stars: 3 },
    { minScore: 6, stars: 2 },
    { minScore: 0, stars: 1 },
  ],
  maxStars: 5,

  /**
   * 同分时的稳定排序（同时作为方案定义顺序）。
   * 卡片展示顺序：匹配星级从高到低，星级相同则按本数组先后。
   */
  planOrder: [
    "ok",
    "atropine",
    "defocus",
    "ok_atropine",
    "defocus_atropine",
  ],

  /**
   * 主要依据文案模板。{age} {diopter} {trendLabel} {planName} 会在运行时替换。
   * 按各维度得分匹配，便于随评分规则一起调整表述。
   */
  reasonTemplates: {
    age: {
      3: "当前年龄 {age} 岁，处于该方案匹配程度相对较高的年龄区间。",
      2: "当前年龄 {age} 岁，该方案在此年龄段具有一定匹配基础。",
      1: "当前年龄 {age} 岁，年龄相关匹配程度相对较低，仍纳入比较。",
    },
    diopter: {
      3: "当前近视度数 {diopter} 度，处于该方案匹配程度相对较高的度数区间。",
      2: "当前近视度数 {diopter} 度，该方案在此度数范围具有一定匹配基础。",
      1: "当前近视度数 {diopter} 度，度数相关匹配程度相对较低，仍纳入比较。",
    },
    axialTrend: {
      4: "眼轴增长趋势为「{trendLabel}」，该方案在进展较快情境下的匹配程度相对更高。",
      3: "眼轴增长趋势为「{trendLabel}」，该方案在中等进展情境下具有较好匹配基础。",
      1: "眼轴增长趋势为「{trendLabel}」，该方案在进展较缓情境下的匹配程度相对较低。",
    },
    combo: {
      youngAge:
        "联合方案在 {age} 岁及以下儿童中具有额外匹配加成。",
      highTrend:
        "联合方案在眼轴增长趋势为「高」时具有额外匹配加成。",
    },
  },

  plans: [
    {
      id: "ok",
      name: "OK镜",
      accent: "#3A7CA5",
      icon: "lens",
      ageScores: [
        { min: 6, max: 7, score: 2 },
        { min: 8, max: 12, score: 3 },
        { min: 13, max: 14, score: 2 },
        { min: 15, max: 16, score: 1 },
      ],
      diopterScores: [
        { min: 50, max: 75, score: 1 },
        { min: 100, max: 400, score: 3 },
        { min: 425, max: 600, score: 2 },
        { min: 625, max: 800, score: 1 },
      ],
      axialTrendScores: {
        low: 1,
        medium: 3,
        high: 4,
      },
      baseScore: 2,
      comboBonuses: [],
      implementation:
        "需要夜间按要求佩戴，并进行规范的镜片清洁、护理和保存；需要保持较好的佩戴依从性。",
      followUp:
        "管理要求较高，初期通常需要较密切随访；后续持续关注视力、近视度数、角膜健康及眼轴变化。",
    },
    {
      id: "atropine",
      name: "低浓度阿托品",
      accent: "#2A9D8F",
      icon: "drop",
      ageScores: [
        { min: 6, max: 7, score: 2 },
        { min: 8, max: 12, score: 3 },
        { min: 13, max: 14, score: 2 },
        { min: 15, max: 16, score: 1 },
      ],
      diopterScores: [
        { min: 50, max: 75, score: 2 },
        { min: 100, max: 400, score: 3 },
        { min: 425, max: 600, score: 2 },
        { min: 625, max: 800, score: 2 },
      ],
      axialTrendScores: {
        low: 1,
        medium: 3,
        high: 4,
      },
      baseScore: 2,
      comboBonuses: [],
      implementation:
        "需要按照医生指导规律点药，保持用药依从性；不建议自行调整用药方式或随意停药。",
      followUp:
        "需要定期随访，持续评估近视进展、眼轴变化及用药后的耐受情况；具体随访安排由医生结合个体情况确定。",
    },
    {
      id: "defocus",
      name: "离焦框架眼镜",
      accent: "#6C63FF",
      icon: "glasses",
      ageScores: [
        { min: 6, max: 7, score: 2 },
        { min: 8, max: 12, score: 3 },
        { min: 13, max: 14, score: 2 },
        { min: 15, max: 16, score: 1 },
      ],
      diopterScores: [
        { min: 50, max: 75, score: 1 },
        { min: 100, max: 400, score: 3 },
        { min: 425, max: 600, score: 2 },
        { min: 625, max: 800, score: 1 },
      ],
      axialTrendScores: {
        low: 1,
        medium: 3,
        high: 4,
      },
      baseScore: 2,
      comboBonuses: [],
      implementation:
        "需要在日常生活中持续规范佩戴；注意镜片状态，并保持良好的佩戴习惯。",
      followUp:
        "以常规定期随访为基础，持续关注视力、近视度数及眼轴变化；根据近视进展情况评估是否需要调整管理策略。",
    },
    {
      id: "ok_atropine",
      name: "OK镜 + 低浓度阿托品",
      accent: "#1D8A99",
      icon: "lens-drop",
      inheritFrom: "ok",
      baseScore: 1,
      comboBonuses: [
        { type: "ageAtMost", value: 12, score: 1 },
        { type: "axialTrend", value: "high", score: 1 },
      ],
      implementation:
        "需要同时完成夜间 OK 镜佩戴及镜片护理，并按照医生指导规律使用药物；对佩戴、护理和用药依从性的要求较高。",
      followUp:
        "管理要求较高，需要同时关注 OK 镜佩戴及护理情况、药物使用情况，以及视力、近视度数和眼轴变化；具体随访安排由医生结合个体情况确定。",
    },
    {
      id: "defocus_atropine",
      name: "离焦框架眼镜 + 低浓度阿托品",
      accent: "#E09F3E",
      icon: "glasses-drop",
      inheritFrom: "defocus",
      baseScore: 1,
      comboBonuses: [
        { type: "ageAtMost", value: 12, score: 1 },
        { type: "axialTrend", value: "high", score: 1 },
      ],
      implementation:
        "需要持续规范佩戴近视控制框架眼镜，并按照医生指导规律使用药物；需要同时保持眼镜佩戴和用药依从性。",
      followUp:
        "需要定期随访，同时关注框架眼镜佩戴、药物使用以及近视度数和眼轴变化；具体随访安排由医生结合个体情况确定。",
    },
  ],
};

  global.APP_CONFIG = APP_CONFIG;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = APP_CONFIG;
  }
})(typeof window !== "undefined" ? window : global);
