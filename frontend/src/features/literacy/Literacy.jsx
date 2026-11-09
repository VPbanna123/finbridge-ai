import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { literacyIcons } from "../../config/constants";
import { useDebounce } from "../../hooks/useDebounce";

/**
 * Each topic has an explanation plus trusted official links so users can go
 * deeper on exactly what they choose.
 */
const literacy = {
  banking: [
    {
      title: "Savings account",
      description:
        "An account designed for saving money while allowing deposits and withdrawals. Usually pays a small interest and comes with a debit card and passbook.",
      tags: ["basics"],
      links: [{ label: "RBI — Basic banking", url: "https://www.rbi.org.in/financialeducation/" }],
    },
    {
      title: "Current account",
      description:
        "An account generally designed for frequent business transactions. Usually pays no interest and offers higher transaction limits.",
      tags: ["basics"],
    },
    {
      title: "Fixed Deposit (FD)",
      description:
        "A fixed deposit keeps money for a chosen period under stated terms and interest. Generally offers a higher rate than a savings account.",
      tags: ["basics"],
    },
    {
      title: "Recurring Deposit (RD)",
      description:
        "A recurring deposit involves making regular deposits for a chosen period, building a lump sum with interest.",
      tags: ["basics"],
    },
    {
      title: "Credit score",
      description:
        "A credit score is based on credit information and may be considered by lenders. Paying dues on time generally helps maintain a healthy score.",
      tags: ["advanced"],
      links: [{ label: "RBI — Credit information", url: "https://www.rbi.org.in/" }],
    },
  ],
  investments: [
    {
      title: "Bond",
      description:
        "A debt instrument where an issuer borrows money under specified repayment terms. The issuer generally pays periodic interest.",
      tags: ["advanced"],
      links: [{ label: "SEBI — Investor education", url: "https://www.sebi.gov.in/" }],
    },
    {
      title: "SIP",
      description:
        "A Systematic Investment Plan allows a fixed amount to be invested periodically in a mutual fund scheme, averaging out market ups and downs.",
      tags: ["basics"],
      links: [{ label: "AMFI — Mutual funds", url: "https://www.amfiindia.com/" }],
    },
    {
      title: "Mutual fund",
      description:
        "A pooled investment vehicle managed according to the objectives of its scheme. Returns are not guaranteed and are subject to market risk.",
      tags: ["basics"],
      links: [{ label: "AMFI — Investor corner", url: "https://www.amfiindia.com/investor-corner" }],
    },
    {
      title: "PPF",
      description:
        "The Public Provident Fund is a government-backed long-term savings scheme with a fixed tenure and tax benefits under applicable rules.",
      tags: ["basics"],
      links: [{ label: "India Post — PPF", url: "https://www.indiapost.gov.in/" }],
    },
    {
      title: "Saving vs investing",
      description:
        "Saving generally emphasizes liquidity and safety, while investing generally involves accepting risk in pursuit of potential returns.",
      tags: ["basics"],
      links: [{ label: "SEBI — Investor education", url: "https://www.sebi.gov.in/" }],
    },
  ],
  taxes: [
    {
      title: "PAN",
      description:
        "Permanent Account Number used for income-tax and other financial purposes. It is a ten-character identifier issued by the Income Tax Department.",
      tags: ["basics"],
      links: [
        { label: "Income Tax Dept — PAN", url: "https://www.incometaxindia.gov.in/" },
      ],
    },
    {
      title: "ITR",
      description:
        "Income Tax Return used to report relevant income and tax information for a financial year within applicable due dates.",
      tags: ["basics"],
      links: [
        { label: "e-Filing portal", url: "https://www.incometax.gov.in/" },
      ],
    },
    {
      title: "TDS",
      description:
        "Tax Deducted at Source from certain payments under applicable rules. The deductor deposits it with the government against your PAN.",
      tags: ["advanced"],
      links: [{ label: "Income Tax Dept", url: "https://www.incometaxindia.gov.in/" }],
    },
    {
      title: "GST",
      description:
        "Goods and Services Tax is an indirect tax framework applied on the supply of goods and services.",
      tags: ["advanced"],
      links: [{ label: "GST portal", url: "https://www.gst.gov.in/" }],
    },
    {
      title: "Assessment year",
      description:
        "The year following a financial year in which income is assessed or returned under applicable rules.",
      tags: ["advanced"],
    },
  ],
  procedures: [
    {
      title: "PAN application",
      description:
        "Use an official PAN service, provide the required identity, address and date-of-birth information, and complete verification.",
      tags: ["basics"],
      links: [{ label: "Income Tax Dept — PAN", url: "https://www.incometaxindia.gov.in/" }],
    },
    {
      title: "ITR filing",
      description:
        "Collect relevant income and tax documents, choose the applicable ITR, submit it, verify the return and retain the acknowledgement.",
      tags: ["advanced"],
      links: [{ label: "e-Filing portal", url: "https://www.incometax.gov.in/" }],
    },
    {
      title: "Open a bank account",
      description:
        "Choose an account, review its requirements, submit KYC documents and complete the bank's verification process.",
      tags: ["basics"],
      links: [{ label: "RBI — Financial education", url: "https://www.rbi.org.in/financialeducation/" }],
    },
    {
      title: "Use UPI safely",
      description:
        "Never share OTPs or UPI PINs. Verify the recipient and amount before confirming a payment. Banks never ask for your PIN or OTP.",
      tags: ["safety"],
      links: [{ label: "NPCI — UPI", url: "https://www.npci.org.in/" }],
    },
  ],
  digital: [
    {
      title: "UPI",
      description:
        "A digital payment system that supports instant transfers between participating bank accounts using a UPI ID or QR code.",
      tags: ["basics"],
      links: [{ label: "NPCI — UPI overview", url: "https://www.npci.org.in/" }],
    },
    {
      title: "QR payment",
      description:
        "A payment initiated by scanning a QR code and confirming the transaction in a payment application.",
      tags: ["basics"],
    },
    {
      title: "Mobile banking",
      description:
        "Using a bank's mobile application to access supported banking services such as transfers, balances and card controls.",
      tags: ["basics"],
    },
    {
      title: "Internet banking",
      description:
        "Using a bank's website to access supported banking services. Always use the bank's official website and check the address.",
      tags: ["safety"],
    },
  ],
};

