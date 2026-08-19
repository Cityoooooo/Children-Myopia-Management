(function () {
  var config = window.APP_CONFIG;
  var engine = window.MyopiaMatch;
  var state = {
    age: config.inputs.age.defaultValue,
    diopter: config.inputs.diopter.defaultValue,
    axialTrend: config.inputs.axialTrend.defaultValue,
  };
  var activeIndex = 0;
  var drag = {
    down: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  };

  var icons = {
    lens:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M7.2 8.1c1.2-1.4 4.8-2 7.4.4"/></svg>',
    drop:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c2.8 4.2 6 7.8 6 11.1A6 6 0 1 1 6 14.1C6 10.8 9.2 7.2 12 3Z"/><path d="M10 15.2c.5 1.4 1.8 2.1 3.2 2"/></svg>',
    glasses:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7.2" cy="13.5" r="3.4"/><circle cx="16.8" cy="13.5" r="3.4"/><path d="M10.6 13.2h2.8M3 13.4h.8M20.2 13.4H21M4.2 8.6 6.1 12M19.8 8.6 17.9 12"/></svg>',
    "lens-drop":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="12" r="6.2"/><circle cx="9" cy="12" r="2.4"/><path d="M17.2 4.8c1.5 2.2 3.2 4.1 3.2 5.9a3.2 3.2 0 1 1-6.4 0c0-1.8 1.7-3.7 3.2-5.9Z"/></svg>',
    "glasses-drop":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6.6" cy="14.2" r="3"/><circle cx="14.2" cy="14.2" r="3"/><path d="M9.6 14h1.6M3.2 14.2h.7M17.2 14.2h.5M4.2 9.8 5.8 12.6M19.6 5.2c1.2 1.8 2.6 3.3 2.6 4.7a2.5 2.5 0 1 1-5 0c0-1.4 1.4-2.9 2.6-4.7Z"/></svg>',
  };

  var chevronLeft =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>';
  var chevronRight =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';

  function $(id) {
    return document.getElementById(id);
  }

  function percent(value, min, max) {
    if (max === min) return 100;
    return ((value - min) / (max - min)) * 100;
  }

  function starSvg(filled) {
    var cls = filled ? "on" : "off";
    return (
      '<svg class="' +
      cls +
      '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 14.8 8.7l6.9.8-5.1 4.7 1.4 6.8L12 18.8 6 21l1.4-6.8L2.3 9.5l6.9-.8L12 2.4Z"/></svg>'
    );
  }

  function renderStars(count, max) {
    var html = "";
    for (var i = 1; i <= max; i++) html += starSvg(i <= count);
    return html;
  }

  function renderAppShell() {
    var age = config.inputs.age;
    var diopter = config.inputs.diopter;
    var trend = config.inputs.axialTrend;

    document.title = config.meta.title;
    document.body.innerHTML =
      '<div class="app">' +
      '<header class="hero">' +
      '<span class="badge">' +
      config.meta.badge +
      "</span>" +
      "<h1>" +
      config.meta.title +
      "</h1>" +
      "<p>" +
      config.meta.subtitle +
      "</p>" +
      "</header>" +
      '<section class="panel" aria-label="儿童信息输入">' +
      "<h2>儿童信息</h2>" +
      '<div class="field">' +
      '<div class="field-top"><label for="age">年龄</label><div class="field-value" id="ageValue"></div></div>' +
      '<input id="age" type="range" min="' +
      age.min +
      '" max="' +
      age.max +
      '" step="' +
      age.step +
      '" value="' +
      state.age +
      '">' +
      '<div class="range-scale"><span>' +
      age.min +
      age.unit +
      "</span><span>" +
      age.max +
      age.unit +
      "</span></div>" +
      "</div>" +
      '<div class="field">' +
      '<div class="field-top"><label for="diopter">当前近视度数</label><div class="field-value" id="diopterValue"></div></div>' +
      '<input id="diopter" type="range" min="' +
      diopter.min +
      '" max="' +
      diopter.max +
      '" step="' +
      diopter.step +
      '" value="' +
      state.diopter +
      '">' +
      '<div class="range-scale"><span>' +
      diopter.min +
      diopter.unit +
      "</span><span>" +
      diopter.max +
      diopter.unit +
      "</span></div>" +
      "</div>" +
      '<div class="field">' +
      '<div class="field-top"><label>眼轴增长趋势</label></div>' +
      '<div class="pills" id="trendPills" role="radiogroup" aria-label="眼轴增长趋势"></div>' +
      "</div>" +
      "</section>" +
      '<section class="results" aria-label="方案匹配结果">' +
      '<div class="section-head">' +
      "<h2>方案匹配结果</h2>" +
      '<div class="nav-btns">' +
      '<button class="nav-btn" id="prevBtn" aria-label="上一张方案">' +
      chevronLeft +
      "</button>" +
      '<button class="nav-btn" id="nextBtn" aria-label="下一张方案">' +
      chevronRight +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="carousel" id="carousel"></div>' +
      '<div class="dots" id="dots"></div>' +
      "</section>" +
      '<footer class="disclaimer">' +
      config.meta.disclaimer +
      "</footer>" +
      "</div>";

    var pills = $("trendPills");
    trend.options.forEach(function (option) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.dataset.id = option.id;
      btn.textContent = option.label;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", option.id === state.axialTrend ? "true" : "false");
      btn.addEventListener("click", function () {
        state.axialTrend = option.id;
        updateTrendPills();
        refreshResults(true);
      });
      pills.appendChild(btn);
    });

    bindSlider("age", function (value) {
      state.age = value;
    });
    bindSlider("diopter", function (value) {
      state.diopter = value;
    });
    bindCarousel();
    updateInputs();
    refreshResults(true);
  }

  function bindSlider(id, onChange) {
    var input = $(id);
    var handler = function () {
      onChange(Number(input.value));
      updateInputs();
      refreshResults(true);
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  }

  function updateTrendPills() {
    Array.prototype.forEach.call($("trendPills").children, function (btn) {
      btn.setAttribute("aria-checked", btn.dataset.id === state.axialTrend ? "true" : "false");
    });
  }

  function updateInputs() {
    var age = config.inputs.age;
    var diopter = config.inputs.diopter;
    $("ageValue").textContent = state.age + age.unit;
    $("diopterValue").textContent = state.diopter + diopter.unit;
    $("age").style.setProperty("--pct", percent(state.age, age.min, age.max) + "%");
    $("diopter").style.setProperty(
      "--pct",
      percent(state.diopter, diopter.min, diopter.max) + "%"
    );
    $("age").value = state.age;
    $("diopter").value = state.diopter;
  }

  function renderCard(plan) {
    var reasons = plan.reasons
      .map(function (item) {
        return "<li>" + item + "</li>";
      })
      .join("");
    return (
      '<article class="card" data-id="' +
      plan.id +
      '" style="--accent:' +
      plan.accent +
      '">' +
      '<div class="card-head">' +
      '<div class="icon-wrap">' +
      (icons[plan.icon] || icons.lens) +
      "</div>" +
      "<h3>" +
      plan.name +
      "</h3>" +
      "</div>" +
      '<div class="match-row">' +
      '<span class="match-label">匹配程度</span>' +
      '<div class="stars" aria-label="匹配程度 ' +
      plan.stars +
      " / " +
      plan.maxStars +
      ' 星">' +
      renderStars(plan.stars, plan.maxStars) +
      "</div>" +
      "</div>" +
      '<div class="block"><h4>主要依据</h4><ul>' +
      reasons +
      "</ul></div>" +
      '<div class="block"><h4>实施要求</h4><p>' +
      plan.implementation +
      "</p></div>" +
      '<div class="block"><h4>复查管理</h4><p>' +
      plan.followUp +
      "</p></div>" +
      "</article>"
    );
  }

  function refreshResults(resetIndex) {
    var plans = engine.matchPlans(state, config);
    var carousel = $("carousel");
    var dots = $("dots");
    carousel.innerHTML = plans.map(renderCard).join("");
    dots.innerHTML = plans
      .map(function (_, index) {
        return '<button class="dot" data-index="' + index + '" aria-label="第 ' + (index + 1) + ' 个方案"></button>';
      })
      .join("");

    Array.prototype.forEach.call(dots.children, function (dot) {
      dot.addEventListener("click", function () {
        goTo(Number(dot.dataset.index));
      });
    });

    if (resetIndex) activeIndex = 0;
    requestAnimationFrame(function () {
      goTo(activeIndex, true);
    });
  }

  function cardStep() {
    var carousel = $("carousel");
    var card = carousel.querySelector(".card");
    if (!card) return carousel.clientWidth;
    var styles = window.getComputedStyle(carousel);
    var gap = parseFloat(styles.columnGap || styles.gap || "12") || 12;
    return card.getBoundingClientRect().width + gap;
  }

  function goTo(index, instant) {
    var carousel = $("carousel");
    var max = carousel.children.length - 1;
    activeIndex = Math.max(0, Math.min(index, max));
    var left = activeIndex * cardStep();
    carousel.scrollTo({
      left: left,
      behavior: instant ? "auto" : "smooth",
    });
    updatePager();
  }

  function nearestIndex() {
    var step = cardStep();
    if (!step) return 0;
    return Math.round($("carousel").scrollLeft / step);
  }

  function updatePager() {
    var dots = $("dots").children;
    Array.prototype.forEach.call(dots, function (dot, index) {
      dot.classList.toggle("active", index === activeIndex);
    });
    $("prevBtn").disabled = activeIndex <= 0;
    $("nextBtn").disabled = activeIndex >= dots.length - 1;
  }

  function bindCarousel() {
    var carousel = $("carousel");
    $("prevBtn").addEventListener("click", function () {
      goTo(activeIndex - 1);
    });
    $("nextBtn").addEventListener("click", function () {
      goTo(activeIndex + 1);
    });

    carousel.addEventListener("scroll", function () {
      if (drag.down) return;
      activeIndex = nearestIndex();
      updatePager();
    });

    carousel.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") return;
      drag.down = true;
      drag.moved = false;
      drag.startX = event.clientX;
      drag.startScroll = carousel.scrollLeft;
      carousel.classList.add("is-dragging");
      try {
        carousel.setPointerCapture(event.pointerId);
      } catch (err) {}
    });

    carousel.addEventListener("pointermove", function (event) {
      if (!drag.down) return;
      var dx = event.clientX - drag.startX;
      if (Math.abs(dx) > 4) drag.moved = true;
      carousel.scrollLeft = drag.startScroll - dx;
    });

    function endDrag() {
      if (!drag.down) return;
      drag.down = false;
      carousel.classList.remove("is-dragging");
      goTo(nearestIndex());
    }

    carousel.addEventListener("pointerup", endDrag);
    carousel.addEventListener("pointercancel", endDrag);
    carousel.addEventListener("pointerleave", function () {
      if (drag.down) endDrag();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    });
  }

  renderAppShell();
})();
