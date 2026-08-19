/**
 * 儿童近视控制方案：输入 → 输出映射逻辑表
 *
 * 输入
 * - age: 6–18 岁
 * - diopter: 50–1000 度（页面步进 25）
 * - cooperation: low | medium | high（低 / 中 / 高）
 * - eyeHealth: healthy | unhealthy（眼部健康 是 / 否）
 *
 * 输出（每张方案卡）
 * - fit: recommended | not_recommended（推荐 / 不推荐）
 * - controlEffect: 仅推荐时显示（强 / 中等）
 * - concerns: 仅不推荐时显示；多项时叠加
 * - risks: 推荐用推荐注意事项；不推荐用评估提示
 *
 * 排序
 * 1. 推荐优先于不推荐
 * 2. 相同适配程度按下方 PLAN_ORDER
 */

export type Cooperation = "low" | "medium" | "high";
export type EyeHealth = "healthy" | "unhealthy";
export type FitLevel = "recommended" | "not_recommended";
export type ControlEffect = "strong" | "moderate";
export type PlanId =
  | "ok"
  | "atropine"
  | "defocus"
  | "ok_atropine"
  | "defocus_atropine";

export interface ChildInput {
  age: number;
  diopter: number;
  cooperation: Cooperation;
  eyeHealth: EyeHealth;
}

export interface Concern {
  title: string;
  text: string;
}

export interface PlanResult {
  id: PlanId;
  name: string;
  icon: string;
  fit: FitLevel;
  controlEffect: ControlEffect | null;
  concerns: Concern[];
  risks: string[];
}

export const PLAN_ORDER: readonly PlanId[] = [
  "ok",
  "atropine",
  "defocus",
  "ok_atropine",
  "defocus_atropine",
] as const;

export const PLAN_NAMES: Record<PlanId, string> = {
  ok: "OK镜",
  atropine: "低浓度阿托品",
  defocus: "离焦框架眼镜",
  ok_atropine: "OK镜+低浓度阿托品",
  defocus_atropine: "离焦框架眼镜+低浓度阿托品",
};

export const PLAN_ICONS: Record<PlanId, string> = {
  ok: "./assets/img/icon-ok-lens.svg",
  atropine: "./assets/img/icon-atropine.svg",
  defocus: "./assets/img/icon-defocus-glasses.svg",
  ok_atropine: "./assets/img/icon-ok-atropine.svg",
  defocus_atropine: "./assets/img/icon-defocus-atropine.svg",
};

const RISK_DOCTOR_WEAR =
  "是否适合佩戴，还需要眼科医生结合小朋友的具体情况进行评估哦！";
const RISK_DOCTOR_USE =
  "是否适合使用，还需要眼科医生结合小朋友的具体情况进行评估哦！";

interface ConditionRule {
  key: string;
  title: string;
  pass: (input: ChildInput) => boolean;
  failText: (input: ChildInput) => string;
}

interface PlanRule {
  id: PlanId;
  controlEffect: ControlEffect;
  recommendedRisks: string[];
  failRiskWear: string;
  failRiskUse: string;
  conditions: ConditionRule[];
}

/**
 * 五套方案的条件映射表。离焦框架眼镜不把眼部健康作为筛选条件。
 */
