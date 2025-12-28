import Link from "next/link";
import { getPublishedPosts } from "fetcher/post";

const TagsPage = ({ tags }: { tags: { [key: string]: number  }}) => {
  return (
    <div>
      <h1 className="text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Tags</h1>
      <div className="flex flex-wrap gap-3">
        {Object.keys(tags).sort((l, r) => tags[r] - tags[l]).map((tag) => {
          const postCount = tags[tag];
          return (
            <Link key={tag} href={`/post?tag=${tag}`} legacyBehavior>
              <a className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 rounded-lg transition-all duration-200 hover:shadow-soft">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{tag}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">{postCount}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
};


TagsPage.getInitialProps = async () => {
  try {
    const posts = await getPublishedPosts();
    const tags = {} as { [key: string]: number };

    posts.forEach((post) => {
      post.tags.forEach((tag: string) => {
        if (tags[tag]) {
          tags[tag] += 1
        } else {
          tags[tag] = 1;
        }
      });
    });
    return { tags };
  } catch (error) {
    return {};
  }
}

export default TagsPage;
