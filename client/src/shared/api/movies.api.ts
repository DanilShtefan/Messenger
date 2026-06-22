export interface IaMovie {
  identifier: string;
  title: string;
  description?: string;
  avg_rating?: number;
  downloads?: number;
}

export const moviesApi = {
  search: async (query: string): Promise<IaMovie[]> => {
    const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results ?? [];
  },

  getEmbedUrl: (identifier: string) => `https://archive.org/embed/${identifier}`,
  getThumbnail: (identifier: string) => `https://archive.org/services/img/${identifier}`,
};
