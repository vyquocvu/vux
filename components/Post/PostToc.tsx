import { FC } from 'react';
import type { TocEntry } from 'utils/toc';

type Props = {
  toc: TocEntry[];
  variant: 'rail' | 'details';
  activeId?: string;
};

const link =
  'block border-l-2 pl-3 font-body leading-snug transition-colors duration-200 ' +
  'border-hairline dark:border-surface-dark-elevated ' +
  'text-muted dark:text-on-dark-soft hover:text-primary';
const active =
  'border-primary text-primary dark:text-primary font-medium';

/**
 * `h4` is folded into the `h3` indent: three visible levels makes a 14-heading
 * article unreadable in a 16rem rail.
 */
const PostToc: FC<Props> = ({ toc, variant, activeId = '' }) => {
  if (toc.length < 2) return null;

  const list = (
    <ol className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
      {toc.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            aria-current={activeId === entry.id ? 'true' : undefined}
            className={`${link} ${entry.level >= 3 ? 'ml-3 text-[12px]' : 'text-[13px]'} ${
              activeId === entry.id ? active : ''
            }`}
          >
            {entry.label}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === 'details') {
    return (
      <details className="mb-8 rounded-md border border-hairline dark:border-surface-dark-elevated bg-surface-soft dark:bg-surface-dark-soft">
        <summary className="cursor-pointer select-none px-4 py-3 font-body text-[11px] uppercase tracking-widest text-muted dark:text-muted-soft font-medium">
          Mục lục · {toc.length} phần
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    );
  }

  return (
    <nav aria-label="Mục lục">
      <p className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium mb-3">
        Mục lục
      </p>
      {list}
    </nav>
  );
};

export default PostToc;
