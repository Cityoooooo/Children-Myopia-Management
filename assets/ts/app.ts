import { createPeekCarousel } from "./carousel.ts";
import {
  evaluateAll,
  type ChildInput,
  type Cooperation,
  type EyeHealth,
  type PlanResult,
} from "./matching.ts";

const FIT_LABEL: Record<PlanResult["fit"], string> = {
  recommended: "推荐",
  not_recommended: "不推荐",
};

const EFFECT_LABEL: Record<NonNullable<PlanResult["controlEffect"]>, string> = {
  strong: "强",
  moderate: "中等",
};

function readInput(form: HTMLFormElement): ChildInput {
  const data = new FormData(form);
  const cooperation = String(data.get("cooperation") ?? "medium") as Cooperation;
  const eyeHealth = String(data.get("eyeHealth") ?? "healthy") as EyeHealth;
  return {
    age: Number(data.get("age") ?? 10),
    diopter: Number(data.get("diopter") ?? 300),
    cooperation,
    eyeHealth,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderConcerns(result: PlanResult): string {
  if (result.concerns.length === 0) return "";
  const heading =
    result.concerns.length > 1
      ? `<p class="concern-count">当前有 ${result.concerns.length} 项条件需要关注：</p>`
      : "";
  const items = result.concerns
    .map(
      (item) => `
        <div class="concern-item">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </div>`,
    )
    .join("");
  return `
    <section class="plan-block">
      <h4>需要关注的地方</h4>
      ${heading}
      ${items}
    </section>`;
}

function renderEffect(result: PlanResult): string {
  if (!result.controlEffect) return "";
  return `
    <section class="plan-block">
      <h4>控制效果</h4>
      <p class="effect-value effect-${result.controlEffect}">${EFFECT_LABEL[result.controlEffect]}</p>
    </section>`;
}

function renderCard(result: PlanResult): string {
  const fitClass = result.fit === "recommended" ? "fit-yes" : "fit-no";
  const risks = result.risks
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `
    <article class="plan-card" data-carousel-card data-fit="${result.fit}">
      <header class="plan-card-head">
        <img class="plan-icon" src="${result.icon}" width="48" height="48" alt="">
        <h3>${escapeHtml(result.name)}</h3>
      </header>
      <section class="plan-block">
        <h4>适配程度</h4>
        <p class="fit-badge ${fitClass}">
          <span class="fit-dot" aria-hidden="true"></span>
          ${FIT_LABEL[result.fit]}
        </p>
      </section>
      ${renderEffect(result)}
      ${renderConcerns(result)}
      <section class="plan-block">
        <h4>风险与注意事项</h4>
        <ul class="risk-list">${risks}</ul>
      </section>
    </article>`;
}

function bindSlider(
  form: HTMLFormElement,
  name: string,
  output: HTMLElement,
  suffix: string,
) {
  const input = form.elements.namedItem(name);
  if (!(input instanceof HTMLInputElement)) return;
  const render = () => {
    output.textContent = `${input.value}${suffix}`;
  };
  input.addEventListener("input", render);
  render();
}

function init() {
  const form = document.querySelector<HTMLFormElement>("#child-form");
  const track = document.querySelector<HTMLElement>("#plan-track");
  const carouselRoot = document.querySelector<HTMLElement>("#plan-carousel");
  if (!form || !track || !carouselRoot) return;

  const ageValue = document.querySelector<HTMLElement>("#age-value");
  const diopterValue = document.querySelector<HTMLElement>("#diopter-value");
  if (ageValue) bindSlider(form, "age", ageValue, " 岁");
  if (diopterValue) bindSlider(form, "diopter", diopterValue, " 度");

  const carousel = createPeekCarousel(carouselRoot);

  const render = () => {
    const results = evaluateAll(readInput(form));
    track.innerHTML = results.map((result) => renderCard(result)).join("");
    carousel.refresh();
  };

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
