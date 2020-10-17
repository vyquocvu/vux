export interface Post {
  uid: string;
  url: string;
  title: string;
  tags: [string];
  label?: string;
  createdAt: any;
  author: string;
  updatedAt: any;
  thumbText: string;
  thumbImage: string;
  draffContent: string;
  isPublished: boolean;
  publishContent: string;
}

export interface PostLite {
  uid: string;
  thumbText: string;
  updatedAt: any;
}
