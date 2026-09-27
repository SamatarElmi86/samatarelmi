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
      }
    });
  }

  function toggleDropdown(item) {
    const isOpen = item.classList.contains("is-open");
    closeAllDropdowns(isOpen ? null : item);
    if (!isOpen) {
      item.classList.add("is-open");
      const btn = item.querySelector("[data-nav-toggle-dropdown]");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  }

  // Bind dropdown disclosure buttons
  dropdownItems.forEach((item) => {
    const btn = item.querySelector("[data-nav-toggle-dropdown]");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(item);
    });

    // Keyboard support: Escape closes current dropdown and returns focus to button
    item.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  });

  // Click outside to close dropdowns
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-nav-dropdown]")) {
      closeAllDropdowns();
    }
  });

  // Mobile Hamburger Toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navLinks.classList.toggle("is-open", !isOpen);
      if (isOpen) {
        closeAllDropdowns();
      }
    });

    // Close menu when a standard navigation link is clicked
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        navToggle.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("is-open");
        closeAllDropdowns();
      }
    });
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