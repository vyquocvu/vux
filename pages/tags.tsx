import Link from "next/link";
import { getPublishedPosts } from "fetcher/post";

const TagsPage = ({ tags }: { tags: { [key: string]: number  }}) => {
  return (
    <div>
      <h1 className="text-3xl">This is some tags</h1>
      <br />
      {Object.keys(tags).map((tag) => {
        const postCount = tags[tag];
        return (
          <div key={tag}>
            <Link href={`/post?tag=${tag}`} legacyBehavior>
              <a className="hover:underline mx-4">
                {tag}: {postCount} post{postCount == 1 ? "" : "s"}
              </a>
            </Link>
          </div>
        );
      })}
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
