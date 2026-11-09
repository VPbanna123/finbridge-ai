import { useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import VerifyCodeForm from "./VerifyCodeForm";

export default function VerifyEmail() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [verified, setVerified] = useState(false);

  const handleVerified = (data) => {
    if (data.user?.language) i18n.changeLanguage(data.user.language);
    login(data);
    setVerified(true);
    setTimeout(() => {
      nav("/dashboard", { replace: true });
    }, 1500);
  };

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
        <div className="auth-card auth-card-centered">
          {!verified && (
            <>
              <div className="auth-success-icon">✉️</div>
              <div className="auth-card-header">
                <span className="eyebrow">{t("auth.verifyTitle")}</span>
                <h2>{t("auth.verifyTitle")}</h2>
                <p>{t("auth.verifyText")}</p>
              </div>
              {email ? (
                <VerifyCodeForm email={email} onVerified={handleVerified} />
              ) : (
                <div className="alert error-alert">
                  {t("auth.emailRequired")}
                </div>
              )}
              <NavLink to="/login" className="btn primary full-width auth-secondary-action">
                {t("auth.backToLogin")}
              </NavLink>
            </>
          )}
          {verified && (
            <>
              <div className="auth-success-icon">✅</div>
              <div className="auth-card-header">
                <span className="eyebrow">{t("auth.emailVerifiedTitle")}</span>
                <h2>{t("auth.emailVerifiedTitle")}</h2>
                <p>{t("auth.emailVerifiedText")}</p>
              </div>
              <NavLink to="/dashboard" className="btn primary full-width">
                {t("auth.goToDashboard")}
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
