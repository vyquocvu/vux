export interface Post {
  uid: string;
  url: string;
  slug: string;
  title: string;
  tags: string[];
  label?: string;
  createdAt: number;
  author: string;
  updatedAt: number;
  thumbText: string;
  thumbImage: string;
  draftContent: string;
  isPublished: boolean;
  publishContent: string;
}

export interface PostLite {
  uid: string;
  thumbText: string;
  updatedAt: number;
}
