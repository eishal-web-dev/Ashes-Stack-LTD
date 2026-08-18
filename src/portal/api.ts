export type Me = { id: string; role: 'admin' | 'client' | 'team'; name: string; email: string };

export async function getMe(): Promise<Me | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}
