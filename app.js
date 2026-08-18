/**
 * ysnsm 邮箱前端（多用户登录版）
 * - 登录：密码前端 MD5 后发送，服务端校验并下发 1h 时效 cookie 会话
 * - 会话：SameSite=None; Secure 跨域 cookie（自动携带，1 小时后过期自动回登录页）
 * - 独立 id：登录后每个用户独立，邮件按用户邮箱隔离
 */
const API = 'https://api.mail.ysnsm.top';

/* ==================== MD5（内联实现） ==================== */
function md5(s) {
  function safeAdd(x, y) { var lsw = (x & 0xffff) + (y & 0xffff), msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xffff); }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (var i = 0; i < x.length; i += 16) {
      var olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936); d = md5ff(d, a, b, c, x[i + 1], 12, -389564586); c = md5ff(c, d, a, b, x[i + 2], 17, 606105819); b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897); d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426); c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341); b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416); d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417); c = md5ff(c, d, a, b, x[i + 10], 17, -42063); b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682); d = md5ff(d, a, b, c, x[i + 13], 12, -40341101); c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290); b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510); d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632); c = md5gg(c, d, a, b, x[i + 11], 14, 643717713); b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691); d = md5gg(d, a, b, c, x[i + 10], 9, 38016083); c = md5gg(c, d, a, b, x[i + 15], 14, -660478335); b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438); d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690); c = md5gg(c, d, a, b, x[i + 3], 14, -187363961); b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467); d = md5gg(d, a, b, c, x[i + 2], 9, -51403784); c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473); b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558); d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463); c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562); b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060); d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353); c = md5hh(c, d, a, b, x[i + 7], 16, -155497632); b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174); d = md5hh(d, a, b, c, x[i], 11, -358537222); c = md5hh(c, d, a, b, x[i + 3], 16, -722521979); b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487); d = md5hh(d, a, b, c, x[i + 12], 11, -421815835); c = md5hh(c, d, a, b, x[i + 15], 16, 530742520); b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844); d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415); c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905); b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571); d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606); c = md5ii(c, d, a, b, x[i + 10], 15, -1051523); b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359); d = md5ii(d, a, b, c, x[i + 15], 10, -30611744); c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380); b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070); d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379); c = md5ii(c, d, a, b, x[i + 2], 15, 718787259); b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }
  function binl2rstr(input) {
    var output = '', i, length32 = input.length * 32;
    for (i = 0; i < length32; i += 8) output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
    return output;
  }
  function rstr2binl(input) {
    var i, length = input.length, output = [];
    for (i = 0; i < length; i += 4) output[i >> 2] = (input.charCodeAt(i)) | (input.charCodeAt(i + 1) << 8) | (input.charCodeAt(i + 2) << 16) | (input.charCodeAt(i + 3) << 24);
    return output;
  }
  function rstrMD5(s) { return binl2rstr(binlMD5(rstr2binl(s), s.length * 8)); }
  function rstr2hex(input) {
    var hexTab = '0123456789abcdef', output = '', x, i;
    for (i = 0; i < input.length; i++) { x = input.charCodeAt(i); output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f); }
    return output;
  }
  function str2rstrUTF8(input) { return unescape(encodeURIComponent(input)); }
  return rstr2hex(rstrMD5(str2rstrUTF8(s)));
}

/* ==================== 页面逻辑 ==================== */
const $ = (s) => document.querySelector(s);
let user = null;

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

function showLogin() {
  $('#loginView').style.display = 'flex';
  $('#mailView').style.display = 'none';
}
function enterMail() {
  $('#loginView').style.display = 'none';
  $('#mailView').style.display = 'block';
  $('#userEmails').textContent = user.emails.join(' / ');
  loadMails();
}

async function init() {
  try {
    user = await api('/api/me'); // 有 1h 会话 cookie → 直接进邮箱
    enterMail();
  } catch {
    showLogin(); // 无会话/过期 → 登录界面
  }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#loginErr').textContent = '';
  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!email || !password) { $('#loginErr').textContent = '请输入邮箱和密码'; return; }
  try {
    user = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: md5(password) }), // MD5 加密后发送
    });
    $('#password').value = '';
    enterMail();
  } catch (err) {
    $('#loginErr').textContent = err.message;
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST' }); } catch (e) {}
  user = null;
  showLogin();
});

async function loadMails() {
  try {
    const data = await api('/api/mails');
    const ul = $('#mailList');
    ul.innerHTML = '';
    $('#mailEmpty').style.display = data.mails.length ? 'none' : 'block';
    data.mails.forEach((m) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="mail-subject">${esc(m.subject)}</div>
        <div class="mail-meta">${esc(m.from)} · ${fmt(m.date)}</div>`;
      li.onclick = () => openMail(m.id);
      ul.appendChild(li);
    });
  } catch (err) {
    $('#mailEmpty').textContent = '加载失败：' + err.message;
    $('#mailEmpty').style.display = 'block';
  }
}

async function openMail(id) {
  try {
    const m = await api('/api/mails/' + id);
    $('#mailDetail').innerHTML = `
      <h2>${esc(m.subject)}</h2>
      <div class="detail-meta">发件人：${esc(m.from)}<br>收件人：${esc(m.to)}<br>时间：${fmt(m.date)}</div>
      <button id="delBtn" class="del-btn">删除</button>
      <hr>
      <pre class="mail-body">${esc(m.text || '(无正文)')}</pre>`;
    $('#delBtn').onclick = async () => {
      try { await api('/api/mails/' + id, { method: 'DELETE' }); } catch (e) {}
      $('#mailDetail').innerHTML = '<p class="placeholder">已删除</p>';
      loadMails();
    };
  } catch (err) {
    $('#mailDetail').innerHTML = '<p class="placeholder">' + esc(err.message) + '</p>';
  }
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmt(iso) { return new Date(iso).toLocaleString('zh-CN'); }

init();
