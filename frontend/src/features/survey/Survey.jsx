import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import { surveyApi } from "../../api/index";
import { surveySchema, validateWith, SURVEY_OPTIONS } from "../../lib/schemas";
import { translateOption } from "../../lib/utils";
import Loading from "../../components/ui/Loading";
import ErrorMessage from "../../components/ui/ErrorMessage";

const GOAL_OPTIONS = [
  "emergency_fund",
  "education",
  "retirement",
  "buy_home",
  "start_business",
  "health",
  "debt_free",
  "travel",
];

const goalLabel = (g) =>
  g.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const EMPTY = {
  ageGroup: "",
  occupation: "",
  state: "",
  city: "",
  incomeRange: "",
  savingsHabit: "",
  expenditurePattern: "",
  upiUsage: "",
  digitalPaymentAwareness: "",
  financialSecurityKnowledge: "",
  needs: [],
  goals: [],
  riskPreference: "",
};

export default function Survey() {
  const { t } = useTranslation();
  const { u } = useAuth();
  const label = (group, value) => translateOption(t, group, value);
  const goalText = (goal) =>
    t(`options.goals.${goal}`, { defaultValue: goalLabel(goal) });
  const statusLabel = (value) =>
    t(`options.status.${value}`, { defaultValue: value });
  const accountSuffix = u?.name ? `, ${u.name.split(" ")[0]}` : "";
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("not_started");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await surveyApi.get();
        if (!mounted) return;
        if (data.responses) {
          setForm({
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(data.responses).filter(([k]) => k in EMPTY)
            ),
            needs: data.responses.needs || [],
            goals: data.responses.goals || [],
          });
        }
        setStatus(data.status || "not_started");
        setProfile(data.profile || null);
      } catch (e) {
        if (mounted) setError(e.response?.data?.message || t("survey.unableLoad"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleArray = (key, value) => {
    setForm((prev) => {
      const current = prev[key] || [];
      let next;
      if (value === "none") {
        next = current.includes("none") ? [] : ["none"];
      } else {
        const withoutNone = current.filter((x) => x !== "none");
        next = withoutNone.includes(value)
          ? withoutNone.filter((x) => x !== value)
          : [...withoutNone, value];
      }
      return { ...prev, [key]: next };
    });
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleGoal = (goal) => {
    setForm((prev) => {
      const current = prev.goals || [];
      return {
        ...prev,
        goals: current.includes(goal)
          ? current.filter((g) => g !== goal)
          : [...current, goal],
      };
    });
  };

  const payloadFromForm = () => {
    const payload = {};
    for (const key of Object.keys(EMPTY)) {
      const value = form[key];
      if (Array.isArray(value)) {
        payload[key] = value;
      } else payload[key] = value === "" || value === undefined ? null : value.trim();
    }
    return payload;
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = payloadFromForm();
    const { data: valid, fieldErrors: errs } = validateWith(surveySchema, payload);
    if (!valid) {
      setFieldErrors(errs);
      setError(t("survey.fixFields"));
      setMessage("");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      setFieldErrors({});
      const { data } = await surveyApi.submit(payload);
      setStatus(data.status);
      setProfile(data.profile);
      setMessage(t("survey.saved"));
    } catch (e2) {
      const apiErrors = e2.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setFieldErrors(
          Object.fromEntries(apiErrors.map((x) => [x.field, x.message]))
        );
      }
      setError(e2.response?.data?.message || t("survey.unableSave"));
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    try {
      setRegenerating(true);
      setError("");
      setMessage("");
      const { data } = await surveyApi.regenerateProfile();
      setProfile(data.profile);
      setStatus(data.status);
      setMessage(t("survey.regenerated"));
    } catch (e) {
      setError(e.response?.data?.message || t("survey.unableRegenerate"));
    } finally {
      setRegenerating(false);
    }
  };

  const selectField = (group, key, placeholder) => (
    <label className="field">
      <span>{placeholder}</span>
      <select className="input" value={form[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">{t("common.select")}</option>
        {SURVEY_OPTIONS[group].map((opt) => (
          <option key={opt} value={opt}>
            {label(group, opt)}
          </option>
        ))}
      </select>
      {fieldErrors[key] && <small className="field-error">{fieldErrors[key]}</small>}
    </label>
  );

  const chipGroup = (group, key) => (
    <div className="chip-group">
      {SURVEY_OPTIONS[group].map((opt) => {
        const active = (form[key] || []).includes(opt);
        return (
          <button
            type="button"
            key={opt}
            className={`chip ${active ? "active" : ""}`}
            onClick={() => toggleArray(key, opt)}
          >
            {label(group, opt)}
          </button>
        );
      })}
    </div>
  );

  if (loading) return <Loading text={t("survey.loading")} />;

  return (
    <div className="content-page">
      <section className="page-hero survey-hero">
        <div>
          <span className="eyebrow">{t("survey.eyebrow")}</span>
          <h1>{t("survey.title")}</h1>
          <p>{t("survey.subtitle", { name: accountSuffix })}</p>
        </div>
        <div className="hero-icon">📝</div>
      </section>

      <div className={`survey-status ${status}`}>
        <span className="status-dot" />
        <strong>{t("survey.profileStatus")}</strong> {statusLabel(status)}
        {status !== "complete" && (
          <span className="muted"> {t("survey.statusHint")}</span>
        )}
      </div>

      <ErrorMessage message={error} />
      {message && <div className="alert success-alert">✓ {message}</div>}

      <form className="profile-form" onSubmit={submit}>
        <div className="profile-section">
          <div className="profile-section-heading">
            <span>👤</span>
            <div>
              <h2>{t("survey.demographics")}</h2>
              <p>{t("survey.demographicsText")}</p>
            </div>
          </div>
          <div className="form-grid">
            {selectField("ageGroup", "ageGroup", t("profile.ageGroup"))}
            {selectField("occupation", "occupation", t("profile.occupation"))}
            <label className="field">
              <span>{t("survey.state")}</span>
              <input
                className="input"
                placeholder={t("survey.statePlaceholder")}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
              {fieldErrors.state && <small className="field-error">{fieldErrors.state}</small>}
            </label>
            <label className="field">
              <span>{t("survey.city")}</span>
              <input
                className="input"
                placeholder={t("survey.cityPlaceholder")}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
              {fieldErrors.city && <small className="field-error">{fieldErrors.city}</small>}
            </label>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-heading">
            <span>💰</span>
            <div>
              <h2>{t("survey.financialSituation")}</h2>
              <p>{t("survey.financialSituationText")}</p>
            </div>
          </div>
          <div className="form-grid">
            {selectField("incomeRange", "incomeRange", t("survey.incomeRange"))}
            {selectField("savingsHabit", "savingsHabit", t("survey.savingsHabit"))}
            {selectField("expenditurePattern", "expenditurePattern", t("survey.expenditurePattern"))}
            {selectField("riskPreference", "riskPreference", t("survey.riskPreference"))}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-heading">
            <span>📱</span>
            <div>
              <h2>{t("survey.digitalLiteracy")}</h2>
              <p>{t("survey.digitalLiteracyText")}</p>
            </div>
          </div>
          <div className="form-grid">
            {selectField("upiUsage", "upiUsage", t("survey.upiUsage"))}
            {selectField(
              "digitalPaymentAwareness",
              "digitalPaymentAwareness",
              t("survey.digitalAwareness")
            )}
            {selectField(
              "financialSecurityKnowledge",
              "financialSecurityKnowledge",
              t("survey.securityKnowledge")
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-heading">
            <span>🎯</span>
            <div>
              <h2>{t("survey.needsTitle")}</h2>
              <p>{t("survey.needsText")}</p>
            </div>
          </div>
          {chipGroup("needs", "needs")}
          {fieldErrors.needs && <small className="field-error">{fieldErrors.needs}</small>}

          <div className="profile-section-heading" style={{ marginTop: 24 }}>
            <span>🏁</span>
            <div>
              <h2>{t("survey.goalsTitle")}</h2>
              <p>{t("survey.goalsText")}</p>
            </div>
          </div>
          <div className="chip-group">
            {GOAL_OPTIONS.map((goal) => {
              const active = (form.goals || []).includes(goal);
              return (
                <button
                  type="button"
                  key={goal}
                  className={`chip ${active ? "active" : ""}`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goalText(goal)}
                </button>
              );
            })}
          </div>
          {fieldErrors.goals && <small className="field-error">{fieldErrors.goals}</small>}
        </div>

        <div className="survey-actions">
          <button className="btn primary" disabled={saving}>
            {saving ? t("survey.saving") : t("survey.saveGenerate")}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={regenerate}
            disabled={regenerating || status === "not_started"}
            title={t("survey.regenerateTitle")}
          >
            {regenerating ? t("survey.regenerating") : t("survey.regenerate")}
          </button>
        </div>
      </form>

      {profile && (
        <section className="profile-preview">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("survey.generatedEyebrow")}</span>
              <h2>{t("survey.yourProfile")}</h2>
            </div>
            <span className={`badge status-${profile.completionStatus}`}>
              {statusLabel(profile.completionStatus)}
            </span>
          </div>
          <div className="preview-grid">
            <div>
              <span>{t("profile.ageGroup")}</span>
              <strong>{label("ageGroup", profile.demographics?.ageGroup)}</strong>
            </div>
            <div>
              <span>{t("profile.occupation")}</span>
              <strong>{label("occupation", profile.demographics?.occupation)}</strong>
            </div>
            <div>
              <span>{t("survey.location")}</span>
              <strong>
                {profile.demographics?.city !== "not_collected"
                  ? profile.demographics.city
                  : label(null, profile.demographics?.state)}
              </strong>
            </div>
            <div>
              <span>{t("profile.income")}</span>
              <strong>{label("incomeRange", profile.financial?.incomeRange)}</strong>
            </div>
            <div>
              <span>{t("survey.savings")}</span>
              <strong>{label("savingsHabit", profile.financial?.savingsHabit)}</strong>
            </div>
            <div>
              <span>{t("profile.spending")}</span>
              <strong>
                {label("expenditurePattern", profile.financial?.expenditurePattern)}
              </strong>
            </div>
            <div>
              <span>{t("profile.upiUsage")}</span>
              <strong>{label("upiUsage", profile.literacy?.upiUsage)}</strong>
            </div>
            <div>
              <span>{t("profile.digitalAwareness")}</span>
              <strong>
                {label("digitalPaymentAwareness", profile.literacy?.digitalPaymentAwareness)}
              </strong>
            </div>
            <div>
              <span>{t("profile.financialSecurity")}</span>
              <strong>
                {label(
                  "financialSecurityKnowledge",
                  profile.literacy?.financialSecurityKnowledge
                )}
              </strong>
            </div>
            <div>
              <span>{t("profile.riskPreference")}</span>
              <strong>{label("riskPreference", profile.riskPreference)}</strong>
            </div>
          </div>
          <div className="preview-lists">
            <div>
              <span>{t("profile.needs")}</span>
              <div className="chip-group">
                {(profile.needs || []).length ? (
                  profile.needs.map((n) => (
                    <span className="chip active static" key={n}>
                      {label("needs", n)}
                    </span>
                  ))
                ) : (
                  <span className="muted">{t("common.notCollected")}</span>
                )}
              </div>
            </div>
            <div>
              <span>{t("profile.goals")}</span>
              <div className="chip-group">
                {(profile.goals || []).length ? (
                  profile.goals.map((g) => (
                    <span className="chip active static" key={g}>
                      {goalText(g)}
                    </span>
                  ))
                ) : (
                  <span className="muted">{t("common.notCollected")}</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
