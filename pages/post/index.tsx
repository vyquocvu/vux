
import { Post } from 'interfaces/Post';
import PostList from "components/Post/List";
import { AuthInterface } from 'interfaces/User'
import { getPublishedPosts } from 'fetcher/post';
import { NextPageContext } from 'next';

type Props = {
  AuthUserInfo: AuthInterface,
  posts: Post[]
}

const Index = (props: Props) => {
  const { posts } = props;
  return <PostList items={posts} />;
};

Index.getInitialProps = async (context: NextPageContext) => {
  const tag = context?.query?.tag;
  try {
    const posts = await getPublishedPosts();
    const filteredPosts = posts.filter((post) => {
      return post.tags.includes(tag);
    });
    const shapedPosts = filteredPosts.map((post) => {
      return {
        uid: post.uid,
        title: post.title,
        updatedAt: post.updatedAt,
        thumbText: post.thumbText,
        createdAt: post.createdAt,
        thumbImage: post.thumbImage,
        isPublished: post.isPublished,
      }
    });
    return { posts: shapedPosts };
  } catch (error) {
    return {};
  }
}

export default Index;
