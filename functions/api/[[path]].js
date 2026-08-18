/**
 * Pages Functions 代理：前端同源 /api/* → Worker API
 * API_URL 写死在代码里（故意的，URL 不是秘密，防抄靠 key）
 * AUTH_KEY 从环境变量读取（Pages Settings → Environment variables → AUTH_KEY）
 * 同学抄了前端源码但没有 AUTH_KEY 环境变量 → 代理 500 → 前端空壳（bushi）
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const base = 'https://api.mail.ysnsm.top'; // 写死（故意的）
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
