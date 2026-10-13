// UI Refiner patch: checks never install dependencies or download browsers.
export async function launchBrowser({ chromium, timeout = 15000 } = {}) {
  chromium ??= (await import('playwright')).chromium;
  try { return await chromium.launch({ timeout }); }
  catch (error) {
    throw new Error(`Chromium launch failed. Install it explicitly with npx playwright install chromium before running doctor/check. ${error.message}`, { cause: error });
  }
}