export const PLAN_RULES: readonly PlanRule[] = [
  {
    id: "ok",
    controlEffect: "strong",
    recommendedRisks: [
      "为了保证佩戴安全，还需要进一步检查角膜条件哦！",
      "OK镜需要每天规范摘戴和护理，要记得保持小手和镜片的清洁卫生。",
      "还要按照医生的要求定期复查，及时了解眼睛的情况。",
    ],
    failRiskWear: RISK_DOCTOR_WEAR,
    failRiskUse: RISK_DOCTOR_WEAR,
    conditions: [
      {
        key: "age",
        title: "年龄",
        pass: (input) => input.age >= 8,
        failText: () => "目前年龄还未达到OK镜常规适用年龄。",
      },
      {
        key: "diopter",
        title: "近视度数",
        pass: (input) => input.diopter < 600,
        failText: () => "当前近视度数超出常规范围。",
      },
      {
        key: "cooperation",
        title: "配合度",
        pass: (input) => input.cooperation === "high",
        failText: () =>
          "OK镜需要每天规范佩戴、摘取和护理，对小朋友和家长的配合要求比较高哦！如果不能坚持规范护理，可能会影响佩戴安全和近视控制效果。",
      },
      {
        key: "eyeHealth",
        title: "眼部健康",
        pass: (input) => input.eyeHealth === "healthy",
        failText: () =>
          "OK镜会直接接触小朋友的角膜，对眼睛的健康状况有一定要求。",
      },
    ],
  },
  {
    id: "atropine",
    controlEffect: "strong",
    recommendedRisks: [
      "需要按照医生的要求每天规律使用哦！",
      "低浓度阿托品通常需要坚持较长时间，并配合定期复查。",
      "不要自己随意停药或漏用，具体使用时间要听医生的安排。",
      "如果使用后眼睛出现不舒服的情况，要及时告诉家长并咨询医生。",
    ],
    failRiskWear: RISK_DOCTOR_USE,
    failRiskUse: RISK_DOCTOR_USE,
    conditions: [
      {
        key: "age",
        title: "年龄",
        pass: (input) => input.age >= 6 && input.age <= 12,
        failText: (input) =>
          input.age < 6
            ? "目前年龄还未达到低浓度阿托品常规适用年龄。"
            : "当前年龄超出低浓度阿托品常规适用年龄范围，需要医生进一步评估哦！",
      },
      {
        key: "diopter",
        title: "近视度数",
        pass: (input) => input.diopter >= 100 && input.diopter <= 400,
        failText: (input) =>
          input.diopter < 100
            ? "当前近视度数低于常规使用范围，需要结合完整的眼部检查进一步评估哦！"
            : "当前近视度数超出常规使用范围，需要医生进一步评估哦！",
      },
      {
        key: "cooperation",
        title: "配合度",
        pass: (input) => input.cooperation !== "low",
        failText: () =>
          "低浓度阿托品需要每天规律使用，并且需要坚持较长时间。如果经常忘记使用，可能会影响近视控制效果哦！",
      },
      {
        key: "eyeHealth",
        title: "眼部健康",
        pass: (input) => input.eyeHealth === "healthy",
        failText: () =>
          "使用低浓度阿托品前，需要先确认眼睛是否适合使用。如果存在特殊的眼部情况，要先请医生进行检查和评估哦！",
      },
    ],
  },
  {
    id: "defocus",
    controlEffect: "moderate",
    recommendedRisks: [
      "需要按照要求坚持佩戴，长时间不戴可能会影响近视控制效果哦！",
      "还需要按照医生的要求定期复查，根据近视变化及时调整。",
    ],
    failRiskWear: RISK_DOCTOR_WEAR,
    failRiskUse: RISK_DOCTOR_USE,
    conditions: [
      {
        key: "age",
        title: "年龄",
        pass: (input) => input.age <= 18,
        failText: () => "目前年龄超过了离焦框架眼镜常规适用年龄。",
      },
      {
        key: "diopter",
        title: "近视度数",
        pass: (input) => input.diopter < 1000,
        failText: () => "当前近视度数超出常规范围，需要医生进一步评估哦！",
      },
      {
        key: "cooperation",
        title: "配合度",
        pass: (input) => input.cooperation !== "low",
        failText: () =>
          "离焦框架眼镜需要在白天坚持佩戴，长时间漏戴可能影响近视控制效果哦！",
      },
    ],
  },
  {
    id: "ok_atropine",
    controlEffect: "strong",
    recommendedRisks: [
      "这个方案同时包含OK镜和低浓度阿托品，对小朋友和家长的长期配合要求比较高哦！",
      "需要每天规范佩戴、摘取和护理OK镜。",
      "需要按照医生要求规律使用低浓度阿托品。",
      "要保持双手、镜片和护理用品的清洁卫生。",
      "需要按照医生要求定期复查。",
    ],
    failRiskWear: RISK_DOCTOR_WEAR,
    failRiskUse: RISK_DOCTOR_USE,
    conditions: [
      {
        key: "age",
        title: "年龄",
        pass: (input) => input.age >= 8 && input.age <= 12,
        failText: (input) =>
          input.age < 8
            ? "目前年龄还未达到OK镜常规适用年龄。"
            : "当前年龄超出低浓度阿托品常规适用年龄范围。",
      },
      {
        key: "diopter",
        title: "近视度数",
        pass: (input) => input.diopter >= 100 && input.diopter < 400,
        failText: (input) =>
          input.diopter < 100
            ? "当前近视度数低于低浓度阿托品常规使用范围。"
            : "当前近视度数超出两种方案共同的常规范围。",
      },
      {
        key: "cooperation",
        title: "配合度",
        pass: (input) => input.cooperation === "high",
        failText: () =>
          "这个方案需要规范佩戴和护理OK镜，同时还要长期规律使用低浓度阿托品，对小朋友和家长的配合要求比较高哦！",
      },
      {
        key: "eyeHealth",
        title: "眼部健康",
        pass: (input) => input.eyeHealth === "healthy",
        failText: () =>
          "这个方案包含OK镜和低浓度阿托品，如果存在眼部问题，需要先由医生检查和评估是否适合哦！",
      },
    ],
  },
  {
    id: "defocus_atropine",
    controlEffect: "strong",
    recommendedRisks: [
      "需要坚持规范佩戴离焦框架眼镜。",
      "需要按照医生要求规律使用低浓度阿托品。",
      "长时间漏戴眼镜可能影响近视控制效果哦！",
      "需要定期复查，并根据医生评估及时调整方案。",
    ],
    failRiskWear: RISK_DOCTOR_WEAR,
    failRiskUse: RISK_DOCTOR_USE,
    conditions: [
      {
        key: "age",
        title: "年龄",
        pass: (input) => input.age >= 6 && input.age <= 12,
        failText: (input) =>
          input.age < 6
            ? "目前年龄还未达到离焦框架眼镜和低浓度阿托品共同的常规适用年龄。"
            : "当前年龄超出低浓度阿托品常规适用年龄范围，需要医生进一步评估哦！",
      },
      {
        key: "diopter",
        title: "近视度数",
        pass: (input) => input.diopter >= 100 && input.diopter < 400,
        failText: (input) =>
          input.diopter < 100
            ? "当前近视度数低于低浓度阿托品常规使用范围。"
            : "当前近视度数超出低浓度阿托品常规范围，需要医生进一步评估哦！",
      },
      {
        key: "cooperation",
        title: "配合度",
        pass: (input) => input.cooperation !== "low",
        failText: () =>
          "这个方案需要长期规律使用低浓度阿托品。如果经常忘记使用，可能会影响近视控制效果哦！",
      },
      {
        key: "eyeHealth",
        title: "眼部健康",
        pass: (input) => input.eyeHealth === "healthy",
        failText: () =>
          "这个方案包含低浓度阿托品，如果存在眼部问题或特殊情况，需要先由医生检查和评估是否适合哦！",
      },
    ],
  },
] as const;

