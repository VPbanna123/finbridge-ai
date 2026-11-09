import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resendVerification, verifyEmail } from "../../api/auth.api";

const errorMessage = (error, t) => {
  const data = error.response?.data;
  switch (data?.code) {
    case "VERIFICATION_CODE_EXPIRED":
      return t("auth.codeExpired");
    case "VERIFICATION_TOO_MANY_ATTEMPTS":
      return t("auth.codeTooMany");
    case "INVALID_VERIFICATION_CODE":
      return t("auth.codeInvalid");
    case "EMAIL_ALREADY_VERIFIED":
      return t("auth.alreadyVerified");
    case "VERIFICATION_CODE_REQUIRED":
      return t("auth.codeRequired");
    default:
      return data?.message || t("auth.verifyFailed");
  }
};

export default function VerifyCodeForm({ email, onVerified }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("auth.codeRequired"));
      return;
    }
    try {
      setLoading(true);
      const { data } = await verifyEmail({ email, code: code.trim() });
      onVerified?.(data);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setNotice("");
    if (!email) {
      setError(t("auth.emailRequired"));
      return;
    }
    try {
      setResending(true);
      await resendVerification(email);
      setNotice(t("auth.resendSent"));
    } catch {
      setError(t("auth.resendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="auth-code-form" onSubmit={submit} noValidate>
      <label className="field">
        <span>{t("auth.verificationCode")}</span>
        <input
          className="input code-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder={t("auth.codePlaceholder")}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-label={t("auth.verificationCode")}
          autoFocus
        />
      </label>
      {error && <div className="alert error-alert">{error}</div>}
      {notice && <div className="alert success-alert">✓ {notice}</div>}
      <button type="submit" className="btn primary full-width" disabled={loading || resending}>
        {loading ? t("auth.verifyingCode") : t("auth.verifyCode")}
      </button>
      <button
        type="button"
        className="btn secondary full-width"
        onClick={resend}
        disabled={loading || resending}
      >
        {resending ? t("common.pleaseWait") : t("auth.resendVerification")}
      </button>
    </form>
  );
}
