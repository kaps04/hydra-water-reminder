const intervalSelect = document.getElementById("interval");
const toggleButton = document.getElementById("toggleButton");
const testButton = document.getElementById("testButton");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

// Hydration tracker elements
const addWaterButton = document.getElementById("addWaterButton");
const waterIntake = document.getElementById("waterIntake");
const waterGoal = document.getElementById("waterGoal");
const glassCount = document.getElementById("glassCount");
const progressFill = document.getElementById("progressFill");
const progressMessage = document.getElementById("progressMessage");

const DAILY_GOAL = 2000;
const GLASS_SIZE = 250;

let isRunning = false;
let totalWater = 0;

// Get today's date
function getToday() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
}

// Load saved data
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    "interval",
    "isRunning",
    "totalWater",
    "waterDate"
  ]);

  intervalSelect.value = String(settings.interval ?? 45);
  isRunning = settings.isRunning ?? false;

  if (settings.waterDate === getToday()) {
    totalWater = settings.totalWater ?? 0;
  } else {
    totalWater = 0;

    await chrome.storage.local.set({
      totalWater: 0,
      waterDate: getToday()
    });
  }

  updateUI();
  updateWaterUI();
}

// Update reminder interface
function updateUI() {
  toggleButton.textContent = isRunning
    ? "Pause reminders"
    : "Start reminders";

  statusText.textContent = isRunning
    ? `Reminders active · Every ${intervalSelect.value} minutes`
    : "Reminders are paused";

  statusDot.classList.toggle("active", isRunning);
}

// Update hydration interface
function updateWaterUI() {
  const percentage = Math.min(
    (totalWater / DAILY_GOAL) * 100,
    100
  );

  waterIntake.textContent = totalWater;
  waterGoal.textContent = `${DAILY_GOAL} ml goal`;
  glassCount.textContent = Math.floor(totalWater / GLASS_SIZE);

  progressFill.style.width = `${percentage}%`;

  if (totalWater === 0) {
    progressMessage.textContent = "Let's get started!";
  } else if (totalWater < DAILY_GOAL) {
    progressMessage.textContent =
      `${Math.round(percentage)}% completed. Keep going!`;
  } else {
    progressMessage.textContent =
      "Daily goal reached! Amazing work! 🎉";
  }
}

// Start or pause reminders
toggleButton.addEventListener("click", async () => {
  isRunning = !isRunning;

  await chrome.storage.local.set({
    interval: Number(intervalSelect.value),
    isRunning
  });

  updateUI();
});

// Change reminder interval
intervalSelect.addEventListener("change", async () => {
  await chrome.storage.local.set({
    interval: Number(intervalSelect.value)
  });

  updateUI();
});

// Send test notification
testButton.addEventListener("click", async () => {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Hydra says hello 💧",
      message: "Your test notification is working!",
      priority: 1
    });
  } catch (error) {
    console.error("Notification failed:", error);
    statusText.textContent =
      "Notification failed. Check browser settings.";
  }
});

// Add one glass of water
addWaterButton.addEventListener("click", async () => {
  totalWater += GLASS_SIZE;

  await chrome.storage.local.set({
    totalWater: totalWater,
    waterDate: getToday()
  });

  updateWaterUI();
});

// Initialize
loadSettings();