const ALL = "all";

export default function Literacy() {
  const { t } = useTranslation();
  const categoryName = (category) => t(`literacy.categories.${category}`);
  const tagLabel = (tag) => t(`literacy.tags.${tag}`);
  const [topic, setTopic] = useState(ALL);
  const [tag, setTag] = useState(ALL);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const allItems = useMemo(
    () =>
      Object.entries(literacy).flatMap(([cat, items]) =>
        items.map((item) => ({ ...item, category: cat }))
      ),
    []
  );

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (topic !== ALL && item.category !== topic) return false;
      if (tag !== ALL && !(item.tags || []).includes(tag)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [allItems, topic, tag, debouncedQuery]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of results) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return [...map.entries()];
  }, [results]);

  const topics = [ALL, ...Object.keys(literacy)];
  const tags = [ALL, ...["basics", "safety", "advanced"]];

  return (
    <div className="content-page">
      <section className="page-hero literacy-hero">
        <div>
          <span className="eyebrow">{t("literacy.eyebrow")}</span>
          <h1>{t("nav.literacy")}</h1>
          <p>{t("literacy.subtitle")}</p>
        </div>
        <div className="hero-icon">📚</div>
      </section>

      <div className="literacy-toolbar">
        <div className="search-wrapper">
          <span>⌕</span>
          <input
            className="search-input"
            placeholder={t("literacy.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {tags.map((x) => (
            <button
              key={x}
              className={`chip ${tag === x ? "active" : ""}`}
              onClick={() => setTag(x)}
            >
              {x === ALL ? t("literacy.allLevels") : tagLabel(x)}
            </button>
          ))}
        </div>
      </div>

      <div className="literacy-layout">
        <aside className="literacy-sidebar">
          <h3>{t("literacy.topics")}</h3>
          {topics.map((x) => (
            <button
              key={x}
              className={`literacy-tab ${topic === x ? "active" : ""}`}
              onClick={() => setTopic(x)}
            >
              <span>{x === ALL ? "🗂️" : literacyIcons[x]}</span>
              {x === ALL ? t("literacy.allTopics") : categoryName(x)}
              <span className="tab-arrow">→</span>
            </button>
          ))}
        </aside>

        <section className="literacy-content">
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔎</div>
              <h3>{t("literacy.noResultsTitle")}</h3>
              <p>{t("literacy.noResultsText")}</p>
            </div>
          ) : (
            grouped.map(([cat, items]) => (
              <div key={cat} className="literacy-group">
                <div className="literacy-heading">
                  <span>{literacyIcons[cat]}</span>
                  <div>
                    <span className="eyebrow">{t("literacy.topicEyebrow")}</span>
                    <h2>{categoryName(cat)}</h2>
                  </div>
                </div>
                <div className="literacy-cards">
                  {items.map((item, index) => (
                    <article className="literacy-card" key={`${cat}-${item.title}`}>
                      <div className="literacy-card-number">{index + 1}</div>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        {item.tags?.length ? (
                          <div className="literacy-tags">
                            {item.tags.map((tg) => (
                              <span className="mini-tag" key={tg}>
                                {tagLabel(tg)}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {item.links?.length ? (
                          <div className="literacy-links">
                            {item.links.map((l) => (
                              <a
                                key={l.url}
                                href={l.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {l.label} ↗
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
