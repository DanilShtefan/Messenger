export interface IaMovie {
  identifier: string;
  title: string;
  description?: string;
  avg_rating?: number;
  downloads?: number;
}

async function fetchVideoUrl(identifier: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/movies/video/${identifier}`);
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export const moviesApi = {
  search: async (query: string): Promise<IaMovie[]> => {
    const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results ?? [];
  },

  getEmbedUrl: (identifier: string) => `https://archive.org/embed/${identifier}`,
  getThumbnail: (identifier: string) => `https://archive.org/services/img/${identifier}`,
  getVideoUrl: fetchVideoUrl,
};
