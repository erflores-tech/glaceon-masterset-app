(function () {
  const DATA_BASE = "https://pokecottagecdn.com/mastersets/data/";
  const PRICING_CORE_VERSION = "20260726-edition-subtype-scoring";
  const PRICING_CORE_URL = `https://pokecottagecdn.com/mastersets/set-pricing-core.js?v=${PRICING_CORE_VERSION}`;
  const DATA_CACHE_VERSION = "20260731-charizard-most-expensive";
  const POKEMON_TOC_SELECTOR = "[data-pokemon-toc], [data-pokemon-table-of-contents], [data-masterset-toc]";
  const POKEMON_MOST_EXPENSIVE_OVERRIDES = {
    "94-gengar": {
      label: "Gengar",
      number: "Masaki Vending Promo (JP)",
      cardId: "94-jpn_unp-73-cosmosHolo",
    },
    "25-pikachu": {
      label: "Pikachu (Y Fujishima)",
      number: "XY-P • Art Academy",
      cardId: "25-jpn_xypunp-74-normal",
    },
    "6-charizard": {
      label: "Base Set",
      number: "1st Edition & Shadowless",
      cardId: "6-base1-4-firstEditionShadowless",
    },
    "133-eevee": {
      label: "Eevee",
      number: "Fan Club (JP)",
      cardId: "133-jpn_unp-122-fanClub500Points",
    },
    "134-vaporeon": {
      label: "Vaporeon Gold Star",
      number: "JP PLAY Promo",
      cardId: "134-jpn_playp-22-cosmosHolo",
    },
    "136-flareon": {
      label: "Flareon Gold Star",
      number: "024/PLAY • JP PLAY Promo",
      cardId: "136-jpn_playp-24-cosmosHolo",
    },
    "143-snorlax": {
      label: "Snorlax Lv.X",
      number: "Rising Rivals • 111/111",
      cardId: "143-pl2-111-holo",
    },
    "196-espeon": {
      label: "Espeon Gold Star",
      number: "016 • POP Series 5 (English)",
      cardId: "196-pop5-16-normal",
    },
    "197-umbreon": {
      label: "Umbreon",
      number: "054/L-P • Daisuki Club (JP)",
      cardId: "197-jpn_legp-54-cosmosHolo",
    },
    "471-glaceon": {
      label: "Glaceon VMAX (JP)",
      number: "091/069",
      cardId: "471-jpn_s6a-91-holo",
    },
    "700-sylveon": {
      label: "Sylveon VMAX (JP)",
      number: "093/069",
      cardId: "700-jpn_s6a-93-holo",
    },
  };
  const POKEMON_TOC_CARD_OVERRIDES = {
    "133-eevee": [
      "133-sv85-167-holo",
      "133-sv6-188-holo",
    ],
  };
  let pricingCorePromise = null;

  function normalizeMastersetKey(mastersetKey) {
    const raw = String(mastersetKey || "").trim();
    const match = raw.match(/\b\d+-[a-z0-9]+(?:-[a-z0-9]+)*\b/i);
    return match ? match[0] : raw;
  }

  function loadMastersetData(mastersetKey) {
    mastersetKey = normalizeMastersetKey(mastersetKey);
    window.PokeCottageMastersetInline = window.PokeCottageMastersetInline || {};

    if (window.PokeCottageMastersetInline[mastersetKey]) {
      return Promise.resolve(window.PokeCottageMastersetInline[mastersetKey]);
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-pc-masterset-data="${mastersetKey}"]`);

      if (existing) {
        existing.addEventListener("load", () => resolve(window.PokeCottageMastersetInline?.[mastersetKey]));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = `${DATA_BASE}${mastersetKey}-data.js?v=${encodeURIComponent(DATA_CACHE_VERSION)}`;
      script.async = true;
      script.dataset.pcMastersetData = mastersetKey;

      script.onload = () => resolve(window.PokeCottageMastersetInline?.[mastersetKey]);
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  function isBinderCard(card) {
    return card.excludeFromBinder !== true &&
      !/\bjumbo\b/i.test(String(card.variant || ""));
  }

  function binderVariantCount(data) {
    const preparedCount = Number(data?.counts?.binderVariants);
    if (Number.isFinite(preparedCount) && preparedCount > 0) return preparedCount;
    return Array.isArray(data?.cards) ? data.cards.filter(isBinderCard).length : 0;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensurePricingCore() {
    if (
      window.PokeCottageSetPricing?.priceCards &&
      window.PokeCottageSetPricing.version === PRICING_CORE_VERSION
    ) {
      return Promise.resolve(window.PokeCottageSetPricing);
    }

    if (pricingCorePromise) return pricingCorePromise;

    pricingCorePromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-pc-pricing-core-version="${PRICING_CORE_VERSION}"]`);

      function resolveIfReady() {
        if (
          window.PokeCottageSetPricing?.priceCards &&
          window.PokeCottageSetPricing.version === PRICING_CORE_VERSION
        ) {
          resolve(window.PokeCottageSetPricing);
          return true;
        }
        return false;
      }

      if (resolveIfReady()) return;

      if (existing) {
        existing.addEventListener("load", () => {
          if (!resolveIfReady()) reject(new Error("Pricing core unavailable"));
        }, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = PRICING_CORE_URL;
      script.async = true;
      script.dataset.pcPricingCoreVersion = PRICING_CORE_VERSION;
      script.onload = () => {
        if (!resolveIfReady()) reject(new Error("Pricing core unavailable"));
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return pricingCorePromise;
  }

  function resolveImageUrl(card) {
    return card?.thumbnailUrl || card?.imageUrl || card?.largeImageUrl || card?.lightboxImageUrl || card?.originalImageUrl || "";
  }

  function resolveTocImageUrl(card) {
    return card?.imageUrl || card?.lightboxImageUrl || card?.largeImageUrl || card?.thumbnailUrl || card?.originalImageUrl || "";
  }

  function resolveFallbackImageUrl(card) {
    return card?.originalImageUrl || card?.lightboxImageUrl || card?.imageUrl || card?.thumbnailUrl || "";
  }

  function cardReleaseTime(card) {
    const rawDate = card?.releaseDate || card?.set?.releaseDate || "";
    const time = Date.parse(rawDate);
    return Number.isFinite(time) ? time : 0;
  }

  function numericCardNumber(card) {
    const match = String(card?.cardNumber || card?.displayCardNumber || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function artworkText(card) {
    return [
      card?.rarity,
      card?.variant,
      card?.category,
      card?.section,
      card?.source,
      card?.set?.name,
      card?.name,
      card?.searchText,
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isEnglishCard(card) {
    return String(card?.region || "International") === "International";
  }

  function isExplicitIllustrationRare(card) {
    const text = artworkText(card);
    if (isHyperRare(card)) return false;
    return /\b(special illustration rare|illustration rare|special art rare|art rare)\b/.test(text);
  }

  function isHyperRare(card) {
    return /\b(mega hyper rare|hyper rare)\b/.test(artworkText(card));
  }

  function isLikelyScarletVioletIllustrationRare(card) {
    if (isHyperRare(card)) return false;
    if (!isEnglishCard(card)) return false;
    const printedTotal = Number(card?.set?.printedTotal || 0);
    const number = numericCardNumber(card);
    const series = String(card?.set?.series || "").toLowerCase();
    const setId = String(card?.set?.id || "").toLowerCase();
    const variant = String(card?.variant || "").toLowerCase();

    if (!series.includes("scarlet & violet") && !setId.startsWith("sv")) return false;
    if (!printedTotal || number <= printedTotal) return false;
    if (/\b(reverse|cosmos|stamp|promo|play|standard|non-holo|pok[eé] ball|master ball)\b/.test(variant)) return false;

    return true;
  }

  function isShowcaseArtworkCard(card, allowInferred = false) {
    if (!isEnglishCard(card)) return false;
    if (isExplicitIllustrationRare(card)) return true;
    if (allowInferred && isLikelyScarletVioletIllustrationRare(card)) return true;
    return false;
  }

  function normalizedArtworkKey(card) {
    const image = resolveTocImageUrl(card)
      .replace(/__(thumb|large)\.webp(?:\?.*)?$/i, "")
      .replace(/\.(png|jpe?g|webp)(?:\?.*)?$/i, "");
    return image || [card?.set?.id, card?.displayCardNumber || card?.cardNumber, card?.name].filter(Boolean).join("|");
  }

  function showcaseTier(card) {
    if (!isEnglishCard(card)) return 99;
    if (isHyperRare(card)) return 99;
    const text = artworkText(card);
    const number = numericCardNumber(card);
    const printedTotal = Number(card?.set?.printedTotal || 0);

    if (isExplicitIllustrationRare(card)) return 0;
    if (isLikelyScarletVioletIllustrationRare(card)) return 1;
    if (/\b(trainer gallery|galarian gallery|gallery)\b/.test(text)) return 2;
    if (/\b(alt art|alternate art|special art|full art)\b/.test(text)) return 3;
    if (printedTotal && number > printedTotal) return 4;
    if (/\b(vmax|vstar|v-union|gx| ex\b| v\b|ultra rare|secret rare|rainbow rare|shiny vault|gold star)\b/.test(text)) return 5;
    return 99;
  }

  function latestReleasedCards(data, limit = 2, mastersetKey = "") {
    const cards = Array.isArray(data?.cards)
      ? data.cards.filter(isBinderCard).filter((card) => resolveImageUrl(card))
      : [];
    const overrideIds = POKEMON_TOC_CARD_OVERRIDES[mastersetKey] || [];
    const overrideCards = overrideIds
      .map((id) => cards.find((card) => card.id === id || card.cardId === id))
      .filter(Boolean);

    if (overrideCards.length) {
      return overrideCards.slice(0, limit);
    }

    const seenArtwork = new Set();
    const selected = [];
    const rankedCards = cards
      .slice()
      .map((card) => ({ card, tier: showcaseTier(card) }))
      .filter((row) => row.tier < 99)
      .sort((a, b) =>
        a.tier - b.tier ||
        cardReleaseTime(b.card) - cardReleaseTime(a.card) ||
        numericCardNumber(b.card) - numericCardNumber(a.card)
      );

    rankedCards.forEach(({ card }) => {
      const key = normalizedArtworkKey(card);
      if (seenArtwork.has(key)) return;
      seenArtwork.add(key);
      selected.push(card);
    });

    return selected.slice(0, limit);
  }

  window.PokeCottageMastersetTotals = window.PokeCottageMastersetTotals || (() => {
    async function renderTotal(el) {
      const mastersetKey = el.dataset.masterset;
      const pokemonName = el.dataset.pokemon || "Pokémon";

      if (!mastersetKey) return;
      if (el.dataset.pcMastersetTotalRendered === "true") return;
      el.dataset.pcMastersetTotalRendered = "true";

      try {
        const data = await loadMastersetData(mastersetKey);

        if (!data || !Array.isArray(data.cards)) {
          el.textContent = `${pokemonName} card total unavailable`;
          return;
        }

        const total = binderVariantCount(data);
        el.textContent = `${total.toLocaleString()} Cards`;
      } catch {
        el.textContent = `${pokemonName} card total unavailable`;
      }
    }

    function init() {
      document.querySelectorAll("[data-masterset-total]").forEach(renderTotal);
    }

    return { init };
  })();

  window.PokeCottageMastersetStats = window.PokeCottageMastersetStats || (() => {
    function renderShell(container, pokemonName) {
      const hasCustomContent = container.children.length > 0 || String(container.textContent || "").trim();
      if (hasCustomContent) return;

      container.classList.add("pc-masterset-stats");
      container.innerHTML = `
        <div class="pc-masterset-stats-grid">
          <div class="pc-masterset-stat">
            <div class="pc-masterset-stat-label">ENGLISH</div>
            <div class="pc-masterset-stat-value" data-masterset-stat="International">-</div>
          </div>

          <div class="pc-masterset-stat">
            <div class="pc-masterset-stat-label">JAPANESE</div>
            <div class="pc-masterset-stat-value" data-masterset-stat="Japan">-</div>
          </div>

          <div class="pc-masterset-stat">
            <div class="pc-masterset-stat-label">S. CHINESE</div>
            <div class="pc-masterset-stat-value" data-masterset-stat="China">-</div>
          </div>

          <div class="pc-masterset-stat">
            <div class="pc-masterset-stat-label">PROMOS</div>
            <div class="pc-masterset-stat-value" data-masterset-stat="promos">-</div>
          </div>

          <div class="pc-masterset-stat">
            <div class="pc-masterset-stat-label">UNIQUE PRINTINGS</div>
            <div class="pc-masterset-stat-value" data-masterset-stat="printings">-</div>
          </div>

          <div class="pc-masterset-stat">
            <div class="pc-masterset-stat-label">ADDITIONAL VARIANTS</div>
            <div class="pc-masterset-stat-value" data-masterset-stat="variants">-</div>
          </div>
        </div>

        <h3 class="pc-masterset-total-heading">
          <span data-masterset-stat-title>How Many Cards Are in the ${escapeHtml(pokemonName)} Master Set?</span>
          <span class="pc-masterset-total-number" data-masterset-stat="total">-</span>
        </h3>
      `;
    }

    async function renderStats(container) {
      const mastersetKey = container.dataset.masterset;
      const pokemonName = container.dataset.pokemon || "Pokémon";

      if (!mastersetKey) return;
      if (container.dataset.pcMastersetStatsRendered === "true") return;
      container.dataset.pcMastersetStatsRendered = "true";
      container.classList.add("pc-masterset-stats");
      renderShell(container, pokemonName);

      try {
        const data = await loadMastersetData(mastersetKey);
        if (!data || !Array.isArray(data.cards)) return;

        const cards = data.cards.filter(isBinderCard);
        const total = binderVariantCount(data);
        const printings = new Set(cards.map(card => card.cardId || card.id)).size;
        const variants = total - printings;

        const regionTotals = cards.reduce((totals, card) => {
          totals[card.region] = (totals[card.region] || 0) + 1;
          return totals;
        }, {});

        const promos = cards.filter(card => {
          const promoText = [
            card.source,
            card.set?.name,
            card.set?.series,
            card.variant
          ].filter(Boolean).join(" ").toLowerCase();

          return promoText.includes("promo");
        }).length;

        const values = {
          International: regionTotals.International || 0,
          Japan: regionTotals.Japan || 0,
          China: regionTotals.China || 0,
          promos,
          printings,
          variants,
          total
        };

        const title = container.querySelector("[data-masterset-stat-title]");
        if (title) title.textContent = `How Many Cards Are in the ${pokemonName} Master Set?`;

        Object.entries(values).forEach(([name, value]) => {
          const element = container.querySelector(`[data-masterset-stat="${name}"]`);
          if (element) element.textContent = `${value.toLocaleString()} ${value === 1 ? "card" : "cards"}`;
        });
      } catch {
        return;
      }
    }

    function init() {
      document.querySelectorAll("[data-masterset-stats]").forEach(renderStats);
    }

    return { init };
  })();

  window.PokeCottagePokemonSummary = window.PokeCottagePokemonSummary || (() => {
    function summaryItem(label, value, className = "", valueIsHtml = false) {
      return `
        <div class="pc-pokemon-summary-item${className ? ` ${className}` : ""}">
          <div class="pc-pokemon-summary-label">${escapeHtml(label)}</div>
          <h4 class="pc-pokemon-summary-value${className ? " pc-pokemon-summary-total-value" : ""}">${valueIsHtml ? value : escapeHtml(value)}</h4>
        </div>`;
    }

    function productUrl(card) {
      return String(card?.tcgplayerUrl || "").trim();
    }

    function displayCardNumber(card) {
      return card?.displayCardNumber || card?.cardNumber || "";
    }

    function mostExpensiveOverride(container) {
      const mastersetKey = normalizeMastersetKey(container.dataset.masterset || "");
      const preset = POKEMON_MOST_EXPENSIVE_OVERRIDES[mastersetKey] || {};
      const label = container.dataset.mostExpensiveLabel || container.dataset.mostExpensiveCard || preset.label || "";
      const url = container.dataset.mostExpensiveUrl || preset.url || "";
      const number = container.dataset.mostExpensiveNumber || preset.number || "";
      const cardId = container.dataset.mostExpensiveId || preset.cardId || "";

      if (!label) return "";

      const text = [label, number].filter(Boolean).join(" • ");
      const safeText = escapeHtml(text);

      if (cardId) {
        return `<a href="#binder" class="pc-pokemon-summary-card-link" data-summary-masterset="${escapeHtml(mastersetKey)}" data-summary-card-id="${escapeHtml(cardId)}">${safeText}</a>`;
      }

      if (!url) return safeText;

      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
    }

    async function mostExpensiveCardHtml(container, data) {
      const override = mostExpensiveOverride(container);
      if (override) return override;

      if (!data || !Array.isArray(data.cards)) return "Unavailable";

      const cards = data.cards
        .filter(isBinderCard)
        .filter((card) => productUrl(card));

      if (!cards.length) return "Unavailable";

      const pricing = await ensurePricingCore();
      const pricedCards = await pricing.priceCards(cards);
      const best = pricedCards
        .filter((row) => Number(row.price || 0) > 0)
        .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))[0];

      if (!best) return "Unavailable";

      const card = best.card;
      const text = [card.displayName || card.name, displayCardNumber(card)].filter(Boolean).join(" • ");
      return `<a href="#binder" class="pc-pokemon-summary-card-link" data-summary-masterset="${escapeHtml(normalizeMastersetKey(container.dataset.masterset || ""))}" data-summary-card-id="${escapeHtml(card.id)}">${escapeHtml(text)}</a>`;
    }

    function revealLinkedCard(event) {
      const link = event.target.closest?.(".pc-pokemon-summary-card-link");
      if (!link) return;

      const mastersetKey = link.dataset.summaryMasterset || "";
      const cardId = link.dataset.summaryCardId || "";
      if (!mastersetKey || !cardId) return;

      event.preventDefault();

      const revealed = window.PokeCottageMastersetBinders?.reveal?.(mastersetKey, cardId);
      if (revealed) return;

      const binder = document.querySelector(`[data-masterset-binder][data-masterset="${CSS.escape(mastersetKey)}"], [data-masterset-binder][data-inline-key="${CSS.escape(mastersetKey)}"]`);
      binder?.scrollIntoView({ behavior: "smooth", block: "start" });

      window.setTimeout(() => {
        window.PokeCottageMastersetBinders?.reveal?.(mastersetKey, cardId);
      }, 700);
      window.setTimeout(() => {
        window.PokeCottageMastersetBinders?.reveal?.(mastersetKey, cardId);
      }, 1800);
    }

    async function renderSummary(container) {
      const mastersetKey = normalizeMastersetKey(container.dataset.masterset);
      if (!mastersetKey) return;
      if (container.dataset.pcPokemonSummaryRendered === "true") return;
      container.dataset.pcPokemonSummaryRendered = "true";

      const fallbackName = container.dataset.pokemon || mastersetKey.split("-").slice(1).join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Pokémon";
      container.classList.add("pc-pokemon-summary");
      container.setAttribute("aria-label", container.getAttribute("aria-label") || `${fallbackName} master set summary`);

      try {
        const data = await loadMastersetData(mastersetKey);
        const pokemonName = container.dataset.pokemon || data?.pokemon?.name || fallbackName;
        const firstAppearance = container.dataset.firstAppeared || container.dataset.firstAppearance || "—";
        const releaseYear = container.dataset.releaseYear || "—";
        const total = data && Array.isArray(data.cards)
          ? `${binderVariantCount(data).toLocaleString()} Cards`
          : `${pokemonName} card total unavailable`;
        const mostExpensive = await mostExpensiveCardHtml(container, data);

        container.innerHTML = [
          summaryItem("NAME", pokemonName),
          summaryItem("FIRST APPEARED", firstAppearance),
          summaryItem("RELEASE YEAR", releaseYear),
          summaryItem("MOST EXPENSIVE CARD", mostExpensive, "pc-pokemon-summary-expensive", true),
          summaryItem("MASTER SET TOTAL", total, "pc-pokemon-summary-total"),
        ].join("");
      } catch {
        const mostExpensive = mostExpensiveOverride(container) || "Unavailable";
        container.innerHTML = [
          summaryItem("NAME", fallbackName),
          summaryItem("FIRST APPEARED", container.dataset.firstAppeared || container.dataset.firstAppearance || "—"),
          summaryItem("RELEASE YEAR", container.dataset.releaseYear || "—"),
          summaryItem("MOST EXPENSIVE CARD", mostExpensive, "pc-pokemon-summary-expensive", true),
          summaryItem("MASTER SET TOTAL", `${fallbackName} card total unavailable`, "pc-pokemon-summary-total"),
        ].join("");
      }
    }

    function init() {
      document.querySelectorAll("[data-pokemon-summary]").forEach(renderSummary);
      if (!document.documentElement.dataset.pcPokemonSummaryLinkBound) {
        document.documentElement.dataset.pcPokemonSummaryLinkBound = "true";
        document.addEventListener("click", revealLinkedCard);
      }
    }

    return { init };
  })();

  window.PokeCottagePokemonToc = window.PokeCottagePokemonToc || (() => {
    const defaultItems = [
      { href: "#cards", title: "Card & Rarity Breakdown" },
      { href: "#binder", title: "Visual Binder", badge: "Popular", badgeClass: "badge-pop" },
      { href: "#binder-size", title: "Binder Size Guide" },
      { href: "#binder-printouts", title: "Printable Placeholders", badge: "Free", badgeClass: "badge-free" },
      { href: "#checklist", title: "Master Set Checklist", badge: "Free", badgeClass: "badge-free" },
      { href: "#evolution", title: "Collect the Entire Evolution" },
    ];

    function tocItems(container) {
      const rawItems = String(container.dataset.tocItems || "").trim();
      if (!rawItems) return defaultItems;

      return rawItems.split("|").map((item) => {
        const [href, title, badge, badgeClass] = item.split("::").map((part) => part.trim());
        return { href, title, badge, badgeClass };
      }).filter((item) => item.href && item.title);
    }

    function renderTocList(container) {
      return tocItems(container).map((item, index) => `
        <a class="toc-item" href="${escapeHtml(item.href)}">
          <span class="toc-num-col">${String(index + 1).padStart(2, "0")}</span>
          <span class="toc-content">
            <span class="toc-title">${escapeHtml(item.title)}</span>
            ${item.badge ? `<span class="toc-badge ${escapeHtml(item.badgeClass || "badge-free")}">${escapeHtml(item.badge)}</span>` : ""}
          </span>
        </a>
      `).join("");
    }

    async function renderToc(container) {
      const mastersetKey = container.dataset.masterset;
      if (container.dataset.pcPokemonTocRendered === "true") return;
      container.dataset.pcPokemonTocRendered = "true";

      container.classList.add("pc-pokemon-toc");
      const label = container.dataset.label || "Explore the Guide";

      if (!mastersetKey) {
        container.innerHTML = `
          <div class="toc-wrap">
            <div class="toc-label">${escapeHtml(label)}</div>
            <div class="toc-list">${renderTocList(container)}</div>
          </div>`;
        return;
      }

      try {
        const data = await loadMastersetData(mastersetKey);
        const [frontCard, backCard] = latestReleasedCards(data, 2, mastersetKey);
        const backCardImage = backCard || frontCard;
        const frontCardImage = frontCard || backCard;
        const backImage = container.dataset.backImage || resolveTocImageUrl(backCardImage);
        const frontImage = container.dataset.frontImage || resolveTocImageUrl(frontCardImage);
        const backFallbackImage = resolveFallbackImageUrl(backCardImage);
        const frontFallbackImage = resolveFallbackImageUrl(frontCardImage);
        const backAlt = [backCard?.displayName || backCard?.name, backCard?.displayCardNumber || backCard?.cardNumber].filter(Boolean).join(" ");
        const frontAlt = [frontCard?.displayName || frontCard?.name, frontCard?.displayCardNumber || frontCard?.cardNumber].filter(Boolean).join(" ");

        container.innerHTML = `
          <div class="guide-card-stack">
            ${backImage ? `<img class="guide-card-img card-back" src="${escapeHtml(backImage)}" data-fallback-src="${escapeHtml(backFallbackImage)}" alt="${escapeHtml(backAlt)}" onerror="if (this.dataset.fallbackSrc && this.src !== this.dataset.fallbackSrc) { this.src = this.dataset.fallbackSrc; this.dataset.fallbackSrc = ''; }">` : ""}
            ${frontImage ? `<img class="guide-card-img card-front" src="${escapeHtml(frontImage)}" data-fallback-src="${escapeHtml(frontFallbackImage)}" alt="${escapeHtml(frontAlt)}" onerror="if (this.dataset.fallbackSrc && this.src !== this.dataset.fallbackSrc) { this.src = this.dataset.fallbackSrc; this.dataset.fallbackSrc = ''; }">` : ""}
          </div>

          <div class="toc-wrap">
            <div class="toc-label">${escapeHtml(label)}</div>
            <div class="toc-list">${renderTocList(container)}</div>
          </div>`;
      } catch {
        container.innerHTML = `
          <div class="toc-wrap">
            <div class="toc-label">${escapeHtml(label)}</div>
            <div class="toc-list">${renderTocList(container)}</div>
          </div>`;
      }
    }

    function init() {
      document.querySelectorAll(POKEMON_TOC_SELECTOR).forEach(renderToc);
    }

    return { init };
  })();

  window.PokeCottageBinderRecommendations = window.PokeCottageBinderRecommendations || (() => {
    function renderShell(container, pokemonName) {
      const hasCustomContent = container.children.length > 0 || String(container.textContent || "").trim();
      if (hasCustomContent) return;

      container.classList.add("pc-binder-rec");
      container.innerHTML = `
        <div class="pc-binder-rec-filters" aria-label="Choose card languages">
          <div class="pc-binder-rec-filter-header">
            <span class="pc-binder-rec-filter-title">INCLUDE CARDS</span>
          </div>

          <div class="pc-binder-rec-language-options">
            <label class="pc-binder-rec-toggle">
              <input type="checkbox" value="International" checked>
              <span>English</span>
            </label>

            <label class="pc-binder-rec-toggle">
              <input type="checkbox" value="Japan" checked>
              <span>Japanese</span>
            </label>

            <label class="pc-binder-rec-toggle">
              <input type="checkbox" value="China" checked>
              <span>Chinese</span>
            </label>

            <label class="pc-binder-rec-switch">
              <input type="checkbox" data-rec-stack-variants>
              <span class="pc-binder-rec-switch-track" aria-hidden="true"></span>
              <span class="pc-binder-rec-switch-label">Stack variants</span>
            </label>
          </div>
        </div>

        <div class="pc-binder-rec-group">
          <p>
            Since the <strong data-rec-pokemon-name>${escapeHtml(pokemonName)} Master Set</strong> has a total of
            <strong><span data-rec-stat="master-count">-</span> <span data-rec-stat="master-label">cards including all variants</span></strong>, you'll need:
          </p>

          <ul class="pc-binder-rec-list">
            <li><span aria-hidden="true">✓</span> <strong>9-Pocket Binder</strong> (with at least <span data-rec-stat="master-9">-</span> dual-sided pages)</li>
            <li><span aria-hidden="true">✓</span> <strong>12-Pocket Binder</strong> (with at least <span data-rec-stat="master-12">-</span> dual-sided pages)</li>
          </ul>
        </div>

        <p class="sqsrte-small pc-binder-rec-note"><em>*Always leave extra room, as additional variants may be released in the future.</em></p>

        <div class="pc-binder-rec-links">
          <a href="#binder-printouts" data-rec-placeholders-link>DOWNLOAD FREE ${escapeHtml(pokemonName)} BINDER PLACEHOLDERS</a>
        </div>
      `;
    }

    async function render(container) {
      const mastersetKey = container.dataset.masterset;
      const pokemonName = container.dataset.pokemon || "Pokémon";

      if (!mastersetKey) return;
      if (container.dataset.pcBinderRecRendered === "true") return;
      container.dataset.pcBinderRecRendered = "true";
      container.classList.add("pc-binder-rec");
      renderShell(container, pokemonName);

      const data = await loadMastersetData(mastersetKey);
      if (!data || !Array.isArray(data.cards)) return;

      const regionInputs = Array.from(container.querySelectorAll('.pc-binder-rec-toggle input[value]'));
      const stackInput = container.querySelector('[data-rec-stack-variants]');

      const nameEls = container.querySelectorAll("[data-rec-pokemon-name]");
      nameEls.forEach(el => el.textContent = `${pokemonName} Master Set`);

      const downloadLink = container.querySelector("[data-rec-placeholders-link]");
      if (downloadLink) {
        downloadLink.href = "#binder-printouts";
        downloadLink.textContent = `DOWNLOAD FREE ${pokemonName} BINDER PLACEHOLDERS`;
      }

      function setStat(name, value) {
        const element = container.querySelector(`[data-rec-stat="${name}"]`);
        if (element) element.textContent = value.toLocaleString();
      }

      function updateRecommendations(changedInput) {
        let checkedInputs = regionInputs.filter(input => input.checked);

        if (!checkedInputs.length && changedInput) {
          changedInput.checked = true;
          checkedInputs = [changedInput];
        }

        const selectedRegions = new Set(checkedInputs.map(input => input.value));
        const selectedCards = data.cards.filter(card =>
          isBinderCard(card) &&
          selectedRegions.has(card.region)
        );

        const uniquePrintingCount = new Set(selectedCards.map(card => card.cardId || card.id)).size;
        const masterCount = stackInput?.checked ? uniquePrintingCount : selectedCards.length;

        setStat("master-count", masterCount);
        setStat("master-9", Math.ceil(masterCount / 18));
        setStat("master-12", Math.ceil(masterCount / 24));

        const masterLabel = container.querySelector('[data-rec-stat="master-label"]');
        if (masterLabel) {
          masterLabel.textContent = stackInput?.checked
            ? "unique card printings"
            : "cards including all variants";
        }
      }

      regionInputs.forEach(input => {
        input.addEventListener("change", () => updateRecommendations(input));
      });

      stackInput?.addEventListener("change", () => updateRecommendations());

      updateRecommendations();
    }

    function init() {
      document.querySelectorAll("[data-binder-rec]").forEach(render);
    }

    return { init };
  })();

  function initAll() {
    window.PokeCottagePokemonSummary?.init();
    window.PokeCottagePokemonToc?.init();
    window.PokeCottageMastersetTotals?.init();
    window.PokeCottageMastersetStats?.init();
    window.PokeCottageBinderRecommendations?.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  window.addEventListener("load", initAll);
  window.addEventListener("pageshow", initAll);
  window.setTimeout(initAll, 250);
  window.setTimeout(initAll, 1000);
  window.PokeCottagePokemonWidgets = { init: initAll };

  if ("MutationObserver" in window) {
    let pendingInit = false;
    const observer = new MutationObserver(() => {
      if (pendingInit) return;
      pendingInit = true;
      window.requestAnimationFrame(() => {
        pendingInit = false;
        initAll();
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
