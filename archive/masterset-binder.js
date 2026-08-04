(function () {
  "use strict";

  const PC = window.PokeCottageMastersets;
  if (!PC) throw new Error("masterset-core.js must load before masterset-binder.js");

  if (typeof PC.displayCardNumber !== "function") {
    PC.displayCardNumber = function displayCardNumber(card) {
      const promoPrefix = (() => {
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
      })();

      if (promoPrefix) {
        const promoRaw = String(card?.cardNumber || card?.displayCardNumber || "").trim().replace(/\s+/g, "");
        if (/^[A-Z]+\d+[A-Z]?$/i.test(promoRaw)) return promoRaw.toUpperCase();
        const number = promoRaw.match(/\d+/)?.[0];
        if (number) {
          const width = promoPrefix === "SVP" || promoPrefix === "SWSH" || promoPrefix === "MEP" ? 3 : 2;
          return `${promoPrefix}${String(Number(number)).padStart(width, "0")}`;
        }
      }

      if (card?.displayCardNumber) return card.displayCardNumber;
      const raw = String(card?.cardNumber || "").trim();
      const total = Number(card?.set?.printedTotal || card?.printedTotal || 0);
      if (/^\d+$/.test(raw) && total > 0) return `${String(Number(raw)).padStart(3, "0")}/${String(total).padStart(3, "0")}`;
      return raw;
    };
  }

  const REGIONS = ["International", "Japan", "China"];
  const LAYOUTS = { "3x3": 9, "4x3": 12, "4x4": 16 };
  const TCG_AFFILIATE = {
    memberID: "6278691",
    campaignID: "1780961",
    actionID: "21018",
  };

  window.PokeCottageMastersetBinders = window.PokeCottageMastersetBinders || {
    instances: new Map(),
    register(key, binder) {
      if (key) this.instances.set(key, binder);
    },
    reveal(key, cardId) {
      const binder = this.instances.get(key);
      if (!binder || typeof binder.revealCard !== "function") return false;
      return binder.revealCard(cardId);
    },
  };

  function regionShort(region) {
    if (region === "International") return "English";
    if (region === "Japan") return "Japanese";
    if (region === "China") return "Chinese";
    return region;
  }

  function gridIcon(layout) {
    const cols = layout === "3x3" ? 3 : 4;
    const rows = layout === "4x4" ? 4 : 3;
    const width = cols * 10;
    const height = rows * 10;
    let rects = "";
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        rects += `<rect x="${1 + col * 11}" y="${1 + row * 11}" width="6" height="6" rx="1.2"/>`;
      }
    }
    return `<svg viewBox="0 0 ${width} ${height}">${rects}</svg>`;
  }

  class Binder {
    constructor(root) {
      this.root = root;
      this.data = null;
      this.dataUrl = "";
      this.allCards = [];
      this.fullDeck = [];
      this.selectedRegions = new Set(REGIONS);
      this.stackVariants = false;
      this.showPrices = false;
      this.currentLayout = "3x3";
      this.currentPage = 0;
      this.currentSpread = 0;
      this.isMobile = window.innerWidth <= 800;
      this.searchMatches = [];
      this.searchMatchSet = new Set();
      this.priceByCardId = new Map();
      this.currentSearchIndex = 0;
      this.currentSearchQuery = "";
      this.warmedImages = new Set();
      this.imagePreloadPromises = new Map();
      this.pageChangeToken = 0;
      this.pendingHeightRelease = 0;
      this.resizeHandler = () => this.onResize();
      this.keyHandler = (event) => this.onKeydown(event);

      this.drawShell();
      this.cacheElements();
      this.bind();
      window.PokeCottageMastersetBinders.register(this.root.dataset.inlineKey || this.root.dataset.masterset || this.root.dataset.mastersetKey || "", this);
      this.load();
    }

    drawShell() {
      this.root.innerHTML = `
        <div class="binder-wrapper">
          <div class="binder-header">
            <div class="header-panel">
              <div class="selection-title">SELECT YOUR BINDER SIZE</div>
              <div class="size-options" data-active-layout="${this.currentLayout}">
                ${Object.entries(LAYOUTS).map(([layout, slots]) => `
                  <div class="size-btn${layout === this.currentLayout ? " active" : ""}" data-layout="${layout}">
                    <div class="size-btn-inner">
                      <div class="size-text"><strong>${layout}</strong><span>${slots} Pockets</span></div>
                    </div>
                  </div>`).join("")}
              </div>
            </div>

            <button class="binder-customize-btn" type="button" aria-expanded="false" data-customize-toggle>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h10"></path>
                <path d="M18 7h2"></path>
                <path d="M16 5v4"></path>
                <path d="M4 12h3"></path>
                <path d="M11 12h9"></path>
                <path d="M9 10v4"></path>
                <path d="M4 17h12"></path>
                <path d="M20 17h0"></path>
                <path d="M18 15v4"></path>
              </svg>
              <span>Customize</span>
            </button>

            <div class="binder-filters is-collapsed" aria-label="Card display options" data-customize-panel>
              <div class="filter-group">
                <span class="filter-title">INCLUDE CARDS</span>
                <div class="filter-language-row">
                  ${REGIONS.map((region) => `
                    <label class="filter-toggle">
                      <input type="checkbox" value="${PC.escapeHtml(region)}" checked>
                      <span>${regionShort(region)}</span>
                    </label>`).join("")}
                  <label class="filter-toggle filter-toggle-coming-soon" title="Coming soon">
                    <input type="checkbox" data-show-cameos aria-disabled="true">
                    <span>Show Cameos</span>
                  </label>
                </div>
              </div>
              <div class="binder-toggle-stack">
                <label class="binder-stack-switch">
                  <input type="checkbox" data-stack-variants>
                  <span class="binder-stack-switch-track" aria-hidden="true"></span>
                  <span class="binder-stack-switch-label">Stack variants</span>
                </label>
                <label class="binder-stack-switch">
                  <input type="checkbox" data-show-prices>
                  <span class="binder-stack-switch-track" aria-hidden="true"></span>
                  <span class="binder-stack-switch-label">Display prices</span>
                </label>
              </div>
            </div>

            <div class="search-group">
              <div class="search-wrapper">
                <div class="search-icon">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="16.65" y1="16.65" x2="21" y2="21"></line></svg>
                </div>
                <input id="binderSearch" type="text" placeholder="Search cards..." autocomplete="off" data-binder-search>
                <div class="search-controls hidden" id="searchControls" data-search-controls>
                  <button type="button" aria-label="Previous match" data-match-dir="-1">←</button>
                  <span data-search-count>0 / 0</span>
                  <button type="button" aria-label="Next match" data-match-dir="1">→</button>
                </div>
                <button class="search-clear hidden" id="clearSearch" type="button" aria-label="Clear search" title="Clear search" data-clear-search>✕</button>
              </div>
            </div>
          </div>

          <div class="binder-viewport">
            <button class="binder-side-nav binder-side-nav-prev" type="button" data-page-dir="-1" aria-label="Previous binder page">
              <svg viewBox="0 0 18 34" aria-hidden="true"><path d="M15 3L3 17L15 31"/></svg>
            </button>
            <div class="book-container" data-book>
              <div class="binder-loading">Loading Binder...</div>
            </div>
            <button class="binder-side-nav binder-side-nav-next" type="button" data-page-dir="1" aria-label="Next binder page">
              <svg viewBox="0 0 18 34" aria-hidden="true"><path d="M3 3L15 17L3 31"/></svg>
            </button>
          </div>

          <div class="navigation-group">
            <button class="nav-btn" type="button" data-page-dir="-1">‹ Prev</button>
            <div class="page-indicator">
              <input id="pageInput" type="text" value="1" data-page-input aria-label="Binder page">
              <span id="pageTotal" data-page-total>of 1</span>
              <div class="page-dots" data-page-dots aria-hidden="true"></div>
              <div class="page-text" data-page-text>Page 1 of 1</div>
            </div>
            <button class="nav-btn" type="button" data-page-dir="1">Next ›</button>
          </div>
        </div>

        <dialog id="lightbox" data-lightbox>
          <span class="close-btn" data-lightbox-close>&times;</span>
          <div class="lightbox-content">
            <img src="" alt="" id="lightboxImage" data-lightbox-image>
            <a href="https://www.tcgplayer.com" target="_blank" rel="noopener noreferrer" class="lightbox-cta" id="lightboxCTA" data-lightbox-cta>
              <span>Check<br>Price On<br>TCGPLAYER</span>
            </a>
          </div>
        </dialog>`;
    }

    cacheElements() {
      this.book = this.root.querySelector("[data-book]");
      this.searchInput = this.root.querySelector("[data-binder-search]");
      this.searchControls = this.root.querySelector("[data-search-controls]");
      this.searchCount = this.root.querySelector("[data-search-count]");
      this.clearSearchButton = this.root.querySelector("[data-clear-search]");
      this.pageInput = this.root.querySelector("[data-page-input]");
      this.pageTotal = this.root.querySelector("[data-page-total]");
      this.pageDots = this.root.querySelector("[data-page-dots]");
      this.pageText = this.root.querySelector("[data-page-text]");
      this.lightbox = this.root.querySelector("[data-lightbox]");
      this.lightboxImage = this.root.querySelector("[data-lightbox-image]");
      this.lightboxCta = this.root.querySelector("[data-lightbox-cta]");
    }

    bind() {
      this.root.querySelectorAll("[data-layout]").forEach((button) => {
        button.addEventListener("click", () => this.updateLayout(button.dataset.layout, button));
      });

      this.root.querySelector("[data-customize-toggle]")?.addEventListener("click", (event) => {
        this.toggleCustomizePanel(event.currentTarget);
      });

      this.root.querySelectorAll(".filter-toggle input").forEach((input) => {
        input.addEventListener("change", () => this.updateRegionFilters(input));
      });

      this.root.querySelector("[data-stack-variants]").addEventListener("change", (event) => {
        this.updateVariantStacking(event.target.checked);
      });

      this.root.querySelector("[data-show-prices]").addEventListener("change", (event) => {
        this.updatePriceVisibility(event.target.checked);
      });

      this.root.querySelector("[data-show-cameos]")?.closest("label")?.addEventListener("click", (event) => {
        event.preventDefault();
        const input = event.currentTarget.querySelector("input");
        if (input) input.checked = false;
      });

      this.root.querySelectorAll("[data-page-dir]").forEach((button) => {
        button.addEventListener("click", () => this.changePage(Number(button.dataset.pageDir)));
      });

      this.pageInput.addEventListener("change", () => this.jumpToPage(this.pageInput.value));
      this.searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          this.handleSearch(this.searchInput.value);
          this.searchInput.blur();
        }
      });

      this.root.querySelectorAll("[data-match-dir]").forEach((button) => {
        button.addEventListener("click", () => this.navigateSearch(Number(button.dataset.matchDir)));
      });

      this.clearSearchButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.searchInput.value = "";
        this.handleSearch("");
        this.searchInput.blur();
      });

      this.root.querySelector("[data-lightbox-close]").addEventListener("click", () => this.closeLightbox());
      this.lightbox.addEventListener("click", (event) => {
        if (event.target === this.lightbox) this.closeLightbox();
      });
      this.lightboxCta.addEventListener("click", (event) => {
        const href = this.lightboxCta.getAttribute("href");
        if (!href || href === "#") {
          event.preventDefault();
          return;
        }
      });

      window.addEventListener("resize", this.resizeHandler);
      window.addEventListener("keydown", this.keyHandler);
    }

    async load() {
      try {
        const loaded = await PC.loadData(this.root);
        this.data = loaded.data;
        this.dataUrl = loaded.dataUrl;
        this.allCards = PC.sortCards((this.data.cards || []).filter(PC.isBinderCard)).map((card) => ({
          ...card,
          displayCardNumber: PC.displayCardNumber(card),
          n: [card.name, PC.displayCardNumber(card), card.variant].filter(Boolean).join(" — "),
          s: PC.cardImageUrl(card, this.dataUrl, "thumbnail"),
          fallbackSrc: PC.resolveAsset ? PC.resolveAsset(card.originalImageUrl || card.imageUrl, this.dataUrl) : (card.originalImageUrl || card.imageUrl || ""),
          lightboxSrc: PC.cardImageUrl(card, this.dataUrl, "lightbox"),
          link: this.marketLink(card).url,
          marketName: this.marketLink(card).marketName,
          variantName: card.variant || "",
          activeID: card.id,
          cardId: card.cardId || card.id,
          setName: card.set?.name || "",
          series: card.set?.series || "",
          artist: typeof card.artist === "string" ? card.artist : (card.artist?.name || ""),
          searchText: this.searchText(card),
          stackCount: 1,
        }));
        await this.loadPrices();
        this.rebuildFullDeck();
        this.buildBinder();
      } catch (error) {
        this.book.innerHTML = `<div class="binder-loading">${PC.escapeHtml(error.message)}</div>`;
      }
    }

    ebaySearchTerms(card) {
      const terms = card.ebaySearchText || [
        card.name,
        card.set?.name || card.source,
        card.cardNumber,
        "pokemon card",
      ].filter(Boolean).join(" ");

      return terms
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[:|()[\]{}"'“”‘’]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    ebayAffiliateSearchLink(card) {
      if (card.ebayUrl) return card.ebayUrl;
      const url = new URL("https://www.ebay.com/sch/i.html");
      url.searchParams.set("_nkw", this.ebaySearchTerms(card));
      url.searchParams.set("_sacat", "0");
      url.searchParams.set("_from", "R40");
      url.searchParams.set("_trksid", "p4624852.m570.l1313");
      url.searchParams.set("mkcid", "1");
      url.searchParams.set("mkrid", "711-53200-19255-0");
      url.searchParams.set("siteid", "0");
      url.searchParams.set("campid", "5339158445");
      url.searchParams.set("customid", "pokecottage");
      url.searchParams.set("toolid", "10001");
      url.searchParams.set("mkevt", "1");
      return url.toString();
    }

    tcgAffiliateLink(rawLink) {
      if (!rawLink) return "";
      let productLink = rawLink;
      try {
        const parsed = new URL(rawLink);
        if (parsed.hostname === "partner.tcgplayer.com") productLink = parsed.searchParams.get("u") || rawLink;
      } catch {
        productLink = rawLink;
      }

      const match = productLink.match(/tcgplayer\.com(\/product\/[^?#]+)/i);
      productLink = match ? `https://www.tcgplayer.com${match[1]}` : productLink.replace("https://tcgplayer.com", "https://www.tcgplayer.com");
      const destination = new URL(productLink);
      destination.searchParams.set("utm_source", "impact");
      destination.searchParams.set("utm_medium", "affiliate");
      destination.searchParams.set("utm_campaign", "poke cottage");
      return `https://partner.tcgplayer.com/c/${TCG_AFFILIATE.memberID}/${TCG_AFFILIATE.campaignID}/${TCG_AFFILIATE.actionID}?u=${encodeURIComponent(destination.toString())}`;
    }

    marketLink(card) {
      if (card.tcgplayerUrl) return { url: this.tcgAffiliateLink(card.tcgplayerUrl), marketName: "TCGPlayer" };
      return { url: this.ebayAffiliateSearchLink(card), marketName: "eBay" };
    }

    pricing() {
      return window.PokeCottageSetPricing || null;
    }

    async loadPrices() {
      const currentPricing = this.pricing();
      if (
        (!currentPricing || currentPricing.version !== PC.pricingCoreVersion) &&
        typeof PC.loadPricingCore === "function"
      ) {
        await PC.loadPricingCore();
      }

      const pricing = this.pricing();
      if (!pricing || typeof pricing.priceCards !== "function") return;

      try {
        const pricedCards = await pricing.priceCards(this.allCards);
        this.priceByCardId = new Map(pricedCards.map(({ card, price }) => [card.id, price]));
        this.allCards = this.allCards.map((card) => ({
          ...card,
          marketPrice: this.priceByCardId.get(card.id) || 0,
        }));
      } catch {
        this.priceByCardId = new Map();
      }
    }

    formatPrice(card) {
      const price = Number(card?.marketPrice || 0);
      if (!price) return "";
      const pricing = this.pricing();
      if (pricing && typeof pricing.formatMoney === "function") return pricing.formatMoney(price);
      return `$${price.toFixed(2)}`;
    }

    searchText(card) {
      return [
        card.searchText,
        card.name,
        card.cardNumber,
        PC.displayCardNumber(card),
        card.variant,
        card.region,
        card.source,
        card.set?.name,
        card.set?.series,
        card.releaseDate,
        typeof card.artist === "string" ? card.artist : card.artist?.name,
      ].filter(Boolean).join(" ").toLowerCase();
    }

    getSlots() {
      return LAYOUTS[this.currentLayout] || 9;
    }

    getTotalPages() {
      return Math.max(1, Math.ceil(this.fullDeck.length / this.getSlots()));
    }

    getTotalSpreads() {
      const pages = this.getTotalPages();
      return pages <= 1 ? 1 : 1 + Math.ceil((pages - 1) / 2);
    }

    getColumns() {
      return this.currentLayout === "3x3" ? 3 : 4;
    }

    getRows() {
      return this.currentLayout === "4x4" ? 4 : 3;
    }

    isVUnionPart(card) {
      return /v[-\s]?union/i.test([card?.name, card?.searchText].filter(Boolean).join(" "));
    }

    vUnionGroupKey(card) {
      return [
        String(card?.name || "").toLowerCase().replace(/\s+/g, " ").trim(),
        card?.region || "",
        card?.set?.id || card?.setName || "",
        card?.releaseDate || "",
      ].join("|");
    }

    vUnionNumber(card) {
      const value = String(card?.displayCardNumber || card?.cardNumber || "").match(/\d+/)?.[0];
      return value ? Number(value) : Number.NaN;
    }

    isVUnionQuartet(deck, index, consumedIndexes) {
      const quartet = deck.slice(index, index + 4);
      if (quartet.length !== 4 || quartet.some((_, offset) => consumedIndexes.has(index + offset))) return false;
      if (!quartet.every((card) => this.isVUnionPart(card))) return false;

      const key = this.vUnionGroupKey(quartet[0]);
      if (!quartet.every((card) => this.vUnionGroupKey(card) === key)) return false;

      const numbers = quartet.map((card) => this.vUnionNumber(card));
      if (numbers.some((number) => Number.isNaN(number))) return true;
      return numbers.every((number, offset) => offset === 0 || number === numbers[offset - 1] + 1);
    }

    vUnionHasStartRoom(position) {
      const slots = this.getSlots();
      const columns = this.getColumns();
      const rows = this.getRows();
      const pagePosition = position % slots;
      if (pagePosition === 0) return true;

      const column = pagePosition % columns;
      const row = Math.floor(pagePosition / columns);
      return column <= columns - 2 && row <= rows - 2;
    }

    vUnionMiddleSlotCount(position) {
      const columns = this.getColumns();
      const column = (position % this.getSlots()) % columns;
      return (columns - (column + 2)) + column;
    }

    arrangeVUnionCards(deck) {
      const arranged = [];
      const consumedIndexes = new Set();

      const takeNextNonUnionIndex = (fromIndex) => {
        for (let index = fromIndex; index < deck.length; index += 1) {
          const card = deck[index];
          if (consumedIndexes.has(index) || this.isVUnionPart(card)) continue;
          return index;
        }
        return -1;
      };

      const pushNextNonUnionCard = (fromIndex) => {
        const fillerIndex = takeNextNonUnionIndex(fromIndex);
        if (fillerIndex < 0) return false;
        consumedIndexes.add(fillerIndex);
        arranged.push(deck[fillerIndex]);
        return true;
      };

      for (let index = 0; index < deck.length; index += 1) {
        if (consumedIndexes.has(index)) continue;

        if (this.isVUnionQuartet(deck, index, consumedIndexes)) {
          const quartet = deck.slice(index, index + 4);

          while (!this.vUnionHasStartRoom(arranged.length) && pushNextNonUnionCard(index + 4)) {
            // Keep the binder page full while moving the V-UNION quartet to a valid 2x2 start.
          }

          quartet.forEach((_, offset) => consumedIndexes.add(index + offset));
          arranged.push(quartet[0], quartet[1]);

          const middleSlots = this.vUnionMiddleSlotCount(arranged.length - 2);
          for (let slot = 0; slot < middleSlots; slot += 1) {
            if (!pushNextNonUnionCard(index + 4)) break;
          }

          arranged.push(quartet[2], quartet[3]);
          index += 3;
          continue;
        }

        arranged.push(deck[index]);
      }

      return arranged;
    }

    rebuildFullDeck() {
      let nextDeck = this.allCards.filter((card) => this.selectedRegions.has(card.region));

      if (this.stackVariants) {
        const stacks = new Map();
        nextDeck.forEach((card) => {
          const key = card.cardId || card.id;
          if (!stacks.has(key)) {
            stacks.set(key, { representative: card, variants: [card] });
            return;
          }
          const stack = stacks.get(key);
          stack.variants.push(card);
          if (String(card.variantName || "").toLowerCase() === "normal") stack.representative = card;
        });

        nextDeck = Array.from(stacks.values()).map((stack) => ({
          ...stack.representative,
          stackCount: stack.variants.length,
          searchText: stack.variants.map((card) => card.searchText).join(" "),
        }));
      }

      this.fullDeck = this.arrangeVUnionCards(nextDeck);
    }

    refreshDeckAfterFilter() {
      this.currentPage = 0;
      this.currentSpread = 0;
      this.rebuildFullDeck();
      if (this.currentSearchQuery) this.handleSearch(this.searchInput.value);
      else this.buildBinder();
    }

    updateRegionFilters(changedInput) {
      const inputs = Array.from(this.root.querySelectorAll(".filter-toggle input[value]"));
      const checked = inputs.filter((input) => input.checked);
      if (!checked.length) {
        changedInput.checked = true;
        return;
      }
      this.selectedRegions = new Set(checked.map((input) => input.value));
      this.refreshDeckAfterFilter();
    }

    updateVariantStacking(shouldStack) {
      this.stackVariants = shouldStack;
      this.refreshDeckAfterFilter();
    }

    updatePriceVisibility(shouldShow) {
      this.showPrices = shouldShow;
      this.renderPreservingViewport();
    }

    warmImage(src) {
      if (!src || this.warmedImages.has(src)) return;
      this.warmedImages.add(src);
      const img = new Image();
      img.src = src;
    }

    preloadImage(src) {
      if (!src) return Promise.resolve();
      if (this.imagePreloadPromises.has(src)) return this.imagePreloadPromises.get(src);

      const promise = new Promise((resolve) => {
        const img = new Image();
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
        img.src = src;

        if (img.decode) {
          img.decode().then(done).catch(done);
        }
      });

      this.imagePreloadPromises.set(src, promise);
      this.warmedImages.add(src);
      return promise;
    }

    warmCards(start, count) {
      const end = Math.min(this.fullDeck.length, start + count);
      for (let i = Math.max(0, start); i < end; i += 1) this.warmImage(this.fullDeck[i].s);
    }

    warmVisibleAndNearbyCards() {
      const slots = this.getSlots();
      if (this.isMobile) {
        const currentStart = this.currentPage * slots;
        this.warmCards(currentStart - slots, slots * 3);
      } else {
        const start = this.currentSpread === 0 ? 0 : slots + ((this.currentSpread - 1) * slots * 2);
        this.warmCards(start - (slots * 2), slots * 6);
      }
    }

    cardsForView(page = this.currentPage, spread = this.currentSpread) {
      const slots = this.getSlots();
      if (this.isMobile) {
        const start = page * slots;
        return this.fullDeck.slice(start, start + slots);
      }

      if (spread === 0) return this.fullDeck.slice(0, slots);

      const leftStart = slots + ((spread - 1) * slots * 2);
      return this.fullDeck.slice(leftStart, leftStart + (slots * 2));
    }

    async preloadView(page = this.currentPage, spread = this.currentSpread, timeoutMs = 1400) {
      const cards = this.cardsForView(page, spread);
      const sources = cards.flatMap((card) => [card.s, card.fallbackSrc]).filter(Boolean);
      if (!sources.length) return;

      await Promise.race([
        Promise.all(sources.map((src) => this.preloadImage(src))),
        new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
      ]);
    }

    preloadAdjacentViews() {
      const jobs = [];
      if (this.isMobile) {
        const lastPage = this.getTotalPages() - 1;
        for (const page of [this.currentPage - 1, this.currentPage, this.currentPage + 1]) {
          if (page >= 0 && page <= lastPage) jobs.push([page, this.currentSpread]);
        }
      } else {
        const lastSpread = this.getTotalSpreads() - 1;
        for (const spread of [this.currentSpread - 1, this.currentSpread, this.currentSpread + 1]) {
          if (spread >= 0 && spread <= lastSpread) jobs.push([this.currentPage, spread]);
        }
      }

      window.setTimeout(() => {
        jobs.forEach(([page, spread]) => this.preloadView(page, spread, 2400));
      }, 0);
    }

    warmNeighborViews() {
      const slots = this.getSlots();
      if (this.isMobile) {
        const start = this.currentPage * slots;
        this.warmCards(start - slots, slots * 3);
        return;
      }

      const start = this.currentSpread === 0 ? 0 : slots + ((this.currentSpread - 1) * slots * 2);
      this.warmCards(start - (slots * 2), slots * 6);
    }

    updateDesktopBinderFit() {
      const viewport = this.root.querySelector(".binder-viewport");
      if (!viewport) return;

      if (window.innerWidth <= 800) {
        viewport.style.removeProperty("--desktop-fit-height");
        viewport.style.removeProperty("--desktop-face-width");
        viewport.style.removeProperty("--desktop-face-height");
        return;
      }

      const rows = this.currentLayout === "4x4" ? 4 : 3;
      const cols = this.currentLayout === "3x3" ? 3 : 4;
      const viewportHeight = Math.max(520, window.innerHeight - 96);
      const viewportWidth = viewport.clientWidth || window.innerWidth;
      const facePadding = 32;
      const cardGap = 12;
      const pageGap = 20;

      let faceHeight = viewportHeight - 10;
      let cardHeight = (faceHeight - facePadding - (rows - 1) * cardGap) / rows;
      let faceWidth = cardHeight * (5 / 7) * cols + facePadding + (cols - 1) * cardGap;
      const maxFaceWidth = (viewportWidth - 168 - pageGap) / 2;

      if (faceWidth > maxFaceWidth) {
        faceWidth = maxFaceWidth;
        const cardWidth = (faceWidth - facePadding - (cols - 1) * cardGap) / cols;
        faceHeight = cardWidth * (7 / 5) * rows + facePadding + (rows - 1) * cardGap;
      }

      viewport.style.setProperty("--desktop-fit-height", `${Math.ceil(faceHeight + 10)}px`);
      viewport.style.setProperty("--desktop-face-width", `${Math.floor(faceWidth)}px`);
      viewport.style.setProperty("--desktop-face-height", `${Math.floor(faceHeight)}px`);
    }

    scheduleDesktopBinderFit() {
      this.updateDesktopBinderFit();
      requestAnimationFrame(() => {
        this.updateDesktopBinderFit();
        requestAnimationFrame(() => this.updateDesktopBinderFit());
      });
    }

    variantLabelText(card) {
      const label = String(card.variantName || "");
      return /world championships/i.test(label) ? "World Championships" : label;
    }

    renderSlots(cards, count, startIndex = 0) {
      return Array.from({ length: count }, (_, index) => {
        const card = cards[index];
        if (!card) return `<div class="card-slot empty-slot"></div>`;

        const globalIndex = startIndex + index;
        const reverseHolo = /\breverse\s+holo\b/i.test(String(card.variant || ""));
        const labelText = this.variantLabelText(card);
        const variantLabel = card.variantName && !this.stackVariants
          ? `<span class="card-variant-label">${PC.escapeHtml(labelText)}</span>`
          : "";
        const priceText = this.showPrices ? this.formatPrice(card) : "";
        const priceLabel = priceText
          ? `<span class="card-price-label" data-nosnippet>${PC.escapeHtml(priceText)}</span>`
          : "";
        const metaLabel = priceLabel || variantLabel
          ? `<span class="card-meta-labels${variantLabel ? " has-variant-label" : ""}">${priceLabel}${variantLabel}</span>`
          : "";
        const stackBadge = card.stackCount > 1 ? `<span class="variant-stack-badge">${card.stackCount} variants</span>` : "";
        const fetchPriority = "high";
        const loadingMode = "eager";

        return `
          <div class="card-slot${reverseHolo ? " reverse-holo" : ""}" data-card-index="${globalIndex}" data-card-id="${PC.escapeHtml(card.id)}">
            <img class="base loaded" src="${PC.escapeHtml(card.s)}" data-fallback-src="${PC.escapeHtml(card.fallbackSrc || "")}" alt="${PC.escapeHtml(card.n)}" draggable="false" loading="${loadingMode}" decoding="async" fetchpriority="${fetchPriority}" onload="this.closest('.card-slot').classList.add('image-ready')" onerror="if (this.dataset.fallbackSrc && this.src !== this.dataset.fallbackSrc) { this.src = this.dataset.fallbackSrc; this.dataset.fallbackSrc = ''; }">
            ${metaLabel}
            ${stackBadge}
          </div>`;
      }).join("");
    }

    buildBinder() {
      if (!this.data) return;
      const slots = this.getSlots();
      this.warmVisibleAndNearbyCards();
      this.book.innerHTML = "";

      const spread = document.createElement("div");
      spread.className = "page";

      if (this.isMobile) {
        const start = this.currentPage * slots;
        const cards = this.fullDeck.slice(start, start + slots);
        spread.innerHTML = `<div class="page-face grid-${this.currentLayout}">${this.renderSlots(cards, slots, start)}</div>`;
      } else if (this.currentSpread === 0) {
        const cards = this.fullDeck.slice(0, slots);
        spread.innerHTML = `<div class="page-face empty"></div><div class="page-face grid-${this.currentLayout}">${this.renderSlots(cards, slots, 0)}</div>`;
      } else {
        const leftStart = slots + ((this.currentSpread - 1) * slots * 2);
        const rightStart = leftStart + slots;
        const leftCards = this.fullDeck.slice(leftStart, leftStart + slots);
        const rightCards = this.fullDeck.slice(rightStart, rightStart + slots);
        spread.innerHTML = `<div class="page-face grid-${this.currentLayout}">${this.renderSlots(leftCards, slots, leftStart)}</div><div class="page-face grid-${this.currentLayout}">${this.renderSlots(rightCards, slots, rightStart)}</div>`;
      }

      this.book.appendChild(spread);
      this.book.classList.remove("is-page-changing");
      this.book.querySelectorAll("[data-card-id]").forEach((slot) => {
        slot.addEventListener("click", () => this.openLightbox(slot.dataset.cardId));
      });
      this.scheduleDesktopBinderFit();
      this.updateIndicator();
      this.updateSearchUI();
      this.applySearchHighlights();
      this.warmNeighborViews();
      this.preloadAdjacentViews();
    }

    lockBookHeight() {
      if (!this.book) return;
      const height = this.book.offsetHeight;
      if (height > 0) this.book.style.minHeight = `${height}px`;
    }

    releaseBookHeight() {
      if (!this.book) return;
      window.clearTimeout(this.pendingHeightRelease);
      const release = () => {
        if (!this.book?.classList.contains("is-page-changing")) this.book.style.removeProperty("min-height");
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(release);
      });
      this.pendingHeightRelease = window.setTimeout(release, 420);
    }

    renderPreservingViewport() {
      const viewport = this.root.querySelector(".binder-viewport");
      const beforeTop = viewport?.getBoundingClientRect().top;
      const beforeScrollY = window.scrollY;
      this.lockBookHeight();
      this.buildBinder();
      this.releaseBookHeight();
      if (typeof beforeTop !== "number") {
        window.scrollTo(window.scrollX, beforeScrollY);
        return;
      }

      const restorePosition = () => {
        const afterTop = viewport.getBoundingClientRect().top;
        window.scrollBy(0, afterTop - beforeTop);
      };

      restorePosition();
      requestAnimationFrame(() => {
        restorePosition();
        requestAnimationFrame(restorePosition);
      });
      setTimeout(restorePosition, 80);
      setTimeout(restorePosition, 180);
    }

    async changePage(direction) {
      const previousPage = this.currentPage;
      const previousSpread = this.currentSpread;
      if (this.isMobile) {
        this.currentPage = Math.max(0, Math.min(this.currentPage + direction, this.getTotalPages() - 1));
      } else {
        this.currentSpread = Math.max(0, Math.min(this.currentSpread + direction, this.getTotalSpreads() - 1));
      }

      if (previousPage === this.currentPage && previousSpread === this.currentSpread) return;

      const token = ++this.pageChangeToken;
      this.lockBookHeight();
      this.book.classList.add("is-page-changing");
      await this.preloadView(this.currentPage, this.currentSpread, 650);
      if (token !== this.pageChangeToken) return;
      this.renderPreservingViewport();
    }

    async jumpToPage(value) {
      const target = parseInt(String(value).split("-")[0], 10);
      if (Number.isNaN(target)) return this.updateIndicator();
      const previousPage = this.currentPage;
      const previousSpread = this.currentSpread;
      if (this.isMobile) {
        this.currentPage = Math.max(0, Math.min(target - 1, this.getTotalPages() - 1));
      } else {
        this.currentSpread = target <= 1 ? 0 : Math.ceil((target - 1) / 2);
        this.currentSpread = Math.max(0, Math.min(this.currentSpread, this.getTotalSpreads() - 1));
      }

      if (previousPage === this.currentPage && previousSpread === this.currentSpread) {
        this.updateIndicator();
        return;
      }

      const token = ++this.pageChangeToken;
      this.lockBookHeight();
      this.book.classList.add("is-page-changing");
      await this.preloadView(this.currentPage, this.currentSpread, 650);
      if (token !== this.pageChangeToken) return;
      this.renderPreservingViewport();
    }

    updateIndicator() {
      const view = this.isMobile ? this.currentPage + 1 : this.currentSpread + 1;
      const totalViews = this.isMobile ? this.getTotalPages() : this.getTotalSpreads();
      this.pageInput.value = this.isMobile ? (this.currentPage + 1) : (this.currentSpread === 0 ? "1" : `${this.currentSpread * 2}-${this.currentSpread * 2 + 1}`);
      this.pageTotal.textContent = `of ${this.getTotalPages()}`;
      if (this.pageText) this.pageText.textContent = `Page ${view} of ${totalViews}`;
      if (this.pageDots) {
        const maxDots = 5;
        const dotCount = Math.min(totalViews, maxDots);
        const activeDot = totalViews <= maxDots
          ? view
          : Math.min(maxDots, Math.max(1, Math.ceil((view / totalViews) * maxDots)));
        this.pageDots.innerHTML = Array.from({ length: dotCount }, (_, index) => (
          `<span class="${index + 1 === activeDot ? "active" : ""}"></span>`
        )).join("");
      }
    }

    setSearchActive(isActive) {
      this.searchControls.classList.toggle("hidden", !isActive);
      this.clearSearchButton.classList.toggle("hidden", !isActive);
    }

    handleSearch(query) {
      this.currentSearchQuery = String(query || "").trim().toLowerCase();
      this.searchMatches = [];
      this.searchMatchSet = new Set();
      this.currentSearchIndex = 0;

      if (this.currentSearchQuery) {
        this.fullDeck.forEach((card, index) => {
          const exactCardNumber = String(card.cardNumber || "").toLowerCase() === this.currentSearchQuery;
          if (exactCardNumber || String(card.searchText || "").includes(this.currentSearchQuery)) this.searchMatches.push(index);
        });
        this.searchMatchSet = new Set(this.searchMatches);
        this.setSearchActive(true);
        if (this.searchMatches.length > 0) {
          this.jumpToSearchMatch(0);
          return;
        }
      } else {
        this.setSearchActive(false);
      }

      this.buildBinder();
    }

    jumpToSearchMatch(index) {
      this.currentSearchIndex = index;
      const matchIndex = this.searchMatches[index];
      const slots = this.getSlots();
      const page = Math.floor(matchIndex / slots);
      const targetSpread = page === 0 ? 0 : Math.ceil(page / 2);

      if (this.isMobile) {
        if (this.currentPage !== page) {
          this.currentPage = page;
          this.buildBinder();
          return;
        }
      } else if (this.currentSpread !== targetSpread) {
        this.currentSpread = targetSpread;
        this.buildBinder();
        return;
      }

      this.updateSearchUI();
      this.applySearchHighlights();
    }

    applySearchHighlights() {
      this.root.querySelectorAll(".card-slot").forEach((slot) => {
        slot.classList.remove("search-match", "active-match");
        const index = parseInt(slot.dataset.cardIndex, 10);
        if (this.currentSearchQuery && this.searchMatchSet.has(index)) {
          slot.classList.add("search-match");
          if (this.searchMatches[this.currentSearchIndex] === index) slot.classList.add("active-match");
        }
      });
    }

    revealCard(cardId) {
      const targetId = String(cardId || "");
      if (!targetId) return false;

      let index = this.fullDeck.findIndex((card) => card.id === targetId);
      if (index < 0 && this.stackVariants) {
        const targetCard = this.allCards.find((card) => card.id === targetId);
        if (targetCard) index = this.fullDeck.findIndex((card) => card.cardId === targetCard.cardId);
      }
      if (index < 0) return false;

      const slots = this.getSlots();
      const page = Math.floor(index / slots);

      if (this.isMobile) {
        this.currentPage = page;
      } else {
        this.currentSpread = page === 0 ? 0 : Math.ceil(page / 2);
      }

      this.buildBinder();

      requestAnimationFrame(() => {
        const slot = this.book.querySelector(`[data-card-id="${CSS.escape(targetId)}"]`)
          || this.book.querySelector(`[data-card-index="${index}"]`);
        if (!slot) return;

        slot.classList.add("summary-target-match");
        slot.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        window.setTimeout(() => slot.classList.remove("summary-target-match"), 5200);
      });

      return true;
    }

    navigateSearch(direction) {
      if (!this.searchMatches.length) return;
      this.currentSearchIndex = (this.currentSearchIndex + direction + this.searchMatches.length) % this.searchMatches.length;
      this.jumpToSearchMatch(this.currentSearchIndex);
    }

    toggleCustomizePanel(button) {
      const panel = this.root.querySelector("[data-customize-panel]");
      if (!panel) return;
      const isOpen = !panel.classList.contains("is-collapsed");
      panel.classList.toggle("is-collapsed", isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
    }

    updateSearchUI() {
      this.searchCount.textContent = !this.currentSearchQuery
        ? "0 matches"
        : (this.searchMatches.length ? `${this.currentSearchIndex + 1} of ${this.searchMatches.length}` : "No matches");
    }

    async updateLayout(layout, element) {
      this.root.querySelectorAll(".size-btn").forEach((button) => button.classList.remove("active"));
      element.classList.add("active");
      const sizeOptions = element.closest(".size-options");
      if (sizeOptions) sizeOptions.dataset.activeLayout = layout;
      this.currentLayout = layout;
      this.currentPage = 0;
      this.currentSpread = 0;
      this.rebuildFullDeck();
      const token = ++this.pageChangeToken;
      this.lockBookHeight();
      this.book.classList.add("is-page-changing");
      await this.preloadView(this.currentPage, this.currentSpread, 650);
      if (token !== this.pageChangeToken) return;
      this.renderPreservingViewport();
    }

    onResize() {
      const mobile = window.innerWidth <= 800;
      if (mobile !== this.isMobile) {
        this.isMobile = mobile;
        this.currentPage = 0;
        this.currentSpread = 0;
        this.buildBinder();
      } else {
        this.scheduleDesktopBinderFit();
      }
    }

    onKeydown(event) {
      if (document.activeElement === this.searchInput) return;
      if (document.activeElement?.matches?.("input, textarea, select, [contenteditable='true']")) return;
      if (this.lightbox.open) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.changePage(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.changePage(1);
      }
    }

    openLightbox(id) {
      const card = this.fullDeck.find((item) => item.id === id) || this.allCards.find((item) => item.id === id);
      if (!card) return;

      if (this.lightbox.parentElement !== document.body) document.body.appendChild(this.lightbox);

      const hasLink = typeof card.link === "string" && card.link.trim();
      this.lightboxCta.hidden = !hasLink;

      if (hasLink) {
        this.lightboxCta.href = card.link;
        this.lightboxCta.querySelector("span").innerHTML = card.marketName === "eBay"
          ? "Find on eBay"
          : "View on<br>TCGPLAYER";
      } else {
        this.lightboxCta.removeAttribute("href");
      }

      const lightboxSrc = card.lightboxSrc || card.s;
      if (this.lightboxImage.src !== lightboxSrc) this.lightboxImage.src = lightboxSrc;
      this.lightboxImage.alt = card.n;
      document.body.classList.add("lightbox-open");

      if (typeof this.lightbox.showModal === "function") {
        if (!this.lightbox.open) this.lightbox.showModal();
      } else {
        this.lightbox.style.display = "flex";
      }
    }

    closeLightbox() {
      if (typeof this.lightbox.close === "function" && this.lightbox.open) {
        this.lightbox.close();
      } else {
        this.lightbox.style.display = "none";
      }
      document.body.classList.remove("lightbox-open");
    }
  }

  PC.register("[data-masterset-binder]", (root) => new Binder(root));
})();
