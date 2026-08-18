/**
 * Pages Functions 代理：前端同源 /api/* → Worker API
 * 环境变量（Pages Settings → Environment variables）：
 *   API_URL  - Worker API 地址（如 https://api.mail.ysnsm.top）
 *   AUTH_KEY - Worker 鉴权密钥（与 Worker secret 一致）
 * AUTH_KEY 只在服务端注入，浏览器永远拿不到；
 * 同学抄了前端源码但没有这两个环境变量 → 代理 500 → 前端空壳（bushi）
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const base = (env.API_URL || '').replace(/\/+$/, '');
  if (!base) {
    return Response.json({ error: 'server not configured (API_URL)' }, { status: 500 });
  }
  const target = base + url.pathname + url.search;
  const headers = new Headers(request.headers);
  headers.set('X-Auth-Key', env.AUTH_KEY || '');
  headers.delete('Origin');
  headers.delete('Referer');
  const init = { method: request.method, headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }
  return fetch(target, init);
}
