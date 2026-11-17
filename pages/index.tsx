
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
    // to 24 h while revalidating. A thrown error keeps the previous page
    // instead of caching an empty feed.
    revalidate: 120,
  };
}

export default Index;
