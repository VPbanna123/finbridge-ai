import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendMessage, getHistory, listSessions, geminiStatus } from "../../api/chat.api";

const STATUS = { CHECKING: "checking", READY: "ready", UNAVAILABLE: "unavailable" };

export default function Chat() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providerStatus, setProviderStatus] = useState(STATUS.CHECKING);
  const [model, setModel] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    let cancelled = false;
    const initialise = async () => {
      const [sessionsResult, statusResult] = await Promise.allSettled([listSessions(), geminiStatus()]);
      if (cancelled) return;

      if (sessionsResult.status === "fulfilled") {
        const loaded = Array.isArray(sessionsResult.value.data?.data) ? sessionsResult.value.data.data : [];
        setSessions(loaded);
        setActiveSessionId((current) => current || loaded[0]?._id || loaded[0]?.id || null);
      } else {
        setError("Unable to load chat history. You can still start a new chat.");
      }

      if (statusResult.status === "fulfilled") {
        const body = statusResult.value.data;
        const status = body?.data || body;
        setProviderStatus(status?.configured ? STATUS.READY : STATUS.UNAVAILABLE);
        setModel(status?.model || "");
      } else {
        setProviderStatus(STATUS.UNAVAILABLE);
      }
    };
    initialise();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    const loadHistory = async () => {
      setError("");
      try {
        const { data } = await getHistory(activeSessionId);
        if (!cancelled) {
          setMessages((data?.data?.messages || []).map((message) => ({
            id: message._id,
            role: message.role,
            content: message.content,
          })));
        }
      } catch (requestError) {
        if (!cancelled) {
          setMessages([]);
          setError(requestError.response?.data?.message || "Unable to load chat history.");
        }
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [activeSessionId]);

  const newSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError("");
  };

  const useSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (providerStatus !== STATUS.READY) {
      setError(t("chat.geminiNotConfigured"));
      return;
    }

    const pendingId = `pending-${Date.now()}`;
    setError("");
    setMessages((current) => [...current, { id: pendingId, role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await sendMessage({ sessionId: activeSessionId || undefined, message: text });
      const result = data?.data;
      setMessages((current) => [
        ...current.filter((message) => message.id !== pendingId),
        { id: `user-${Date.now()}`, role: "user", content: text },
        { id: `model-${Date.now()}`, role: "model", content: result?.message || t("chat.sendFailed") },
      ]);
      if (result?.sessionId) setActiveSessionId(result.sessionId);
      const sessionsResponse = await listSessions();
      setSessions(Array.isArray(sessionsResponse.data?.data) ? sessionsResponse.data.data : []);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== pendingId));
      setError(requestError.response?.data?.message || requestError.response?.data?.errors?.[0]?.message || t("chat.sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const ready = providerStatus === STATUS.READY;
  return (
    <div className="chat-container">
      <aside className="chat-sidebar" aria-label={t("chat.title")}>
        <div className="chat-sidebar-header">
          <div className="chat-brand"><span className="chat-brand-icon">✦</span><h3>{t("chat.title")}</h3></div>
          <button type="button" className="chat-new-button" onClick={newSession} title={t("chat.newChat")} aria-label={t("chat.newChat")}>＋</button>
        </div>
        <div className={`chat-status ${ready ? "ready" : "offline"}`}><span />{providerStatus === STATUS.CHECKING ? t("common.loading") : ready ? "AI assistant ready" : "AI assistant unavailable"}</div>
        <ul className="session-list">
          {sessions.map((session) => {
            const id = session._id || session.id;
            return <li key={id}><button type="button" className={`session-item ${activeSessionId === id ? "active" : ""}`} onClick={() => setActiveSessionId(id)}><span className="session-title">{session.title || t("chat.newChat")}</span></button></li>;
          })}
          {!sessions.length && <li className="session-item empty"><span className="muted">{t("chat.noSessions")}</span></li>}
        </ul>
      </aside>

      <section className="chat-panel">
        <div className="chat-header"><div><p className="chat-eyebrow">FINBRIDGE AI</p><h2>{activeSessionId ? t("chat.conversation") : t("chat.startConversation")}</h2></div>{model && <span className="chat-model">{model}</span>}</div>
        {providerStatus === STATUS.UNAVAILABLE && <div className="alert error-alert chat-config-alert" role="alert"><strong>Unable to reach the AI assistant.</strong><span>{t("chat.geminiNotConfigured")} Restart the backend after changing <code>GEMINI_MODEL</code>.</span></div>}
        <div className="chat-messages" aria-live="polite">
          {error && <div className="alert error-alert" role="alert">{error}</div>}
          {!messages.length && !error && <div className="chat-empty"><div className="chat-welcome-icon">✦</div><h3>Your financial guide, on demand.</h3><p>{t("chat.startChatting")}</p><div className="chat-suggestions">{["Create a monthly budget", "Explain a government scheme", "How should I start saving?"].map((suggestion) => <button type="button" key={suggestion} onClick={() => useSuggestion(suggestion)} disabled={!ready}>{suggestion}</button>)}</div></div>}
          {messages.map((message) => <div key={message.id} className={`chat-message ${message.role === "user" ? "user" : "model"}`}><div className="message-bubble">{message.content}</div><span className="message-role">{message.role === "user" ? t("chat.you") : t("chat.assistant")}</span></div>)}
          {loading && <div className="chat-message model"><div className="message-bubble">{t("chat.typing")}</div></div>}
          <div ref={endRef} />
        </div>
        <form className="chat-form" onSubmit={handleSubmit}>
          <input className="input chat-input" type="text" placeholder={providerStatus === STATUS.CHECKING ? t("common.loading") : t("chat.typeMessage")} value={input} onChange={(event) => setInput(event.target.value)} disabled={loading || !ready} autoFocus />
          <button type="submit" className="chat-send-button" disabled={loading || !ready || !input.trim()} aria-label={t("chat.send")}>{loading ? "…" : "↑"}<span>{t("chat.send")}</span></button>
        </form>
      </section>
    </div>
  );
}
