export interface Post {
  content: string;
  title: string;
  id: string;
  publishedDate: string;
  author: {
    id: string;
    name: string;
    email?: string;
    bio?: string;
    profilePic?: string;
  };
  published: boolean;
  claps: [];
  bookmarkId?: string;
}
