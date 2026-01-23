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
}

export interface ProjectReaction {
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  commentCount: number;
}
