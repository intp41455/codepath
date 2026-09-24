/* 循码 · Star 权益解锁（零依赖，纯前端校验）
 * ============================================================
 * 机制：陛下在 GitHub 仓库点 star 的用户，在 issue 留言 GitHub 用户名，
 *      由运营侧用 tools/gen-code.py 生成解锁码发给用户，用户在站内输入即解锁全部高级模块。
 *
 * 安全模型（诚实说明）：
 *   本文件为纯静态站，无后端。校验采用「校验和 + 盐」方案，用于防止随手乱输，
 *   不构成密码学级别的授权。这是刻意选择——站点卖点之一就是"零后端、零追踪"，
 *   不值得为了防盗版引入服务器。真正的门槛是"你得去点个 star"，属荣誉制。
 *
 * 码格式：CP-XXXX-XXXX-XXXX （大写字母 + 数字，去掉易混字符 0O1I）
 * 校验：前 11 位为载荷，末位组为基于载荷 + 盐的校验和。
 *
 * 挂接点：
 *   - index.html 顶栏 #star-unlock-button（★ 图标）打开解锁对话框
 *   - 解锁状态存 localStorage['codepath_star']
 *   - 其他模块可用 window.CodepathStar.isUnlocked() 判断是否解锁
 */
(function () {
  "use strict";

  var STORAGE_KEY = "codepath_star";
  var SALT = "codepath-academy-2026";

  // 去掉易混字符：0 O 1 I L
  var ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

  /* ---------- 校验核心 ---------- */
  // 确定性哈希：FNV-1a 32bit，把字符串映射成 0..36^4 的数，取末 4 位字符。
  // 关键：必须用 Math.imul 做 32 位精确乘法。普通 `h * 16777619` 会超过 2^53，
  //      双精度浮点丢精度，导致与 Python 侧（& 0xFFFFFFFF 精确整数）结果不一致。
  function hashPayload(payload) {
    var h = 2166136261 | 0;
    var s = payload + "|" + SALT;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h = h >>> 0;
    // 生成 4 个字符的校验位
    var out = "";
    var n = h;
    for (var k = 0; k < 4; k++) {
      out += ALPHABET[n % ALPHABET.length];
      n = Math.floor(n / ALPHABET.length) + 7;
    }
    return out;
  }

  // 归一化用户输入：去空格/横杠、转大写
  function normalize(raw) {
    return String(raw || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  }

  // 校验一个码是否合法
  function validate(raw) {
    var s = normalize(raw);
    // 完整码：CP + 12 位（8 载荷 + 4 校验）= 14 字符
    if (s.length !== 14 || s.slice(0, 2) !== "CP") return false;
    var payload = s.slice(2, 10);   // 8 位载荷
    var check = s.slice(10);        // 4 位校验
    var expect = hashPayload(payload);
    return check === expect;
  }

  /* ---------- 状态持久化 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return d && d.code ? d : null;
    } catch (e) {
      return null;
    }
  }

  function save(code) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        code: code,
        at: new Date().toISOString()
      }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function isUnlocked() {
    var d = load();
    return !!(d && validate(d.code));
  }

  /* ---------- UI ---------- */
  var DIALOG_ID = "star-unlock-dialog";

  function ensureDialog() {
    if (document.getElementById(DIALOG_ID)) return document.getElementById(DIALOG_ID);

    var dlg = document.createElement("dialog");
    dlg.id = DIALOG_ID;
    dlg.innerHTML = [
      '<div class="dialog-head"><h2>⭐ 解锁全部高级功能</h2>',
      '<button class="icon-button" id="close-star" aria-label="关闭">×</button></div>',
      '<p class="auth-sub">给循码点个 star，全部高级模块免费解锁</p>',
      '<div id="star-body"></div>'
    ].join("");
    document.body.appendChild(dlg);

    dlg.querySelector("#close-star").onclick = function () { dlg.close(); };
    return dlg;
  }

  function renderBody() {
    var body = document.getElementById("star-body");
    if (!body) return;
    var unlocked = isUnlocked();

    if (unlocked) {
      var d = load();
      body.innerHTML = [
        '<div class="star-ok">',
        '<div class="star-ok-icon">⭐</div>',
        '<b>已解锁全部高级功能</b>',
        '<p class="muted">解锁码：', (d.code || "").replace(/(.{2})(.{4})(.{4})(.{4})/, "$1-$2-$3-$4"),
        '<br>解锁时间：', (d.at || "").slice(0, 10), '</p>',
        '<button type="button" class="secondary" id="star-revoke">解除本机解锁</button>',
        '</div>'
      ].join("");
      var rev = document.getElementById("star-revoke");
      if (rev) rev.onclick = function () {
        clear();
        renderBody();
        if (window.CodepathToast) window.CodepathToast("已解除本机解锁");
        document.dispatchEvent(new CustomEvent("codepath:star-changed", { detail: { unlocked: false } }));
      };
      return;
    }

    body.innerHTML = [
      '<ol class="star-steps">',
      '<li>打开 <a href="https://github.com/intp41455/codepath" target="_blank" rel="noopener">GitHub 仓库</a>，点右上角 <b>Star ⭐</b></li>',
      '<li>在该仓库 <a href="https://github.com/intp41455/codepath/issues/new?title=%E7%94%B3%E9%A2%86%E8%A7%A3%E9%94%81%E7%A0%81&body=%E6%88%91%E5%B7%B2%E7%82%B9%20star%EF%BC%8C%E6%B1%82%E8%A7%A3%E9%94%81%E7%A0%81%20%F0%9F%99%8F%20%EF%BC%88GitHub%20%E7%94%A8%E6%88%B7%E5%90%8D%EF%BC%9A%EF%BC%89" target="_blank" rel="noopener">新建 issue</a> 留言你的 GitHub 用户名</li>',
      '<li>收到解锁码后，填在下面 →</li>',
      '</ol>',
      '<div class="star-input-row">',
      '<input id="star-code-input" type="text" placeholder="CP-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false">',
      '<button type="button" class="primary" id="star-apply">解锁</button>',
      '</div>',
      '<p id="star-msg" role="alert" aria-live="polite" class="muted"></p>',
      '<p class="muted star-note">码只在本机校验并保存，不上传服务器。一个 star 一份心意，感谢支持 🙏</p>'
    ].join("");

    var input = document.getElementById("star-code-input");
    var msg = document.getElementById("star-msg");

    function apply() {
      var v = input.value.trim();
      if (!v) { msg.textContent = "请先填入解锁码"; msg.style.color = "#e57373"; return; }
      if (validate(v)) {
        save(normalize(v));
        msg.textContent = "";
        renderBody();
        if (window.CodepathToast) window.CodepathToast("⭐ 已解锁全部高级功能");
        document.dispatchEvent(new CustomEvent("codepath:star-changed", { detail: { unlocked: true } }));
      } else {
        msg.textContent = "解锁码无效，请检查是否输错（或去 issue 重新领取）";
        msg.style.color = "#e57373";
      }
    }

    document.getElementById("star-apply").onclick = apply;
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") apply(); });
  }

  function openDialog() {
    var dlg = ensureDialog();
    renderBody();
    if (dlg.showModal) dlg.showModal();
  }

  /* ---------- 顶栏按钮 ---------- */
  function mountButton() {
    var actions = document.querySelector(".top-actions");
    if (!actions || document.getElementById("star-unlock-button")) return;

    var btn = document.createElement("button");
    btn.className = "icon-button";
    btn.id = "star-unlock-button";
    btn.type = "button";
    btn.setAttribute("aria-label", "Star 解锁全部高级功能");
    btn.onclick = openDialog;
    actions.insertBefore(btn, actions.firstChild);

    refreshButton();
    document.addEventListener("codepath:star-changed", refreshButton);
  }

  function refreshButton() {
    var btn = document.getElementById("star-unlock-button");
    if (!btn) return;
    var on = isUnlocked();
    btn.textContent = "⭐";
    btn.title = on ? "已解锁全部高级功能（点击查看）" : "点 star 免费解锁全部高级功能";
    btn.classList.toggle("star-unlocked", on);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mountButton);
    } else {
      mountButton();
    }
  }
  init();

  // 导出
  window.CodepathStar = {
    isUnlocked: isUnlocked,
    validate: validate,
    open: openDialog,
    clear: clear,
    _hash: hashPayload,
    _normalize: normalize
  };
})();
