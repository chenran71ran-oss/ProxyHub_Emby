(function () {
  var saved;
  try { saved = localStorage.getItem('emby_proxy_dark'); } catch (_) {}
  var dark = saved === '1' || (saved !== '0' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.forkTheme = dark ? 'dark' : 'light';
  document.documentElement.dataset.forkUi = 'dashboard-v03';
})();
