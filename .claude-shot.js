const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3002", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.mouse.click(720, 450);
  await page.waitForTimeout(2000);
  await page.mouse.click(720, 450);
  await page.waitForTimeout(6000);

  // Freeze the rotation animations so the dashed pattern doesn't create an
  // optical-illusion asymmetry, and inspect the ring/img geometry directly.
  const info = await page.evaluate(() => {
    const img = document.querySelector('img[alt="Noorva AI holographic data sphere"]');
    const container = img.parentElement;
    const ringInner = container.querySelector('div[style*="dashed"]');
    const ringOuter = ringInner.parentElement;
    document.querySelectorAll("*").forEach((el) => {
      el.style.animationPlayState = "paused";
    });
    const imgRect = img.getBoundingClientRect();
    const ringRect = ringOuter.getBoundingClientRect();
    return {
      imgRect,
      ringRect,
      ringCenter: { x: ringRect.left + ringRect.width / 2, y: ringRect.top + ringRect.height / 2 },
      probedCoreCenter: {
        x: imgRect.left + (490 / 989) * imgRect.width,
        y: imgRect.top + (310 / 702) * imgRect.height,
      },
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({
    path: "C:\\Users\\MDSIND~1\\AppData\\Local\\Temp\\claude\\c--Users-MDS-India-Desktop-github-repo-Noorva-Website\\4a7ccb6f-0ea8-4b07-955e-590e0c5685ec\\scratchpad\\hero-zoom-tight.png",
    clip: { x: 920, y: 300, width: 320, height: 250 },
  });
  await browser.close();
})();
