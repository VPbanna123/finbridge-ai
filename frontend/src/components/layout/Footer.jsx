import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div>
        <strong>FinBridge AI</strong>
        <span> • {t("footer.tagline")}</span>
      </div>
      <span>{t("footer.builtFor")}</span>
    </footer>
  );
}
