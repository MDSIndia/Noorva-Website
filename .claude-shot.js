const { chromium } = require("playwright-core");

async function run(viewport, label) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto("http://localhost:3002", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(2000);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(5000);

  await page.evaluate(() => {
    document.getElementById("story-gallery")?.scrollIntoView({ behavior: "instant" });
  });
  await page.waitForTimeout(1500);

  const dir = "C:\\Users\\MDSIND~1\\AppData\\Local\\Temp\\claude\\c--Users-MDS-India-Desktop-github-repo-Noorva-Website\\4a7ccb6f-0ea8-4b07-955e-590e0c5685ec\\scratchpad";
  await page.screenshot({ path: `${dir}\\overlay-${label}.png` });
  console.log(label, "errors:", JSON.stringify(errors));
  await browser.close();
}

(async () => {
  await run({ width: 1920, height: 1010 }, "wide1920");
  await run({ width: 1440, height: 900 }, "desktop1440");
  await run({ width: 390, height: 844 }, "mobile");
})();
