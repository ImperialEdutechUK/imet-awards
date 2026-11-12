/** Calls one of this site's own API routes from the browser and returns its data, or throws with the server's message. */
export async function api<T = Record<string, unknown>>(path: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({ error: 'Unexpected server response' }));
  if (!res.ok || !body.ok) throw Object.assign(new Error(body.error || 'Request failed'), { status: res.status });
  return body as T;
}
