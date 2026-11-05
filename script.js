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

  applyPreferences();
  document.addEventListener("DOMContentLoaded", () => {
    buildAccessibilityPanel();
    buildMobileMenu();
    enableSelectionReader();
  });
})();
