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

/** Rail-only projection: no tags, no body, so one bounded query suffices. */
export interface LatestPost {
  uid: string;
  slug: string;
  title: string;
  updatedAt: number;
}
