// Samatar Elmi — Global Site JavaScript & Accessible Navigation System

(function () {
  // --- 1. Dynamic Year in Footer ---
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  // --- 2. Canonical Accessible Navigation Disclosures ---
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");
  const dropdownItems = document.querySelectorAll("[data-nav-dropdown]");

  function closeAllDropdowns(exceptItem = null) {
    dropdownItems.forEach((item) => {
      if (item !== exceptItem) {
        item.classList.remove("is-open");
        const btn = item.querySelector("[data-nav-toggle-dropdown]");
        if (btn) btn.setAttribute("aria-expanded", "false");
        const menu = item.querySelector("[data-dropdown-menu]");
        if (menu) menu.classList.remove("is-open");
      }
    });
  }

  function toggleDropdown(item) {
    const btn = item.querySelector("[data-nav-toggle-dropdown]");
    const isOpen = item.classList.contains("is-open") || (btn && btn.getAttribute("aria-expanded") === "true");
    
    if (isOpen) {
      item.classList.remove("is-open");
      if (btn) btn.setAttribute("aria-expanded", "false");
      const menu = item.querySelector("[data-dropdown-menu]");
      if (menu) menu.classList.remove("is-open");
    } else {
      closeAllDropdowns(item);
      item.classList.add("is-open");
      if (btn) btn.setAttribute("aria-expanded", "true");
      const menu = item.querySelector("[data-dropdown-menu]");
      if (menu) menu.classList.add("is-open");
    }
  }

  // Bind dropdown disclosure buttons
  dropdownItems.forEach((item) => {
    const btn = item.querySelector("[data-nav-toggle-dropdown]");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(item);
    });

    // Keyboard support: Escape closes current dropdown and returns focus to button
    item.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        const menu = item.querySelector("[data-dropdown-menu]");
        if (menu) menu.classList.remove("is-open");
        btn.focus();
      }
    });
  });

  // Click outside to close dropdowns
  document.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target : (e.target && e.target.parentElement instanceof Element ? e.target.parentElement : null);
    if (!el || !el.closest("[data-nav-dropdown]")) {
      closeAllDropdowns();
    }
  });

  // Mobile Hamburger Toggle & Scroll Lock Management
  function closeMobileMenu() {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    closeAllDropdowns();
  }

  function openMobileMenu() {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", "true");
    navLinks.classList.add("is-open");
    document.body.classList.add("menu-open");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = navToggle.getAttribute("aria-expanded") === "true" || navLinks.classList.contains("is-open");
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close menu when a navigation link is clicked
    navLinks.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link && link.getAttribute("href")) {
        closeMobileMenu();
      }
    });

    // Global keyboard support: Escape closes mobile menu and restores focus
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) {
        closeMobileMenu();
        navToggle.focus();
      }
    });

    // Window resize handler: clean up mobile menu state when expanding to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1040 && navLinks.classList.contains("is-open")) {
        closeMobileMenu();
      }
    });
  }

  // --- 2b. Tour Cities Disclosure Responsive Sync ---
  const tourCitiesDisclosure = document.getElementById("tour-cities-disclosure");
  if (tourCitiesDisclosure) {
    function syncTourCitiesDisclosure() {
      if (window.innerWidth > 820) {
        tourCitiesDisclosure.open = true;
      }
    }
    syncTourCitiesDisclosure();
    window.addEventListener("resize", syncTourCitiesDisclosure);
  }

  // --- 3. Events Date Management & Archive Sorting ---
  const londonDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const eventDateKey = (node) => {
    const datetime = node.querySelector("time[datetime]")?.getAttribute("datetime");
    return datetime ? datetime.slice(0, 10) : "";
  };

  const eventSortKey = (node) => node.dataset.eventSort || eventDateKey(node) || "9999-12-31";
  const todayInLondon = londonDateKey();

  const upcomingBody = document.querySelector("[data-event-upcoming]");
  const earlierBody = document.querySelector("[data-event-earlier]");
  if (upcomingBody && earlierBody) {
    const rows = [...upcomingBody.querySelectorAll("tr"), ...earlierBody.querySelectorAll("tr")];
    const upcomingRows = [];
    const earlierRows = [];
    rows.forEach((row) => {
      const dateKey = eventDateKey(row);
      (dateKey && dateKey < todayInLondon ? earlierRows : upcomingRows).push(row);
    });
    upcomingRows.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
    earlierRows.sort((a, b) => eventSortKey(b).localeCompare(eventSortKey(a)));
    upcomingRows.forEach((row) => upcomingBody.append(row));
    earlierRows.forEach((row) => earlierBody.append(row));
    const upcomingGroup = document.querySelector("[data-event-upcoming-group]");
    const earlierGroup = document.querySelector("[data-event-earlier-group]");
    if (upcomingGroup) upcomingGroup.hidden = upcomingRows.length === 0;
    if (earlierGroup) earlierGroup.hidden = earlierRows.length === 0;
  }

  const homeEvents = [...document.querySelectorAll("[data-home-event]")];
  if (homeEvents.length) {
    homeEvents.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
    homeEvents.forEach((event) => event.parentElement.append(event));
    let visibleUpcoming = 0;
    homeEvents.forEach((event) => {
      const dateKey = eventDateKey(event);
      const show = (!dateKey || dateKey >= todayInLondon) && visibleUpcoming < 3;
      event.hidden = !show;
      if (show) visibleUpcoming += 1;
    });
  }

  // --- 4. Press Kit Biography Clipboard Copy ---
  document.querySelectorAll("[data-copy-bio]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const bioKey = btn.dataset.copyBio;
      const target = document.querySelector(`[data-bio-content="${bioKey}"]`);
      if (!target) return;

      const textToCopy = target.innerText.trim();
      const labelSpan = btn.querySelector(".bio-copy-btn__text") || btn;
      const originalText = labelSpan.textContent;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }

        btn.classList.add("is-copied");
        labelSpan.textContent = "Copied!";
        btn.setAttribute("aria-live", "polite");

        setTimeout(() => {
          btn.classList.remove("is-copied");
          labelSpan.textContent = originalText;
        }, 2200);
      } catch (err) {
        console.warn("Could not copy biography text:", err);
        const details = document.querySelector(".bio-disclosure-preview");
        if (details) details.open = true;
        labelSpan.textContent = "Opened below";
        setTimeout(() => {
          labelSpan.textContent = originalText;
        }, 2200);
      }
    });
  });

})();