// Regenerates the baked cover/spine/chapter-page textures used by the 3D
// book (components/StoryGallery3D/) in public/story-3d/. The 3D book renders
// these as WebGL texture maps rather than live HTML/CSS, so editing copy in
// components/storyData.ts alone does nothing at runtime — this script must
// be re-run (and the resulting PNGs committed) any time a chapter's text,
// image, or a cover's design changes.
//
// Bakes TWO variants, since the fullscreen reader (BookReader3D) switches
// shape based on viewport: a portrait set (also used by the always-portrait
// closed-book idle preview, BookModel.tsx) and a landscape set (desktop-only
// reader). See bake-story-textures.portrait.template.html /
// .landscape.template.html for the actual per-variant layouts.
//
// Usage: node scripts/bake-story-textures.js
//
// Requires Playwright (already a devDependency for this project's own
// verification scripts). Renders standalone HTML templates (not the live
// React components) at a fixed design resolution, driven by the CHAPTERS
// array below — keep that array in sync with components/storyData.ts by
// hand; this repo has no TypeScript-executing script runner (tsx/ts-node)
// installed, so importing storyData.ts directly isn't available here.

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const STORY_3D_DIR = path.join(PROJECT_ROOT, "public", "story-3d");

// Keep in sync with components/storyData.ts's storyChapters array.
const CHAPTERS = [
  { i: 1, eyebrow: "01 / The Spark", headline: "Before language, before fire had a name — there was only the looking up.", body: "A mind curious enough to wonder about the lights above it was already, quietly, becoming something new." },
  { i: 2, eyebrow: "02 / The First Word", headline: "Then someone spoke, and someone else understood.", body: "Connection began as two people, a fire, and the need to be less alone with what they knew." },
  { i: 3, eyebrow: "03 / What We Passed On", headline: "We carved our stories into stone so they would outlive us.", body: "Tools sharpened hands. Stories sharpened memory. Together, they became culture." },
  { i: 4, eyebrow: "04 / An Idea, Turning", headline: "One invention, and suddenly the whole world moved faster.", body: "The wheel didn't just carry weight — it carried people toward each other." },
  { i: 5, eyebrow: "05 / Ideas Travel", headline: "Civilizations grow. Humanity advances.", body: "The printing press turned knowledge from a privilege into a birthright." },
  { i: 6, eyebrow: "06 / Steam. Speed. Strength.", headline: "A new era begins.", body: "Distance stopped being the thing that kept people apart." },
  { i: 7, eyebrow: "07 / Powering Progress", headline: "A brighter future for all.", body: "Light stayed on after the sun went down, and everyday life was never quite the same." },
  { i: 8, eyebrow: "08 / The World Just Got Smaller", headline: "A voice, carried across distance.", body: "Progress connects us all — it always has." },
];

// width/height here just need to comfortably contain the template's own
// .sheet dimensions — the actual crop is driven by each element's own
// screenshot() call below, not this viewport.
const VARIANTS = [
  { name: "portrait", template: "bake-story-textures.portrait.template.html", viewport: { width: 1300, height: 1850 }, targets: ["cover-front", "cover-back", "cover-front-emissive", "cover-back-emissive", "spine", ...CHAPTERS.map((c) => `page-${c.i}`)] },
  // Closed-book back cover is portrait-only (the idle preview never goes
  // landscape), so it's skipped here.
  { name: "landscape", template: "bake-story-textures.landscape.template.html", viewport: { width: 1850, height: 1200 }, targets: ["cover-front", "spine", ...CHAPTERS.map((c) => `page-${c.i}`)] },
];

async function bakeVariant(browser, variant) {
  const outDir = path.join(STORY_3D_DIR, variant.name);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const htmlTemplate = path.join(__dirname, variant.template);
  const page = await browser.newPage({ viewport: variant.viewport, deviceScaleFactor: 1 });
  await page.goto("file:///" + htmlTemplate.replace(/\\/g, "/"));

  await page.evaluate(
    ({ chapters, projectRoot }) => {
      const template = document.getElementById("page-1");

      function fillPage(el, ch) {
        // Portrait pages have one <img> (.page-photo); landscape pages have
        // two (.page-photo-fg sharp panel + .page-photo-bg blurred full-
        // width backdrop) — both need the same source photo.
        const src = `file:///${projectRoot}/public/story/chapter-${ch.i}.png`.replace(/\\/g, "/");
        el.querySelectorAll("img").forEach((img) => { img.src = src; });
        el.querySelector(".page-eyebrow").textContent = ch.eyebrow;
        el.querySelector(".page-headline").textContent = ch.headline;
        el.querySelector(".page-body").textContent = ch.body;
        el.querySelectorAll(".page-footer span")[1].textContent = `${String(ch.i).padStart(2, "0")} / 08`;
      }

      fillPage(template, chapters[0]);
      for (const ch of chapters.slice(1)) {
        const clone = template.cloneNode(true);
        clone.id = `page-${ch.i}`;
        fillPage(clone, ch);
        document.body.appendChild(clone);
      }
    },
    { chapters: CHAPTERS, projectRoot: PROJECT_ROOT }
  );

  await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return Promise.all(
      imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })))
    );
  });
  await page.waitForTimeout(200);

  for (const id of variant.targets) {
    const el = await page.$("#" + id);
    if (!el) {
      console.log(`MISSING [${variant.name}]`, id);
      continue;
    }
    await el.screenshot({ path: path.join(outDir, `${id}.png`) });
    console.log(`saved [${variant.name}]`, id);
  }

  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const variant of VARIANTS) {
    await bakeVariant(browser, variant);
  }
  await browser.close();
})();
