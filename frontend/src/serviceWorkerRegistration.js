import { Workbox } from 'workbox-window';

export function register() {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      const wb = new Workbox(swUrl);

      wb.addEventListener('installed', event => {
        if (event.isUpdate) {
          if (confirm('New content is available and will be used when all tabs for this page are closed. Proceed to reload?')) {
            window.location.reload();
          }
        } else {
          console.log('App is cached for offline use.');
        }
      });

      wb.register();
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}
