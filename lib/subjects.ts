export interface SubjectConfig {
  id: string;
  name: string;
  icon: string;
  rssFeeds: { url: string; name: string }[];
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id: "psychology",
    name: "心理学",
    icon: "brain",
    rssFeeds: [
      {
        url: "https://feeds.feedburner.com/PsychologyToday",
        name: "Psychology Today",
      },
      {
        url: "https://export.arxiv.org/rss/q-bio.NC",
        name: "ArXiv Neuroscience",
      },
    ],
  },
  {
    id: "biology",
    name: "生物学",
    icon: "leaf",
    rssFeeds: [
      { url: "https://www.nature.com/nature.rss", name: "Nature" },
      {
        url: "https://feeds.feedburner.com/sciencedaily/top_news",
        name: "Science Daily",
      },
    ],
  },
  {
    id: "physics",
    name: "物理学",
    icon: "atom",
    rssFeeds: [
      {
        url: "https://export.arxiv.org/rss/physics.gen-ph",
        name: "ArXiv Physics",
      },
      { url: "https://physicsworld.com/feed/", name: "Physics World" },
    ],
  },
  {
    id: "sociology",
    name: "社会学",
    icon: "users",
    rssFeeds: [
      {
        url: "https://sociologicalimagination.org/feed",
        name: "Sociological Imagination",
      },
      {
        url: "https://export.arxiv.org/rss/econ.GN",
        name: "ArXiv Social",
      },
    ],
  },
  {
    id: "ai-news",
    name: "AI 日报",
    icon: "cpu",
    rssFeeds: [
      {
        url: "https://export.arxiv.org/rss/cs.AI",
        name: "ArXiv cs.AI",
      },
      { url: "https://huggingface.co/blog/feed.xml", name: "HuggingFace Blog" },
    ],
  },
];

export function getSubject(id: string): SubjectConfig | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function getWeekStart(date: Date = new Date()): Date {
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
}

export function getTodayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

