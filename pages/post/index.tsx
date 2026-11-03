
import { Post } from 'interfaces/Post';
import Feed from 'components/Post/Feed';
import { getPublishedPosts } from 'fetcher/post';
import { NextPageContext } from 'next';

type Props = {
  posts: Post[]
  tag: string | null
}

const Index = ({ posts, tag }: Props) => {
  return <Feed items={posts} initialTag={tag} />;
};

Index.getInitialProps = async (context: NextPageContext) => {
  const tag = context?.query?.tag as string | undefined;
  try {
    const posts = await getPublishedPosts();
    const filteredPosts = tag
      ? posts.filter((post) => post.tags.includes(tag))
      : posts;
    const shapedPosts = filteredPosts.map((post) => {
      return {
        uid: post.uid,
        title: post.title,
        updatedAt: post.updatedAt,
        thumbText: post.thumbText,
        createdAt: post.createdAt,
        thumbImage: post.thumbImage,
        isPublished: post.isPublished,
        tags: post.tags || [],
      }
    });
    return { posts: shapedPosts, tag: tag ?? null };
  } catch (error) {
    return { posts: [], tag: null };
  }
}

export default Index;
