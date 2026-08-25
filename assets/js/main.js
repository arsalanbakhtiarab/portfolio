/* Ink Profile interactions: theme preference, responsive navigation, and mailto contact form. */
const body = document.body;
const savedTheme = localStorage.getItem('arsalan-theme');

if (savedTheme === 'light') body.classList.replace('theme-dark', 'theme-light');

const updateThemeLabel = () => {
  const label = document.querySelector('.theme-label');
  if (label) label.textContent = body.classList.contains('theme-light') ? 'Dark mode' : 'Light mode';
};

updateThemeLabel();

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const isLight = body.classList.toggle('theme-light');
  body.classList.toggle('theme-dark', !isLight);
  localStorage.setItem('arsalan-theme', isLight ? 'light' : 'dark');
  updateThemeLabel();
});

document.querySelector('[data-menu-toggle]')?.addEventListener('click', event => {
  const open = body.classList.toggle('menu-open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.site-nav a').forEach(link => link.addEventListener('click', () => body.classList.remove('menu-open')));

document.querySelectorAll('[data-contact-form]').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get('name') || '';
  const email = data.get('email') || '';
  const message = data.get('message') || '';
  const status = form.querySelector('.form-status');
  if (status) status.textContent = 'Opening your email application…';
  window.location.href = `mailto:arsalanbakhtiarab@gmail.com?subject=${encodeURIComponent(`Portfolio enquiry from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
}));

document.querySelectorAll('[data-year]').forEach(item => { item.textContent = new Date().getFullYear(); });
