const DEFAULT_API_BASE = "https://api.snapsell.workers.dev";

type ChannelPlatform = "facebook" | "vinted" | "gumtree";

interface RelistTask {
  id: string;
  platform: ChannelPlatform;
  variant_id: string;
  template_payload?: Record<string, unknown>;
}

const platformMatchers: Record<ChannelPlatform, RegExp> = {
  facebook: /facebook\.com\/marketplace/i,
  vinted: /vinted\./i,
  gumtree: /gumtree\.com/i
};

const pollTimers = new Map<ChannelPlatform, number>();

function getPlatformFromUrl(url?: string): ChannelPlatform | undefined {
  if (!url) return undefined;
  return (Object.keys(platformMatchers) as ChannelPlatform[]).find((platform) =>
    platformMatchers[platform].test(url)
  );
}

async function getApiBase(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiBase"], (items) => {
      const stored = items["apiBase"];
      resolve(typeof stored === "string" && stored.length ? stored : DEFAULT_API_BASE);
    });
  });
}

function queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => resolve(tabs));
  });
}

function sendMessage(tabId: number, message: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

async function fetchTasks(platform: ChannelPlatform): Promise<RelistTask[]> {
  const base = await getApiBase();
  try {
    const res = await fetch(`${base}/extension/tasks?platform=${platform}&limit=5`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      console.warn("SnapSell: task fetch failed", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as { tasks?: RelistTask[] };
    return Array.isArray(data.tasks) ? data.tasks : [];
  } catch (err) {
    console.error("SnapSell: task fetch error", err);
    return [];
  }
}

async function pollPlatform(platform: ChannelPlatform) {
  const tasks = await fetchTasks(platform);
  if (!tasks.length) return;

  const tabs = await queryTabs({ url: getTabQueryForPlatform(platform) });
  for (const tab of tabs) {
    if (!tab.id) continue;
    await sendMessage(tab.id, { type: "snapsell.tasks", platform, tasks }).catch((err) => {
      console.warn("SnapSell: unable to post tasks to tab", tab.id, err);
    });
  }
}

function getTabQueryForPlatform(platform: ChannelPlatform): string[] {
  switch (platform) {
    case "facebook":
      return ["*://www.facebook.com/marketplace/*"];
    case "vinted":
      return ["*://*.vinted.*/*"];
    case "gumtree":
      return ["*://www.gumtree.com/*"];
    default:
      return ["<all_urls>"];
  }
}

async function ensurePolling(platform: ChannelPlatform) {
  if (pollTimers.has(platform)) return;
  const timerId = setInterval(() => {
    void pollPlatform(platform);
  }, 15000);
  pollTimers.set(platform, Number(timerId));
  await pollPlatform(platform);
}

function stopPolling(platform: ChannelPlatform) {
  const timer = pollTimers.get(platform);
  if (timer) {
    clearInterval(timer);
    pollTimers.delete(platform);
  }
}

async function refreshPollingState() {
  await Promise.all(
    (Object.keys(platformMatchers) as ChannelPlatform[]).map(async (platform) => {
      const tabs = await queryTabs({ url: getTabQueryForPlatform(platform) });
      if (tabs.length) {
        await ensurePolling(platform);
      } else {
        stopPolling(platform);
      }
    }),
  );
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url ?? tab.url ?? "";
  const platform = getPlatformFromUrl(url);
  if (platform && changeInfo.status === "complete") {
    void ensurePolling(platform);
    return;
  }
  if (changeInfo.status === "loading" && url && !platform) {
    void refreshPollingState();
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  await refreshPollingState();
});

chrome.tabs.onActivated.addListener(async () => {
  await refreshPollingState();
});

chrome.windows.onFocusChanged.addListener(async () => {
  await refreshPollingState();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "snapsell.poll" && typeof message.platform === "string") {
    const platform = message.platform as ChannelPlatform;
    ensurePolling(platform);
    void pollPlatform(platform).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
  return undefined;
});

console.log("SnapSell Autofill background ready");
