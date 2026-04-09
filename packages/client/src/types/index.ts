export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  avatarUrl: string | null;
}

export interface UserProfile extends User {
  createdAt: string;
  _count: { participations: number; votes: number; comments: number };
}

export interface EventSummary {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  theme: string | null;
  imageUrls: string[];
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  maxCapacity: number | null;
  createdAt: string;
  creator: { id: string; name: string; avatarUrl: string | null };
  _count: { participations: number; comments: number };
}

export interface VoteOption {
  id: string;
  label: string;
  value: number;
  _count: { votes: number };
}

export interface VoteTopic {
  id: string;
  category: "BUDGET" | "ENTRY_PRICE" | "CUSTOM";
  label: string;
  closesAt: string;
  options: VoteOption[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

export interface EventDetail extends EventSummary {
  participations: { userId: string }[];
  voteTopics: VoteTopic[];
  comments: Comment[];
  userVotes: Record<string, string>; // topicId -> optionId
}

export interface VoteResult {
  id: string;
  label: string;
  value: number;
  count: number;
  percentage: number;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  events?: T[];
  comments?: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
