/**
 * 匹配计算引擎：只消费 APP_CONFIG，不把规则写死在逻辑里。
 */
(function (global) {
  function fillTemplate(template, vars) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] == null ? "" : String(vars[key]);
    });
  }

  function findRange(value, ranges) {
    if (!ranges || !ranges.length) return null;
    var hit = ranges.find(function (range) {
      return value >= range.min && value <= range.max;
    });
    if (hit) return hit;

    return ranges.reduce(function (best, range) {
      var dist =
        value < range.min ? range.min - value : value > range.max ? value - range.max : 0;
      var bestDist =
        value < best.min ? best.min - value : value > best.max ? value - best.max : 0;
      return dist < bestDist ? range : best;
    });
  }

  function resolvePlan(plan, allPlans) {
    if (!plan.inheritFrom) return plan;
    var base = allPlans.find(function (item) {
      return item.id === plan.inheritFrom;
    });
    if (!base) return plan;
    return {
      id: plan.id,
      name: plan.name,
      accent: plan.accent,
      icon: plan.icon,
      ageScores: plan.ageScores || base.ageScores,
      diopterScores: plan.diopterScores || base.diopterScores,
      axialTrendScores: plan.axialTrendScores || base.axialTrendScores,
      baseScore: plan.baseScore,
      comboBonuses: plan.comboBonuses || [],
      implementation: plan.implementation,
      followUp: plan.followUp,
    };
  }

  function scoreComboBonuses(plan, input) {
    var details = [];
    var total = 0;
    (plan.comboBonuses || []).forEach(function (bonus) {
      var matched = false;
      if (bonus.type === "ageAtMost") {
        matched = input.age <= bonus.value;
      } else if (bonus.type === "axialTrend") {
        matched = input.axialTrend === bonus.value;
      }
      if (matched) {
        total += bonus.score;
        details.push(bonus);
      }
    });
    return { total: total, details: details };
  }

  function toStars(score, mapping, maxStars) {
    var sorted = (mapping || []).slice().sort(function (a, b) {
      return b.minScore - a.minScore;
    });
    for (var i = 0; i < sorted.length; i++) {
      if (score >= sorted[i].minScore) {
        return Math.max(1, Math.min(maxStars || 5, sorted[i].stars));
      }
    }
    return 1;
  }

  function trendLabel(config, trendId) {
    var option = config.inputs.axialTrend.options.find(function (item) {
      return item.id === trendId;
    });
    return option ? option.label : trendId;
  }

  function buildReasons(plan, breakdown, input, config) {
    var templates = config.reasonTemplates || {};
    var vars = {
      age: input.age,
      diopter: input.diopter,
      trendLabel: trendLabel(config, input.axialTrend),
      planName: plan.name,
    };
    var reasons = [];

    var ageTpl = templates.age && templates.age[breakdown.age];
    var diopterTpl = templates.diopter && templates.diopter[breakdown.diopter];
    var trendTpl = templates.axialTrend && templates.axialTrend[breakdown.axialTrend];

    if (ageTpl) reasons.push(fillTemplate(ageTpl, vars));
    if (diopterTpl) reasons.push(fillTemplate(diopterTpl, vars));
    if (trendTpl) reasons.push(fillTemplate(trendTpl, vars));

    (breakdown.comboDetails || []).forEach(function (bonus) {
      if (bonus.type === "ageAtMost" && templates.combo && templates.combo.youngAge) {
        reasons.push(fillTemplate(templates.combo.youngAge, vars));
      }
      if (bonus.type === "axialTrend" && templates.combo && templates.combo.highTrend) {
        reasons.push(fillTemplate(templates.combo.highTrend, vars));
      }
    });

    return reasons;
  }

  function scorePlan(rawPlan, input, config) {
    var plan = resolvePlan(rawPlan, config.plans);
    var ageRange = findRange(input.age, plan.ageScores);
    var diopterRange = findRange(input.diopter, plan.diopterScores);
    var ageScore = ageRange ? ageRange.score : 0;
    var diopterScore = diopterRange ? diopterRange.score : 0;
    var axialScore =
      plan.axialTrendScores && plan.axialTrendScores[input.axialTrend] != null
        ? plan.axialTrendScores[input.axialTrend]
        : 0;
    var combo = scoreComboBonuses(plan, input);
    var total =
      ageScore + diopterScore + axialScore + (plan.baseScore || 0) + combo.total;
    var stars = toStars(total, config.starMapping, config.maxStars);
    var breakdown = {
      age: ageScore,
      diopter: diopterScore,
      axialTrend: axialScore,
      base: plan.baseScore || 0,
      combo: combo.total,
      comboDetails: combo.details,
      total: total,
    };

    return {
      id: plan.id,
      name: plan.name,
      accent: plan.accent,
      icon: plan.icon,
      stars: stars,
      maxStars: config.maxStars || 5,
      implementation: plan.implementation,
      followUp: plan.followUp,
      reasons: buildReasons(plan, breakdown, input, config),
      breakdown: breakdown,
    };
  }

  function comparePlans(a, b, planOrder) {
    if (b.stars !== a.stars) return b.stars - a.stars;
    var orderA = planOrder.indexOf(a.id);
    var orderB = planOrder.indexOf(b.id);
    if (orderA === -1) orderA = 99;
    if (orderB === -1) orderB = 99;
    return orderA - orderB;
  }

  function matchPlans(input, config) {
    var order = config.planOrder || [];
    return config.plans
      .map(function (plan) {
        return scorePlan(plan, input, config);
      })
      .sort(function (a, b) {
        return comparePlans(a, b, order);
      });
  }

  var api = {
    fillTemplate: fillTemplate,
    findRange: findRange,
    toStars: toStars,
    scorePlan: scorePlan,
    matchPlans: matchPlans,
  };

  global.MyopiaMatch = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : global);
