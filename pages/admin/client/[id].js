import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "../../../components/Topbar";

const DOC_TYPES = [
  { type: "welcome", label: "Welcome Doc", desc: "Onboarding packet for a new client." },
  { type: "contract", label: "Contract", desc: "Service agreement based on your template." },
  { type: "access_request", label: "Access Request", desc: "Ask for assets, logins or info." },
  { type: "monthly_report", label: "Monthly Report", desc: "Progress update for this month." },
  { type: "fulfillment", label: "Fulfillment Doc", desc: "Confirms delivery & handover." },
  { type: "feedback_request", label: "Feedback Request", desc: "Ask the client for feedback." },
];

export default function ClientDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState("");
  const [message, setMessage] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoice, setInvoice] = useState({ invoiceNumber: "0001", amount: 5000, project: "Landing Page Service Agreement", dueDate: "" });

  useEffect(() => {
    if (!id) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        if (u.role !== "admin") return router.replace("/portal");
        setUser(u);
        return Promise.all([
          fetch("/api/admin/clients").then((r) => r.json()),
          fetch(`/api/documents?clientId=${id}`).then((r) => r.json()),
        ]);
      })
      .then(([clients, d]) => {
        setClient(clients.find((c) => c._id === id));
        setDocs(d);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [id, router]);

  async function refreshDocs() {
    const d = await fetch(`/api/documents?clientId=${id}`).then((r) => r.json());
    setDocs(d);
  }

  async function sendDoc(type, meta = {}) {
    setSending(type);
    setMessage("");
    const res = await fetch("/api/admin/send-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, type, meta }),
    });
    const data = await res.json();
    setSending("");
    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage(`${data.title} sent to ${client.name}'s portal.`);
      setShowInvoice(false);
      refreshDocs();
    }
    setTimeout(() => setMessage(""), 4000);
  }

  if (loading || !client) return <div className="container">Loading…</div>;

  return (
    <>
      <Topbar user={user} links={[{ href: "/admin", label: "← All clients" }]} />
      <div className="container">
        <div className="eyebrow">CLIENT FILE</div>
        <h1>{client.name}</h1>
        <p className="sub">
          {client.email} · {client.company}
          {client.googleEmail ? ` · Meet: ${client.googleEmail}` : ""}
          {client.age ? ` · Age ${client.age}` : ""}
          {client.gender ? ` · ${client.gender}` : ""}
        </p>

        {message && <div className={message.startsWith("Error") ? "error-box" : "success-box"}>{message}</div>}

        <div className="card">
          <h2>Send a document — one click</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Generates a branded PDF instantly and puts it straight in {client.name.split(" ")[0]}'s Client Portal for download.
          </p>
          <div className="btn-grid">
            {DOC_TYPES.map((d) => (
              <button
                key={d.type}
                className="btn outline"
                disabled={sending === d.type}
                onClick={() => sendDoc(d.type, d.type === "welcome" ? { googleEmail: client.googleEmail } : {})}
                title={d.desc}
              >
                {sending === d.type ? "Sending…" : `Send ${d.label}`}
              </button>
            ))}
            <button className="btn orange" onClick={() => setShowInvoice((v) => !v)}>
              {showInvoice ? "Cancel invoice" : "Send Invoice"}
            </button>
          </div>

          {showInvoice && (
            <div style={{ marginTop: 20, borderTop: "1px solid #e4e1da", paddingTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="field">
                  <label>Invoice #</label>
                  <input value={invoice.invoiceNumber} onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
                </div>
                <div className="field">
                  <label>Amount (PKR)</label>
                  <input type="number" value={invoice.amount} onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })} />
                </div>
                <div className="field">
                  <label>Project / description</label>
                  <input value={invoice.project} onChange={(e) => setInvoice({ ...invoice, project: e.target.value })} />
                </div>
                <div className="field">
                  <label>Due date</label>
                  <input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })} />
                </div>
              </div>
              <button
                className="btn orange"
                disabled={sending === "invoice"}
                onClick={() =>
                  sendDoc("invoice", {
                    invoiceNumber: invoice.invoiceNumber,
                    amount: Number(invoice.amount),
                    project: invoice.project,
                    dueDate: invoice.dueDate || undefined,
                  })
                }
              >
                {sending === "invoice" ? "Sending…" : "Confirm & Send Invoice"}
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Documents sent to this client</h2>
          {docs.length === 0 ? (
            <div className="empty">Nothing sent yet.</div>
          ) : (
            <table className="list">
              <thead>
                <tr><th>Document</th><th>Sent</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id}>
                    <td>{d.title}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                    <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                    <td>
                      <a className="btn small outline" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
