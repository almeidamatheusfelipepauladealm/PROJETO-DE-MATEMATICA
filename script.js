(() => {
  "use strict";

  
  const STORAGE_KEY = "matematica-inclusiva-v2";
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const readStore = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  };

  const saved = readStore();
  const state = {
    font: Number(saved.font || 0), // 0, 1 ou 2  →  100%, 112,5%, 125%
    contrast: Boolean(saved.contrast),
    dark:
      typeof saved.dark === "boolean"
        ? saved.dark
        : window.matchMedia("(prefers-color-scheme: dark)").matches,
    read: Boolean(saved.read),
  };

  const save = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          font: state.font,
          contrast: state.contrast,
          dark: state.dark,
          read: state.read,
        })
      );
    } catch {
      
    }
  };

  const applyPreferences = () => {
    root.style.fontSize = `${100 + state.font * 12.5}%`;
    root.dataset.contrast = state.contrast ? "high" : "normal";
    root.dataset.theme = state.dark ? "dark" : "light";
  };

  
  const speak = text => {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    const voice = window.speechSynthesis
      .getVoices()
      .find(item => item.lang.toLowerCase().startsWith("pt-br"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  
  const setupAccessibilityPanel = () => {
    const toggle = document.querySelector(".a11y-toggle");
    const panel = document.getElementById("a11y-panel");
    if (!toggle || !panel) return;

    const fontValue = panel.querySelector(".font-value");
    const fontDown = panel.querySelector('[data-font="down"]');
    const fontUp = panel.querySelector('[data-font="up"]');
    const switches = [...panel.querySelectorAll(".switch")];

    const setOpen = open => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };

    const refresh = () => {
      fontValue.textContent = `${100 + state.font * 12.5}%`;
      fontDown.disabled = state.font === 0;
      fontUp.disabled = state.font === 2;
      switches.forEach(item =>
        item.setAttribute("aria-checked", String(Boolean(state[item.dataset.pref])))
      );
    };

    const update = () => {
      applyPreferences();
      save();
      refresh();
    };

    toggle.addEventListener("click", () => setOpen(panel.hidden));

    fontDown.addEventListener("click", () => {
      state.font = Math.max(0, state.font - 1);
      update();
    });

    fontUp.addEventListener("click", () => {
      state.font = Math.min(2, state.font + 1);
      update();
    });

    switches.forEach(item =>
      item.addEventListener("click", () => {
        const key = item.dataset.pref;
        state[key] = !state[key];
        update();
        if (key === "read" && state.read) speak("Leitura em voz alta ativada.");
        if (key === "read" && !state.read && "speechSynthesis" in window)
          window.speechSynthesis.cancel();
      })
    );

    panel.querySelector('[data-pref="reset"]').addEventListener("click", () => {
      state.font = 0;
      state.contrast = false;
      state.read = false;
      state.dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      update();
    });

    document.addEventListener("pointerdown", event => {
      if (!panel.hidden && !panel.parentElement.contains(event.target))
        setOpen(false);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    refresh();
  };

  
  const setupSelectionReader = () => {
    const readSelection = () => {
      if (!state.read) return;
      const text = window
        .getSelection()
        ?.toString()
        .replace(/\s+/g, " ")
        .trim();
      if (text && text.length > 2 && text.length < 900) speak(text);
    };

    document.addEventListener("mouseup", () =>
      window.setTimeout(readSelection, 80)
    );
    document.addEventListener("keyup", event => {
      if (["Shift", "ArrowLeft", "ArrowRight"].includes(event.key))
        window.setTimeout(readSelection, 80);
    });
  };

 
  const setupHeader = () => {
    const header = document.querySelector(".site-header");
    const button = document.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    if (!header || !button || !nav) return;

    const setMenu = open => {
      header.dataset.menu = open ? "open" : "closed";
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Fechar navegação" : "Abrir navegação");
    };

    button.addEventListener("click", () =>
      setMenu(header.dataset.menu !== "open")
    );
    nav.querySelectorAll("a").forEach(link =>
      link.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && header.dataset.menu === "open") {
        setMenu(false);
        button.focus();
      }
    });

    const onScroll = () =>
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    
    if (!("IntersectionObserver" in window)) return;
    const links = [...nav.querySelectorAll("a")];
    const targets = links
      .map(link => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          links.forEach(link =>
            link.getAttribute("href") === `#${entry.target.id}`
              ? link.setAttribute("aria-current", "true")
              : link.removeAttribute("aria-current")
          );
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach(target => observer.observe(target));
  };

  
  const setupRouteMap = () => {
    const app = document.getElementById("route-app");
    if (!app) return;

    const CELL = 30; 
    const ROWS = 9; 

    const sectors = {
      hortifruti: {
        name: "Hortifruti",
        points: [[2, 9], [2, 2], [4, 2]],
      },
      mercearia: {
        name: "Mercearia",
        points: [[2, 9], [2, 8], [9, 8]],
      },
      laticinios: {
        name: "Laticínios",
        points: [[2, 9], [2, 8], [7, 8], [7, 2], [9, 2]],
      },
    };

    const buttons = [...app.querySelectorAll("[data-sector]")];
    const shelves = [...app.querySelectorAll("[data-shelf]")];
    const svg = app.querySelector("svg");
    const path = document.getElementById("route-path");
    const startDot = document.getElementById("route-start");
    const endDot = document.getElementById("route-end");
    const cart = document.getElementById("route-cart");
    const stepsList = document.getElementById("route-steps");
    const statDistance = document.getElementById("stat-distance");
    const statTurns = document.getElementById("stat-turns");
    const statCoords = document.getElementById("stat-coords");
    const listen = document.getElementById("route-listen");
    const mapTitle = document.getElementById("map-title");
    const mapDesc = document.getElementById("map-desc");
    if (!svg || !path || !stepsList) return;

    const icons = {
      forward:
        '<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>',
      right:
        '<polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>',
      left: '<polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>',
      arrive:
        '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
    };

    const iconSvg = name =>
      `<span class="step-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg></span>`;

    const squares = n => `${n} ${n === 1 ? "quadrado" : "quadrados"}`;
    const coord = ([x, y]) => `(${x}, ${ROWS - y})`;

    
    const analyse = sector => {
      const { points } = sector;
      const legs = [];
      let previous = null;

      for (let i = 1; i < points.length; i += 1) {
        const dx = points[i][0] - points[i - 1][0];
        const dy = points[i][1] - points[i - 1][1];
        const heading = { x: Math.sign(dx), y: Math.sign(dy) };
        let turn = "forward";
        if (previous) {
          
          const cross = previous.x * heading.y - previous.y * heading.x;
          turn = cross > 0 ? "right" : "left";
        }
        legs.push({ length: Math.abs(dx) + Math.abs(dy), turn });
        previous = heading;
      }

      const steps = legs.map((leg, index) => {
        const text =
          index === 0
            ? `Siga em frente ${squares(leg.length)}.`
            : `Vire à ${leg.turn === "right" ? "direita" : "esquerda"} e siga ${squares(leg.length)}.`;
        return { icon: leg.turn, text };
      });
      steps.push({ icon: "arrive", text: `Você chegou ao setor ${sector.name}.` });

      return {
        steps,
        distance: legs.reduce((sum, leg) => sum + leg.length, 0),
        turns: legs.filter(leg => leg.turn !== "forward").length,
      };
    };

    
    let frame = 0;
    let pathLength = 0;
    let travelTime = 2000;

    const setProgress = progress => {
      path.style.strokeDashoffset = String(pathLength * (1 - progress));
      const point = path.getPointAtLength(pathLength * progress);
      cart.setAttribute("cx", point.x);
      cart.setAttribute("cy", point.y);
    };

    const play = () => {
      cancelAnimationFrame(frame);
      if (reduceMotion.matches) {
        setProgress(1);
        return;
      }
      const startedAt = performance.now();
      setProgress(0);
      const tick = now => {
        const t = Math.min(1, (now - startedAt) / travelTime);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setProgress(eased);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    
    let current = null;
    let currentSpeech = "";

    const select = (key, { animate = true } = {}) => {
      const sector = sectors[key];
      if (!sector) return;
      current = key;

      const { steps, distance, turns } = analyse(sector);
      const pixels = sector.points.map(([x, y]) => [x * CELL, y * CELL]);
      const [first] = pixels;
      const last = pixels[pixels.length - 1];

      path.setAttribute(
        "d",
        pixels.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ")
      );
      pathLength = path.getTotalLength();
      path.style.strokeDasharray = String(pathLength);
      startDot.setAttribute("cx", first[0]);
      startDot.setAttribute("cy", first[1]);
      endDot.setAttribute("cx", last[0]);
      endDot.setAttribute("cy", last[1]);
      travelTime = Math.min(3400, 900 + distance * 150);

      buttons.forEach(button =>
        button.setAttribute("aria-pressed", String(button.dataset.sector === key))
      );
      shelves.forEach(shelf =>
        shelf.classList.toggle("is-target", shelf.dataset.shelf === key)
      );

      stepsList.innerHTML = steps
        .map(step => `<li>${iconSvg(step.icon)}<span>${step.text}</span></li>`)
        .join("");

      statDistance.textContent = squares(distance);
      statTurns.textContent = String(turns);
      statCoords.textContent = `${coord(sector.points[0])} → ${coord(
        sector.points[sector.points.length - 1]
      )}`;

      const sentences = steps.map(step => step.text).join(" ");
      currentSpeech = `Destino: ${sector.name}. ${sentences}`;
      if (mapTitle)
        mapTitle.textContent = `Mapa ilustrativo de um supermercado: trajeto até ${sector.name}`;
      if (mapDesc)
        mapDesc.textContent = `${sentences} O desenho não tem escala real.`;

      if (animate) play();
      else setProgress(1);
    };

    buttons.forEach(button =>
      button.addEventListener("click", () => select(button.dataset.sector))
    );

    if (listen)
      listen.addEventListener("click", () => {
        play();
        speak(currentSpeech);
      });

    select("hortifruti", { animate: false });

   
    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      const once = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            once.disconnect();
            if (current) play();
          }
        },
        { threshold: 0.45 }
      );
      once.observe(svg);
    }
  };


  // Lê todo o conteúdo principal do site, bloco por bloco
  const setupReadAll = () => {
    const button = document.querySelector('[data-action="read-all"]');
    const main = document.getElementById("conteudo");
    if (!button || !main) return;
    if (!("speechSynthesis" in window)) {
      button.hidden = true;
      return;
    }

    const label = button.querySelector(".read-all-label");
    const BLOCKS = "h1, h2, h3, h4, p, li, figcaption, blockquote, dt, dd, th, td, small";
    let reading = false;
    let sessionId = 0;
    let currentEl = null;

    const isVisible = el =>
      !el.closest('[hidden], [aria-hidden="true"]') && el.getClientRects().length > 0;

    const collectBlocks = () =>
      [...main.querySelectorAll(BLOCKS)]
        // evita ler o mesmo texto duas vezes (ex.: <p> dentro de <li>)
        .filter(el => !el.parentElement.closest(BLOCKS) && isVisible(el))
        .map(el => ({ el, text: el.textContent.replace(/\s+/g, " ").trim() }))
        .filter(item => item.text.length > 1);

    const highlight = el => {
      currentEl?.classList.remove("reading-now");
      currentEl = el;
      if (!el) return;
      el.classList.add("reading-now");
      el.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "center",
      });
    };

    const setReading = value => {
      reading = value;
      button.setAttribute("aria-pressed", String(value));
      label.textContent = value ? "Parar leitura" : "Ler o site todo";
      if (!value) highlight(null);
    };

    const stop = () => {
      sessionId++;
      setReading(false);
      window.speechSynthesis.cancel();
    };

    const start = () => {
      const blocks = collectBlocks();
      if (!blocks.length) return;
      window.speechSynthesis.cancel();
      setReading(true);

      const voice = window.speechSynthesis
        .getVoices()
        .find(item => item.lang.toLowerCase().startsWith("pt-br"));

      const session = ++sessionId;
      let index = 0;
      const next = () => {
        if (!reading || session !== sessionId) return;
        if (index >= blocks.length) {
          setReading(false);
          return;
        }
        const { el, text } = blocks[index++];
        highlight(el);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 0.95;
        if (voice) utterance.voice = voice;
        utterance.onend = next;
        utterance.onerror = event => {
          if (session !== sessionId) return;
          // outra fala do site cancelou a leitura
          if (event.error === "interrupted" || event.error === "canceled") {
            setReading(false);
            return;
          }
          next();
        };
        window.speechSynthesis.speak(utterance);
      };
      next();
    };

    button.addEventListener("click", () => (reading ? stop() : start()));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && reading) stop();
    });

    window.addEventListener("pagehide", () => window.speechSynthesis.cancel());
  };

  applyPreferences();

  document.addEventListener("DOMContentLoaded", () => {
    setupHeader();
    setupAccessibilityPanel();
    setupSelectionReader();
    setupReadAll();
    setupRouteMap();
  });
})();