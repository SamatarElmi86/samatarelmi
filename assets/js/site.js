const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    navLinks.classList.toggle("is-open", !open);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
    }
  });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

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
