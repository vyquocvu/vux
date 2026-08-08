import { FC, useMemo, useState } from 'react';

import { Post } from 'interfaces/Post';
import PostRow from './PostRow';
import TagChip from './TagChip';

type Props = {
  items: Post[];
};

const normalize = (tag: string) => tag.trim().toLowerCase();

const Feed: FC<Props> = ({ items = [] }) => {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of items) {
      for (const tag of post.tags || []) {
        const key = normalize(tag);
        if (!key) continue;
        if (!seen.has(key)) seen.set(key, tag);
      }
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, display]) => display);
  }, [items]);

  const filtered = useMemo(() => {
    if (!activeTag) return items;
    const key = normalize(activeTag);
    return items.filter((p) => (p.tags || []).some((t) => normalize(t) === key));
  }, [items, activeTag]);

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev && normalize(prev) === normalize(tag) ? null : tag));
  };

  if (items.length === 0) {
    return (
      <p className="font-body text-sm text-muted dark:text-muted-soft py-12 text-center">
        No posts yet.
      </p>
    );
  }

  return (
    <div className="feed">
      {allTags.length > 0 && (
        <div
          className="mb-8 -mx-1 px-1 py-1 flex flex-wrap gap-2"
          role="toolbar"
          aria-label="Filter posts by tag"
        >
          <TagChip
            label="All"
            variant="filter"
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              variant="filter"
              active={activeTag !== null && normalize(activeTag) === normalize(tag)}
              onClick={() => handleTagClick(tag)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="font-body text-sm text-muted dark:text-muted-soft py-12 text-center">
          No posts tagged{' '}
          <span className="text-ink dark:text-on-dark font-medium">{activeTag}</span>.{' '}
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className="text-primary hover:text-primary-active underline underline-offset-2"
          >
            Clear filter
          </button>
        </p>
      ) : (
        <div className="border-t border-hairline dark:border-surface-dark-elevated">
          {filtered.map((post) => (
            <PostRow key={post.uid} data={post} onTagClick={handleTagClick} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
