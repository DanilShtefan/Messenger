export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  replies: Comment[];
}

export interface CommentsResponse {
  comments: Comment[];
  cursor: string | null;
}
