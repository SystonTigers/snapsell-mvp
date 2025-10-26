interface RelistTaskMessage {
  type: "snapsell.tasks";
  platform: "facebook" | "vinted" | "gumtree";
  tasks: Array<{
    id: string;
    variant_id: string;
    template_payload?: Record<string, unknown>;
  }>;
}

declare global {
  interface Window {
    __SNAPSELL_QUEUE__?: RelistTaskMessage["tasks"];
  }
}

function handleTasks(message: RelistTaskMessage) {
  window.__SNAPSELL_QUEUE__ = message.tasks;
  console.info("SnapSell: received tasks", message.platform, message.tasks.length);
  if (!message.tasks.length) return;

  const [next] = message.tasks;
  highlightDraftIntent(next);
}

function highlightDraftIntent(task: RelistTaskMessage["tasks"][number]) {
  const bannerId = "snapsell-task-banner";
  let banner = document.getElementById(bannerId);
  if (!banner) {
    banner = document.createElement("div");
    banner.id = bannerId;
    banner.style.position = "fixed";
    banner.style.bottom = "16px";
    banner.style.right = "16px";
    banner.style.zIndex = "999999";
    banner.style.padding = "12px 16px";
    banner.style.background = "#1f2937";
    banner.style.color = "#fff";
    banner.style.borderRadius = "8px";
    banner.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
    document.body.appendChild(banner);
  }
  banner.textContent = `SnapSell task ready: ${task.variant_id}`;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "snapsell.tasks") {
    handleTasks(message as RelistTaskMessage);
  }
});

console.log("SnapSell Autofill content script ready");
