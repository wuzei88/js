/******************************
 * Quantumult X - YouTube 简易翻译脚本示例
 * 功能：
 * 1. 翻译 YouTube Web 部分常见 UI 文本到中文；
 * 2. 对部分标题/简介做简单“字典式翻译”示例；
 *
 * 说明：
 * - 这是一个示范脚本，重点是教你怎么写/怎么用；
 * - 想要“全量机器翻译”，需要接外部翻译 API，会比较复杂；
 *******************************/

const isQuantumultX = typeof $task !== "undefined";

function done(body) {
  if (isQuantumultX) {
    $done({ body });
  } else {
    $done({ body });
  }
}

let body = $response.body;

// 非文本直接放行
if (!body || typeof body !== "string") {
  done(body);
}

/**
 * 一、通用 UI 文本翻译（适配 HTML / JSON 中的字符串）
 * 这里尽量只替换独立词/短语，避免误伤。
 */
const uiMap = {
  "Home": "主页",
  "Shorts": "短视频",
  "Subscriptions": "订阅",
  "Library": "媒体库",
  "Explore": "探索",
  "Trending": "热门",
  "History": "历史记录",
  "Watch later": "稍后观看",
  "Liked videos": "赞过的视频",
  "Share": "分享",
  "Download": "下载",
  "Comments": "评论",
  "Show more": "展开更多",
  "Show less": "收起",
  "Autoplay": "自动播放",
  "Settings": "设置",
  "Report": "举报",
  "Subscribers": "位订阅者",
  "views": "次观看",
  "View all": "查看全部",
  "LIVE": "直播中",
  "Top chat": "热聊",
  "Live chat": "直播聊天",
  "Skip ads": "跳过广告",
  "Ad": "广告"
};

/**
 * 为了减少误替换，这里做一个比较保守的替换函数：
 * - 尝试匹配引号包裹的字符串（HTML/JSON 中常见情况）
 */
function smartReplace(str, dict) {
  for (const [en, zh] of Object.entries(dict)) {
    // 1. JSON / HTML 属性中的 "xxx" 或 'xxx'
    const patternQuoted = new RegExp(`(["'])${en}(["'])`, "g");
    str = str.replace(patternQuoted, `$1${zh}$2`);

    // 2. 部分页面纯文本（用非字母边界简单兜底，避免连在句子中全替）
    const patternWord = new RegExp(`([^A-Za-z])${en}([^A-Za-z])`, "g");
    str = str.replace(patternWord, `$1${zh}$2`);
  }
  return str;
}

/**
 * 二、标题/简介的简单翻译示例
 * 思路：
 * - 找到 "title": "xxxx" / "descriptionSnippet" 之类字段，
 * - 通过一个小词典做替换（你可以自己扩展）。
 */
const simpleDict = {
  "tutorial": "教程",
  "beginner": "新手",
  "ultimate": "终极",
  "guide": "指南",
  "review": "评测",
  "unboxing": "开箱",
  "best": "最佳",
  "top": "热门",
  "tips": "技巧",
  "tricks": "技巧",
  "how to": "如何",
  "setup": "设置",
  "config": "配置",
  "proxy": "代理",
  "vpn": "VPN"
};

function translateByDict(str, dict) {
  let s = str;
  for (const [en, zh] of Object.entries(dict)) {
    const reg = new RegExp(en, "ig");
    s = s.replace(reg, (m) => {
      // 保留大小写形式很复杂，这里直接替换为中文
      return zh;
    });
  }
  return s;
}

function translateTitleAndDesc(str) {
  // 处理 "title": "xxx"
  str = str.replace(
    /("title"\s*:\s*")([^"]+)(")/g,
    (match, p1, p2, p3) => {
      const newText = translateByDict(p2, simpleDict);
      return `${p1}${newText}${p3}`;
    }
  );

  // 处理 "description": "xxx"
  str = str.replace(
    /("description"\s*:\s*")([^"]+)(")/g,
    (match, p1, p2, p3) => {
      const newText = translateByDict(p2, simpleDict);
      return `${p1}${newText}${p3}`;
    }
  );

  return str;
}

/**
 * 三、按顺序进行处理
 */
try {
  let newBody = body;

  // 1. UI 文字翻译
  newBody = smartReplace(newBody, uiMap);

  // 2. 标题/简介简单翻译示例
  newBody = translateTitleAndDesc(newBody);

  done(newBody);
} catch (e) {
  // 出问题就原样返回，避免页面挂掉
  console.log("YouTube Translate Script Error: " + e);
  done(body);
}
