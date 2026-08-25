/* Ink Profile interactions: theme preference, responsive navigation, mailto contact form, and public market telemetry. */
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

const marketPanel = document.querySelector('[data-live-market]');

if (marketPanel) {
  const refreshButton = marketPanel.querySelector('[data-market-refresh]');
  const status = marketPanel.querySelector('[data-market-status]');
  const windowLabel = marketPanel.querySelector('[data-market-window]');
  const price = marketPanel.querySelector('[data-market-price]');
  const change = marketPanel.querySelector('[data-market-change]');
  const range = marketPanel.querySelector('[data-market-range]');
  const volume = marketPanel.querySelector('[data-market-volume]');
  const updated = marketPanel.querySelector('[data-market-updated]');
  const line = marketPanel.querySelector('[data-market-line]');
  const area = marketPanel.querySelector('[data-market-area]');
  const point = marketPanel.querySelector('[data-market-point]');

  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value);
  const compact = value => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);

  const resetMetrics = () => {
    [price, change, range, volume].forEach(element => { element.textContent = '—'; element.classList.remove('positive', 'negative'); });
    line.setAttribute('d', '');
    area.setAttribute('d', '');
    point.setAttribute('r', '0');
  };

  const drawSeries = prices => {
    const width = 720;
    const height = 260;
    const padding = { top: 18, right: 8, bottom: 34, left: 8 };
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const spread = Math.max(rawMax - rawMin, rawMax * 0.002, 1);
    const min = rawMin - spread * 0.12;
    const max = rawMax + spread * 0.12;
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;
    const points = prices.map((value, index) => ({
      x: padding.left + (index / Math.max(prices.length - 1, 1)) * usableWidth,
      y: padding.top + (1 - (value - min) / (max - min)) * usableHeight,
    }));
    const path = points.map((item, index) => `${index ? 'L' : 'M'}${item.x.toFixed(2)},${item.y.toFixed(2)}`).join(' ');
    const baseline = height - padding.bottom;
    const last = points.at(-1);
    line.setAttribute('d', path);
    area.setAttribute('d', `${path} L${last.x.toFixed(2)},${baseline} L${points[0].x.toFixed(2)},${baseline} Z`);
    point.setAttribute('cx', last.x.toFixed(2));
    point.setAttribute('cy', last.y.toFixed(2));
    point.setAttribute('r', '4.5');
  };

  const loadMarketData = async () => {
    refreshButton.disabled = true;
    marketPanel.dataset.marketState = 'loading';
    status.textContent = 'Refreshing public market data…';
    try {
      const [klinesResponse, tickerResponse] = await Promise.all([
        fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=48', { cache: 'no-store' }),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { cache: 'no-store' }),
      ]);
      if (!klinesResponse.ok || !tickerResponse.ok) throw new Error('Market endpoint unavailable');
      const [klines, ticker] = await Promise.all([klinesResponse.json(), tickerResponse.json()]);
      const closes = klines.map(item => Number(item[4])).filter(Number.isFinite);
      if (closes.length < 2 || !Number.isFinite(Number(ticker.lastPrice))) throw new Error('Incomplete market payload');

      const move = Number(ticker.priceChangePercent);
      drawSeries(closes);
      price.textContent = money(Number(ticker.lastPrice));
      change.textContent = `${move >= 0 ? '+' : ''}${move.toFixed(2)}%`;
      change.classList.toggle('positive', move >= 0);
      change.classList.toggle('negative', move < 0);
      range.textContent = `${money(Number(ticker.lowPrice))} – ${money(Number(ticker.highPrice))}`;
      volume.textContent = `$${compact(Number(ticker.quoteVolume))}`;
      windowLabel.textContent = `${closes.length} hourly closes · BTC/USDT`;
      updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      status.textContent = 'Live public spot-market feed';
      marketPanel.dataset.marketState = 'ready';
    } catch (error) {
      resetMetrics();
      windowLabel.textContent = 'Public market data unavailable';
      updated.textContent = 'No cached market data is shown';
      status.textContent = 'Live data could not be loaded. Please refresh to retry.';
      marketPanel.dataset.marketState = 'error';
    } finally {
      refreshButton.disabled = false;
    }
  };

  refreshButton.addEventListener('click', loadMarketData);
  loadMarketData();
}
