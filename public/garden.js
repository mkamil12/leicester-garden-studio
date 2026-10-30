"use strict";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((element) => observer.observe(element));
}
const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
let menuOpen = false;
let menuBusy = false;
const menuClose = mobileNav.querySelector("[data-menu-close]");
const backgroundNodes = [...document.body.children].filter(
  (node) => node !== mobileNav && node.tagName !== "SCRIPT",
);
const previousInert = new Map();
function lockBackground(locked) {
  backgroundNodes.forEach((node) => {
    if (locked) {
      previousInert.set(node, node.inert);
      node.inert = true;
    } else {
      node.inert = previousInert.get(node) || false;
    }
  });
  document.body.classList.toggle("menu-open", locked);
}
async function closeMenu(restoreFocus = true) {
  if (!menuOpen || menuBusy) return;
  menuBusy = true;
  if (!reducedMotion.matches) {
    await mobileNav
      .animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-14px)" },
        ],
        { duration: 280, easing: "cubic-bezier(.4,0,.2,1)" },
      )
      .finished.catch(() => {});
  }
  mobileNav.hidden = true;
  menuOpen = false;
  menuBusy = false;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open navigation");
  lockBackground(false);
  if (restoreFocus) toggle.focus({ preventScroll: true });
}
function openMenu() {
  if (menuOpen || menuBusy) return;
  menuOpen = true;
  mobileNav.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Close navigation");
  lockBackground(true);
  menuClose.focus({ preventScroll: true });
  if (!reducedMotion.matches) {
    mobileNav.animate(
      [
        { opacity: 0, clipPath: "inset(0 0 100% 0)" },
        { opacity: 1, clipPath: "inset(0 0 0% 0)" },
      ],
      { duration: 650, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    mobileNav.querySelectorAll(".menu-main nav a").forEach((link, index) =>
      link.animate(
        [
          { opacity: 0, transform: "translateY(20px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 560,
          delay: 100 + index * 55,
          fill: "backwards",
          easing: "cubic-bezier(.22,1,.36,1)",
        },
      ),
    );
  }
}
toggle.addEventListener("click", openMenu);
menuClose.addEventListener("click", () => closeMenu());
mobileNav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", async (event) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    await closeMenu(false);
    window.location.assign(link.href);
  }),
);
document.addEventListener("keydown", (event) => {
  if (!menuOpen) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
  }
  if (event.key === "Tab") {
    const items = [
      ...mobileNav.querySelectorAll("a[href],button:not([disabled])"),
    ];
    const first = items[0],
      last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
const triggers = [...document.querySelectorAll(".service-trigger")];
triggers.forEach((button) =>
  button.addEventListener("click", () => {
    const wasOpen = button.getAttribute("aria-expanded") === "true";
    triggers.forEach((trigger) => {
      const active = trigger === button && !wasOpen;
      trigger.setAttribute("aria-expanded", String(active));
      document.getElementById(trigger.getAttribute("aria-controls")).hidden =
        !active;
      trigger.querySelector(".plus").textContent = active ? "−" : "+";
    });
    if (!wasOpen) {
      const image = document.getElementById("service-image");
      image.src =
        button.dataset.image === "hero"
          ? "/assets/mma/garden-after.jpg"
          : "/assets/mma/tidy-after.jpg";
      document.getElementById("service-image-label").textContent =
        button.dataset.image === "hero"
          ? "SPACE TO GROW. ROOM TO BREATHE."
          : "THE DETAILS MAKE THE DIFFERENCE.";
    }
  }),
);
let ticking = false;
function updateParallax() {
  if (reducedMotion.matches) return;
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const position = hero.getBoundingClientRect();
  if (position.bottom > 0 && position.top < innerHeight) {
    const shift = Math.min(90, Math.max(0, -position.top * 0.15));
    document.querySelector(".hero-image img").style.transform =
      `translateY(${shift}px) scale(1.06)`;
  }
}
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true },
);
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    document.documentElement.classList.remove("motion");
    const image = document.querySelector(".hero-image img");
    if (image) image.style.transform = "";
  }
});
const contact = window.STUDIO_CONTACT || {};
if (contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
  const box = document.getElementById("studio-contact");
  const label = document.createElement("span");
  label.className = "section-index";
  label.textContent = "DISCUSS THE WEBSITE CONCEPT";
  const email = document.createElement("a");
  email.className = "underlink";
  email.href =
    "mailto:" +
    encodeURIComponent(contact.email) +
    "?subject=Website%20concept%20discussion";
  email.textContent = "Email the designer";
  box.replaceChildren(label, email);
  try {
    const url = new URL(contact.bookingUrl);
    if (url.protocol === "https:") {
      const link = document.createElement("a");
      link.className = "underlink";
      link.style.marginLeft = "20px";
      link.href = url.href;
      link.textContent = "Book a call";
      box.append(link);
    }
  } catch {}
}
