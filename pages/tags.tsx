import Link from "next/link";
import { getPublishedPosts } from "fetcher/post";

const TagsPage = ({ tags }: { tags: { [key: string]: number } }) => {
  const entries = Object.entries(tags).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark mb-3 tracking-tight">
        Tags
      </h1>
      <p className="font-body text-sm text-muted dark:text-on-dark-soft mb-8">
        {entries.length} chủ đề · {entries.reduce((n, [, c]) => n + c, 0)} lượt gán
      </p>
      <div className="flex flex-wrap gap-2.5">
        {entries.map(([tag, count]) => (
          <Link key={tag} href={`/post?tag=${encodeURIComponent(tag)}`} legacyBehavior>
            <a className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill border border-hairline dark:border-surface-dark-elevated bg-canvas dark:bg-surface-dark-soft hover:border-primary dark:hover:border-primary transition-colors duration-200">
              <span className="font-body text-sm text-ink dark:text-on-dark">{tag}</span>
              <span className="font-mono text-[11px] text-muted dark:text-muted-soft">{count}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const getStaticProps = async () => {
  try {
    const posts = await getPublishedPosts();
    const tags = {} as { [key: string]: number };
    posts.forEach((post) => {
      post.tags.forEach((tag: string) => {
        tags[tag] = (tags[tag] ?? 0) + 1;
      });
    });
    return {
      props: { tags },
      // The tag list is computed from D1, so cache the page for 5 min
      // at the edge. Background refresh keeps it warm during content
      // updates.
      revalidate: 300,
    };
  } catch {
    return { props: { tags: {} }, revalidate: 60 };
  }
};

export default TagsPage;
