(function () {
  "use strict";

  const PC = window.PokeCottageMastersets;
  if (!PC) throw new Error("masterset-core.js must load first");

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

      const raw = String(card?.cardNumber || "").trim();
      const total = Number(card?.set?.printedTotal || card?.printedTotal || 0);
      const explicit = String(card?.displayCardNumber || "").trim();
      const explicitFraction = explicit.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (explicitFraction) {
        return `${String(Number(explicitFraction[1])).padStart(3, "0")}/${String(Number(explicitFraction[2])).padStart(3, "0")}`;
      }
      if (/^\d+$/.test(explicit) && total > 0) return `${String(Number(explicit)).padStart(3, "0")}/${String(total).padStart(3, "0")}`;
      if (explicit) return explicit;
      const rawFraction = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (rawFraction) {
        return `${String(Number(rawFraction[1])).padStart(3, "0")}/${String(Number(rawFraction[2])).padStart(3, "0")}`;
      }
      if (/^\d+$/.test(raw) && total > 0) return `${String(Number(raw)).padStart(3, "0")}/${String(total).padStart(3, "0")}`;
      return raw;
    };
  }

  const REGIONS = ["International", "Japan", "China"];
  const PAGE_SIZE = 50;
  const INITIAL_ROWS = 150;
  const MOBILE_BREAKPOINT = 640;
  const AFFILIATE = {
    memberID: "6278691",
    campaignID: "1780961",
    actionID: "21018",
  };
  class MastersetTable {
    constructor(root) {
      this.root = root;
      this.cards = [];
      this.filteredData = [];
      this.priceByCardId = new Map();
      this.selectedRegions = new Set(REGIONS);
      this.visibleCount = INITIAL_ROWS;
      this.sortKey = "";
      this.sortDirection = "asc";
      this.activeSearchValue = "";
      this.scrollTicking = false;

      this.draw();
      this.cacheElements();
      this.bind();
      this.load();
    }

    draw() {
      this.root.innerHTML = `
        <div id="stickyControls">
          <div class="search-container">
            <div class="search-wrapper">
              <span class="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
                  <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                </svg>
              </span>
              <input type="search" id="tableSearch" placeholder="Search cards..." aria-label="Search cards" autocomplete="off">
              <button type="button" id="clearSearchBtn" aria-label="Clear search">&times;</button>
            </div>
            <div class="filter-wrapper">
              <button type="button" class="search-action-btn" id="filterToggle" aria-label="Filter table" aria-expanded="false" aria-controls="filterPanel">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path d="M4 6H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  <path d="M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                </svg>
              </button>
              <div id="filterPanel" class="filter-panel" role="menu">
                ${this.regionButtons()}
              </div>
            </div>
          </div>
        </div>

        <div id="mobileFilterFab">
          <button type="button" id="mobileFilterToggle" aria-label="Filter table" aria-expanded="false" aria-controls="mobileFilterPanel">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="M4 6H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <path d="M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>
          <div id="mobileFilterPanel" class="filter-panel" role="menu">
            ${this.regionButtons()}
          </div>
        </div>

        <div id="mobileSearchFab">
          <div id="mobileSearchToggle">
            <button type="button" class="mobile-search-icon" id="mobileSearchOpen" aria-label="Open search">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
                <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
              </svg>
            </button>
            <input type="search" id="mobileTableSearch" placeholder="Search cards..." aria-label="Search cards" autocomplete="off">
            <button type="button" id="mobileClearSearchBtn" aria-label="Clear search">&times;</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="master-set-table">
            <thead>
              <tr>
                <th scope="col" class="image-column" aria-label="Card image"></th>
                <th scope="col">Name</th>
                <th scope="col">Number</th>
                <th scope="col">Set</th>
                <th scope="col">Variant</th>
                <th scope="col" class="master-set-language-heading">Language</th>
                <th scope="col" class="master-set-price-heading">Price</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
            <tbody id="emptyState" style="display:none;">
              <tr><td colspan="7" class="empty-message">No matches found.</td></tr>
            </tbody>
          </table>
        </div>
        <div id="loadMoreTrigger" style="height: 20px;" aria-hidden="true"></div>`;
    }

    regionButtons() {
      return REGIONS.map((region) => `<button type="button" data-region="${PC.escapeHtml(region)}" role="menuitemcheckbox" aria-checked="true"><span aria-hidden="true">✓</span> ${this.languageName(region)}</button>`).join("");
    }

    cacheElements() {
      this.els = {
        searchInput: this.root.querySelector("#tableSearch"),
        clearSearchBtn: this.root.querySelector("#clearSearchBtn"),
        mobileFab: this.root.querySelector("#mobileSearchFab"),
        mobileToggle: this.root.querySelector("#mobileSearchToggle"),
        mobileOpenBtn: this.root.querySelector("#mobileSearchOpen"),
        mobileInput: this.root.querySelector("#mobileTableSearch"),
        mobileClear: this.root.querySelector("#mobileClearSearchBtn"),
        mobileFilterFab: this.root.querySelector("#mobileFilterFab"),
        mobileFilterToggle: this.root.querySelector("#mobileFilterToggle"),
        mobileFilterPanel: this.root.querySelector("#mobileFilterPanel"),
        filterPanel: this.root.querySelector("#filterPanel"),
        filterToggle: this.root.querySelector("#filterToggle"),
        tableWrapper: this.root.querySelector(".table-wrapper"),
        tableBody: this.root.querySelector("#tableBody"),
        emptyState: this.root.querySelector("#emptyState"),
        emptyMessage: this.root.querySelector("#emptyState .empty-message"),
        loadMoreTrigger: this.root.querySelector("#loadMoreTrigger"),
        resetSortBtn: this.root.querySelector("[data-reset-sort]"),
      };
    }

    bind() {
      const els = this.els;

      els.searchInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.setInputValue(els.searchInput.value);
        this.applySearch(els.searchInput.value);
        requestAnimationFrame(() => {
          els.searchInput.blur();
          this.scrollToTablePosition();
        });
      });

      els.searchInput.addEventListener("input", () => {
        els.mobileInput.value = els.searchInput.value;
        this.updateSearchUi();
      });

      els.clearSearchBtn.addEventListener("click", () => {
        this.setInputValue("");
        this.applySearch("");
        requestAnimationFrame(() => els.searchInput.blur());
      });

      const openMobileSearch = () => {
        els.mobileFab.classList.add("active");
        setTimeout(() => els.mobileInput.focus(), 50);
      };

      els.mobileOpenBtn.addEventListener("click", openMobileSearch);
      els.mobileToggle.addEventListener("click", (event) => {
        if (event.target === els.mobileInput || event.target === els.mobileClear) return;
        openMobileSearch();
      });
      els.mobileInput.addEventListener("click", (event) => event.stopPropagation());
      els.mobileInput.addEventListener("input", () => {
        els.searchInput.value = els.mobileInput.value;
        this.updateSearchUi();
      });
      els.mobileInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.setInputValue(els.mobileInput.value);
        this.applySearch(els.mobileInput.value);
        requestAnimationFrame(() => {
          els.mobileInput.blur();
          els.mobileFab.classList.add("active");
          this.scrollToTablePosition();
        });
      });
      els.mobileClear.addEventListener("click", (event) => {
        event.stopPropagation();
        this.setInputValue("");
        this.applySearch("");
        els.mobileFab.classList.remove("active");
        requestAnimationFrame(() => els.mobileInput.blur());
      });

      els.filterToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !els.filterPanel.classList.contains("open");
        this.closeAllPanels();
        this.setPanelOpen(els.filterPanel, els.filterToggle, willOpen);
      });
      els.mobileFilterToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !els.mobileFilterPanel.classList.contains("open");
        this.closeAllPanels();
        this.setPanelOpen(els.mobileFilterPanel, els.mobileFilterToggle, willOpen);
      });

      this.root.querySelectorAll(".filter-panel").forEach((panel) => panel.addEventListener("click", (event) => event.stopPropagation()));
      this.root.querySelectorAll(".filter-panel button[data-region]").forEach((button) => {
        button.addEventListener("click", () => {
          const region = button.getAttribute("data-region");
          if (this.selectedRegions.has(region)) {
            if (this.selectedRegions.size === 1) return;
            this.selectedRegions.delete(region);
          } else {
            this.selectedRegions.add(region);
          }
          this.applySearch();
        });
      });

      document.addEventListener("click", (event) => {
        if (this.isMobile() && !els.mobileFab.contains(event.target) && !this.hasActiveSearch()) {
          els.mobileFab.classList.remove("active");
        }
        if (!els.filterPanel.contains(event.target) && !els.filterToggle.contains(event.target)) {
          this.setPanelOpen(els.filterPanel, els.filterToggle, false);
        }
        if (!els.mobileFilterPanel.contains(event.target) && !els.mobileFilterToggle.contains(event.target)) {
          this.setPanelOpen(els.mobileFilterPanel, els.mobileFilterToggle, false);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.closeAllPanels();
      });

      window.addEventListener("scroll", () => {
        if (this.scrollTicking) return;
        this.scrollTicking = true;
        requestAnimationFrame(() => {
          this.handleMobileFabVisibility();
          this.scrollTicking = false;
        });
      }, { passive: true });

      window.addEventListener("resize", () => this.handleMobileFabVisibility());

      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) this.maybeLoadMore();
      }, { root: null, rootMargin: "200px" });
      this.observer.observe(els.loadMoreTrigger);
    }

    async load() {
      try {
        const loaded = await PC.loadData(this.root);
        this.dataUrl = loaded.dataUrl;
        this.cards = PC.sortCards((loaded.data.cards || []).filter((card) => card && card.cardNumber && card.name));
        await this.loadPrices();
        this.filteredData = this.cards.slice();
        this.sortFilteredData();
        this.renderTable(false);
        this.updateSortButtons();
        this.updateFilterButtons();
        this.handleMobileFabVisibility();
      } catch (error) {
        this.els.emptyState.style.display = "table-row-group";
        this.els.emptyMessage.textContent = error.message;
      }
    }

    isMobile() {
      return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    hasActiveSearch() {
      return this.activeSearchValue.trim() !== "";
    }

    hasActiveFilter() {
      return this.selectedRegions.size !== REGIONS.length;
    }

    languageName(region) {
      return region === "Japan" ? "Japanese" : region === "China" ? "Chinese" : "English";
    }

    languageCode(region) {
      return region === "Japan" ? "JP" : region === "China" ? "CN" : "EN";
    }

    formatReleaseDate(value) {
      const [year, month] = String(value || "").split("-");
      if (!year || !month) return "";

      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      if (Number.isNaN(date.getTime())) return String(value || "");

      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    }

    makeTcgAffiliateLink(rawLink) {
      if (!rawLink) return "#";
      let productLink = rawLink;
      try {
        const parsed = new URL(rawLink);
        if (parsed.hostname === "partner.tcgplayer.com") productLink = parsed.searchParams.get("u") || rawLink;
      } catch {
        productLink = rawLink;
      }
      const match = productLink.match(/tcgplayer\.com(\/product\/[^?#]+)/i);
      if (!match) return productLink;
      const destination = new URL("https://www.tcgplayer.com" + match[1]);
      destination.searchParams.set("utm_source", "impact");
      destination.searchParams.set("utm_medium", "affiliate");
      destination.searchParams.set("utm_campaign", "poke cottage");
      const cleanProductLink = destination.toString();
      return `https://partner.tcgplayer.com/c/${AFFILIATE.memberID}/${AFFILIATE.campaignID}/${AFFILIATE.actionID}?u=${encodeURIComponent(cleanProductLink)}`;
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

    makeEbayAffiliateLink(card) {
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

    makeMarketLink(card) {
      return card.tcgplayerUrl ? this.makeTcgAffiliateLink(card.tcgplayerUrl) : this.makeEbayAffiliateLink(card);
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
        const pricedCards = await pricing.priceCards(this.cards);
        this.priceByCardId = new Map(pricedCards.map(({ card, price }) => [card.id, price]));
        this.cards = this.cards.map((card) => ({
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

    imageForCard(card) {
      return PC.cardImageUrl(card, this.dataUrl, "thumbnail") || PC.imageUrl(card, this.dataUrl);
    }

    fallbackImageForCard(card) {
      return PC.resolveAsset ? PC.resolveAsset(card.originalImageUrl || card.imageUrl, this.dataUrl) : (card.originalImageUrl || card.imageUrl || "");
    }

    sortValue(card, key) {
      switch (key) {
        case "name":
          return card.name || "";
        case "number":
          return PC.displayCardNumber(card) || card.cardNumber || "";
        case "set":
          return card.set?.name || card.source || "";
        case "variant":
          return PC.displayVariant(card) || "";
        case "language":
          return this.languageCode(card.region);
        case "price":
          return Number(card.marketPrice || 0);
        default:
          return "";
      }
    }

    compareCards(a, b, key) {
      const av = this.sortValue(a, key);
      const bv = this.sortValue(b, key);
      if (key === "price") return av - bv;
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    sortFilteredData() {
      if (!this.sortKey) return;
      const direction = this.sortDirection === "desc" ? -1 : 1;
      this.filteredData = this.filteredData
        .slice()
        .sort((a, b) => direction * this.compareCards(a, b, this.sortKey));
    }

    setSort(key) {
      if (!key) return;
      if (this.sortKey === key) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortDirection = key === "price" ? "desc" : "asc";
      }
      this.sortFilteredData();
      this.visibleCount = INITIAL_ROWS;
      this.renderTable(false);
      this.updateSortButtons();
    }

    resetSort() {
      if (!this.sortKey) return;
      this.sortKey = "";
      this.sortDirection = "asc";
      this.applySearch();
    }

    updateSortButtons() {
      return;
    }

    buildRow(card) {
      const row = document.createElement("tr");
      row.classList.add(`master-set-row--${this.languageCode(card.region).toLowerCase()}`);

      const image = document.createElement("td");
      image.className = "master-set-card-image-cell";
      const imageWrap = document.createElement(card.tcgplayerUrl ? "a" : "span");
      imageWrap.className = "master-set-card-art";
      if (card.tcgplayerUrl) {
        imageWrap.href = this.makeTcgAffiliateLink(card.tcgplayerUrl);
        imageWrap.target = "_blank";
        imageWrap.rel = "noopener sponsored";
        imageWrap.setAttribute("aria-label", `${card.name || "Card"} on TCGPlayer`);
      }
      const imageEl = document.createElement("img");
      imageEl.src = this.imageForCard(card);
      imageEl.dataset.fallbackSrc = this.fallbackImageForCard(card);
      imageEl.addEventListener("error", () => {
        if (!imageEl.dataset.fallbackSrc || imageEl.src === imageEl.dataset.fallbackSrc) return;
        imageEl.src = imageEl.dataset.fallbackSrc;
        imageEl.dataset.fallbackSrc = "";
      });
      imageEl.alt = "";
      imageEl.loading = "lazy";
      imageEl.decoding = "async";
      imageWrap.appendChild(imageEl);
      image.appendChild(imageWrap);

      const name = document.createElement("td");
      name.className = "master-set-card-name";
      const label = document.createElement(card.tcgplayerUrl ? "a" : "span");
      label.textContent = card.name || "";
      if (card.tcgplayerUrl) {
        label.href = this.makeTcgAffiliateLink(card.tcgplayerUrl);
        label.target = "_blank";
        label.rel = "noopener sponsored";
      }
      name.appendChild(label);

      const number = document.createElement("td");
      number.textContent = PC.displayCardNumber(card);

      const set = document.createElement("td");
      set.textContent = card.set?.name || card.source || "";
      const variant = document.createElement("td");
      variant.textContent = PC.displayVariant(card);
      const language = document.createElement("td");
      const languageCode = this.languageCode(card.region);
      language.innerHTML = `<span class="language-pill language-pill--${PC.escapeHtml(languageCode.toLowerCase())}">${PC.escapeHtml(languageCode)}</span>`;
      const marketPrice = document.createElement("td");
      marketPrice.className = "master-set-market-price";
      marketPrice.setAttribute("data-nosnippet", "");
      const priceText = this.formatPrice(card);
      if (priceText && card.tcgplayerUrl) {
        const priceLink = document.createElement("a");
        priceLink.textContent = priceText;
        priceLink.href = this.makeTcgAffiliateLink(card.tcgplayerUrl);
        priceLink.target = "_blank";
        priceLink.rel = "noopener sponsored";
        marketPrice.appendChild(priceLink);
      } else {
        const ebayLink = document.createElement("a");
        ebayLink.innerHTML = "Find on<br>eBay";
        ebayLink.href = this.makeEbayAffiliateLink(card);
        ebayLink.target = "_blank";
        ebayLink.rel = "noopener sponsored";
        marketPrice.appendChild(ebayLink);
      }

      row.append(image, name, number, set, variant, language, marketPrice);
      return row;
    }

    renderTable(append) {
      const fragment = document.createDocumentFragment();
      const start = append ? Math.max(this.visibleCount - PAGE_SIZE, 0) : 0;
      this.filteredData.slice(start, this.visibleCount).forEach((card) => fragment.appendChild(this.buildRow(card)));
      if (!append) this.els.tableBody.replaceChildren();
      this.els.tableBody.appendChild(fragment);
      requestAnimationFrame(() => this.maybeLoadMore());
    }

    triggerInView() {
      const rect = this.els.loadMoreTrigger.getBoundingClientRect();
      return rect.top < window.innerHeight + 200 && rect.bottom > -200;
    }

    maybeLoadMore() {
      if (this.visibleCount >= this.filteredData.length) return;
      if (!this.triggerInView()) return;
      this.visibleCount += PAGE_SIZE;
      this.renderTable(true);
    }

    matchesCurrentFilter(card) {
      return this.selectedRegions.has(card.region);
    }

    applySearch(searchValue) {
      const raw = searchValue !== undefined ? searchValue : this.els.searchInput.value;
      const search = raw.trim().toLowerCase();
      this.activeSearchValue = search;
      this.filteredData = this.cards.filter((card) => {
        const artistName = typeof card.artist === "string" ? card.artist : (card.artist?.name || "");
        const displayVariant = PC.displayVariant(card);
        const haystack = [
          card.cardNumber,
          PC.displayCardNumber(card),
          card.name,
          card.variant,
          displayVariant,
          card.region,
          this.languageName(card.region),
          this.languageCode(card.region),
          card.source,
          card.set?.name,
          card.set?.series,
          card.releaseDate,
          artistName,
          card.searchText,
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(search) && this.matchesCurrentFilter(card);
      });
      this.sortFilteredData();
      this.visibleCount = INITIAL_ROWS;
      this.renderTable(false);
      this.updateSortButtons();
      if (this.filteredData.length === 0) {
        this.els.emptyState.style.display = "table-row-group";
        this.els.emptyMessage.textContent = search ? `No matches found for "${raw.trim()}"` : "No matches found.";
      } else {
        this.els.emptyState.style.display = "none";
      }
      this.updateSearchUi();
      this.updateFilterButtons();
      this.handleMobileFabVisibility();
    }

    setInputValue(value) {
      this.els.searchInput.value = value;
      this.els.mobileInput.value = value;
      this.updateSearchUi();
    }

    updateSearchUi() {
      const hasValue = this.els.searchInput.value.trim() !== "";
      this.els.clearSearchBtn.style.display = hasValue ? "flex" : "none";
      this.els.mobileClear.classList.toggle("has-value", hasValue);
      this.els.mobileClear.style.display = hasValue && this.isMobile() ? "flex" : "none";
    }

    updateFilterButtons() {
      this.root.querySelectorAll(".filter-panel button[data-region]").forEach((button) => {
        const selected = this.selectedRegions.has(button.getAttribute("data-region"));
        button.classList.toggle("active", selected);
        button.setAttribute("aria-checked", String(selected));
      });
      this.els.filterToggle.classList.toggle("active", this.hasActiveFilter());
      this.els.mobileFilterToggle.classList.toggle("active", this.hasActiveFilter());
    }

    setPanelOpen(panel, toggleButton, open) {
      panel.classList.toggle("open", open);
      toggleButton.setAttribute("aria-expanded", String(open));
    }

    closeAllPanels() {
      this.setPanelOpen(this.els.filterPanel, this.els.filterToggle, false);
      this.setPanelOpen(this.els.mobileFilterPanel, this.els.mobileFilterToggle, false);
    }

    scrollToTablePosition() {
      const y = this.els.tableWrapper.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top: Math.max(y, 0), behavior: "smooth" });
    }

    handleMobileFabVisibility() {
      if (!this.isMobile()) {
        this.els.mobileFab.classList.remove("visible", "active");
        this.els.mobileFilterFab.classList.remove("visible");
        this.setPanelOpen(this.els.mobileFilterPanel, this.els.mobileFilterToggle, false);
        return;
      }
      if (this.hasActiveSearch() || this.hasActiveFilter()) {
        this.els.mobileFab.classList.add("visible");
        this.els.mobileFilterFab.classList.add("visible");
        if (this.hasActiveSearch()) this.els.mobileFab.classList.add("active");
        return;
      }
      const rect = this.els.tableWrapper.getBoundingClientRect();
      const tableVisible = rect.top < window.innerHeight && rect.bottom > 120;
      this.els.mobileFab.classList.toggle("visible", tableVisible);
      this.els.mobileFilterFab.classList.toggle("visible", tableVisible);
      if (!tableVisible) {
        this.els.mobileFab.classList.remove("active");
        this.setPanelOpen(this.els.mobileFilterPanel, this.els.mobileFilterToggle, false);
      }
    }

  }

  PC.register("[data-masterset-table]", (root) => new MastersetTable(root));
})();
