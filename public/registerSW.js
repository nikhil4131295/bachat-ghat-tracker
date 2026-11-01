if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('Bachat Ghat Service Worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('Service Worker registration skipped:', err);
      });
  });
}
