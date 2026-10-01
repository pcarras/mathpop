// Cliente minimo para a API REST do Upstash Redis (sem dependencias). As variaveis chegam com a integracao do Vercel.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
export const ligado = () => !!(URL_ && TOK);
export async function pipe(cmds) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds.map((c) => c.map(String))) });
  if (!r.ok) throw new Error('redis ' + r.status);
  const j = await r.json();
  return j.map((x) => { if (x && x.error) throw new Error('redis: ' + x.error); return x.result; });
}
export const cmd = async (...a) => (await pipe([a]))[0];
export const obj = (arr) => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i + 1 < arr.length; i += 2) o[arr[i]] = arr[i + 1]; return o; };
