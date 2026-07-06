export type KenBurns = "zoom-in" | "zoom-out" | "pan-left" | "pan-right";

export interface StoryChapterData {
  index: number;
  imageSrc: string;
  eyebrow: string;
  headline: string;
  body: string;
  kenBurns: KenBurns;
  /** 0 = faded monochrome/sepia (ancient past), 1 = full natural color (present). The story "colorizes itself" as it progresses. */
  grade: number;
  isLast?: boolean;
}

export const storyChapters: StoryChapterData[] = [
  {
    index: 1,
    imageSrc: "/story/chapter-1.png",
    eyebrow: "01 / The Spark",
    headline: "Before language, before fire had a name — there was only the looking up.",
    body: "A mind curious enough to wonder about the lights above it was already, quietly, becoming something new.",
    kenBurns: "zoom-in",
    grade: 0.05,
  },
  {
    index: 2,
    imageSrc: "/story/chapter-2.png",
    eyebrow: "02 / The First Word",
    headline: "Then someone spoke, and someone else understood.",
    body: "Connection began as two people, a fire, and the need to be less alone with what they knew.",
    kenBurns: "pan-right",
    grade: 0.15,
  },
  {
    index: 3,
    imageSrc: "/story/chapter-3.png",
    eyebrow: "03 / What We Passed On",
    headline: "We carved our stories into stone so they would outlive us.",
    body: "Tools sharpened hands. Stories sharpened memory. Together, they became culture.",
    kenBurns: "zoom-in",
    grade: 0.28,
  },
  {
    index: 4,
    imageSrc: "/story/chapter-4.png",
    eyebrow: "04 / An Idea, Turning",
    headline: "One invention, and suddenly the whole world moved faster.",
    body: "The wheel didn't just carry weight — it carried people toward each other.",
    kenBurns: "zoom-out",
    grade: 0.42,
  },
  {
    index: 5,
    imageSrc: "/story/chapter-5.png",
    eyebrow: "05 / Ideas Travel",
    headline: "Civilizations grow. Humanity advances.",
    body: "The printing press turned knowledge from a privilege into a birthright.",
    kenBurns: "zoom-in",
    grade: 0.58,
  },
  {
    index: 6,
    imageSrc: "/story/chapter-6.png",
    eyebrow: "06 / Steam. Speed. Strength.",
    headline: "A new era begins.",
    body: "Distance stopped being the thing that kept people apart.",
    kenBurns: "pan-right",
    grade: 0.72,
  },
  {
    index: 7,
    imageSrc: "/story/chapter-7.png",
    eyebrow: "07 / Powering Progress",
    headline: "A brighter future for all.",
    body: "Light stayed on after the sun went down, and everyday life was never quite the same.",
    kenBurns: "zoom-in",
    grade: 0.86,
  },
  {
    index: 8,
    imageSrc: "/story/chapter-8.png",
    eyebrow: "08 / The World Just Got Smaller",
    headline: "A voice, carried across distance.",
    body: "Progress connects us all — it always has.",
    kenBurns: "zoom-in",
    grade: 1,
    isLast: true,
  },
];
