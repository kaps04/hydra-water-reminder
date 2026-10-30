const ALARM_NAME = "hydra-water-reminder";

async function scheduleReminder(minutes) {
  await chrome.alarms.clear(ALARM_NAME);

  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: minutes,
    periodInMinutes: minutes
  });
}

async function syncReminder() {
  const settings = await chrome.storage.local.get([
    "interval",
    "isRunning"
  ]);

  if (settings.isRunning) {
    await scheduleReminder(settings.interval ?? 45);
  } else {
    await chrome.alarms.clear(ALARM_NAME);
  }
}

// Set safe defaults when Hydra is installed.
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.local.get([
    "interval",
    "isRunning"
  ]);

  await chrome.storage.local.set({
    interval: settings.interval ?? 45,
    isRunning: settings.isRunning ?? false
  });

  await syncReminder();
});

// Restore the alarm when Chrome starts.
chrome.runtime.onStartup.addListener(syncReminder);

// Keep the alarm synchronized with changes from the popup.
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === "local" &&
    (changes.interval || changes.isRunning)
  ) {
    syncReminder();
  }
});

// Show a notification whenever the scheduled alarm fires.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const settings = await chrome.storage.local.get("isRunning");

  if (!settings.isRunning) return;

  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Time to hydrate 💧",
    message: "Take a little break and have some water.",
    priority: 1
  });
});

// Make sure alarms exist after a service-worker restart.
chrome.runtime.onInstalled.addListener(syncReminder);