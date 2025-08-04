export interface Comment {
  id: number;
  eventId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentWithUser extends Comment {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}