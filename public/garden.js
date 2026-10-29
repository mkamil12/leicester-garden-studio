'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); mobileNav.hidden = true; }
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open)); toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation'); mobileNav.hidden = open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); toggle.focus(); } });
document.addEventListener('click', event => { if(!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu(); });
const triggers = [...document.querySelectorAll('.service-trigger')];
triggers.forEach(button => button.addEventListener('click', () => {
  const wasOpen = button.getAttribute('aria-expanded') === 'true';
  triggers.forEach(trigger => {
    const active = trigger === button && !wasOpen;
    trigger.setAttribute('aria-expanded', String(active));
    document.getElementById(trigger.getAttribute('aria-controls')).hidden = !active;
    trigger.querySelector('.plus').textContent = active ? '−' : '+';
  });
  if(!wasOpen) {
    const image = document.getElementById('service-image');
    image.src = button.dataset.image === 'hero' ? '/assets/mma/garden-after.jpg' : '/assets/mma/tidy-after.jpg';
    document.getElementById('service-image-label').textContent = button.dataset.image === 'hero' ? 'SPACE TO GROW. ROOM TO BREATHE.' : 'THE DETAILS MAKE THE DIFFERENCE.';
  }
}));
let ticking = false;
function updateParallax() {
  if(reducedMotion.matches) return;
  const hero = document.querySelector('.hero');
  if(!hero) return;
  const position = hero.getBoundingClientRect();
  if(position.bottom > 0 && position.top < innerHeight) {
    const shift = Math.min(90, Math.max(0, -position.top * 0.15));
    document.querySelector('.hero-image img').style.transform = `translateY(${shift}px) scale(1.06)`;
  }
}
window.addEventListener('scroll', () => { if(!ticking) { requestAnimationFrame(() => { updateParallax(); ticking = false; }); ticking = true; } }, { passive: true });
reducedMotion.addEventListener('change', () => {
  if(reducedMotion.matches) { document.documentElement.classList.remove('motion'); document.querySelector('.hero-image img').style.transform = ''; }
});
const contact = window.STUDIO_CONTACT || {};
if(contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
  const box = document.getElementById('studio-contact');
  const label = document.createElement('span'); label.className = 'section-index'; label.textContent = 'DISCUSS THE WEBSITE CONCEPT';
  const email = document.createElement('a'); email.className = 'underlink'; email.href = 'mailto:' + encodeURIComponent(contact.email) + '?subject=Website%20concept%20discussion'; email.textContent = 'Email the designer ↗';
  box.replaceChildren(label, email);
  try { const url = new URL(contact.bookingUrl); if(url.protocol === 'https:') { const link = document.createElement('a'); link.className='underlink';link.style.marginLeft='20px';link.href=url.href;link.textContent='Book a call ↗';box.append(link); } } catch {}
}
