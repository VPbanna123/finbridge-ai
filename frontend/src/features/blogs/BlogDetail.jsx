import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import { blogApi } from "../../api/index";
import { commentSchema, validateWith } from "../../lib/schemas";
import { formatDate } from "../../lib/utils";
import RichText from "../../lib/markdown";
import Loading from "../../components/ui/Loading";
import ErrorMessage from "../../components/ui/ErrorMessage";
import EmptyState from "../../components/ui/EmptyState";

export default function BlogDetail() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const nav = useNavigate();
  const { u } = useAuth();
  const isAdmin = u?.role === "admin";

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await blogApi.getBySlug(slug);
      setBlog(data.blog);
      setComments(data.comments || []);
    } catch (e) {
      setError(e.response?.data?.message || t("blogDetail.unableLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const addComment = async (e) => {
    e.preventDefault();
    const { data: valid, fieldErrors } = validateWith(commentSchema, { text });
    if (!valid) {
      setCommentError(fieldErrors.text || t("blogDetail.invalidComment"));
      return;
    }
    try {
      setPosting(true);
      setCommentError("");
      const { data } = await blogApi.addComment(blog._id, text.trim());
      setComments((prev) => [
        ...prev,
        { ...data.comment, authorName: u?.name || t("common.you") },
      ]);
      setText("");
    } catch (e2) {
      setCommentError(e2.response?.data?.message || t("blogDetail.unableComment"));
    } finally {
      setPosting(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await blogApi.removeComment(blog._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (e) {
      setCommentError(e.response?.data?.message || t("blogDetail.unableDeleteComment"));
    }
  };

  const deleteBlog = async () => {
    if (!window.confirm(t("blogDetail.deleteConfirm"))) return;
    try {
      await blogApi.remove(blog._id);
      nav("/blogs", { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || t("blogDetail.unableDeleteBlog"));
    }
  };

  if (loading) return <Loading text={t("blogDetail.loading")} />;
  if (error) return <ErrorMessage message={error} />;
  if (!blog)
    return (
      <EmptyState icon="📰" title={t("blogDetail.notFoundTitle")} text={t("blogDetail.notFoundText")} />
    );

  return (
    <div className="content-page">
      <NavLink to="/blogs" className="back-link">
        {t("blogDetail.back")}
      </NavLink>

      <article className="blog-article">
        <header className="blog-article-head">
          <div className="blog-meta">
            <span>{blog.authorName || t("blogDetail.defaultAuthor")}</span>
            <span>{formatDate(blog.createdAt, i18n.language)}</span>
          </div>
          <h1>{blog.title}</h1>
          {isAdmin && (
            <div className="blog-owner-actions">
              <NavLink to={`/blogs/${blog.slug}/edit`} className="btn secondary">
                Edit
              </NavLink>
              <button type="button" className="btn danger" onClick={deleteBlog}>
                Delete
              </button>
            </div>
          )}
        </header>

        {blog.image?.url && (
          <div className="blog-article-image">
            <img src={blog.image.url} alt={blog.title} />
          </div>
        )}

        <RichText className="blog-content" text={blog.content} />
      </article>

      <section className="comments-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("blogDetail.discussion")}</span>
            <h2>{t("blogDetail.comments", { count: comments.length })}</h2>
          </div>
        </div>

        <form className="comment-form" onSubmit={addComment}>
          <textarea
            className="input comment-input"
            placeholder={t("blogDetail.sharePlaceholder")}
            value={text}
            maxLength={1000}
            onChange={(e) => {
              setText(e.target.value);
              setCommentError("");
            }}
          />
          <button className="btn primary" disabled={posting}>
            {posting ? t("blogDetail.posting") : t("blogDetail.postComment")}
          </button>
        </form>
        {commentError && <div className="alert error-alert">⚠️ {commentError}</div>}

        {comments.length === 0 ? (
          <p className="muted">{t("blogDetail.noComments")}</p>
        ) : (
          <ul className="comment-list">
            {comments.map((c) => {
              const myId = String(u?._id || u?.id || "");
              const ownerId = String(c.userId?._id || c.userId || "");
              const canDelete = isAdmin || (myId && ownerId === myId);
              return (
                <li className="comment-item" key={c._id}>
                  <div className="comment-avatar">
                    {(c.authorName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <strong>{c.authorName || t("common.user")}</strong>
                      <span>{formatDate(c.createdAt, i18n.language)}</span>
                    </div>
                    <p>{c.text}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      className="comment-delete"
                      onClick={() => removeComment(c._id)}
                      title={t("blogDetail.deleteComment")}
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
