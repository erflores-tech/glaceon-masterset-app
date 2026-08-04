(function () {
  "use strict";

  const EVOLUTION_DATA_VERSION = "20260728-snorlax-ready";
  const DATA_SCRIPT_URL = `https://pokecottagecdn.com/mastersets/data/evolution-lines-data.js?v=${EVOLUTION_DATA_VERSION}`;
  const DEFAULT_PAGE_BASE = "https://pokecottage.com/pokemon-master-sets/";
  const DEFAULT_IMAGE_BASE = "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/";
  let dataPromise = null;

  const TYPE_BY_NUMBER = {
    1: "grass",
    2: "grass",
    3: "grass",
    4: "fire",
    5: "fire",
    6: "fire",
    25: "electric",
    26: "electric",
    92: "ghost",
    93: "ghost",
    94: "ghost",
    133: "normal",
    134: "water",
    135: "electric",
    136: "fire",
    143: "normal",
    151: "psychic",
    172: "electric",
    185: "rock",
    196: "psychic",
    197: "dark",
    438: "rock",
    446: "normal",
    447: "fighting",
    448: "fighting",
    470: "grass",
    471: "ice",
    656: "water",
    657: "water",
    658: "water",
    700: "fairy",
  };

  const TYPE_COLORS = {
    normal: "#A8A8A8",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F2C94C",
    grass: "#74C365",
    ice: "#96D9D6",
    fighting: "#C6783D",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#F4A6D7",
  };

  const FALLBACK_LIVE_MASTERSETS = new Set([
    "1-bulbasaur",
    "6-charizard",
    "25-pikachu",
    "94-gengar",
    "133-eevee",
    "134-vaporeon",
    "135-jolteon",
    "136-flareon",
    "143-snorlax",
    "151-mew",
    "185-sudowoodo",
    "196-espeon",
    "197-umbreon",
    "448-lucario",
    "470-leafeon",
    "471-glaceon",
    "658-greninja",
    "700-sylveon",
  ]);

  function pc() {
    return window.PokeCottageMastersets || {};
  }

  function escapeHtml(value) {
    return pc().escapeHtml ? pc().escapeHtml(value) : String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadEvolutionData(root) {
    const url = root.dataset.evolutionDataUrl || DATA_SCRIPT_URL;

    if (window.PokeCottageEvolutionLines) {
      return Promise.resolve(window.PokeCottageEvolutionLines);
    }

    if (!dataPromise) {
      dataPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector("script[data-pc-evolution-lines]");

        if (existing) {
          existing.addEventListener("load", () => resolve(window.PokeCottageEvolutionLines));
          existing.addEventListener("error", reject);
          return;
        }

        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.dataset.pcEvolutionLines = "true";
        script.onload = () => resolve(window.PokeCottageEvolutionLines);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    return dataPromise;
  }

  function pageUrlFor(item, root, data) {
    const baseUrl = root.dataset.pageBaseUrl || data.pageBaseUrl || DEFAULT_PAGE_BASE;
    return new URL(item.slug, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
  }

  function imageUrlFor(item, root) {
    const baseUrl = root.dataset.imageBaseUrl || DEFAULT_IMAGE_BASE;
    return `${baseUrl}${String(item.number).padStart(3, "0")}.png`;
  }

  function numberLabel(item) {
    return `#${String(item.number).padStart(4, "0")}`;
  }

  function typeNameFor(item) {
    const type = String(item.type || item.primaryType || TYPE_BY_NUMBER[Number(item.number)] || "normal").toLowerCase();
    return TYPE_COLORS[type] ? type : "normal";
  }

  function typeStyleFor(item) {
    const type = typeNameFor(item);
    return `--pc-evo-type-color: ${TYPE_COLORS[type]}; --pc-evo-type-color-soft: ${TYPE_COLORS[type]}44;`;
  }

  function pageExists(item, data) {
    const liveKeys = new Set([...(data.liveMastersets || []), ...FALLBACK_LIVE_MASTERSETS]);
    if (liveKeys.size) return liveKeys.has(item.key);
    return false;
  }

  function arrowMarkup() {
    return `
      <span class="pc-evolution-arrow" aria-hidden="true">
        <svg viewBox="0 0 32 52" fill="none">
          <path d="M7 5L25 26L7 47" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    `;
  }

  function downArrowMarkup() {
    return `
      <span class="pc-evolution-arrow pc-evolution-arrow-down" aria-hidden="true">
        <svg viewBox="0 0 52 32" fill="none">
          <path d="M5 7L26 25L47 7" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    `;
  }

  function cardMarkup(item, root, data) {
    const isCurrent = item.key === root.dataset.masterset;
    const isLive = pageExists(item, data);
    const href = pageUrlFor(item, root, data);
    const image = imageUrlFor(item, root);
    const typeName = typeNameFor(item);
    const typeStyle = typeStyleFor(item);
    const classes = ["pc-evolution-card", isLive ? "is-live" : "is-coming-soon"].join(" ");
    const current = isCurrent ? 'aria-current="page"' : "";
    const body = `
      <span class="pc-evolution-orb pc-evolution-type-${escapeHtml(typeName)}" style="${escapeHtml(typeStyle)}" aria-label="${escapeHtml(item.name)} ${escapeHtml(typeName)} type">
        <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" aria-hidden="true">
      </span>
      <span class="pc-evolution-name-line">
        <span class="pc-evolution-name">${escapeHtml(item.name)}</span>
        <span class="pc-evolution-number">${escapeHtml(numberLabel(item))}</span>
      </span>
    `;

    if (!isLive) {
      return `
        <div class="${classes}" ${current}>
          <span class="pc-evolution-card-inner">${body}</span>
        </div>
      `;
    }

    return `
      <div class="${classes}" ${current}>
        <a href="${escapeHtml(href)}" aria-label="View ${escapeHtml(item.name)} master set guide">${body}</a>
      </div>
    `;
  }

  function childrenMarkup(node, root, data, depth) {
    const children = node.children || [];
    if (!children.length) return "";

    if (children.length === 1) {
      return `
        ${arrowMarkup()}
        ${nodeMarkup(children[0], root, data, depth + 1)}
      `;
    }

    if (depth === 0) {
      return `
        ${downArrowMarkup()}
        <div class="pc-evolution-branch-list" style="--pc-evo-branch-count: ${children.length}">
          ${children.map((child) => `
            <div class="pc-evolution-branch${(child.children || []).length ? " pc-evolution-branch-has-children" : ""}">
              ${nodeMarkup(child, root, data, depth + 1)}
            </div>
          `).join("")}
        </div>
      `;
    }

    return `
      ${arrowMarkup()}
      <div class="pc-evolution-branch-list is-stacked" style="--pc-evo-branch-count: ${children.length}">
        ${children.map((child) => `
          <div class="pc-evolution-branch${(child.children || []).length ? " pc-evolution-branch-has-children" : ""}">
            ${nodeMarkup(child, root, data, depth + 1)}
          </div>
        `).join("")}
      </div>
    `;
  }

  function nodeMarkup(node, root, data, depth = 0) {
    if (!node) return "";
    const hasSingleChild = (node.children || []).length === 1;
    const nextChildBranches = hasSingleChild && (node.children[0].children || []).length > 1;
    const childCount = (node.children || []).length;
    const branchClass = childCount > 1 && depth === 0
      ? " pc-evolution-split pc-evolution-split-root"
      : ` pc-evolution-path-node${childCount > 1 ? " pc-evolution-path-branches" : ""}`;

    if (hasSingleChild) {
      return `
        <div class="pc-evolution-chain-node">
          <div class="pc-evolution-step${nextChildBranches ? " pc-evolution-step-to-branch" : ""}">
            ${cardMarkup(node, root, data)}
            ${arrowMarkup()}
            ${nodeMarkup(node.children[0], root, data, depth + 1)}
          </div>
        </div>
      `;
    }

    return `
      <div class="${branchClass.trim()}">
        ${cardMarkup(node, root, data)}
        ${childrenMarkup(node, root, data, depth)}
      </div>
    `;
  }

  function fallbackTree(entry) {
    const line = Array.isArray(entry?.line) ? entry.line : [];
    if (!line.length) return null;
    return line.reduceRight((child, item) => ({ ...item, children: child ? [child] : [] }), null);
  }

  function renderLine(root, data, entry) {
    const tree = entry?.tree || fallbackTree(entry);

    if (!tree) {
      root.innerHTML = `<div class="pc-evolution-empty">Evolution line unavailable</div>`;
      return;
    }

    root.innerHTML = `
      <div class="pc-evolution-map">
        ${nodeMarkup(tree, root, data)}
      </div>
    `;
  }

  async function init(root) {
    root.classList.add("pc-evolution-line");
    root.innerHTML = `<div class="pc-evolution-loading">Loading evolution line...</div>`;

    const key = root.dataset.masterset;
    if (!key) {
      root.innerHTML = `<div class="pc-evolution-empty">Missing Pokémon key</div>`;
      return;
    }

    try {
      const data = await loadEvolutionData(root);
      const entry = data.entries?.[key];
      renderLine(root, data, entry);
    } catch (error) {
      root.innerHTML = `<div class="pc-evolution-empty">Evolution line unavailable</div>`;
      console.error(error);
    }
  }

  function boot() {
    if (pc().register) {
      pc().register("[data-pc-evolution-line]", init);
      return;
    }

    document.querySelectorAll("[data-pc-evolution-line]").forEach((root) => {
      if (root.dataset.mastersetInitialized) return;
      root.dataset.mastersetInitialized = "true";
      init(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
