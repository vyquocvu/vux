import { FC } from 'react';
import Link from 'next/link';

import { friendlyStr, timeFromNow } from 'utils/common';
import { Post } from 'interfaces/Post';
import TagChip from './TagChip';

type Props = {
  data: Post;
  onTagClick?: (tag: string) => void;
};

const PostRow: FC<Props> = ({ data, onTagClick }) => {
  const { title, updatedAt, thumbText, tags = [] } = data;
  const slug = `${friendlyStr(title)}.${data.uid}`;

  return (
    <article
      className={
        'group py-8 border-b border-hairline dark:border-surface-dark-elevated ' +
        'last:border-b-0 transition-colors duration-200'
      }
    >
      <time
        dateTime={new Date(updatedAt * 1000).toISOString()}
        className="font-body text-[11px] uppercase tracking-widest text-muted dark:text-muted-soft font-medium"
      >
        {timeFromNow(updatedAt)}
      </time>

      <h2 className="mt-2 font-display text-2xl md:text-3xl font-normal tracking-tight leading-tight">
        <Link
          href={`/post/${slug}`}
          className="text-ink dark:text-on-dark transition-colors duration-200 group-hover:text-primary"
        >
          {title}
        </Link>
      </h2>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              variant={onTagClick ? 'filter' : 'inline'}
              onClick={onTagClick ? () => onTagClick(tag) : undefined}
            />
          ))}
        </div>
      )}

      {thumbText && (
        <p
          className={
            'mt-4 font-body text-sm text-body dark:text-on-dark-soft leading-relaxed ' +
            'max-h-12 overflow-hidden group-hover:max-h-40 ' +
            'transition-[max-height] duration-300 ease-out'
          }
        >
          {thumbText}…
        </p>
      )}

      <Link
        href={`/post/${slug}`}
        className={
          'mt-3 inline-flex items-center gap-1 font-body text-sm font-medium ' +
          'text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ' +
          'transition-all duration-200'
        }
      >
        Read <span aria-hidden>→</span>
      </Link>
    </article>
  );
};

export default PostRow;
