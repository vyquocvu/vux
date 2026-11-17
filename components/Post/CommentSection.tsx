import { FC, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUserInfo } from "utils/auth/hooks";
import { timeFromNow } from "utils/common";

interface Comment {
  id: string;
  postUid: string;
  authorId: string | null;
  authorName: string;
  content: string;
  createdAt: number;
}

type Props = {
  postUid: string;
};

const CommentSection: FC<Props> = ({ postUid }) => {
  const { AuthUser } = useAuthUserInfo();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postUid}/comments`);
      const data = await res.json() as { comments?: Comment[] };
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postUid]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postUid}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json() as { comment?: Comment; error?: string };
      if (res.ok) {
        if (data.comment) setComments((prev) => [...prev, data.comment!]);
        setContent("");
      } else {
        setError(data.error || "Đã có lỗi xảy ra");
      }
    } catch {
      setError("Không thể gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-8 pb-12">
      <hr className="mt-12 mb-6 border-hairline dark:border-surface-dark-elevated" />
      <h2 className="font-display text-2xl font-normal mb-6 text-ink dark:text-on-dark tracking-tight">
        Comments
      </h2>

      {AuthUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận..."
            rows={3}
            className="w-full px-3.5 py-2.5 border border-hairline dark:border-surface-dark-elevated rounded-lg bg-canvas dark:bg-surface-dark text-ink dark:text-on-dark font-body text-sm resize-vertical focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors duration-200"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="px-4 py-2 bg-primary text-on-primary font-body text-sm font-medium rounded-lg border-none cursor-pointer transition-colors duration-200 hover:bg-primary-active disabled:opacity-40 disabled:cursor-default"
            >
              {submitting ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
          {error && (
            <p className="mt-2 font-body text-sm text-error">{error}</p>
          )}
        </form>
      ) : (
        <p className="mb-8 font-body text-sm text-muted dark:text-muted-soft">
          <Link href="/login" className="text-primary hover:text-primary-active transition-colors duration-200">
            Đăng nhập
          </Link>{" "}
          để bình luận.
        </p>
      )}

      {loading ? (
        <p className="font-body text-sm text-muted dark:text-muted-soft">Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p className="font-body text-sm text-muted dark:text-muted-soft italic">Chưa có bình luận nào.</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div
              key={c.id}
              className="group border border-hairline dark:border-surface-dark-elevated rounded-lg p-4 bg-canvas dark:bg-surface-dark"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-medium text-ink dark:text-on-dark">
                    {c.authorName}
                  </span>
                  <span className="font-body text-xs text-muted-soft dark:text-on-dark-soft">
                    {timeFromNow(c.createdAt)}
                  </span>
                </div>
                {AuthUser && (AuthUser.isAdmin || AuthUser.id === c.authorId) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 font-body text-xs text-muted dark:text-muted-soft hover:text-error transition-all duration-200 cursor-pointer bg-transparent border-none"
                    aria-label="Xoá bình luận"
                  >
                    Xoá
                  </button>
                )}
              </div>
              <p className="font-body text-sm text-body dark:text-on-dark-soft leading-relaxed whitespace-pre-wrap break-words m-0">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
