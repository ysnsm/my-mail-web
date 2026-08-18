/**
 * ysnsm 邮箱前端（免配置版）
 * 依赖：Pages Functions 同源代理 /api/*（环境变量注入 API_URL + AUTH_KEY）
 * 浏览器无需填 Worker 地址或 Key——抄代码的同学没有 Pages Functions 环境变量，前端即空壳（bushi）
 */
const $ = (sel) => document.querySelector(sel);

let mails = [];
let currentId = null;

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: { ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
  return data;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso || '';
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadList() {
  const box = $('#mailList');
  box.innerHTML = '<div class="list-placeholder">加载中…</div>';
  try {
    const data = await api('/mails?limit=50');
    mails = data.mails || [];
    renderList();
  } catch (e) {
    box.innerHTML = '<div class="list-placeholder">加载失败：' + escapeHtml(e.message) + '</div>';
  }
}

function renderList() {
  const box = $('#mailList');
  if (mails.length === 0) {
    box.innerHTML = '<div class="list-placeholder">收件箱为空</div>';
    return;
  }
  box.innerHTML = '';
  for (const m of mails) {
    const div = document.createElement('div');
    div.className = 'mail-item' + (m.id === currentId ? ' active' : '');
    div.innerHTML =
      '<div class="from">' + escapeHtml(m.from || '未知发件人') + '</div>' +
      '<div class="subject">' + escapeHtml(m.subject || '(无主题)') + '</div>' +
      '<div class="date">' + escapeHtml(formatDate(m.date)) + '</div>';
    div.onclick = () => openMail(m.id);
    box.appendChild(div);
  }
}

async function openMail(id) {
  currentId = id;
  renderList();
  const detail = $('#mailDetail');
  detail.innerHTML = '<div id="emptyTip">加载中…</div>';
  try {
    const m = await api('/mails/' + id);
    const bodyHtml = m.html
      ? '<iframe sandbox="allow-same-origin" srcdoc="' + escapeHtml(m.html) + '"></iframe>'
      : '<pre>' + escapeHtml(m.text || '(无正文)') + '</pre>';
    detail.innerHTML =
      '<div class="mail-head">' +
        '<h2>' + escapeHtml(m.subject || '(无主题)') + '</h2>' +
        '<div class="meta">' +
          '<b>发件人：</b>' + escapeHtml(m.from || '') + '<br>' +
          '<b>收件人：</b>' + escapeHtml(m.to || '') + '<br>' +
          '<b>时间：</b>' + escapeHtml(formatDate(m.date)) +
        '</div>' +
      '</div>' +
      '<div class="mail-body">' + bodyHtml + '</div>' +
      '<button class="delete-btn">删除邮件</button>';
    detail.querySelector('.delete-btn').onclick = () => removeMail(id);
  } catch (e) {
    detail.innerHTML = '<div id="emptyTip">加载失败：' + escapeHtml(e.message) + '</div>';
  }
}

async function removeMail(id) {
  if (!confirm('确定删除这封邮件？')) return;
  try {
    await api('/mails/' + id, { method: 'DELETE' });
    currentId = null;
    $('#mailDetail').innerHTML = '<div id="emptyTip">已删除</div>';
    loadList();
  } catch (e) {
    alert('删除失败：' + e.message);
  }
}

// 初始化：自动加载，无需任何配置
$('#refreshBtn').onclick = loadList;
loadList();
