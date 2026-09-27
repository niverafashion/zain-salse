let installPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register(
        "./service-worker.js",
        { scope: "./" }
      );

      console.log("Zain Sales PWA ready");
    } catch (error) {
      console.error(
        "Service Worker registration failed:",
        error
      );
    }
  });
}

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();
    installPrompt = event;

    const button =
      document.getElementById("installAppBtn");

    if (button) button.hidden = false;
  }
);

window.addEventListener(
  "appinstalled",
  () => {
    installPrompt = null;

    const button =
      document.getElementById("installAppBtn");

    if (button) button.hidden = true;
  }
);

async function installZainSales() {
  if (!installPrompt) return;

  const prompt = installPrompt;
  installPrompt = null;

  await prompt.prompt();

  const result = await prompt.userChoice;

  console.log("Install result:", result.outcome);
}

window.addEventListener("DOMContentLoaded", () => {
  const button =
    document.getElementById("installAppBtn");

  if (button) {
    button.addEventListener(
      "click",
      installZainSales
    );
  }
});