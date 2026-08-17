import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "../../components/Topbar";

export default function AdminHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        if (u.role !== "admin") return router.replace("/portal");
        setUser(u);
        return fetch("/api/admin/clients").then((r) => r.json());
      })
      .then((c) => {
        setClients(c);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (loading) return <div className="container">Loading…</div>;

  return (
    <>
      <Topbar user={user} />
      <div className="container">
        <div className="eyebrow">ADMIN PORTAL</div>
        <h1>Clients</h1>
        <p className="sub">
          Click into a client to send an invoice, contract, welcome doc, monthly report, fulfillment doc,
          feedback request or access request in one click.
        </p>

        <div className="card">
          {clients.length === 0 ? (
            <div className="empty">
              No clients yet. Clients appear here once they sign up at <code>/signup</code>.
            </div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Docs sent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.company}</td>
                    <td>{c.docCount}</td>
                    <td>
                      <a className="btn small orange" href={`/admin/client/${c._id}`}>Open</a>
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
