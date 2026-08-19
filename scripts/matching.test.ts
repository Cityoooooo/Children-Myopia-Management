import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateAll, type ChildInput, type PlanId } from "../assets/ts/matching.ts";

function idsByFit(
  input: ChildInput,
  fit: "recommended" | "not_recommended",
): PlanId[] {
  return evaluateAll(input)
    .filter((item) => item.fit === fit)
    .map((item) => item.id);
}

function plan(input: ChildInput, id: PlanId) {
  const found = evaluateAll(input).find((item) => item.id === id);
  assert.ok(found, `missing plan ${id}`);
  return found;
}

describe("myopia plan matching table", () => {
  it("recommends all five plans for 10y / 300d / high / healthy", () => {
    const results = evaluateAll({
      age: 10,
      diopter: 300,
      cooperation: "high",
      eyeHealth: "healthy",
    });
    assert.equal(results.length, 5);
    assert.deepEqual(
      results.map((item) => item.id),
      ["ok", "atropine", "defocus", "ok_atropine", "defocus_atropine"],
    );
    assert.ok(results.every((item) => item.fit === "recommended"));
    assert.equal(plan({ age: 10, diopter: 300, cooperation: "high", eyeHealth: "healthy" }, "defocus").controlEffect, "moderate");
  });

  it("sorts recommended plans first, then by the specified order", () => {
    const results = evaluateAll({
      age: 10,
      diopter: 300,
      cooperation: "medium",
      eyeHealth: "healthy",
    });
    assert.deepEqual(
      results.map((item) => item.id),
      ["atropine", "defocus", "defocus_atropine", "ok", "ok_atropine"],
    );
    assert.deepEqual(idsByFit({
      age: 10,
      diopter: 300,
      cooperation: "medium",
      eyeHealth: "healthy",
    }, "recommended"), ["atropine", "defocus", "defocus_atropine"]);
  });

  it("rejects OK lens under age 8, 600 degrees, non-high cooperation, or unhealthy eyes", () => {
    const young = plan({ age: 7, diopter: 300, cooperation: "high", eyeHealth: "healthy" }, "ok");
    assert.equal(young.fit, "not_recommended");
    assert.equal(young.concerns[0]?.title, "年龄");
    assert.equal(young.controlEffect, null);

    const highDiopter = plan({ age: 10, diopter: 600, cooperation: "high", eyeHealth: "healthy" }, "ok");
    assert.equal(highDiopter.fit, "not_recommended");
    assert.equal(highDiopter.concerns[0]?.title, "近视度数");

    const medium = plan({ age: 10, diopter: 300, cooperation: "medium", eyeHealth: "healthy" }, "ok");
    assert.equal(medium.fit, "not_recommended");
    assert.equal(medium.concerns[0]?.title, "配合度");

    const unhealthy = plan({ age: 10, diopter: 300, cooperation: "high", eyeHealth: "unhealthy" }, "ok");
    assert.equal(unhealthy.fit, "not_recommended");
    assert.equal(unhealthy.concerns[0]?.title, "眼部健康");
  });

  it("stacks every unmatched OK lens reason", () => {
    const result = plan({
      age: 7,
      diopter: 700,
      cooperation: "medium",
      eyeHealth: "unhealthy",
    }, "ok");
    assert.equal(result.concerns.length, 4);
    assert.deepEqual(
      result.concerns.map((item) => item.title),
      ["年龄", "近视度数", "配合度", "眼部健康"],
    );
  });

  it("accepts atropine at 6-12 years and 100-400 degrees with medium or high cooperation", () => {
    const ok = plan({ age: 12, diopter: 400, cooperation: "medium", eyeHealth: "healthy" }, "atropine");
    assert.equal(ok.fit, "recommended");
    assert.equal(ok.controlEffect, "strong");

    const old = plan({ age: 13, diopter: 200, cooperation: "high", eyeHealth: "healthy" }, "atropine");
    assert.equal(old.fit, "not_recommended");
    assert.match(old.concerns[0]?.text ?? "", /超出低浓度阿托品常规适用年龄/);

    const lowDegree = plan({ age: 10, diopter: 75, cooperation: "high", eyeHealth: "healthy" }, "atropine");
    assert.match(lowDegree.concerns[0]?.text ?? "", /低于常规使用范围/);

    const lowCoop = plan({ age: 10, diopter: 200, cooperation: "low", eyeHealth: "healthy" }, "atropine");
    assert.equal(lowCoop.concerns[0]?.title, "配合度");
  });

  it("does not use eye health as a filter for defocus glasses", () => {
    const result = plan({
      age: 10,
      diopter: 300,
      cooperation: "medium",
      eyeHealth: "unhealthy",
    }, "defocus");
    assert.equal(result.fit, "recommended");
    assert.equal(result.controlEffect, "moderate");
    assert.equal(result.concerns.length, 0);
  });

  it("rejects defocus glasses at 1000 degrees or low cooperation", () => {
    const high = plan({ age: 10, diopter: 1000, cooperation: "high", eyeHealth: "healthy" }, "defocus");
    assert.equal(high.fit, "not_recommended");
    assert.equal(high.concerns[0]?.title, "近视度数");

    const low = plan({ age: 10, diopter: 300, cooperation: "low", eyeHealth: "healthy" }, "defocus");
    assert.equal(low.fit, "not_recommended");
    assert.equal(low.concerns[0]?.title, "配合度");
  });

  it("requires overlapping OK and atropine ranges for the combination plan", () => {
    const recommended = plan({
      age: 10,
      diopter: 300,
      cooperation: "high",
      eyeHealth: "healthy",
    }, "ok_atropine");
    assert.equal(recommended.fit, "recommended");

    const at400 = plan({
      age: 10,
      diopter: 400,
      cooperation: "high",
      eyeHealth: "healthy",
    }, "ok_atropine");
    assert.equal(at400.fit, "not_recommended");
    assert.match(at400.concerns[0]?.text ?? "", /超出两种方案共同的常规范围/);

    const atropineAlone = plan({
      age: 10,
      diopter: 400,
      cooperation: "high",
      eyeHealth: "healthy",
    }, "atropine");
    assert.equal(atropineAlone.fit, "recommended");
  });

  it("rejects combo plans when age is over 12", () => {
    const input: ChildInput = {
      age: 15,
      diopter: 250,
      cooperation: "high",
      eyeHealth: "healthy",
    };
    assert.equal(plan(input, "ok").fit, "recommended");
    assert.equal(plan(input, "atropine").fit, "not_recommended");
    assert.equal(plan(input, "defocus").fit, "recommended");
    assert.equal(plan(input, "ok_atropine").fit, "not_recommended");
    assert.equal(plan(input, "defocus_atropine").fit, "not_recommended");
  });
});
