import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { askAgent, SUGGESTED_QUESTIONS } from '../lib/agent';
import { EmergencyBanner, SourceTag } from '../components/UI';

export default function AgentChatScreen() {
  const { entities, currentFamily, currentParent, roleKeys } = useApp();
  const [messages, setMessages] = useState([
    { role: 'agent', text: `שלום! אני לב המעבר, כאן כדי לעזור לכם לראות מה קורה סביב ${currentParent?.nickname || 'ההורה'}. אפשר לשאול אותי על תרופות, תורים, משימות ותורנויות — אני קורא רק את מה שתיעדתם באפליקציה.`, sources: [] },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send(text) {
    const q = (text ?? input).trim();
    if (!q || !currentParent) return;
    const userMsg = { role: 'user', text: q };
    const result = askAgent(q, { entities, familyId: currentFamily.id, parentId: currentParent.id, roleKeys });
    const agentMsg = result.emergency
      ? { role: 'agent', emergency: true }
      : { role: 'agent', text: result.text, sources: result.sources };
    setMessages((m) => [...m, userMsg, agentMsg]);
    setInput('');
  }

  return (
    <div className="stack">
      <h1>שיחה עם לב המעבר</h1>
      <p className="muted small">הסוכן קורא רק נתונים שאתם מורשים לצפות בהם, ואינו ממציא מידע. כשמידע חסר הוא יגיד זאת בפירוש.</p>

      <div className="card" style={{ minHeight: 340, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.emergency ? <EmergencyBanner /> : (
                <>
                  <span>{m.text}</span>
                  <SourceTag sources={m.sources} />
                </>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input
            style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid var(--border)' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="מה חשוב לעשות היום?"
            aria-label="הקלדת שאלה לסוכן"
          />
          <button className="btn btn-primary" onClick={() => send()}>שליחה</button>
        </div>
      </div>

      <div className="tag-row">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button key={q} className="btn btn-secondary btn-sm" onClick={() => send(q)}>{q}</button>
        ))}
      </div>
    </div>
  );
}
