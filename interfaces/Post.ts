export interface Post {
  uid: string;
  url: string;
  title: string;
  tags: [string];
  label?: string;
  createdAt: any;
  updatedAt: any;
  thumbText: string;
  thumbImage: string;
  draffContent: string;
  isPublished: boolean;
  publishContent: string;
}
