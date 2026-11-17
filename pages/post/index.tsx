
import { Post } from 'interfaces/Post';
import Feed from 'components/Post/Feed';
import { getPublishedPosts } from 'fetcher/post';
import type { GetServerSideProps } from 'next';

type Props = {
  posts: Post[]
  tag: string | null
}

const Index = ({ posts, tag }: Props) => {
  return <Feed items={posts} initialTag={tag} />;
};

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  res.setHeader("Cache-Control", "private, no-cache, no-store");
  const rawTag = query?.tag;
  const tag = Array.isArray(rawTag) ? rawTag[0] : rawTag;
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
  return { props: { posts: shapedPosts, tag: tag ?? null } };
};

export default Index;
