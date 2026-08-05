export interface Post {
  uid: string;
  url: string;
  slug: string;
  title: string;
  tags: string[];
  createdAt: number;
  author: string;
  updatedAt: number;
  thumbText: string;
  thumbImage: string;
  draftContent: string;
  isPublished: boolean;
  publishContent: string;
}
