(function () {
  "use strict";

  if (window.PokeCottageMastersets) return;

  const DATA_SCRIPT_BASE = "https://pokecottagecdn.com/mastersets/data/";
  const DATA_CACHE_VERSION = "20260725-pokemon-dates-rarity-images";
  const IMAGE_CACHE_VERSION = "20260725";
  const PRICING_CORE_VERSION = "20260726-edition-subtype-scoring";
  const PRICING_CORE_URL = `https://pokecottagecdn.com/mastersets/set-pricing-core.js?v=${PRICING_CORE_VERSION}`;
  const cache = new Map();
  const inlineScriptCache = new Map();
  let pricingCorePromise = null;
  const initializers = [];
  const lazyObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        lazyObserver.unobserve(entry.target);
        runInitializer(entry.target);
      });
    }, { rootMargin: "900px 0px 900px 0px", threshold: 0.01 })
    : null;

  const lazySelectors = [
    "[data-masterset-binder]",
    "[data-masterset-placeholders]",
    "[data-masterset-table]",
    "[data-set-binder]",
    "[data-set-card-gallery]",
    "[data-set-placeholders]",
    "[data-set-price-list]",
    "[data-set-promo-gallery]",
    "[data-set-table]",
    "[data-set-top-priced-flip-cards]",
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function dataKeyFor(root) {
    return root.dataset.inlineKey || root.dataset.masterset || root.dataset.mastersetKey || "";
  }

  function dataUrlFor(root) {
    const inlineKey = dataKeyFor(root);
    const fallbackUrl = inlineKey ? `${DATA_SCRIPT_BASE}${inlineKey}-data.js` : "./data/133-eevee.json";
    const url = new URL(root.dataset.dataUrl || fallbackUrl, window.location.href);
    if (url.hostname === "pokecottagecdn.com" && url.pathname.startsWith("/mastersets/data/")) {
      url.searchParams.set("v", DATA_CACHE_VERSION);
    }
    return url.href;
  }

  function resolveAsset(value, dataUrl) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return new URL(`../${String(value).replace(/^\.\//, "")}`, dataUrl).href;
  }

  function withImageCacheVersion(url) {
    if (!url || !/^https:\/\/pokecottagecdn\.com\/mastersets\/images\/cards\//i.test(url)) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${IMAGE_CACHE_VERSION}`;
  }

  function imageUrl(card, dataUrl) {
    return withImageCacheVersion(resolveAsset(card.imageUrl, dataUrl));
  }

  function cardImageUrl(card, dataUrl, size = "default") {
    const field = size === "thumbnail"
      ? "thumbnailUrl"
      : (size === "lightbox" ? "lightboxImageUrl" : "imageUrl");
    return withImageCacheVersion(resolveAsset(card?.[field] || card?.imageUrl, dataUrl));
  }

  function loadInlineScript(inlineKey) {
    window.PokeCottageMastersetInline = window.PokeCottageMastersetInline || {};

    if (window.PokeCottageMastersetInline[inlineKey]) {
      return Promise.resolve(window.PokeCottageMastersetInline[inlineKey]);
    }

    if (!inlineScriptCache.has(inlineKey)) {
      inlineScriptCache.set(inlineKey, new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-pc-masterset-data="${inlineKey}"]`);

        if (existing) {
          existing.addEventListener("load", () => resolve(window.PokeCottageMastersetInline?.[inlineKey]));
          existing.addEventListener("error", reject);
          return;
        }

        const script = document.createElement("script");
        script.src = `${DATA_SCRIPT_BASE}${inlineKey}-data.js?v=${encodeURIComponent(DATA_CACHE_VERSION)}`;
        script.async = true;
        script.dataset.pcMastersetData = inlineKey;
        script.onload = () => resolve(window.PokeCottageMastersetInline?.[inlineKey]);
        script.onerror = reject;
        document.head.appendChild(script);
      }));
    }

    return inlineScriptCache.get(inlineKey);
  }

  function loadPricingCore() {
    if (window.PokeCottageSetPricing?.version === PRICING_CORE_VERSION) {
      return Promise.resolve(window.PokeCottageSetPricing);
    }

    if (!pricingCorePromise) {
      pricingCorePromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-pc-pricing-core-version="${PRICING_CORE_VERSION}"]`);

        if (existing) {
          existing.addEventListener("load", () => resolve(window.PokeCottageSetPricing));
          existing.addEventListener("error", reject);
          return;
        }

        const script = document.createElement("script");
        script.src = PRICING_CORE_URL;
        script.async = true;
        script.dataset.pcPricingCoreVersion = PRICING_CORE_VERSION;
        script.onload = () => resolve(window.PokeCottageSetPricing);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    return pricingCorePromise;
  }

  function isBinderCard(card) {
    return card?.excludeFromBinder !== true && !/\bjumbo\b/i.test(String(card?.variant || ""));
  }

  async function loadData(root) {
    const url = dataUrlFor(root);
    const inlineKey = dataKeyFor(root);
    const inlineData = inlineKey && window.PokeCottageMastersetInline?.[inlineKey];
    if (inlineData) return { data: inlineData, dataUrl: url };
    if (inlineKey) return { data: await loadInlineScript(inlineKey), dataUrl: url };
    if (!cache.has(url)) {
      cache.set(url, fetch(url, { cache: "no-cache" }).then((response) => {
        if (!response.ok) throw new Error(`Could not load master-set data (${response.status})`);
        return response.json();
      }));
    }
    return { data: await cache.get(url), dataUrl: url };
  }

  function shouldLazyMount(selector, root, options = {}) {
    if (options.lazy === false) return false;
    if (options.lazy === true) return true;
    if (root.dataset.mastersetLazy === "false") return false;
    if (root.dataset.mastersetLazy === "true") return true;
    return lazySelectors.includes(selector);
  }

  function lazyPlaceholderHeight(selector) {
    if (/\bbinder\]/.test(selector)) return "min(720px, 82vh)";
    if (/\btable\]|\bprice-list\]/.test(selector)) return "420px";
    if (/\bcard-gallery\]/.test(selector)) return "520px";
    if (/\bpromo-gallery\]/.test(selector)) return "380px";
    if (/\bplaceholders\]|\btop-priced-flip-cards\]/.test(selector)) return "320px";
    return "240px";
  }

  function runInitializer(root) {
    if (root.dataset.mastersetInitialized) return;
    const index = Number(root.dataset.mastersetInitializerIndex);
    const item = initializers[index];
    if (!item) return;

    root.dataset.mastersetInitialized = "true";
    if (root.dataset.mastersetLazyMinHeight === "true") {
      root.style.minHeight = "";
      root.removeAttribute("data-masterset-lazy-min-height");
    }
    root.removeAttribute("data-masterset-queued");
    root.removeAttribute("data-masterset-initializer-index");
    item.initializer(root);
  }

  function queueInitializer(root, index) {
    if (!lazyObserver) {
      runInitializer(root);
      return;
    }

    root.dataset.mastersetQueued = "true";
    root.dataset.mastersetInitializerIndex = String(index);
    if (!root.style.minHeight) {
      root.style.minHeight = lazyPlaceholderHeight(initializers[index]?.selector || "");
      root.dataset.mastersetLazyMinHeight = "true";
    }
    lazyObserver.observe(root);
  }

  function register(selector, initializer, options = {}) {
    initializers.push({ selector, initializer, options });
    scan(document);
  }

  function scan(scope) {
    for (let index = 0; index < initializers.length; index++) {
      const item = initializers[index];
      scope.querySelectorAll(item.selector).forEach((root) => {
        if (root.dataset.mastersetInitialized || root.dataset.mastersetQueued) return;
        root.dataset.mastersetInitializerIndex = String(index);

        if (shouldLazyMount(item.selector, root, item.options)) {
          queueInitializer(root, index);
        } else {
          runInitializer(root);
        }
      });
    }
  }

  function regionLabel(region) {
    return region === "International" ? "English" : region;
  }

  function regionShortLabel(region) {
    if (region === "International") return "EN";
    if (region === "Japan") return "JP";
    if (region === "China") return "CN";
    return region;
  }

  function displayVariant(card) {
    const sourceText = [
      card?.source,
      card?.set?.name,
    ].filter(Boolean).join(" ");

    if (/Holon Research Tower: (Fire|Lightning|Water) Quarter Deck/i.test(sourceText)) {
      return /firstEdition/i.test(String(card?.id || "")) ? "Reverse Holo" : "Standard";
    }

    return card?.variant || "";
  }

  function promoPrefix(card) {
    if (card?.region && card.region !== "International") return "";

    const setId = String(card?.set?.id || "").toLowerCase();
    const setName = String(card?.set?.name || "");

    if (setId === "svp" || /scarlet\s*&\s*violet promos/i.test(setName)) return "SVP";
    if (setId === "mep" || /mega evolution promos/i.test(setName)) return "MEP";
    if (setId === "swshp" || /sword\s*&\s*shield promos/i.test(setName)) return "SWSH";
    if (setId === "smp" || /sun\s*&\s*moon promos/i.test(setName)) return "SM";
    if (setId === "xyp" || /^xy promos$/i.test(setName)) return "XY";
    if (setId === "bwp" || /black\s*&\s*white promos/i.test(setName)) return "BW";
    if (setId === "dpp" || /diamond\s*&\s*pearl promos/i.test(setName)) return "DP";

    return "";
  }

  function promoDisplayCardNumber(card) {
    const prefix = promoPrefix(card);
    if (!prefix) return "";

    const raw = String(card?.cardNumber || card?.displayCardNumber || "").trim().replace(/\s+/g, "");
    if (!raw) return "";
    if (/^[A-Z]+\d+[A-Z]?$/i.test(raw)) return raw.toUpperCase();

    const number = raw.match(/\d+/)?.[0];
    if (!number) return raw.toUpperCase();

    const width = prefix === "SVP" || prefix === "SWSH" || prefix === "MEP" ? 3 : 2;
    return `${prefix}${String(Number(number)).padStart(width, "0")}`;
  }

  function displayCardNumber(card) {
    const promoNumber = promoDisplayCardNumber(card);
    if (promoNumber) return promoNumber;

    const explicitNumber = String(card?.displayCardNumber || "").trim();
    const galleryMatch = explicitNumber.match(/^GG\s*0*(\d+)(?:\s*\/\s*GG\s*0*\d+)?$/i);
    if (galleryMatch) return `GG${String(Number(galleryMatch[1])).padStart(2, "0")}/GG70`;

    const printedTotal = Number(card?.set?.printedTotal || card?.printedTotal || 0);

    const explicitFraction = explicitNumber.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (explicitFraction) {
      return `${String(Number(explicitFraction[1])).padStart(3, "0")}/${String(Number(explicitFraction[2])).padStart(3, "0")}`;
    }

    if (/^\d+$/.test(explicitNumber) && printedTotal > 0) {
      return `${String(Number(explicitNumber)).padStart(3, "0")}/${String(printedTotal).padStart(3, "0")}`;
    }

    if (explicitNumber) return explicitNumber;

    const raw = String(card?.cardNumber || "").trim();
    const rawGalleryMatch = raw.match(/^GG\s*0*(\d+)(?:\s*\/\s*GG\s*0*\d+)?$/i);
    if (rawGalleryMatch) return `GG${String(Number(rawGalleryMatch[1])).padStart(2, "0")}/GG70`;

    const rawFraction = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (rawFraction) {
      return `${String(Number(rawFraction[1])).padStart(3, "0")}/${String(Number(rawFraction[2])).padStart(3, "0")}`;
    }

    const numeric = Number(raw);

    if (/^\d+$/.test(raw) && Number.isFinite(numeric) && printedTotal > 0) {
      return `${String(numeric).padStart(3, "0")}/${String(printedTotal).padStart(3, "0")}`;
    }

    return raw;
  }

  function normalizedVariantText(card) {
    return [
      card?.variant,
      card?.variantId,
    ].filter(Boolean).join(" ")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .toLowerCase()
      .trim();
  }

  function variantRank(card) {
    const text = normalizedVariantText(card);
    const foilText = String(card?.foil || "").toLowerCase();
    if (card?.set?.id === "me25") {
      if (/\b(1st|first) edition\b/.test(text)) return 10;
      if (/reverse holo\s*-\s*(ball|r)\b/i.test(foilText)) return 30;
      if (/reverse holo\s*-\s*energy\b/i.test(foilText)) return 40;
      if (/\bmaster ball\b/.test(text)) return 50;
      if (/\b(standard|normal)\b/.test(text) || (/\bholo\b/.test(text) && !/\breverse\b/.test(text))) return 20;
      if (/\breverse holo\b/.test(text)) return 40;
      return 100;
    }
    if (/\b(1st|first) edition\b/.test(text)) return 10;
    if (/\b(standard|normal)\b/.test(text)) return 20;
    if (/\breverse holo\b/.test(text)) return 30;
    if (/\bpok[eé] ball\b/.test(text)) return 40;
    if (/\bmaster ball\b/.test(text)) return 50;
    if (/\beurope championships\b/.test(text) && /\bstaff\b/.test(text)) return 61;
    if (/\beurope championships\b/.test(text) && /\btop\s*8\b/.test(text)) return 62;
    if (/\beurope championships\b/.test(text) && /\bchampion\b/.test(text)) return 63;
    if (/\beurope championships\b/.test(text)) return 60;
    if (/\bnorth america championships\b/.test(text) && /\bstaff\b/.test(text)) return 66;
    if (/\bnorth america championships\b/.test(text) && /\btop\s*8\b/.test(text)) return 67;
    if (/\bnorth america championships\b/.test(text) && /\bchampion\b/.test(text)) return 68;
    if (/\bnorth america championships\b/.test(text)) return 65;
    if (/\bregional championships\b/.test(text) && /\bstaff\b/.test(text)) return 61;
    if (/\bregional championships\b/.test(text)) return 60;
    if (/\bultra league ball\b|\bultra ball league\b/.test(text)) return 69;
    if (/\bplay\s*pok[eé]mon\b/.test(text) && /\bcosmos holo\b/.test(text)) return 71;
    if (/\bplay\s*pok[eé]mon\b/.test(text)) return 70;
    return 100;
  }

  function compareVariants(a, b) {
    return variantRank(a) - variantRank(b) ||
      String(a.variant || "").localeCompare(String(b.variant || ""));
  }

  function displayNumberValue(cardNumber = "") {
    const value = String(cardNumber || "").trim();
    const match = value.match(/^(?:[A-Z]+)?0*(\d+)/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function promoSortOrder(card) {
    const setText = [card?.set?.id, card?.set?.name, card?.source].filter(Boolean).join(" ").toLowerCase();
    return /\bpromo/.test(setText) ? 1 : 0;
  }

  function sortCards(cards) {
    return [...cards].sort((a, b) =>
      String(a.releaseDate || "").localeCompare(String(b.releaseDate || "")) ||
      String(a.region || "").localeCompare(String(b.region || "")) ||
      (promoSortOrder(a) - promoSortOrder(b)) ||
      String(a.set?.name || "").localeCompare(String(b.set?.name || ""), undefined, { numeric: true, sensitivity: "base" }) ||
      (displayNumberValue(a.displayCardNumber || a.cardNumber) - displayNumberValue(b.displayCardNumber || b.cardNumber)) ||
      String(a.displayCardNumber || a.cardNumber || "").localeCompare(String(b.displayCardNumber || b.cardNumber || ""), undefined, { numeric: true }) ||
      compareVariants(a, b)
    );
  }

  window.PokeCottageMastersets = {
    escapeHtml,
    displayCardNumber,
    displayVariant,
    cardImageUrl,
    imageUrl,
    isBinderCard,
    loadData,
    loadInlineScript,
    loadPricingCore,
    pricingCoreVersion: PRICING_CORE_VERSION,
    regionLabel,
    regionShortLabel,
    register,
    resolveAsset,
    sortCards,
    variantRank,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scan(document), { once: true });
  } else {
    scan(document);
  }

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) scan(node.matches?.("[data-masterset-component]") ? node.parentElement : node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
