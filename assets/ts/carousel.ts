export interface CarouselApi {
  refresh: () => void;
  goTo: (index: number) => void;
  destroy: () => void;
}

interface CarouselOptions {
  onIndexChange?: (index: number) => void;
}

export function createPeekCarousel(
  root: HTMLElement,
  options: CarouselOptions = {},
): CarouselApi {
  const viewport = root.querySelector<HTMLElement>("[data-carousel-viewport]");
  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  const prevBtn = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const nextBtn = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
  const dots = root.querySelector<HTMLElement>("[data-carousel-dots]");

  if (!viewport || !track || !prevBtn || !nextBtn || !dots) {
    throw new Error("Carousel markup is incomplete.");
  }

  let index = 0;
  let cardCount = 0;
  let pointerId: number | null = null;
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;
  let snapTimer = 0;

  const cards = () =>
    Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-card]"));

  const layoutCards = () => {
    const list = cards();
    const viewportWidth = viewport.clientWidth;
    const cardWidth = Math.round(viewportWidth * 0.82);
    const pad = Math.max(16, Math.round((viewportWidth - cardWidth) / 2));
    track.style.paddingLeft = `${pad}px`;
    track.style.paddingRight = `${pad}px`;
    list.forEach((card) => {
      card.style.width = `${cardWidth}px`;
      card.style.flexBasis = `${cardWidth}px`;
    });
  };

  const cardCenterScroll = (card: HTMLElement): number =>
    card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;

  const nearestIndex = (): number => {
    const list = cards();
    if (list.length === 0) return 0;
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    list.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const updateChrome = () => {
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= cardCount - 1;
    dots.querySelectorAll<HTMLButtonElement>(".dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
    options.onIndexChange?.(index);
  };

  const goTo = (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
    const list = cards();
    if (list.length === 0) return;
    index = Math.max(0, Math.min(nextIndex, list.length - 1));
    const target = cardCenterScroll(list[index]);
    viewport.scrollTo({ left: target, behavior });
    updateChrome();
  };

  const renderDots = () => {
    dots.innerHTML = "";
    for (let i = 0; i < cardCount; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dot";
      button.setAttribute("aria-label", `第 ${i + 1} 个方案`);
      button.addEventListener("click", () => goTo(i));
      dots.append(button);
    }
  };

  const syncIndexFromScroll = () => {
    const next = nearestIndex();
    if (next !== index) {
      index = next;
      updateChrome();
    } else {
      prevBtn.disabled = index <= 0;
      nextBtn.disabled = index >= cardCount - 1;
    }
  };

  const onScroll = () => {
    if (dragging) return;
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(syncIndexFromScroll, 60);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    dragging = true;
    moved = false;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    viewport.scrollLeft = startScroll - dx;
  };

  const endDrag = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    viewport.classList.remove("is-dragging");
    goTo(nearestIndex());
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!moved) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  };

  const onPrev = () => goTo(index - 1);
  const onNext = () => goTo(index + 1);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("click", onClickCapture, true);
  viewport.addEventListener("scroll", onScroll, { passive: true });
  prevBtn.addEventListener("click", onPrev);
  nextBtn.addEventListener("click", onNext);
  root.addEventListener("keydown", onKeyDown);
  const resizeObserver = new ResizeObserver(() => {
    const current = index;
    layoutCards();
    goTo(current, "auto");
  });
  resizeObserver.observe(viewport);

  const refresh = () => {
    layoutCards();
    cardCount = cards().length;
    renderDots();
    goTo(0, "auto");
  };

  const destroy = () => {
    viewport.removeEventListener("pointerdown", onPointerDown);
    viewport.removeEventListener("pointermove", onPointerMove);
    viewport.removeEventListener("pointerup", endDrag);
    viewport.removeEventListener("pointercancel", endDrag);
    viewport.removeEventListener("click", onClickCapture, true);
    viewport.removeEventListener("scroll", onScroll);
    prevBtn.removeEventListener("click", onPrev);
    nextBtn.removeEventListener("click", onNext);
    root.removeEventListener("keydown", onKeyDown);
    resizeObserver.disconnect();
    window.clearTimeout(snapTimer);
  };

  refresh();

  return { refresh, goTo, destroy };
}
