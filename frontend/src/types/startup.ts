export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string; // Markdown support
  logo_url: string | null;
  website_url: string | null;
  founded_date: string;
  status: 'Active' | 'Built' | 'Paused';
  owner_id: string;
  is_hiring: boolean;
  looking_for_cofounder: boolean;
  tech_stack: string[];
  milestones: Milestone[];
  member_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface StartupMember {
  user_id: string;
  role: 'Owner' | 'Core Team' | 'Member';
  name: string;
  username: string;
  avatar_url: string | null;
}

export interface JobPosting {
  id: string;
  startup_id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  salary_range?: string;
  custom_questions: { id: string; question: string; type: 'text' | 'choice'; options?: string[] }[];
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  answers: { question_id: string; answer: string }[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
}
export interface StartupUpdate {
  id: string;
  startup_id: string;
  user_id: string;
  content: string;
  is_broadcast: boolean;
  created_at: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}
