/**
 * ysnsm 邮箱前端
 * 依赖：后端 Worker API（GET /api/mails, GET /api/mails/:id, DELETE /api/mails/:id）
 * 鉴权：?key=xxx 或 X-Auth-Key 头（与 Worker 的 AUTH_KEY 一致）
 */
const LS_URL = 'ysnsm_api_url';
const DEFAULT_API_URL = 'https://api.mail.ysnsm.top';
const LS_KEY = 'ysnsm_api_key';

const $ = (sel) => document.querySelector(sel);

let mails = [];
let currentId = null;

function loadSettings() {
  $('#apiUrl').value = localStorage.getItem(LS_URL) || DEFAULT_API_URL;
  $('#apiKey').value = localStorage.getItem(LS_KEY) || '';
}


async function loadConfigFromEnv() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const cfg = await res.json();
    // 环境变量有值才覆盖（localStorage 里手动保存的值优先）
    if (cfg.apiUrl && !localStorage.getItem(LS_URL)) {
      $('#apiUrl').value = cfg.apiUrl;
    }
    if (cfg.apiKey && !localStorage.getItem(LS_KEY)) {
      $('#apiKey').value = cfg.apiKey;
    }
  } catch (e) {
    // 没有 Pages Functions 或未配置环境变量时静默失败（保持手动填写）
  }
}

function saveSettings() {
  localStorage.setItem(LS_URL, $('#apiUrl').value.trim());
  localStorage.setItem(LS_KEY, $('#apiKey').value.trim());
}

function apiBase() {
  const u = $('#apiUrl').value.trim();
  return u.replace(/\/+$/, '');
}

async function api(path, options = {}) {
  const base = apiBase();
  if (!base) throw new Error('请先填写 Worker 地址');
  const res = await fetch(base + path, {
    ...options,
    headers: {
      'X-Auth-Key': $('#apiKey').value.trim(),
      ...(options.headers || {}),
    },
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
    const data = await api('/api/mails?limit=50');
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
    const m = await api('/api/mails/' + id);
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
    await api('/api/mails/' + id, { method: 'DELETE' });
    currentId = null;
    $('#mailDetail').innerHTML = '<div id="emptyTip">已删除</div>';
    loadList();
  } catch (e) {
    alert('删除失败：' + e.message);
  }
}

// 初始化
loadSettings();
loadConfigFromEnv();
$('#saveBtn').onclick = () => {
  saveSettings();
  loadList();
};
$('#refreshBtn').onclick = loadList;
loadList();
