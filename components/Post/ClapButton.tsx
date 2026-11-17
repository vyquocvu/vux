import { FC, useCallback, useEffect, useState } from "react";

const MAX_CLAPS = 50;
const STORAGE_PREFIX = "claps:";

type Props = {
  postUid: string;
};

const ClapButton: FC<Props> = ({ postUid }) => {
  const [count, setCount] = useState(0);
  const [localClaps, setLocalClaps] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_PREFIX + postUid) || 0);
    setLocalClaps(stored);

    fetch(`/api/posts/${postUid}/claps`)
      .then((r) => r.json() as Promise<{ count?: number }>)
      .then((data) => {
        setCount(data.count ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postUid]);

  const handleClap = useCallback(async () => {
    if (localClaps >= MAX_CLAPS) return;
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);

    try {
      const res = await fetch(`/api/posts/${postUid}/claps`, { method: "POST" });
      const data = await res.json() as { count?: number };
      if (res.status === 429) {
        setLocalClaps(MAX_CLAPS);
        localStorage.setItem(STORAGE_PREFIX + postUid, String(MAX_CLAPS));
        if (typeof data.count === "number") setCount(data.count);
        return;
      }
      if (!res.ok) return;
      setCount(data.count ?? count + 1);
    } catch {
      return;
    }

    const next = localClaps + 1;
    setLocalClaps(next);
    localStorage.setItem(STORAGE_PREFIX + postUid, String(next));
  }, [postUid, localClaps, count]);

  return (
    <div className="post-applause flex items-center gap-3 max-w-4xl w-full mx-auto px-8 py-2">
      <button
        type="button"
        onClick={handleClap}
        disabled={localClaps >= MAX_CLAPS}
        className={`
          group relative flex items-center justify-center w-12 h-12 rounded-full
          border border-hairline dark:border-surface-dark-elevated
          transition-all duration-200 cursor-pointer
          hover:border-primary dark:hover:border-primary
          disabled:opacity-40 disabled:cursor-default
          ${bouncing ? "scale-125" : "scale-100"}
        `}
        aria-label={`Clap ${count} times`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-colors duration-200 ${localClaps > 0 ? "text-primary" : "text-muted dark:text-muted-soft"} group-hover:text-primary`}
        >
          <path
            d="M12 2C11.2 2 10.5 2.5 10.2 3.2L8 9H5.5C4.7 9 4 9.7 4 10.5C4 11.3 4.7 12 5.5 12H7.2L5.1 18.3C4.9 19.1 5.3 19.9 6.1 20.1C6.9 20.3 7.7 19.9 7.9 19.1L10.2 12H13.8L16.1 19.1C16.3 19.9 17.1 20.3 17.9 20.1C18.7 19.9 19.1 19.1 18.9 18.3L16.8 12H18.5C19.3 12 20 11.3 20 10.5C20 9.7 19.3 9 18.5 9H16L13.8 3.2C13.5 2.5 12.8 2 12 2Z"
            fill="currentColor"
          />
        </svg>
        {bouncing && (
          <span className="absolute -top-1 -right-1 text-primary font-body text-xs font-bold animate-ping">
            +1
          </span>
        )}
      </button>
      <span className="font-body text-sm text-muted dark:text-muted-soft tabular-nums min-w-[2ch]">
        {loading ? "…" : count}
      </span>
    </div>
  );
};

export default ClapButton;
