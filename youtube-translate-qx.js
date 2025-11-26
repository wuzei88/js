/******************************
 * Quantumult X - YouTube 字幕自动翻译脚本
 *
 * 功能：
 *  - 拦截 https://www.youtube.com/api/timedtext 字幕接口
 *  - 调用 Google Translate 免费接口，将字幕翻译为目标语言
 *
 * 使用提示：
 *  - 默认翻译成简体中文（zh-CN），可以自行改成其他语言代码
 *  - 仅在字幕不是中文时才尝试翻译
 *******************************/

const isQX = typeof $task !== "undefined";
const url = $request.url || "";
let body = $response.body || "";

// ===== 你可以在这里改目标语言 =====
const TARGET_LANG = "zh-CN"; // 想要英文就写 "en"、繁体 "zh-TW"、日文 "ja" 等
// ==================================

// 如果本身就是中文字幕，直接放行（简单判断）
if (/lang=zh/i.test(url) || /tlang=zh/i.test(url)) {
  $done({ body });
}

// 非 XML/空响应直接放行
if (!body || typeof body !== "string" || body.indexOf("<text") === -1) {
  $done({ body });
}

// XML 实体解码
function decodeXml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// XML 实体编码
function encodeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 调用 Google Translate 免费接口翻译
function translateOne(text) {
  const q = encodeURIComponent(text);
  const api =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${TARGET_LANG}&dt=t&q=${q}`;

  const req = { url: api, headers: { "User-Agent": "Mozilla/5.0" } };

  return $task.fetch(req).then(
    (resp) => {
      try {
        const data = JSON.parse(resp.body);
        // data[0] 是分段数组，每项 [翻译后, 原文, ...]
        let result = "";
        data[0].forEach((seg) => {
          result += seg[0];
        });
        return result || text; // 失败就返回原文
      } catch (e) {
        console.log("Translate parse error:", e);
        return text;
      }
    },
    (err) => {
      console.log("Translate request error:", err);
      return text;
    }
  );
}

// 主逻辑：抽取 <text> 标签内容 -> 翻译 -> 写回 XML
!(async () => {
  try {
    const regex = /<text([^>]*)>([\s\S]*?)<\/text>/g;
    let match;
    const segments = [];

    while ((match = regex.exec(body)) !== null) {
      const full = match[0];
      const attrs = match[1] || "";
      const contentRaw = match[2] || "";
      const content = decodeXml(contentRaw);

      segments.push({
        full,
        attrs,
        text: content,
      });
    }

    if (segments.length === 0) {
      $done({ body });
      return;
    }

    const translatedList = [];

    // 逐行翻译（简单直观，但如果视频非常长，可能稍微慢一点）
    for (let i = 0; i < segments.length; i++) {
      const t = segments[i].text.trim();
      if (!t) {
        translatedList[i] = segments[i].text;
        continue;
      }

      // 如果本行已经大概率是中文，就不翻
      if (/[\u4e00-\u9fa5]/.test(t)) {
        translatedList[i] = segments[i].text;
        continue;
      }

      const trans = await translateOne(t);
      translatedList[i] = trans;
    }

    let newBody = body;

    // 按顺序替换回 XML
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const newTextEncoded = encodeXml(translatedList[i]);
      const replacement = `<text${seg.attrs}>${newTextEncoded}</text>`;
      newBody = newBody.replace(seg.full, replacement);
    }

    $done({ body: newBody });
  } catch (e) {
    console.log("YouTube Subtitle Translate Error:", e);
    $done({ body });
  }
})();
