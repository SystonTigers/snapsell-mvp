const DEFAULT_API_BASE = "https://api.snapsell.workers.dev";

type ChannelPlatform = "facebook" | "vinted" | "gumtree";

async function loadSettings(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiBase"], (items) => {
      const stored = items["apiBase"];
      resolve(typeof stored === "string" && stored.length ? stored : DEFAULT_API_BASE);
    });
  });
}

async function saveApiBase(value: string) {
  return new Promise<void>((resolve) => {
    chrome.storage.sync.set({ apiBase: value }, () => resolve());
  });
}

async function fetchTasks(apiBase: string, platform: ChannelPlatform) {
  const status = document.getElementById("status");
  const list = document.getElementById("tasks");
  if (!status || !list) return;

  status.textContent = "Loading tasks...";
  list.innerHTML = "";

  try {
    const res = await fetch(`${apiBase}/extension/tasks?platform=${platform}&limit=5`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      status.textContent = `Error ${res.status}`;
      return;
    }
    const data = (await res.json()) as { tasks?: Array<{ id: string; variant_id: string }> };
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    if (!tasks.length) {
      status.textContent = "No pending jobs.";
      return;
    }
    status.textContent = `${tasks.length} task(s) ready.`;
    for (const task of tasks) {
      const li = document.createElement("li");
      li.textContent = `${task.id} → ${task.variant_id}`;
      li.style.fontSize = "12px";
      li.style.padding = "4px 0";
      list.appendChild(li);
    }
    chrome.runtime.sendMessage({ type: "snapsell.poll", platform }).catch(() => undefined);
  } catch (err) {
    console.error("SnapSell popup fetch error", err);
    status.textContent = "Failed to load tasks.";
  }
}

async function init() {
  const apiBaseInput = document.getElementById("apiBase") as HTMLInputElement | null;
  const platformSelect = document.getElementById("platform") as HTMLSelectElement | null;
  const refreshBtn = document.getElementById("refresh") as HTMLButtonElement | null;

  if (!apiBaseInput || !platformSelect || !refreshBtn) return;

  const apiBase = await loadSettings();
  apiBaseInput.value = apiBase;

  refreshBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const nextBase = apiBaseInput.value.trim() || DEFAULT_API_BASE;
    await saveApiBase(nextBase);
    const platform = platformSelect.value as ChannelPlatform;
    await fetchTasks(nextBase, platform);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});
