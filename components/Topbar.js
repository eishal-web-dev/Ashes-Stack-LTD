import { useRouter } from "next/router";

export default function Topbar({ user, links = [] }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <div className="topbar">
      <div className="brand">ASH<span>ES</span> {user?.role === "admin" ? "· Admin" : "· Client Portal"}</div>
      <nav style={{ display: "flex", alignItems: "center" }}>
        {links.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
        <span style={{ marginLeft: 20, color: "#999", fontSize: 13 }}>{user?.name}</span>
        <button onClick={logout}>Log out</button>
      </nav>
    </div>
  );
}
