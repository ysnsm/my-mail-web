/**
 * Pages Functions：从环境变量注入前端配置
 * 环境变量（Pages Settings → Environment variables）：
 *   API_URL  - Worker API 地址（如 https://api.mail.ysnsm.top）
 *   AUTH_KEY - Worker 鉴权密钥（与 Worker secret 一致）
 * 同学抄了前端源码但没有这两个环境变量 → 此接口返回空 → 前端空壳（bushi）
 */
export async function onRequest(context) {
  const { env } = context;
  return Response.json({
    apiUrl: env.API_URL || '',
    apiKey: env.AUTH_KEY || '',
  });
}
