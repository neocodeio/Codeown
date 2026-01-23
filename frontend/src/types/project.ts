export interface Project {
  id: number;
  user_id: string;
  title: string;
  description: string;
  technologies_used: string[];
  status: 'in_progress' | 'completed' | 'paused';
  github_repo?: string;
  live_demo?: string;
  cover_image?: string;
  project_details: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  user?: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  rating?: number;
  rating_count?: number;
  user_rating?: number;
  contributors?: {
    user_id: string;
    username: string;
    avatar_url: string | null;
    name: string;
  }[];
}

export interface ProjectFormData {
  title: string;
  description: string;
  technologies_used: string[];
  status: 'in_progress' | 'completed' | 'paused';
  github_repo?: string;
  live_demo?: string;
  cover_image?: string;
  project_details: string;
  contributors?: string[]; // Array of usernames
}

export interface ProjectReaction {
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  commentCount: number;
}
