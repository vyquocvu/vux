import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { friendlyStr, timeFromNow } from 'utils/common';
import { Post } from 'interfaces/Post';
import TagChip from './TagChip';

type Props = {
  data: Post;
  onTagClick?: (tag: string) => void;
};

const formatDate = (second: number): string => {
  const d = new Date(second * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const PostRow: FC<Props> = ({ data, onTagClick }) => {
  const { title, updatedAt, thumbText, thumbImage, tags = [] } = data;
  const slug = `${friendlyStr(title)}.${data.uid}`;

  return (
    <article className="group border-b border-hairline dark:border-surface-dark-elevated py-7 last:border-b-0">
      <div className={thumbImage ? 'md:grid md:grid-cols-[minmax(0,1fr)_11rem] md:gap-6' : ''}>
        <div className="min-w-0">
          <p className="font-body text-[11px] uppercase tracking-widest text-muted dark:text-muted-soft font-medium">
            <time dateTime={new Date(updatedAt * 1000).toISOString()}>{formatDate(updatedAt)}</time>
            <span className="text-muted-soft"> · {timeFromNow(updatedAt)}</span>
          </p>

          <h2 className="mt-2 font-display text-2xl md:text-[1.75rem] font-normal tracking-tight leading-[1.2]">
            <Link href={`/post/${slug}`} className="text-ink dark:text-on-dark transition-colors duration-200 group-hover:text-primary">
              {title}
            </Link>
          </h2>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
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
            <p className="mt-3 font-body text-sm text-body dark:text-on-dark-soft leading-relaxed line-clamp-2">
              {thumbText}
            </p>
          )}

          <Link
            href={`/post/${slug}`}
            className="mt-3 inline-flex items-center gap-1 font-body text-sm font-medium text-primary hover:text-primary-active transition-colors duration-200"
          >
            Đọc bài <span aria-hidden>→</span>
          </Link>
        </div>

        {thumbImage && (
          <div className="hidden md:block overflow-hidden rounded-md border border-hairline dark:border-surface-dark-elevated">
            <Image
              src={thumbImage}
              alt=""
              width={448}
              height={280}
              unoptimized
              className="w-full h-full object-cover aspect-[16/10]"
            />
          </div>
        )}
      </div>
    </article>
  );
};

export default PostRow;
