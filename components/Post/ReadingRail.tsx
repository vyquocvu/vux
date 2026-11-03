import { FC } from 'react';
import Link from 'next/link';
import { timeFromNow } from 'utils/common';
import type { LatestPost } from 'interfaces/Post';
import type { TocEntry } from 'utils/toc';
import PostToc from './PostToc';
import { useActiveHeading } from './useActiveHeading';
import TagChip from './TagChip';

type Props = {
  toc: TocEntry[];
  minutes: number;
  updatedAt: number;
  tags: string[];
  latest: LatestPost[];
};

const label =
  'font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium';

const formatDate = (second: number): string => {
  const d = new Date(second * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/**
 * Fills the xl gutter. Every block hides itself when it has no data: 7 posts
 * have no headings and 17 have no tags, so the rail must degrade without
 * leaving a hole. Meta is always present, so the rail is never empty.
 */
const ReadingRail: FC<Props> = ({ toc, minutes, updatedAt, tags, latest }) => {
  const activeId = useActiveHeading(toc);

  return (
    <div className="sticky top-12 pt-2 space-y-7">
      <div className="text-right">
        <p className={`${label} mb-1.5`}>Đọc</p>
        <p className="font-body text-sm text-ink dark:text-on-dark">{formatDate(updatedAt)}</p>
        <p className="font-body text-xs text-muted dark:text-on-dark-soft">{minutes} phút</p>
      </div>

      {toc.length >= 2 && <PostToc toc={toc} variant="rail" activeId={activeId} />}

      {tags.length > 0 && (
        <div className="border-t border-hairline dark:border-surface-dark-elevated pt-5">
          <p className={`${label} mb-3`}>Tag</p>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {tags.map((tag) => <TagChip key={tag} label={tag} />)}
          </div>
        </div>
      )}

      {latest.length > 0 && (
        <div className="border-t border-hairline dark:border-surface-dark-elevated pt-5">
          <p className={`${label} mb-3`}>Mới nhất</p>
          <ul className="space-y-3">
            {latest.map((post) => (
              <li key={post.uid}>
                <Link
                  href={`/post/${post.slug}`}
                  className="block font-body text-[13px] leading-snug text-ink dark:text-on-dark hover:text-primary"
                >
                  {post.title}
                  <span className="block text-muted-soft text-[11px] mt-0.5">
                    {timeFromNow(post.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReadingRail;
