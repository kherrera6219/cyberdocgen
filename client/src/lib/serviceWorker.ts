export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isDev = import.meta.env.DEV;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (isDev) {
          console.info("Service worker registered", registration.scope);
        }
      })
      .catch((error) => {
        console.error("Service worker registration failed", error);
      });
  });
}
