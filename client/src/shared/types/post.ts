export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
  viewsCount: number;
  viewersPreview: {
    viewers: Array<{
      id: string;
      displayName: string;
      avatarUrl: string | null;
    }>;
    totalCount: number;
  };
}

export interface PostsResponse {
  posts: Post[];
  cursor: string | null;
}
