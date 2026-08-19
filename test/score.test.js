const assert = require("assert");
const config = require("../js/config");
const engine = require("../js/engine");

function match(input) {
  return engine.matchPlans(input, config);
}

function byId(plans, id) {
  return plans.find((plan) => plan.id === id);
}

function testExampleDefaults() {
  const plans = match({ age: 10, diopter: 250, axialTrend: "medium" });
  const ok = byId(plans, "ok");
  assert.strictEqual(ok.breakdown.age, 3);
  assert.strictEqual(ok.breakdown.diopter, 3);
  assert.strictEqual(ok.breakdown.axialTrend, 3);
  assert.strictEqual(ok.breakdown.base, 2);
  assert.strictEqual(ok.breakdown.total, 11);
  assert.strictEqual(ok.stars, 4);

  const atropine = byId(plans, "atropine");
  assert.strictEqual(atropine.breakdown.total, 11);
  assert.strictEqual(atropine.stars, 4);

  const combo = byId(plans, "ok_atropine");
  assert.strictEqual(combo.breakdown.base, 1);
  assert.strictEqual(combo.breakdown.combo, 1);
  assert.strictEqual(combo.breakdown.total, 11);
  assert.strictEqual(combo.stars, 4);

  assert.deepStrictEqual(
    plans.map((plan) => plan.id),
    ["ok", "atropine", "defocus", "ok_atropine", "defocus_atropine"]
  );
}

function testHighTrendComboBonus() {
  const plans = match({ age: 10, diopter: 250, axialTrend: "high" });
  const combo = byId(plans, "ok_atropine");
  assert.strictEqual(combo.breakdown.age, 3);
  assert.strictEqual(combo.breakdown.diopter, 3);
  assert.strictEqual(combo.breakdown.axialTrend, 4);
  assert.strictEqual(combo.breakdown.base, 1);
  assert.strictEqual(combo.breakdown.combo, 2);
  assert.strictEqual(combo.breakdown.total, 13);
  assert.strictEqual(combo.stars, 5);

  const ok = byId(plans, "ok");
  assert.strictEqual(ok.breakdown.total, 12);
  assert.strictEqual(ok.stars, 5);
}

function testLowMatchStillVisible() {
  const plans = match({ age: 16, diopter: 50, axialTrend: "low" });
  assert.strictEqual(plans.length, 5);
  plans.forEach((plan) => {
    assert.ok(plan.stars >= 1);
    assert.ok(plan.name);
    assert.ok(plan.implementation);
    assert.ok(plan.followUp);
    assert.ok(plan.reasons.length >= 3);
  });

  const atropine = byId(plans, "atropine");
  assert.strictEqual(atropine.breakdown.diopter, 2);
  assert.strictEqual(atropine.breakdown.total, 6);
  assert.strictEqual(atropine.stars, 2);

  const ok = byId(plans, "ok");
  assert.strictEqual(ok.breakdown.diopter, 1);
  assert.strictEqual(ok.breakdown.total, 5);
  assert.strictEqual(ok.stars, 1);

  const combo = byId(plans, "ok_atropine");
  assert.strictEqual(combo.breakdown.combo, 0);
  assert.strictEqual(combo.breakdown.total, 4);
  assert.strictEqual(combo.stars, 1);

  assert.strictEqual(plans[0].id, "atropine");
}

function testDegreeBands() {
  const low = engine.scorePlan(
    config.plans[0],
    { age: 10, diopter: 75, axialTrend: "medium" },
    config
  );
  const mid = engine.scorePlan(
    config.plans[0],
    { age: 10, diopter: 100, axialTrend: "medium" },
    config
  );
  assert.strictEqual(low.breakdown.diopter, 1);
  assert.strictEqual(mid.breakdown.diopter, 3);
}

function testAgeBands() {
  const young = engine.scorePlan(
    config.plans[0],
    { age: 7, diopter: 250, axialTrend: "medium" },
    config
  );
  const peak = engine.scorePlan(
    config.plans[0],
    { age: 8, diopter: 250, axialTrend: "medium" },
    config
  );
  const older = engine.scorePlan(
    config.plans[0],
    { age: 15, diopter: 250, axialTrend: "medium" },
    config
  );
  assert.strictEqual(young.breakdown.age, 2);
  assert.strictEqual(peak.breakdown.age, 3);
  assert.strictEqual(older.breakdown.age, 1);
}

function testComboAgeCutoff() {
  const young = match({ age: 12, diopter: 250, axialTrend: "medium" });
  const older = match({ age: 13, diopter: 250, axialTrend: "medium" });
  assert.strictEqual(byId(young, "ok_atropine").breakdown.combo, 1);
  assert.strictEqual(byId(older, "ok_atropine").breakdown.combo, 0);
}

function testStarMappingIsConfigurable() {
  assert.strictEqual(engine.toStars(12, config.starMapping, 5), 5);
  assert.strictEqual(engine.toStars(10, config.starMapping, 5), 4);
  assert.strictEqual(engine.toStars(8, config.starMapping, 5), 3);
  assert.strictEqual(engine.toStars(6, config.starMapping, 5), 2);
  assert.strictEqual(engine.toStars(4, config.starMapping, 5), 1);
}

function testNoForbiddenCopy() {
  const forbidden = [
    "适合",
    "不适合",
    "推荐",
    "不推荐",
    "可以使用",
    "不可以使用",
    "禁用",
    "最佳方案",
    "首选方案",
  ];
  const blob = JSON.stringify(config);
  forbidden.forEach((word) => {
    assert.strictEqual(blob.includes(word), false, "config contains " + word);
  });
}

const tests = [
  testExampleDefaults,
  testHighTrendComboBonus,
  testLowMatchStillVisible,
  testDegreeBands,
  testAgeBands,
  testComboAgeCutoff,
  testStarMappingIsConfigurable,
  testNoForbiddenCopy,
];

tests.forEach((fn) => fn());
console.log("All " + tests.length + " scoring tests passed.");
