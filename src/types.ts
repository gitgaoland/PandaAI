export interface Post {
  id: string;
  title: string;
  category: string; // "政治" | "历史" | "文化" | "技术" | "经济" | "社会" | "外交" | "地理"
  tags: string[];
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  views: number;
  likes: number;
  createdAt: string;
  readingTime: string; // e.g. "5 分钟"
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  isApproved: boolean; // CMS can moderate
  reply?: string; // Admin's reply
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
}
