// types/episode.ts
export interface Episode {
  id: string;
  title: string;
  description: string;
  status: "draft" | "scheduled" | "published";
  uploadDate: string;
  duration: string;
  listens: number;
  topic: string;
  publishDate?: string;
  publishTime?: string;
  audioUrl?: string;
  audioPublicId?: string;
  audioFileName?: string;
  audioSize?: number;
  audioDuration?: number;
  audioFormat?: string;
  audioId?: string;
  coverImage?: string;
  isPublic?: boolean;
  // Add these for real-time features
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}
