/* 循码 · 通用模型接口（BYOK，自带 Key）
 * 走 OpenAI 兼容协议：POST {baseUrl}/chat/completions
 * 可用端点：OpenAI / DeepSeek / Moonshot / Ollama 本地 / 各类中转站
 * 安全：apiKey 仅存浏览器本地 localStorage，绝不上传到循码服务器。
 * 降级：未配置 Key 或调用失败时，返回确定性"本地演示回复"，站点开箱即用不报错。
 * 本文件零依赖，不修改任何现有模块。
 */
(function () {
  "use strict";

  var STORAGE_KEY = "codepath_llm";
  var TIMEOUT_MS = 60000;

  // Provider 预设（选中自动填 baseUrl/model，可手改）
  var PROVIDERS = {
    openai:   { label: "OpenAI",     baseUrl: "https://api.openai.com/v1",     model: "gpt-4o-mini",    needKey: true },
    deepseek: { label: "DeepSeek",   baseUrl: "https://api.deepseek.com/v1",   model: "deepseek-chat",  needKey: true },
    ollama:   { label: "Ollama 本地", baseUrl: "http://localhost:11434/v1",   model: "llama3",          needKey: false },
    custom:   { label: "自定义",       baseUrl: "",                            model: "",                needKey: true }
  };

  var DEFAULT = {
    provider: "openai",
    baseUrl: PROVIDERS.openai.baseUrl,
    model: PROVIDERS.openai.model,
    apiKey: "",
    temperature: 0.7
  };

  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT);
      var c = JSON.parse(raw);
      return Object.assign({}, DEFAULT, c || {});
    } catch (e) {
      return Object.assign({}, DEFAULT);
    }
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return true;
    } catch (e) {
      return false;
    }
  }

  // 本地模拟助手：无 Key / 调用失败时的确定性演示回复
  function fallbackReply(original, reason) {
    return (
      "（本地演示回复 · 未连接模型）\n" +
      "你没有配置可用的模型，或刚才的连接失败了。原因：" + reason + "\n\n" +
      "这是一个确定性的占位回复，用来保证循码在无模型时也能正常交互。\n" +
      "想接真实模型：点右上角 ⚙「模型设置」，填入任意 OpenAI 兼容的 baseUrl、model 和 apiKey，" +
      "再点「测试连接」。Key 只保存在你的浏览器本地，不会发送到循码服务器。\n\n" +
      "你刚才问的是：「" + (original || "").slice(0, 60) + "」"
    );
  }

  // 核心可复用函数：window.llmChat
  async function llmChat(input) {
    var messages = input && input.messages ? input.messages : [];
    var cfg = loadConfig();
    var original = (messages.length ? messages[messages.length - 1].content : (input && input.question) || "");

    if (!cfg.apiKey && cfg.provider !== "ollama") {
      return { ok: false, source: "local", text: fallbackReply(original, "未配置 API Key") };
    }

    var base = (cfg.baseUrl || "").replace(/\/+$/, "");
    if (!base) {
      return { ok: false, source: "local", text: fallbackReply(original, "未填写 baseUrl") };
    }

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    try {
      var headers = { "Content-Type": "application/json" };
      if (cfg.apiKey) headers["Authorization"] = "Bearer " + cfg.apiKey;

      var resp = await fetch(base + "/chat/completions", {
        method: "POST",
        headers: headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: cfg.model || "gpt-4o-mini",
          messages: messages,
          temperature: typeof cfg.temperature === "number" ? cfg.temperature : 0.7
        })
      });

      if (!resp.ok) {
        var detail = "";
        try { detail = (await resp.json()).error?.message || ("HTTP " + resp.status); } catch (e) { detail = "HTTP " + resp.status; }
        return { ok: false, source: "local", text: fallbackReply(original, "模型端点返回 " + detail) };
      }

      var data = await resp.json();
      var content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content : "";
      if (!content) {
        return { ok: false, source: "local", text: fallbackReply(original, "模型返回了空内容") };
      }
      return { ok: true, source: "model", text: content };
    } catch (err) {
      return {
        ok: false, source: "local",
        text: fallbackReply(original, "网络/CORS 失败：" + (err && err.message ? err.message : err) +
          "（注意：浏览器直连要求该模型端点允许跨域；Ollama 需配 OLLAMA_ORIGINS）")
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // 测试连接：发一条 ping，验证 baseUrl/model/key 可用
  async function testConnection(cfgOverride) {
    var cfg = cfgOverride || loadConfig();
    var base = (cfg.baseUrl || "").replace(/\/+$/, "");
    if (!base) return { ok: false, message: "请先填写 baseUrl" };
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var headers = { "Content-Type": "application/json" };
      if (cfg.apiKey) headers["Authorization"] = "Bearer " + cfg.apiKey;
      var resp = await fetch(base + "/chat/completions", {
        method: "POST", headers: headers, signal: controller.signal,
        body: JSON.stringify({ model: cfg.model || "gpt-4o-mini", messages: [{ role: "user", content: "ping" }], max_tokens: 8, temperature: 0 })
      });
      if (!resp.ok) {
        var d = ""; try { d = (await resp.json()).error?.message || resp.status; } catch (e) { d = resp.status; }
        return { ok: false, message: "连接失败：" + d };
      }
      return { ok: true, message: "连接成功 ✓ 模型 " + (cfg.model || "") + " 可用" };
    } catch (err) {
      return { ok: false, message: "连接失败：" + (err && err.message ? err.message : err) + "（多为跨域 CORS 限制或端点不通）" };
    } finally {
      clearTimeout(timer);
    }
  }

  // 暴露给页面
  window.llmChat = llmChat;
  window.llmClient = {
    providers: PROVIDERS,
    defaults: DEFAULT,
    load: loadConfig,
    save: saveConfig,
    test: testConnection,
    storageKey: STORAGE_KEY
  };
})();