function evaluatePlan(rule: PlanRule, input: ChildInput): PlanResult {
  const concerns: Concern[] = [];
  const failedKeys: string[] = [];

  for (const condition of rule.conditions) {
    if (!condition.pass(input)) {
      failedKeys.push(condition.key);
      concerns.push({
        title: condition.title,
        text: condition.failText(input),
      });
    }
  }

  if (concerns.length === 0) {
    return {
      id: rule.id,
      name: PLAN_NAMES[rule.id],
      icon: PLAN_ICONS[rule.id],
      fit: "recommended",
      controlEffect: rule.controlEffect,
      concerns: [],
      risks: rule.recommendedRisks,
    };
  }

  const useStyleFail = failedKeys.some(
    (key) => key === "cooperation" || key === "eyeHealth",
  );
  const failRisk =
    failedKeys.length > 1 || useStyleFail ? rule.failRiskUse : rule.failRiskWear;

  return {
    id: rule.id,
    name: PLAN_NAMES[rule.id],
    icon: PLAN_ICONS[rule.id],
    fit: "not_recommended",
    controlEffect: null,
    concerns,
    risks: [failRisk],
  };
}

function fitRank(fit: FitLevel): number {
  return fit === "recommended" ? 0 : 1;
}

export function evaluateAll(input: ChildInput): PlanResult[] {
  return PLAN_RULES.map((rule) => evaluatePlan(rule, input)).sort((a, b) => {
    const fitDelta = fitRank(a.fit) - fitRank(b.fit);
    if (fitDelta !== 0) return fitDelta;
    return PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id);
  });
}
