import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import { blogApi } from "../../api/index";
import { blogSchema, validateWith } from "../../lib/schemas";
import Loading from "../../components/ui/Loading";
import ErrorMessage from "../../components/ui/ErrorMessage";
import EmptyState from "../../components/ui/EmptyState";
import Whiteboard from "./Whiteboard";

const readFileAsDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function BlogEditor() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const nav = useNavigate();
  const { u } = useAuth();
  const isAdmin = u?.role === "admin";
  const editing = Boolean(slug);

  const fileRef = useRef(null);
  const [form, setForm] = useState({ title: "", content: "", published: true });
  const [blogId, setBlogId] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!editing) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await blogApi.getBySlug(slug);
        if (!mounted) return;
        setForm({
          title: data.blog.title,
          content: data.blog.content,
          published: data.blog.published !== false,
        });
        setBlogId(data.blog._id);
        setExistingImageUrl(data.blog.image?.url || "");
      } catch (e) {
        if (mounted) setError(e.response?.data?.message || t("editor.unableLoad"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editing, slug]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("editor.imageTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("editor.imageSizeError"));
      return;
    }
    setError("");
    const dataUri = await readFileAsDataUri(file);
    setNewImage(dataUri);
    setRemoveImage(false);
  };

  const onWhiteboardSave = (dataUri) => {
    setNewImage(dataUri);
    setRemoveImage(false);
    setWhiteboardOpen(false);
  };

  const clearImage = () => {
    setNewImage(null);
    if (fileRef.current) fileRef.current.value = "";
    if (existingImageUrl) setRemoveImage(true);
    else setRemoveImage(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const { data: valid, fieldErrors: errs } = validateWith(blogSchema, {
      title: form.title,
      content: form.content,
    });
    if (!valid) {
      setFieldErrors(errs);
      setError(t("editor.fixFields"));
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        published: form.published,
      };
      if (newImage) payload.image = newImage;
      else if (removeImage) payload.image = "";

      const { data } = editing
        ? await blogApi.update(blogId, payload)
        : await blogApi.create(payload);
      nav(`/blogs/${data.blog.slug}`, { replace: true });
    } catch (e2) {
      const apiErrors = e2.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setFieldErrors(Object.fromEntries(apiErrors.map((x) => [x.field, x.message])));
      }
      setError(e2.response?.data?.message || t("editor.unableSave"));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <EmptyState
        icon="🔒"
        title={t("editor.adminOnlyTitle")}
        text={t("editor.adminOnlyText")}
      />
    );
  }

  if (loading) return <Loading text={t("editor.loading")} />;

  return (
    <div className="content-page">
      <span className="back-link" onClick={() => nav(-1)} role="button">
        {t("editor.back")}
      </span>

      <section className="page-hero blog-hero">
        <div>
          <span className="eyebrow">{t("editor.eyebrow")}</span>
          <h1>{editing ? t("editor.editTitle") : t("editor.newTitle")}</h1>
          <p>{t("editor.subtitle")}</p>
        </div>
        <div className="hero-icon">✍️</div>
      </section>

      <ErrorMessage message={error} />

      <form className="profile-form" onSubmit={submit}>
        <label className="field">
          <span>{t("editor.title")}</span>
          <input
            className="input"
            value={form.title}
            maxLength={160}
            placeholder={t("editor.titlePlaceholder")}
            onChange={(e) => set("title", e.target.value)}
          />
          {fieldErrors.title && <small className="field-error">{fieldErrors.title}</small>}
        </label>

        <label className="field" style={{ marginTop: 16 }}>
          <span>{t("editor.content")}</span>
          <textarea
            className="input blog-content-input"
            rows={12}
            value={form.content}
            placeholder={t("editor.contentPlaceholder")}
            onChange={(e) => set("content", e.target.value)}
          />
          {fieldErrors.content && <small className="field-error">{fieldErrors.content}</small>}
        </label>

        <div className="profile-section" style={{ marginTop: 24, paddingTop: 0, borderTop: 0 }}>
          <div className="profile-section-heading">
            <span>🖼️</span>
            <div>
              <h2>{t("editor.coverImage")}</h2>
              <p>{t("editor.coverText")}</p>
            </div>
          </div>

          <div className="image-editor">
            <div className="image-preview">
              {newImage ? (
                <img src={newImage} alt={t("editor.coverImage")} />
              ) : !removeImage && existingImageUrl ? (
                <img src={existingImageUrl} alt={t("editor.coverImage")} />
              ) : (
                <span className="muted">{t("editor.noImage")}</span>
              )}
            </div>
            <div className="image-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFile}
                hidden
                id="blog-image-input"
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => fileRef.current?.click()}
              >
                {t("editor.uploadImage")}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setWhiteboardOpen(true)}
              >
                {t("editor.openWhiteboard")}
              </button>
              {(newImage || (!removeImage && existingImageUrl)) && (
                <button type="button" className="btn danger" onClick={clearImage}>
                  {t("editor.removeImage")}
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="field checkbox-field" style={{ marginTop: 16 }}>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          <span>{t("editor.publishNow")}</span>
        </label>

        <div className="survey-actions">
          <button className="btn primary" disabled={saving}>
            {saving ? t("editor.saving") : editing ? t("editor.update") : t("editor.publish")}
          </button>
          <button type="button" className="btn secondary" onClick={() => nav(-1)}>
            {t("common.cancel")}
          </button>
        </div>
      </form>

      {whiteboardOpen && (
        <Whiteboard onClose={() => setWhiteboardOpen(false)} onSave={onWhiteboardSave} />
      )}
    </div>
  );
}
