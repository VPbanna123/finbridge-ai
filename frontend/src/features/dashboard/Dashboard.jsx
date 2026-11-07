import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import client from "../../api/client";
import { surveyApi } from "../../api/index";
import { resendVerification } from "../../api/auth.api";
import { localized, formatCurrency } from "../../lib/utils";
import { stripMarkdown } from "../../lib/markdown";
import { FARMER_PORTAL_URL } from "../../config/constants";
import Loading from "../../components/ui/Loading";
import ErrorMessage from "../../components/ui/ErrorMessage";
import EmptyState from "../../components/ui/EmptyState";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { u } = useAuth();
  const [d, setD] = useState(null);
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [error, setError] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      try {
        setError("");
        const { data } = await client.get("/dashboard");
        if (mounted) setD(data);
      } catch (e) {
        if (mounted) setError(e.response?.data?.message || t("dashboard.unableLoad"));
      }
    }
    async function fetchSurveyStatus() {
      try {
        const { data } = await surveyApi.getStatus();
        if (mounted) setSurveyStatus(data.status);
      } catch {
        // dashboard still works without survey status
      }
    }
    fetchDashboard();
    fetchSurveyStatus();
    return () => { mounted = false; };
  }, [t]);

  if (!d && !error) return <Loading text={t("common.preparing")} />;

  const recommendations = d?.recommendations || [];
  const firstName = u?.name?.split(" ")[0] || t("dashboard.welcomeFallback");

  const resendEmail = async () => {
    if (!u?.email) return;
    try {
      await resendVerification(u.email);
      setVerifyMessage(t("dashboard.emailSent"));
    } catch {
      setVerifyMessage("");
    }
  };

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">{t("dashboard.eyebrow")}</span>
          <h1>
            {t("nav.dashboard")}, <span>{t("dashboard.welcome", { name: firstName })}</span>
          </h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        <div className="welcome-illustration">💰</div>
      </section>

      <ErrorMessage message={error} />

      {u?.emailVerified === false && (
        <div className="survey-cta verify-cta">
          <span className="survey-cta-icon">✉️</span>
          <div>
            <strong>{t("dashboard.verifyTitle")}</strong>
            <p className="muted">{verifyMessage || t("dashboard.verifyText")}</p>
          </div>
          <button type="button" className="btn secondary" onClick={resendEmail}>
            {t("dashboard.resendEmail")}
          </button>
        </div>
      )}

      <section className="krishi-sakhi-banner" aria-labelledby="krishi-sakhi-heading">
        <div className="krishi-sakhi-visual" aria-hidden="true">🌾</div>
        <div className="krishi-sakhi-copy">
          <h2 id="krishi-sakhi-heading">{t("krishiSakhiHeading")}</h2>
          <p>{t("krishiSakhiDescription")}</p>
        </div>
        <a
          className="krishi-sakhi-link"
          href={FARMER_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("krishiSakhiVisit")}
        </a>
      </section>

      {surveyStatus && surveyStatus !== "complete" && (
        <div className="survey-cta">
          <span className="survey-cta-icon">📝</span>
          <div>
            <strong>
              {surveyStatus === "not_started"
                ? t("dashboard.surveyCompleteTitle")
                : t("dashboard.surveyFinishTitle")}
            </strong>
            <p className="muted">{t("dashboard.surveyText")}</p>
          </div>
          <NavLink to="/survey" className="btn primary">
            {surveyStatus === "not_started" ? t("dashboard.startSurvey") : t("dashboard.continue")} →
          </NavLink>
        </div>
      )}

      {d && (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">₹</div>
              <div><span>{t("dashboard.totalExpenses")}</span><strong>{formatCurrency(d.totalExpenses)}</strong></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">🏛️</div>
              <div><span>{t("dashboard.recommendedSchemes")}</span><strong>{recommendations.length}</strong></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">📚</div>
              <div><span>{t("dashboard.financialLearning")}</span><strong>{t("dashboard.explore")}</strong></div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-main-card">
              <div className="section-heading">
                <div><span className="eyebrow">{t("dashboard.personalizedForYou")}</span><h2>{t("dashboard.recommendedSchemesTitle")}</h2></div>
                <NavLink to="/schemes" className="text-link">{t("dashboard.viewAll")}</NavLink>
              </div>
              {recommendations.length === 0 ? (
                <EmptyState
                  icon="🏛️"
                  title={t("dashboard.noRecommendationsTitle")}
                  text={t("dashboard.noRecommendationsText")}
                />
              ) : (
                <div className="recommendation-list">
                  {recommendations.slice(0, 4).map((x) => (
                    <NavLink key={x.scheme.slug} to={`/schemes/${x.scheme.slug}`} className="recommendation-item">
                      <div className="scheme-icon">🏛️</div>
                      <div className="recommendation-content">
                        <strong>{localized(x.scheme.name, i18n.language)}</strong>
                        <span>{stripMarkdown(localized(x.scheme.description, i18n.language))}</span>
                      </div>
                      <span className="arrow">→</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-side-card">
              <div className="section-heading"><div><span className="eyebrow">{t("dashboard.learn")}</span><h2>{t("dashboard.financialLiteracy")}</h2></div></div>
              <p className="muted">{t("dashboard.literacyText")}</p>
              <div className="learning-mini-list">
                <div><span>🏦</span><strong>{t("dashboard.bankingBasics")}</strong></div>
                <div><span>📱</span><strong>{t("dashboard.digitalPayments")}</strong></div>
                <div><span>📈</span><strong>{t("dashboard.investments")}</strong></div>
                <div><span>🧾</span><strong>{t("dashboard.taxes")}</strong></div>
              </div>
              <NavLink to="/literacy" className="btn secondary full-width">{t("dashboard.startLearning")}</NavLink>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
