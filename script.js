(() => {
  "use strict";

  const root = document.documentElement;
  const storageKey = "matematica-inclusiva-static";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  const state = {
    fontLevel: Number(saved.fontLevel || 0),
    contrast: Boolean(saved.contrast),
    dark:
      saved.dark === "dark" ||
      (!saved.dark &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
  };

  const save = () =>
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        fontLevel: state.fontLevel,
        contrast: state.contrast,
        dark: state.dark ? "dark" : "light",
      })
    );

  const applyPreferences = () => {
    root.style.fontSize = `${100 + state.fontLevel * 12.5}%`;
    root.dataset.contrast = state.contrast ? "high" : "normal";
    root.dataset.theme = state.dark ? "dark" : "light";
    save();
  };

  const speak = text => {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.94;
    const voice = window.speechSynthesis
      .getVoices()
      .find(item => item.lang.toLowerCase().startsWith("pt-br"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const buildAccessibilityPanel = () => {
    const wrapper = document.querySelector(".accessibility-wrapper");
    const toggle = wrapper?.querySelector(".accessibility-toggle");
    if (!wrapper || !toggle) return;
    const panel = document.createElement("div");
    panel.id = "accessibility-panel";
    panel.className = "accessibility-panel";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Opções de acessibilidade");
    panel.innerHTML = `
      <div class="panel-heading"><strong>Uma leitura do seu jeito</strong><button class="icon-button panel-close" aria-label="Fechar opções">×</button></div>
      <p>Ajuste a apresentação sem mudar o conteúdo. Para ouvir, selecione qualquer trecho de texto.</p>
      <div class="font-controls"><span>Tamanho do texto</span><div><button class="icon-button font-down" aria-label="Diminuir tamanho">−</button><span class="font-size-status" aria-live="polite"></span><button class="icon-button font-up" aria-label="Aumentar tamanho">+</button></div></div>
      <button class="settings-option contrast-option" aria-pressed="false"><span>◐</span><span>Alto contraste</span><span class="option-check"></span></button>
      <button class="settings-option dark-option" aria-pressed="false"><span>◐</span><span>Modo escuro</span><span class="option-check"></span></button>
      <button class="settings-option reset-option"><span>↻</span><span>Restaurar padrão</span></button>`;
    wrapper.appendChild(panel);
    const setOpen = open => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };
    const refresh = () => {
      panel.querySelector(".font-size-status").textContent =
        `${100 + state.fontLevel * 12.5}%`;
      panel.querySelector(".font-down").disabled = state.fontLevel === 0;
      panel.querySelector(".font-up").disabled = state.fontLevel === 2;
      panel
        .querySelector(".contrast-option")
        .setAttribute("aria-pressed", String(state.contrast));
      panel.querySelector(".contrast-option .option-check").textContent =
        state.contrast ? "✓" : "";
      panel
        .querySelector(".dark-option")
        .setAttribute("aria-pressed", String(state.dark));
      panel.querySelector(".dark-option span:nth-child(2)").textContent =
        state.dark ? "Modo claro" : "Modo escuro";
      panel.querySelector(".dark-option .option-check").textContent = state.dark
        ? "✓"
        : "";
    };
    toggle.addEventListener("click", () => setOpen(panel.hidden));
    panel.querySelector(".panel-close").addEventListener("click", () => {
      setOpen(false);
      toggle.focus();
    });
    panel.querySelector(".font-down").addEventListener("click", () => {
      state.fontLevel = Math.max(0, state.fontLevel - 1);
      applyPreferences();
      refresh();
    });
    panel.querySelector(".font-up").addEventListener("click", () => {
      state.fontLevel = Math.min(2, state.fontLevel + 1);
      applyPreferences();
      refresh();
    });
    panel.querySelector(".contrast-option").addEventListener("click", () => {
      state.contrast = !state.contrast;
      applyPreferences();
      refresh();
    });
    panel.querySelector(".dark-option").addEventListener("click", () => {
      state.dark = !state.dark;
      applyPreferences();
      refresh();
    });
    panel.querySelector(".reset-option").addEventListener("click", () => {
      state.fontLevel = 0;
      state.contrast = false;
      state.dark = false;
      applyPreferences();
      refresh();
    });
    document.addEventListener("pointerdown", event => {
      if (!wrapper.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.focus();
      }
    });
    refresh();
  };

  const buildMobileMenu = () => {
    const header = document.querySelector(".site-header");
    const button = document.querySelector(".mobile-menu-toggle");
    const links = [...document.querySelectorAll(".desktop-nav a")];
    if (!header || !button || !links.length) return;
    const nav = document.createElement("nav");
    nav.id = "mobile-navigation";
    nav.className = "mobile-nav page-width";
    nav.setAttribute("aria-label", "Navegação para dispositivos móveis");
    links.forEach(link => {
      const copy = link.cloneNode(true);
      copy.addEventListener("click", () => setOpen(false));
      nav.appendChild(copy);
    });
    header.appendChild(nav);
    const setOpen = open => {
      nav.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute(
        "aria-label",
        open ? "Fechar navegação" : "Abrir navegação"
      );
    };
    setOpen(false);
    button.addEventListener("click", () => setOpen(nav.hidden));
  };

  const enableSelectionReader = () => {
    const readSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().replace(/\s+/g, " ").trim();
      if (text && text.length > 2 && text.length < 900) speak(text);
    };
    document.addEventListener("mouseup", () =>
      window.setTimeout(readSelection, 80)
    );
    document.addEventListener("keyup", event => {
      if (
        event.key === "Shift" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      )
        window.setTimeout(readSelection, 80);
    });
  };

  const buildConceptMap = () => {
    const map = document.querySelector(".concept-map");
    if (!map) return;
    const buttons = [...map.querySelectorAll(".destination-options button")];
    const svg = map.querySelector("svg[role='img']");
    const route = svg?.querySelector(".map-route");
    const endCircles = svg ? [...svg.querySelectorAll("circle")].slice(2) : [];
    const title = svg?.querySelector("title");
    const desc = svg?.querySelector("desc");
    const guideTitle = map.querySelector(".map-guidance strong");
    const guideText = map.querySelector(".map-guidance span");
    if (!buttons.length || !route || endCircles.length < 2) return;

    const destinations = {
      Hortifruti: {
        path: "M 70 256 L 70 75 L 118 75",
        end: [118, 75],
        text: "Siga pelo corredor à esquerda. O setor de hortifruti está à sua frente.",
      },
      Mercearia: {
        path: "M 70 256 L 280 256 L 280 236",
        end: [280, 236],
        text: "Vire à direita no corredor inferior e siga até a segunda gôndola. A mercearia está à sua esquerda.",
      },
      "Laticínios": {
        path: "M 70 256 L 210 256 L 210 53 L 244 53 L 244 75",
        end: [244, 75],
        text: "Vire à direita, siga até o corredor central e avance até o fundo. Vire à direita: os laticínios estão à sua frente.",
      },
    };

    const arrow = buttons
      .find(button => button.querySelector("svg"))
      ?.querySelector("svg");

    const select = (button, announce) => {
      const name = button.textContent.trim();
      const data = destinations[name];
      if (!data) return;
      buttons.forEach(item =>
        item.setAttribute("aria-pressed", String(item === button))
      );
      if (arrow) button.appendChild(arrow);
      route.setAttribute("d", data.path);
      endCircles.forEach(circle => {
        circle.setAttribute("cx", data.end[0]);
        circle.setAttribute("cy", data.end[1]);
      });
      if (title)
        title.textContent = `Mapa ilustrativo de um supermercado: trajeto até ${name}`;
      if (desc)
        desc.textContent = `Entrada na parte inferior esquerda e três setores. ${data.text} O desenho é esquemático e não possui escala de distância.`;
      if (guideTitle) guideTitle.textContent = `Destino: ${name}`;
      if (guideText) guideText.textContent = data.text;
      if (announce) speak(`Destino: ${name}. ${data.text}`);
    };

    buttons.forEach(button =>
      button.addEventListener("click", () => select(button, true))
    );
  };

  const enableHeaderShadow = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const update = () =>
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
  };

  const enableActiveNav = () => {
    if (!("IntersectionObserver" in window)) return;
    const links = [
      ...document.querySelectorAll(".desktop-nav a, .mobile-nav a"),
    ];
    const sections = [
      ...new Set(links.map(link => link.getAttribute("href"))),
    ]
      .map(hash => document.querySelector(hash))
      .filter(Boolean);
    const setActive = id =>
      links.forEach(link =>
        link.getAttribute("href") === `#${id}`
          ? link.setAttribute("aria-current", "true")
          : link.removeAttribute("aria-current")
      );
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(section => observer.observe(section));
  };

  const enableReveal = () => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const items = [
      ...document.querySelectorAll("main section:not(#inicio) .page-width"),
    ];
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(item => {
      item.classList.add("reveal");
      observer.observe(item);
    });
  };

  applyPreferences();
  document.addEventListener("DOMContentLoaded", () => {
    enableHeaderShadow();
    enableReveal();
    buildAccessibilityPanel();
    buildMobileMenu();
    enableSelectionReader();
    buildConceptMap();
    enableActiveNav();
  });
})();
