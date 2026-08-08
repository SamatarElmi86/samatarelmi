const data = window.GALLERY_DATA;
const grid = document.querySelector("[data-gallery-grid]");
const controls = document.querySelector("[data-gallery-controls]");
const loadMore = document.querySelector("[data-load-more]");
const status = document.querySelector("[data-gallery-status]");
const dialog = document.querySelector("[data-lightbox]");
const dialogMedia = document.querySelector("[data-lightbox-media]");
const dialogCaption = document.querySelector("[data-lightbox-caption]");
const pageSize = 24;
let activeCategory = "All";
let shown = pageSize;

function interleave(items) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  });
  const result = [];
  while ([...groups.values()].some((group) => group.length)) {
    for (const group of groups.values()) {
      if (group.length) result.push(group.shift());
    }
  }
  return result;
}

const ordered = interleave(data.items);

function filteredItems() {
  return activeCategory === "All" ? ordered : data.items.filter((item) => item.category === activeCategory);
}

function openLightbox(item, label) {
  dialogMedia.replaceChildren();
  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.poster = item.poster;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    dialogMedia.append(video);
  } else {
    const image = document.createElement("img");
    image.src = item.src;
    image.alt = label;
    image.width = item.width;
    image.height = item.height;
    dialogMedia.append(image);
  }
  dialogCaption.textContent = label;
  dialog.showModal();
}

function render() {
  const items = filteredItems();
  const visible = items.slice(0, shown);
  grid.replaceChildren();
  const counts = new Map();

  visible.forEach((item) => {
    const number = (counts.get(item.category) || 0) + 1;
    counts.set(item.category, number);
    const label = `${item.category} archive — ${item.type === "video" ? "film" : "image"} ${number}`;
    const figure = document.createElement("figure");
    figure.className = "gallery-item";
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Open ${label}`);

    if (item.type === "video") {
      const image = document.createElement("img");
      image.src = item.poster;
      image.alt = "";
      image.loading = "lazy";
      button.append(image);
    } else {
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = label;
      image.loading = "lazy";
      image.decoding = "async";
      image.width = item.width;
      image.height = item.height;
      button.append(image);
    }

    button.addEventListener("click", () => openLightbox(item, label));
    const caption = document.createElement("figcaption");
    caption.textContent = `${item.category}${item.type === "video" ? " · Film" : ""}`;
    figure.append(button, caption);
    grid.append(figure);
  });

  status.textContent = `Showing ${visible.length} of ${items.length} items${activeCategory === "All" ? "" : ` in ${activeCategory}`}.`;
  loadMore.hidden = visible.length >= items.length;
}

controls?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  shown = pageSize;
  controls.querySelectorAll("button").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
  render();
});

loadMore?.addEventListener("click", () => {
  shown += pageSize;
  render();
});

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog || event.target.closest("[data-lightbox-close]")) dialog.close();
});

dialog?.addEventListener("close", () => {
  const video = dialogMedia.querySelector("video");
  if (video) video.pause();
});

if (data && grid) render();
