import { useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import client from "../../api/client";
import { resendVerification } from "../../api/auth.api";
import { registerSchema, loginSchema } from "../../lib/schemas";

const readFileAsDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AuthPage({ register = false }) {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [f, setF] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [avatar, setAvatar] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendState, setResendState] = useState("");

  const schema = register ? registerSchema : loginSchema;

  const validateField = (key, value) => {
    let message = "";
    if (register && key === "confirmPassword") {
      message = value === f.password ? "" : t("auth.passwordsMismatch");
    } else if (key === "name" && !register) {
      message = "";
    } else if (schema.shape[key]) {
      const result = schema.shape[key].safeParse(value);
      message = result.success ? "" : result.error.issues[0].message;
    }
    setFieldErrors((prev) => ({ ...prev, [key]: message }));
  };

  const update = (key) => (e) => {
    const value = e.target.value;
    setF((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
    if (key === "password" && register && f.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: value === f.confirmPassword ? "" : t("auth.passwordsMismatch"),
      }));
    }
  };

  const blur = (key) => (e) => validateField(key, e.target.value.trim());

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(file.type)) {
      setAvatarError(t("auth.photoTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(t("auth.photoSizeError"));
      return;
    }
    setAvatarError("");
    try {
      setAvatar(await readFileAsDataUri(file));
    } catch {
      setAvatarError(t("auth.photoTypeError"));
    }
  };

  const resend = async (email) => {
    setResendState("");
    try {
      await resendVerification(email);
      setResendState(t("auth.resendSent"));
    } catch {
      setResendState(t("auth.resendFailed"));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setUnverifiedEmail("");
    setResendState("");

    const payload = register
      ? { name: f.name.trim(), email: f.email.trim(), password: f.password }
      : { email: f.email.trim(), password: f.password };
    if (register && avatar) payload.profileImage = avatar;

    const errors = {};
    const parsed = schema.safeParse({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });
    if (!parsed.success) {
      parsed.error.issues.forEach((iss) => {
        errors[iss.path[0]] = iss.message;
      });
    }
    if (register && f.password !== f.confirmPassword) {
      errors.confirmPassword = t("auth.passwordsMismatch");
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setErr(t("auth.fixFields"));
      return;
    }

    try {
      setLoading(true);
      const { data } = await client.post(
        `/auth/${register ? "register" : "login"}`,
        payload
      );

      if (data.requiresVerification) {
        nav(`/verify-email?email=${encodeURIComponent(payload.email)}`);
        return;
      }

      if (data.user?.language) i18n.changeLanguage(data.user.language);
      login(data);
      nav("/dashboard");
    } catch (e) {
      const data = e.response?.data;
      const msg = data?.message || t("auth.unableRequest");
      if (data?.errors?.length) {
        const fe = {};
        data.errors.forEach((er) => (fe[er.field] = er.message));
        setFieldErrors(fe);
      }
      if (data?.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(payload.email);
        setErr(t("auth.emailNotVerified"));
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const pwdType = showPassword ? "text" : "password";

  return (
    <div className="auth-shell">
      <select
        className="auth-language-select"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label={t("profile.language")}
      >
        <option value="en">EN</option>
        <option value="hi">हिंदी</option>
        <option value="kn">ಕನ್ನಡ</option>
      </select>
      <div className="auth-background-shape shape-one" />
      <div className="auth-background-shape shape-two" />
      <div className="auth-layout">
        <div className="auth-brand-panel">
          <div className="brand-mark large">F</div>
          <h1>FinBridge AI</h1>
          <p>{t("auth.brandTagline")}</p>
          <div className="auth-feature-list">
            <div><span>🏦</span><span>{t("auth.featureServices")}</span></div>
            <div><span>🏛️</span><span>{t("auth.featureSchemes")}</span></div>
            <div><span>📊</span><span>{t("auth.featureExpenses")}</span></div>
            <div><span>🌐</span><span>{t("auth.featureLanguage")}</span></div>
          </div>
        </div>

        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="mobile-brand">
            <div className="brand-mark">F</div>
            <span>FinBridge AI</span>
          </div>

          <div className="auth-card-header">
            <span className="eyebrow">
              {register ? t("auth.getStarted") : t("auth.welcomeBackEyebrow")}
            </span>
            <h2>{register ? t("auth.createAccount") : t("auth.welcomeBack")}</h2>
            <p>{register ? t("auth.createAccountSubtitle") : t("auth.signInSubtitle")}</p>
          </div>

          {register && (
            <div className="auth-avatar-picker">
              <button
                type="button"
                className="auth-avatar-button"
                onClick={() => fileRef.current?.click()}
                aria-label={t("auth.addPhoto")}
              >
                {avatar ? (
                  <img src={avatar} alt={t("auth.addPhoto")} />
                ) : (
                  <span>{f.name.trim().charAt(0).toUpperCase() || "👤"}</span>
                )}
                <span className="auth-avatar-badge">+</span>
              </button>
              <div>
                <strong>{avatar ? t("auth.changePhoto") : t("auth.addPhoto")}</strong>
                <p className="muted">{t("auth.photoOptional")}</p>
                {avatarError && <small className="field-error">{avatarError}</small>}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFile}
                hidden
              />
            </div>
          )}

          {register && (
            <label className="field">
              <span>{t("auth.name")}</span>
              <input
                className={`input ${fieldErrors.name ? "input-error" : ""}`}
                placeholder={t("auth.namePlaceholder")}
                autoComplete="name"
                value={f.name}
                onChange={update("name")}
                onBlur={blur("name")}
              />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
            </label>
          )}

          <label className="field">
            <span>{t("auth.email")}</span>
            <input
              className={`input ${fieldErrors.email ? "input-error" : ""}`}
              placeholder={t("auth.emailPlaceholder")}
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={update("email")}
              onBlur={blur("email")}
            />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </label>

          <label className="field">
            <span>{t("auth.password")}</span>
            <div className="password-input">
              <input
                className={`input ${fieldErrors.password ? "input-error" : ""}`}
                placeholder={
                  register ? t("auth.passwordNewPlaceholder") : t("auth.passwordPlaceholder")
                }
                type={pwdType}
                autoComplete={register ? "new-password" : "current-password"}
                value={f.password}
                onChange={update("password")}
                onBlur={blur("password")}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? t("auth.hide") : t("auth.show")}
              </button>
            </div>
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
          </label>

          {register && (
            <label className="field">
              <span>{t("auth.confirmPassword")}</span>
              <input
                className={`input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                placeholder={t("auth.confirmPlaceholder")}
                type={pwdType}
                autoComplete="new-password"
                value={f.confirmPassword}
                onChange={update("confirmPassword")}
                onBlur={blur("confirmPassword")}
              />
              {fieldErrors.confirmPassword && (
                <small className="field-error">{fieldErrors.confirmPassword}</small>
              )}
            </label>
          )}

          {err && (
            <div className="alert error-alert">
              <span>⚠️</span>
              <span>{err}</span>
            </div>
          )}

          {unverifiedEmail && (
            <div className="auth-resend-row">
              {resendState ? (
                <span className="muted">{resendState}</span>
              ) : (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => resend(unverifiedEmail)}
                >
                  {t("auth.resendVerification")}
                </button>
              )}
            </div>
          )}

          <button className="btn primary full-width" disabled={loading}>
            {loading
              ? t("common.pleaseWait")
              : register
              ? t("auth.createAccountBtn")
              : t("auth.signInBtn")}
          </button>

          <div className="auth-switch">
            {register ? (
              <>
                {t("auth.haveAccount")} <NavLink to="/login"> {t("nav.login")}</NavLink>
              </>
            ) : (
              <>
                {t("auth.noAccount")} <NavLink to="/register"> {t("auth.createOne")}</NavLink>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
