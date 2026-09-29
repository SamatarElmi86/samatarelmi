(function () {
  const data = window.GALLERY_DATA;
  if (!data) return;

  const container = document.querySelector("[data-gallery-container]");
  if (!container) return;

  // Cache elements
  const doorsSection = document.getElementById("gallery-doors-view");
  const carouselSection = document.getElementById("gallery-carousel-view");
  const doorsGrid = document.getElementById("doors-grid");

  // Carousel elements
  const backToDoorsBtn = document.getElementById("carousel-back-btn");
  const carouselCatTitle = document.getElementById("carousel-category-title");
  const carouselCounter = document.getElementById("carousel-counter");
  const carouselCatTabs = document.getElementById("carousel-category-tabs");
  const carouselStage = document.getElementById("carousel-stage-media");
  const carouselCaption = document.getElementById("carousel-caption");
  const carouselPrevBtn = document.getElementById("carousel-prev-btn");
  const carouselNextBtn = document.getElementById("carousel-next-btn");
  const thumbnailStrip = document.getElementById("carousel-thumbnail-strip");

  // Lightbox elements
  const dialog = document.querySelector("[data-lightbox]");
  const dialogMedia = document.querySelector("[data-lightbox-media]");
  const dialogCaption = document.querySelector("[data-lightbox-caption]");

  // State
  let activeCategoryId = null;
  let activeCategoryItems = [];
  let currentIndex = 0;

  // Build Category Items Map
  const categoryItemsMap = new Map();
  data.categories.forEach((cat) => {
    categoryItemsMap.set(cat.id, []);
  });
  data.items.forEach((item) => {
    if (categoryItemsMap.has(item.category)) {
      categoryItemsMap.get(item.category).push(item);
    }
  });

  // Render Category Doors
  function renderDoors() {
    if (!doorsGrid) return;
    doorsGrid.innerHTML = "";

    data.categories.forEach((cat) => {
      const items = categoryItemsMap.get(cat.id) || [];
      const count = items.length;

      const card = document.createElement("article");
      card.className = "door-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Enter ${cat.title} collection, ${cat.countLabel}`);

      card.innerHTML = `
        <div class="door-media">
          <img src="${cat.cover}" alt="${cat.title} collection preview" loading="lazy" decoding="async">
          <div class="door-scrim"></div>
        </div>
        <div class="door-body">
          <div class="door-header">
            <span class="door-pill">${cat.countLabel}</span>
          </div>
          <h2 class="door-title">${cat.title}</h2>
          <p class="door-desc">${cat.description}</p>
          <div class="door-cta">
            <span>Enter collection</span>
            <span class="door-arrow" aria-hidden="true">→</span>
          </div>
        </div>
      `;

      function enter() {
        openCategory(cat.id, 0);
      }

      card.addEventListener("click", enter);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enter();
        }
      });

      doorsGrid.appendChild(card);
    });
  }

  // Render Carousel Category Quick Switch Tabs
  function renderCategoryTabs() {
    if (!carouselCatTabs) return;
    carouselCatTabs.innerHTML = "";

    data.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "carousel-tab-btn" + (cat.id === activeCategoryId ? " is-active" : "");
      btn.textContent = `${cat.title} (${categoryItemsMap.get(cat.id)?.length || 0})`;
      btn.setAttribute("aria-pressed", cat.id === activeCategoryId ? "true" : "false");
      btn.addEventListener("click", () => {
        openCategory(cat.id, 0);
      });
      carouselCatTabs.appendChild(btn);
    });
  }

  // Open Carousel for a specific Category
  function openCategory(catId, index = 0) {
    const cat = data.categories.find((c) => c.id === catId);
    if (!cat) return;

    activeCategoryId = catId;
    activeCategoryItems = categoryItemsMap.get(catId) || [];
    currentIndex = Math.max(0, Math.min(index, activeCategoryItems.length - 1));

    // Show carousel, hide doors
    doorsSection.hidden = true;
    carouselSection.hidden = false;

    // Update Header
    if (carouselCatTitle) carouselCatTitle.textContent = `${cat.title} Collection`;
    renderCategoryTabs();
    renderSlide();
    renderThumbnails();

    // Scroll to top of carousel smoothly
    carouselSection.scrollIntoView({ behavior: "smooth", block: "start" });

    // Update URL hash
    updateHash();
  }

  // Back to Doors
  function showDoors() {
    activeCategoryId = null;
    carouselSection.hidden = true;
    doorsSection.hidden = false;
    history.replaceState(null, "", window.location.pathname + window.location.search);
    doorsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Update Current Slide
  function renderSlide() {
    if (!activeCategoryItems.length) return;
    const item = activeCategoryItems[currentIndex];
    const total = activeCategoryItems.length;

    // Counter
    if (carouselCounter) {
      carouselCounter.textContent = `${currentIndex + 1} of ${total}`;
    }

    // Prev / Next button states
    if (carouselPrevBtn) {
      carouselPrevBtn.setAttribute("aria-label", `Previous item (now at ${currentIndex + 1} of ${total})`);
    }
    if (carouselNextBtn) {
      carouselNextBtn.setAttribute("aria-label", `Next item (now at ${currentIndex + 1} of ${total})`);
    }

    // Stage Media
    carouselStage.innerHTML = "";

    if (item.type === "youtube") {
      const wrap = document.createElement("div");
      wrap.className = "carousel-youtube-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?rel=0&autoplay=0`;
      iframe.title = item.title || "YouTube video player";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      wrap.appendChild(iframe);
      carouselStage.appendChild(wrap);
    } else if (item.type === "video") {
      const wrap = document.createElement("div");
      wrap.className = "carousel-video-wrap";
      const video = document.createElement("video");
      video.src = item.src;
      video.poster = item.poster || "";
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      wrap.appendChild(video);
      carouselStage.appendChild(wrap);
    } else {
      // Image
      const imgWrap = document.createElement("div");
      imgWrap.className = "carousel-image-wrap";
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = `${item.category} archive image ${currentIndex + 1}`;
      img.loading = "eager";
      img.decoding = "async";
      img.title = "Click to enlarge in full-screen lightbox";
      img.addEventListener("click", () => openLightbox(item));
      imgWrap.appendChild(img);

      const zoomHint = document.createElement("button");
      zoomHint.type = "button";
      zoomHint.className = "carousel-zoom-hint";
      zoomHint.setAttribute("aria-label", "Open image in high-resolution lightbox");
      zoomHint.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg> Fullscreen`;
      zoomHint.addEventListener("click", () => openLightbox(item));
      imgWrap.appendChild(zoomHint);

      carouselStage.appendChild(imgWrap);
    }

    // Caption & info
    let captionHtml = "";
    if (item.title) {
      captionHtml += `<strong class="carousel-caption-title">${item.title}</strong>`;
    }
    if (item.subtitle) {
      captionHtml += `<span class="carousel-caption-sub">${item.subtitle}</span>`;
    }
    if (item.credit) {
      captionHtml += `<span class="carousel-caption-credit">Credit: ${item.credit}</span>`;
    }
    if (!item.title && !item.subtitle && !item.credit) {
      captionHtml += `<span class="carousel-caption-sub">${item.category} collection · Item ${currentIndex + 1} of ${total}</span>`;
    }

    if (item.type === "youtube") {
      captionHtml += `<a class="carousel-external-link" href="https://www.youtube.com/watch?v=${item.youtubeId}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>`;
    }

    carouselCaption.innerHTML = captionHtml;

    // Highlight Thumbnail
    highlightActiveThumbnail();
  }

  // Render Horizontal Thumbnail Filmstrip
  function renderThumbnails() {
    if (!thumbnailStrip) return;
    thumbnailStrip.innerHTML = "";

    activeCategoryItems.forEach((item, idx) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "carousel-thumb" + (idx === currentIndex ? " is-active" : "");
      thumb.setAttribute("aria-label", `Slide ${idx + 1}: ${item.title || item.category}`);
      thumb.dataset.index = idx;

      const thumbImg = document.createElement("img");
      thumbImg.src = item.thumbnail || item.poster || item.src;
      thumbImg.alt = "";
      thumbImg.loading = "lazy";
      thumb.appendChild(thumbImg);

      if (item.type === "youtube" || item.type === "video") {
        const badge = document.createElement("span");
        badge.className = "carousel-thumb-play";
        badge.innerHTML = "▶";
        thumb.appendChild(badge);
      }

      thumb.addEventListener("click", () => {
        currentIndex = idx;
        renderSlide();
        updateHash();
      });

      thumbnailStrip.appendChild(thumb);
    });

    highlightActiveThumbnail();
  }

  function highlightActiveThumbnail() {
    if (!thumbnailStrip) return;
    const thumbs = thumbnailStrip.querySelectorAll(".carousel-thumb");
    thumbs.forEach((th, idx) => {
      if (idx === currentIndex) {
        th.classList.add("is-active");
        th.setAttribute("aria-current", "true");
        // Scroll thumbnail into view
        th.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } else {
        th.classList.remove("is-active");
        th.removeAttribute("aria-current");
      }
    });
  }

  // Navigation handlers
  function goPrev() {
    if (!activeCategoryItems.length) return;
    currentIndex = (currentIndex - 1 + activeCategoryItems.length) % activeCategoryItems.length;
    renderSlide();
    updateHash();
  }

  function goNext() {
    if (!activeCategoryItems.length) return;
    currentIndex = (currentIndex + 1) % activeCategoryItems.length;
    renderSlide();
    updateHash();
  }

  if (carouselPrevBtn) carouselPrevBtn.addEventListener("click", goPrev);
  if (carouselNextBtn) carouselNextBtn.addEventListener("click", goNext);
  if (backToDoorsBtn) backToDoorsBtn.addEventListener("click", showDoors);

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (carouselSection && !carouselSection.hidden) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        if (dialog && dialog.open) {
          dialog.close(); document.body.classList.remove("modal-open");
        } else {
          showDoors();
        }
      }
    }
  });

  // Touch Swipe on Carousel Stage
  let touchStartX = 0;
  let touchEndX = 0;
  if (carouselStage) {
    carouselStage.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselStage.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const threshold = 40;
    if (touchEndX < touchStartX - threshold) {
      goNext();
    } else if (touchEndX > touchStartX + threshold) {
      goPrev();
    }
  }

  // Lightbox Modal
  function openLightbox(item) {
    if (!dialog) return;
    dialogMedia.replaceChildren();

    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title || `${item.category} archive image`;
    dialogMedia.appendChild(img);

    dialogCaption.textContent = item.credit
      ? `${item.title || item.category} · Photograph: ${item.credit}`
      : (item.title || item.category);

    dialog.showModal(); document.body.classList.add("modal-open");
  }

  if (dialog) {
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.closest("[data-lightbox-close]")) {
        dialog.close();
      }
    });
  }

  // URL Hash Syncing
  function updateHash() {
    if (activeCategoryId) {
      const slug = activeCategoryId.toLowerCase().replace(/\s+/g, "-");
      history.replaceState(null, "", `#${slug}/${currentIndex + 1}`);
    }
  }

  function checkHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      showDoors();
      return;
    }

    const parts = hash.split("/");
    const slug = parts[0];
    const slideNum = parseInt(parts[1], 10) || 1;

    const matchedCat = data.categories.find(
      (c) => c.id.toLowerCase().replace(/\s+/g, "-") === slug || c.id.toLowerCase() === slug
    );

    if (matchedCat) {
      openCategory(matchedCat.id, Math.max(0, slideNum - 1));
    } else {
      showDoors();
    }
  }

  // Initialize
  renderDoors();
  window.addEventListener("hashchange", checkHash);
  checkHash();
})();
