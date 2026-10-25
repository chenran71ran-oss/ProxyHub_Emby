(function () {
  'use strict';
  var root = document.documentElement;
  var manual = null;
  var originalThemeToggle = window.toggleDarkMode;
  function savedTheme() {
    try { return localStorage.getItem('emby_proxy_dark'); } catch (_) { return null; }
  }
  function applyTheme(dark, persist) {
    root.dataset.forkTheme = dark ? 'dark' : 'light';
    root.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);
    if (persist) {
      manual = dark;
      try { localStorage.setItem('emby_proxy_dark', dark ? '1' : '0'); } catch (_) {}
    }
    document.querySelectorAll('#themeToggle,.fork-theme-toggle').forEach(function (button) {
      button.textContent = dark ? '☀' : '☾';
      button.setAttribute('aria-label', dark ? '切换到白天模式' : '切换到夜间模式');
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? '切换到白天模式' : '切换到夜间模式';
    });
    var color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = dark ? '#21262f' : '#f3f1f6';
  }
  function toggle() {
    var dark = root.dataset.forkTheme !== 'dark';
    // Preserve the author's chart recolouring, with the new palette already active.
    root.dataset.forkTheme = dark ? 'dark' : 'light';
    if (typeof originalThemeToggle === 'function') originalThemeToggle();
    applyTheme(dark, true);
  }
  window.toggleDarkMode = toggle;
  function ready() {
    var saved = savedTheme();
    applyTheme(manual !== null ? manual : saved === '1' || (saved !== '0' && matchMedia('(prefers-color-scheme: dark)').matches), false);
    var button = document.getElementById('themeToggle');
    if (button) {
      button.onclick = toggle;
    } else if (!document.querySelector('.fork-theme-toggle')) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'fork-theme-toggle fork-theme-floating';
      button.onclick = toggle;
      document.body.appendChild(button);
      applyTheme(root.dataset.forkTheme === 'dark', false);
    }
    if (!document.getElementById('forkBuildBadge')) {
      var badge = document.createElement('div');
      badge.id = 'forkBuildBadge';
      badge.className = 'fork-build-badge';
      badge.textContent = '上游 4.0.4 · Dashboard UI v03 · 个人 Fork';
      var anchor = document.querySelector('#view-settings') || document.querySelector('.login-box');
      if (anchor) anchor.appendChild(badge);
    }
    if (typeof window.doOnlineUpdate === 'function' && !window.doOnlineUpdate.forkGuarded) {
      var upstreamUpdate = window.doOnlineUpdate;
      var guardedUpdate = async function () {
        // This is a compatibility guard, not proof of testing or a security boundary.
        if (typeof latestCode !== 'string' || !latestCode.includes('// FORK_UI: dashboard-') || !latestCode.includes('function applyCustomUI(')) {
          var message = '只安装本 Fork 已合并的构建。请先在 GitHub 合并作者更新与自定义 UI，再更新面板。';
          if (typeof showToast === 'function') showToast(message); else alert(message);
          return;
        }
        if (!confirm('安装个人 Fork 的已合并版本？请先确认已备份配置及数据库。')) return;
        return upstreamUpdate.apply(this, arguments);
      };
      guardedUpdate.forkGuarded = true;
      window.doOnlineUpdate = guardedUpdate;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  window.addEventListener('storage', function (event) {
    if (event.key === 'emby_proxy_dark') {
      manual = null;
      applyTheme(event.newValue === '1' || (event.newValue !== '0' && matchMedia('(prefers-color-scheme: dark)').matches), false);
    }
  });
  var media = matchMedia('(prefers-color-scheme: dark)');
  if (media.addEventListener) media.addEventListener('change', function (event) {
    if (savedTheme() === null && manual === null) applyTheme(event.matches, false);
  });
})();
