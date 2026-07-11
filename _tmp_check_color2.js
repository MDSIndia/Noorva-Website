const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push("console: " + msg.text()); });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  for (let i = 0; i < 10; i++) {
    try { await page.mouse.click(700, 450); } catch {}
    await page.waitForTimeout(300);
    if ((await page.locator("text=Click anywhere to begin").count()) === 0) break;
  }
  await page.waitForTimeout(500);
  await page.mouse.click(700, 450);
  await page.waitForTimeout(4500);
  await page.evaluate(() => {
    const el = document.querySelector("#features");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await page.waitForTimeout(1500);

  for (let i = 1; i <= 8; i++) {
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `C:/Users/MDS India/Desktop/github-repo/scratch_diag/c2-${i}.png` });
  }

  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})();
