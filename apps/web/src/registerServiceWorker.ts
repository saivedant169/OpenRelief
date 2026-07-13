const shouldRegisterServiceWorker = import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === "1";

export const registerServiceWorker = () => {
  if (!shouldRegisterServiceWorker || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => undefined);
  });
};
