export interface IaMovie {
  identifier: string;
  title: string;
  description?: string;
  avg_rating?: number;
  downloads?: number;
}

async function fetchVideoUrl(identifier: string): Promise<string | null> {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}`);
    const data = await res.json();
    const file = data.files?.find(
      (f: any) => f.source === 'original' && (f.format === 'MPEG4' || f.format === 'h.264'),
    );
    if (file) return `https://archive.org/download/${identifier}/${file.name}`;
    // fallback: try identifier.mp4
    return `https://archive.org/download/${identifier}/${identifier}.mp4`;
  } catch {
    return `https://archive.org/download/${identifier}/${identifier}.mp4`;
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
