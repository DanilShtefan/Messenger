export interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  album: { cover_medium: string; cover_small: string };
  preview: string;
  duration: number;
}

export const musicApi = {
  getChart: async (): Promise<DeezerTrack[]> => {
    const res = await fetch('/api/music/chart');
    return res.json();
  },
};
