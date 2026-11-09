import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { formatCurrency, toLocale, translateOption } from "../../lib/utils";
import { categoryIcons } from "../../config/constants";
import { expenseSchema } from "../../lib/schemas";
import Loading from "../../components/ui/Loading";
import ErrorMessage from "../../components/ui/ErrorMessage";

export default function Tracker() {
  const { t, i18n } = useTranslation();
  const [m, setM] = useState(new Date());
  const [es, setE] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [f, setF] = useState({ amount: "", category: "food", note: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const locale = toLocale(i18n.language);
  const ms = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");
      const { data } = await client.get(`/expenses?month=${ms}`);
      setE(data.expenses || []);
    } catch (e) {
      setError(e.response?.data?.message || t("tracker.unableLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadExpenses(); }, [ms]);

  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const firstDay = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
  const total = es.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const selectedExpenses = es.filter((e) => new Date(e.date).getDate() === selectedDay);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError("");
    const parsed = expenseSchema.safeParse({ ...f, amount: Number(f.amount), date: new Date(m.getFullYear(), m.getMonth(), selectedDay).toISOString() });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0].message);
      return;
    }

    try {
      setSaving(true);
      setError("");
      await client.post("/expenses", {
        ...f,
        amount: Number(f.amount),
        date: new Date(m.getFullYear(), m.getMonth(), selectedDay).toISOString(),
      });
      setF({ amount: "", category: "food", note: "" });
      await loadExpenses();
    } catch (e) {
      setError(e.response?.data?.message || t("tracker.unableSave"));
    } finally {
      setSaving(false);
    }
  };

  const changeMonth = (offset) => {
    const next = new Date(m.getFullYear(), m.getMonth() + offset, 1);
    setM(next);
    const nextDays = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    setSelectedDay(Math.min(selectedDay, nextDays));
  };

  const weekdays = [
    t("tracker.weekdays.sun"),
    t("tracker.weekdays.mon"),
    t("tracker.weekdays.tue"),
    t("tracker.weekdays.wed"),
    t("tracker.weekdays.thu"),
    t("tracker.weekdays.fri"),
    t("tracker.weekdays.sat"),
  ];

  return (
    <div className="content-page">
      <section className="page-hero tracker-hero">
        <div>
          <span className="eyebrow">{t("tracker.eyebrow")}</span>
          <h1>{t("nav.tracker")}</h1>
          <p>{t("tracker.subtitle")}</p>
        </div>
        <div className="hero-icon">📊</div>
      </section>

      <ErrorMessage message={error} />

      <div className="tracker-summary">
        <div className="tracker-total">
          <span>{t("total")}</span>
          <strong>{formatCurrency(total)}</strong>
          <small>{m.toLocaleDateString(locale, { month: "long", year: "numeric" })}</small>
        </div>
        <div className="tracker-tip">
          <span>💡</span>
          <div><strong>{t("tracker.tipTitle")}</strong><p>{t("tracker.tipText")}</p></div>
        </div>
      </div>

      <div className="tracker-layout">
        <section className="calendar-card">
          <div className="calendar-header">
            <button className="icon-button" onClick={() => changeMonth(-1)}>←</button>
            <h2>{m.toLocaleDateString(locale, { month: "long", year: "numeric" })}</h2>
            <button className="icon-button" onClick={() => changeMonth(1)}>→</button>
          </div>

          {loading ? <Loading text={t("tracker.loadingExpenses")} /> : (
            <>
              <div className="calendar-weekdays">
                {weekdays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="calendar-grid">
                {Array.from({ length: firstDay }).map((_, i) => <div className="calendar-empty" key={`empty-${i}`} />)}
                {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
                  const dayExpenses = es.filter((e) => new Date(e.date).getDate() === day);
                  const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
                  return (
                    <button type="button" key={day} onClick={() => setSelectedDay(day)} className={`calendar-day ${selectedDay === day ? "selected" : ""}`}>
                      <span>{day}</span>
                      {dayTotal > 0 && <small>{formatCurrency(dayTotal)}</small>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="expense-panel">
          <div className="expense-panel-header">
            <span className="eyebrow">{t("tracker.selectedDate")}</span>
            <h2>{m.toLocaleDateString(locale, { day: "numeric", month: "long" })}</h2>
          </div>

          {selectedExpenses.length > 0 && (
            <div className="selected-expenses">
              <h3>{t("tracker.expensesOnDay")}</h3>
              {selectedExpenses.map((expense) => (
                <div className="expense-row" key={expense._id}>
                  <div className="expense-category-icon">{categoryIcons[expense.category] || "📌"}</div>
                  <div>
                    <strong>{translateOption(t, "categories", expense.category)}</strong>
                    <span>{expense.note || t("tracker.noNote")}</span>
                  </div>
                  <b>{formatCurrency(expense.amount)}</b>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="expense-form" noValidate>
            <h3>{t("tracker.addExpense")}</h3>
            <label className="field">
              <span>{t("tracker.amount")}</span>
              <input className="input" type="number" min="1" placeholder={t("tracker.amountPlaceholder")} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
              {fieldError && <small className="text-red-600 text-xs">{fieldError}</small>}
            </label>
            <label className="field">
              <span>{t("tracker.category")}</span>
              <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {Object.keys(categoryIcons).map((x) => (
                  <option key={x} value={x}>{categoryIcons[x]} {translateOption(t, "categories", x)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("tracker.note")}</span>
              <input className="input" placeholder={t("tracker.notePlaceholder")} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            </label>
            <button className="btn primary full-width" disabled={saving}>
              {saving ? t("common.saving") : t("tracker.saveExpense")}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
