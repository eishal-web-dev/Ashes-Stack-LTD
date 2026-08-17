import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "../../components/Topbar";

const TYPE_LABELS = {
  welcome: "Welcome Packet",
  contract: "Service Agreement / Contract",
  invoice: "Invoice",
  access_request: "Access / Information Request",
  monthly_report: "Monthly Progress Report",
  fulfillment: "Fulfillment & Handover",
  feedback_request: "Feedback Request",
};

export default function Portal() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        if (u.role === "admin") return router.replace("/admin");
        setUser(u);
        return Promise.all([
          fetch("/api/client/profile").then((r) => r.json()),
          fetch("/api/documents").then((r) => r.json()),
        ]);
      })
      .then((res) => {
        if (!res) return;
        setProfile(res[0]);
        setDocs(res[1]);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/client/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfile(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div className="container">Loading…</div>;

  return (
    <>
      <Topbar user={user} />
      <div className="container">
        <div className="eyebrow">YOUR PROJECT</div>
        <h1>Welcome, {user?.name}</h1>
        <p className="sub">{profile?.company} — {profile?.project}</p>

        <div className="card">
          <h2>Your details</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            We use this to book Google Meet calls and keep your file up to date.
          </p>
          {saved && <div className="success-box">Saved.</div>}
          <form onSubmit={saveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label>Gmail (for Google Meet invites)</label>
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={profile?.googleEmail || ""}
                  onChange={(e) => setProfile({ ...profile, googleEmail: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={profile?.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Age</label>
                <input
                  type="number"
                  value={profile?.age || ""}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Gender</label>
                <select
                  value={profile?.gender || ""}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button className="btn orange" disabled={saving}>{saving ? "Saving…" : "Save details"}</button>
          </form>
        </div>

        <div className="card">
          <h2>Documents from ASHES</h2>
          {docs.length === 0 ? (
            <div className="empty">No documents yet — your admin will send your welcome packet, contract and invoices here.</div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Sent</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id}>
                    <td>{d.title}</td>
                    <td>{TYPE_LABELS[d.type] || d.type}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                    <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                    <td>
                      <a className="btn small outline" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">
                        Download
                      </a>
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
