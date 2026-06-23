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
}

export interface PostsResponse {
  posts: Post[];
  cursor: string | null;
}
