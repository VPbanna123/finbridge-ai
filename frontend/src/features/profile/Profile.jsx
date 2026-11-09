import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import client from "../../api/client";
import { surveyApi, userApi } from "../../api/index";
import { translateOption } from "../../lib/utils";
import { languageNames } from "../../config/constants";
import ErrorMessage from "../../components/ui/ErrorMessage";

const readFileAsDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { u, updateUser } = useAuth();
  const fileRef = useRef(null);
  const [f, setF] = useState({ ...u, language: u?.language || "en" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("not_started");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await surveyApi.get();
        if (mounted) {
          setProfile(data.profile || null);
          setStatus(data.status || "not_started");
        }
      } catch {
        // non-fatal — profile still editable
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = (key, value) => setF((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const { data } = await client.patch("/users/profile", f);
      const updatedUser = data.user || f;
      updateUser(updatedUser);
      setF({ ...updatedUser, language: updatedUser.language || "en" });
      if (updatedUser.language) i18n.changeLanguage(updatedUser.language);
      setMessage(t("profile.updated"));
    } catch (e) {
      setError(e.response?.data?.message || t("profile.unableUpdate"));
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(file.type)) {
      setError(t("profile.photoTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("profile.photoSizeError"));
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");
      const dataUri = await readFileAsDataUri(file);
      const { data } = await userApi.updateProfilePhoto(dataUri);
      updateUser(data.user);
      setF((prev) => ({ ...prev, ...data.user }));
      setMessage(t("profile.photoUpdated"));
    } catch {
      setError(t("profile.photoError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const avatarUrl = f.profileImage?.url || u?.profileImage?.url;
  const initial = (u?.name || "U").charAt(0).toUpperCase();
  const displayText = (value) =>
    !value || value === "not_collected" ? t("common.notCollected") : value;

  return (
    <div className="content-page">
      <section className="page-hero profile-hero">
        <div>
          <span className="eyebrow">{t("profile.eyebrow")}</span>
          <h1>{t("profile.title")}</h1>
          <p>{t("profile.subtitle")}</p>
        </div>
        <button
          type="button"
          className="profile-avatar-large profile-avatar-button"
          onClick={() => fileRef.current?.click()}
          aria-label={t("profile.changePhoto")}
        >
          {avatarUrl ? <img src={avatarUrl} alt={u?.name || t("profile.title")} /> : initial}
          <span className="profile-avatar-badge">{uploading ? "…" : "📷"}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onPhoto}
          hidden
        />
      </section>

      <section className="profile-preview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("profile.surveyEyebrow")}</span>
            <h2>{t("profile.generatedTitle")}</h2>
          </div>
          <span className={`badge status-${status}`}>
            {t(`options.status.${status}`, { defaultValue: status })}
          </span>
        </div>
        {profile ? (
          <div className="preview-grid">
            <div><span>{t("profile.ageGroup")}</span><strong>{translateOption(t, "ageGroup", profile.demographics?.ageGroup)}</strong></div>
            <div><span>{t("profile.occupation")}</span><strong>{translateOption(t, "occupation", profile.demographics?.occupation)}</strong></div>
            <div><span>{t("profile.state")}</span><strong>{displayText(profile.demographics?.state)}</strong></div>
            <div><span>{t("profile.city")}</span><strong>{displayText(profile.demographics?.city)}</strong></div>
            <div><span>{t("profile.income")}</span><strong>{translateOption(t, "incomeRange", profile.financial?.incomeRange)}</strong></div>
            <div><span>{t("profile.savingsHabit")}</span><strong>{translateOption(t, "savingsHabit", profile.financial?.savingsHabit)}</strong></div>
            <div><span>{t("profile.spending")}</span><strong>{translateOption(t, "expenditurePattern", profile.financial?.expenditurePattern)}</strong></div>
            <div><span>{t("profile.upiUsage")}</span><strong>{translateOption(t, "upiUsage", profile.literacy?.upiUsage)}</strong></div>
            <div><span>{t("profile.digitalAwareness")}</span><strong>{translateOption(t, "digitalPaymentAwareness", profile.literacy?.digitalPaymentAwareness)}</strong></div>
            <div><span>{t("profile.financialSecurity")}</span><strong>{translateOption(t, "financialSecurityKnowledge", profile.literacy?.financialSecurityKnowledge)}</strong></div>
            <div><span>{t("profile.riskPreference")}</span><strong>{translateOption(t, "riskPreference", profile.riskPreference)}</strong></div>
            <div><span>{t("profile.needs")}</span><strong>{(profile.needs || []).map((n) => translateOption(t, "needs", n)).join(", ") || t("common.notCollected")}</strong></div>
          </div>
        ) : (
          <p className="muted">{t("profile.surveyEmpty")}</p>
        )}
        <div style={{ marginTop: 16 }}>
          <NavLink to="/survey" className="btn secondary">
            {status === "not_started" ? t("profile.takeSurvey") : t("profile.updateSurvey")}
          </NavLink>
        </div>
      </section>

      <form className="profile-form" onSubmit={submit}>
        <div className="profile-section">
          <div className="profile-section-heading">
            <span>👤</span>
            <div><h2>{t("profile.personalInfo")}</h2><p>{t("profile.personalInfoText")}</p></div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>{t("profile.name")}</span>
              <input className="input" value={f.name || ""} onChange={(e) => update("name", e.target.value)} />
            </label>
            <label className="field">
              <span>{t("profile.email")}</span>
              <input className="input" value={f.email || ""} disabled />
            </label>
            <label className="field">
              <span>{t("profile.state")}</span>
              <input className="input" placeholder={t("survey.statePlaceholder")} value={f.state || ""} onChange={(e) => update("state", e.target.value)} />
            </label>
            <label className="field">
              <span>{t("profile.language")}</span>
              <select
                className="input"
                value={f.language || "en"}
                onChange={(e) => {
                  update("language", e.target.value);
                  i18n.changeLanguage(e.target.value);
                }}
              >
                {Object.entries(languageNames).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <small className="muted">{t("profile.languageHelp")}</small>
            </label>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-heading">
            <span>📊</span>
            <div><h2>{t("profile.financialProfile")}</h2><p>{t("profile.financialProfileText")}</p></div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>{t("profile.ageGroup")}</span>
              <select className="input" value={f.ageGroup || ""} onChange={(e) => update("ageGroup", e.target.value)}>
                <option value="">{t("profile.selectAge")}</option>
                {["18-25","26-40","41-60","60+"].map((x) => (
                  <option key={x} value={x}>{translateOption(t, "ageGroup", x)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("profile.occupation")}</span>
              <select className="input" value={f.occupation || ""} onChange={(e) => update("occupation", e.target.value)}>
                <option value="">{t("profile.selectOccupation")}</option>
                {["student","salaried","small_business","farmer","daily_wage","homemaker","senior_citizen","other"].map((x) => (
                  <option key={x} value={x}>{translateOption(t, "occupation", x)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("profile.income")}</span>
              <select className="input" value={f.incomeRange || ""} onChange={(e) => update("incomeRange", e.target.value)}>
                <option value="">{t("profile.selectIncome")}</option>
                {["below_15000","15000_30000","30000_60000","above_60000"].map((x) => (
                  <option key={x} value={x}>{translateOption(t, "incomeRange", x)}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <ErrorMessage message={error} />
        {message && <div className="alert success-alert">✓ {message}</div>}
        <button className="btn primary" disabled={saving}>
          {saving ? t("common.saving") : t("profile.saveChanges")}
        </button>
      </form>
    </div>
  );
}
