
import { Post } from 'interfaces/Post';
import Feed from 'components/Post/Feed';
import { getPublishedPosts } from 'fetcher/post';

type Props = {
  posts: Post[]
}

const Index = (props: Props) => {
  const { posts } = props;
  return <Feed items={posts} />;
};

export const getStaticProps = async () => {
  try {
    const posts = await getPublishedPosts();
    const shapePosts = posts.map((post) => {
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

    return {
      props: {
        posts: shapePosts
      },
      // Cache the homepage at the CDN edge for 2 min; serve stale for up
      // to 24 h while revalidating. Re-renders fetch D1 fresh and refresh
      // the edge entry.
      revalidate: 120,
    };
  } catch (error) {
    return {
      props: {
        posts: [],
      }
    };
  }
  
}

export default Index;
