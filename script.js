// ---------- 1. Data & User State ----------
const KEY = "smartHabits";
const USER_KEY = "smartHabitUserName";

let habits = [];
try { habits = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { habits = []; }
let userName = localStorage.getItem(USER_KEY) || "";

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(habits)); } catch (e) {}
  render();
}

// ---------- 2. Date & Time helpers ----------
function fmt(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmt(d);
}
const today = () => daysAgo(0);
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return "Good Morning 🌅";
  if (hour >= 12 && hour < 17) return "Good Afternoon ☀️";
  if (hour >= 17 && hour < 22) return "Good Evening 🌆";
  return "Good Night 🌙";
}

// ---------- 3. Streak & Stats Logic ----------
function streak(h) {
  let count = 0;
  let i = h.log.includes(today()) ? 0 : 1;
  while (h.log.includes(daysAgo(i))) { count++; i++; }
  return count;
}

function weeklyStats() {
  let done = 0;
  habits.forEach(h => {
    for (let i = 0; i < 7; i++) if (h.log.includes(daysAgo(i))) done++;
  });
  const total = habits.length * 7;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function smartMessage() {
  if (habits.length === 0) return "";
  const old = habits.filter(h => h.created <= daysAgo(2));
  const missed = old.find(h => [0, 1, 2].every(i => !h.log.includes(daysAgo(i))));
  if (missed) return "💡 You haven't checked \"" + missed.name + "\" for 3 days. Complete it today to restart your streak!";
  return "🔥 Keep going! Consistency builds mastery.";
}

// ---------- 4. Activity Actions ----------
function addHabit() {
  const input = document.getElementById("habitInput");
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  habits.push({ id: Date.now(), name: name, created: today(), log: [] });
  input.value = "";
  save();
}

function toggleToday(id) {
  const h = habits.find(x => x.id === id);
  if (!h) return;
  const t = today();
  h.log = h.log.includes(t) ? h.log.filter(d => d !== t) : h.log.concat(t);
  save();
}

function deleteHabit(id) {
  if (!confirm("Delete this habit and its progress?")) return;
  habits = habits.filter(x => x.id !== id);
  save();
}

// ---------- 5. 5-Second Splash Animation Control ----------
function runSplashAnimation(onComplete) {
  const welcomeSplash = document.getElementById("welcomeSplash");
  const splashTitle = document.getElementById("splashTitle");
  const splashSubtitle = document.getElementById("splashSubtitle");
  const splashProgress = document.getElementById("splashProgress");

  splashTitle.textContent = "Welcome back, " + userName + "!";
  splashSubtitle.textContent = getTimeBasedGreeting() + " ✨";
  welcomeSplash.hidden = false;

  let progress = 0;
  splashProgress.style.width = "0%";

  const intervalTime = 50;
  const totalDuration = 5000;
  const increment = (intervalTime / totalDuration) * 100;

  const timer = setInterval(() => {
    progress += increment;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      welcomeSplash.hidden = true;
      if (onComplete) onComplete();
    }
    splashProgress.style.width = progress + "%";
  }, intervalTime);
}

function checkUserSession(isInitialLoad = false) {
  const welcomeScreen = document.getElementById("welcomeScreen");
  const mainApp = document.getElementById("mainApp");
  const timeGreetingEl = document.getElementById("timeGreeting");

  timeGreetingEl.textContent = getTimeBasedGreeting();

  if (!userName) {
    welcomeScreen.hidden = false;
    mainApp.hidden = true;
  } else {
    welcomeScreen.hidden = true;
    if (isInitialLoad) {
      runSplashAnimation(() => {
        mainApp.hidden = false;
        render();
      });
    } else {
      mainApp.hidden = false;
      render();
    }
  }
}

// ---------- 6. Navigation Tabs Logic ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.hidden = true);

    btn.classList.add("active");
    const targetTab = document.getElementById(btn.dataset.tab);
    if (targetTab) targetTab.hidden = false;
  });
});

// ---------- 7. Custom Timer Hub Logic (User-defined minutes) ----------
let hubInterval = null;
let hubTimeLeft = 25 * 60; // default 25 mins

function updateHubTimerDisplay() {
  const m = String(Math.floor(hubTimeLeft / 60)).padStart(2, "0");
  const s = String(hubTimeLeft % 60).padStart(2, "0");
  document.getElementById("hubTimerDisplay").textContent = m + ":" + s;
}

// User apna custom time set karega
document.getElementById("setCustomTimeBtn").addEventListener("click", () => {
  const inputVal = Number(document.getElementById("customMinutesInput").value);
  if (!inputVal || inputVal <= 0) {
    alert("Kripya sahi minutes enter karein (e.g. 30)");
    return;
  }
  if (hubInterval) { clearInterval(hubInterval); hubInterval = null; document.getElementById("hubStartBtn").textContent = "Start Timer"; }
  hubTimeLeft = inputVal * 60;
  updateHubTimerDisplay();
});

document.getElementById("hubStartBtn").addEventListener("click", (e) => {
  if (hubInterval) {
    clearInterval(hubInterval);
    hubInterval = null;
    e.target.textContent = "Start Timer";
    return;
  }
  e.target.textContent = "Pause Timer";
  hubInterval = setInterval(() => {
    if (hubTimeLeft > 0) {
      hubTimeLeft--;
      updateHubTimerDisplay();
    } else {
      clearInterval(hubInterval);
      hubInterval = null;
      alert("🎉 Focus session completed! Shandar pradarshan.");
      document.getElementById("hubStartBtn").textContent = "Start Timer";
    }
  }, 1000);
});

document.getElementById("hubResetBtn").addEventListener("click", () => {
  if (hubInterval) { clearInterval(hubInterval); hubInterval = null; }
  document.getElementById("hubStartBtn").textContent = "Start Timer";
  const customVal = Number(document.getElementById("customMinutesInput").value) || 25;
  hubTimeLeft = customVal * 60;
  updateHubTimerDisplay();
});

// ---------- 8. Leaderboard Rendering ----------
function renderLeaderboard() {
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";

  let totalUserChecks = 0;
  habits.forEach(h => totalUserChecks += h.log.length);

  const entries = [
    { name: userName || "You", score: totalUserChecks * 10 + 150, badge: "🥇", isUser: true },
    { name: "Aarav Sharma", score: 380, badge: "🥈", isUser: false },
    { name: "Priya Verma", score: 310, badge: "🥉", isUser: false },
    { name: "Rohan Gupta", score: 240, badge: "✨", isUser: false }
  ];

  entries.sort((a, b) => b.score - a.score);

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "leaderboard-item";
    li.innerHTML = `
      <div class="leaderboard-user">
        <span class="rank-badge">${entry.badge || (index + 1)}</span>
        <span>${entry.name} ${entry.isUser ? '(You)' : ''}</span>
      </div>
      <div class="score-badge">${entry.score} XP</div>
    `;
    list.appendChild(li);
  });
}

// ---------- 9. Rendering Dashboard ----------
function render() {
  if (!userName) return;

  const greeting = getTimeBasedGreeting();
  document.getElementById("userGreetingTitle").textContent = greeting + ", " + userName;
  document.getElementById("todayLabel").textContent =
    new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const list = document.getElementById("habitList");
  list.innerHTML = "";

  habits.forEach(h => {
    const li = document.createElement("li");
    const isDone = h.log.includes(today());
    li.className = "habit animate-slide" + (isDone ? " done" : "");

    let week = "";
    for (let i = 6; i >= 0; i--) week += '<span class="' + (h.log.includes(daysAgo(i)) ? "on" : "") + '"></span>';

    li.innerHTML =
      '<button class="tick" data-act="tick" data-id="' + h.id + '" aria-label="Mark done">&#10003;</button>' +
      '<div class="info"><div class="name"></div>' +
      '<div class="meta">Streak: ' + streak(h) + ' day' + (streak(h) === 1 ? "" : "s") + '</div>' +
      '<div class="week" aria-hidden="true">' + week + '</div></div>' +
      '<div class="habit-actions">' +
      '<button class="del" data-act="del" data-id="' + h.id + '" aria-label="Delete">&#10005;</button>' +
      '</div>';

    li.querySelector(".name").textContent = h.name;
    list.appendChild(li);
  });

  document.getElementById("empty").hidden = habits.length > 0;

  const s = weeklyStats();
  document.getElementById("percent").textContent = s.percent + "%";
  document.getElementById("progressDetail").textContent =
    habits.length ? s.done + " of " + s.total + " check-ins completed" : "This week's consistency";
  document.getElementById("barFill").style.width = s.percent + "%";

  const msg = smartMessage();
  const box = document.getElementById("smartMsg");
  box.hidden = !msg;
  box.textContent = msg;

  renderLeaderboard();
}

// ---------- 10. Event Listeners ----------
document.getElementById("startBtn").addEventListener("click", () => {
  const input = document.getElementById("userNameInput");
  const nameVal = input.value.trim();
  if (!nameVal) { input.focus(); return; }
  userName = nameVal;
  localStorage.setItem(USER_KEY, userName);
  document.getElementById("welcomeScreen").hidden = true;
  runSplashAnimation(() => {
    document.getElementById("mainApp").hidden = false;
    render();
  });
});

document.getElementById("userNameInput").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("startBtn").click();
});

document.getElementById("changeNameBtn").addEventListener("click", () => {
  if (confirm("Do you want to change your profile name?")) {
    localStorage.removeItem(USER_KEY);
    userName = "";
    document.getElementById("mainApp").hidden = true;
    document.getElementById("userNameInput").value = "";
    checkUserSession(false);
  }
});

document.getElementById("addBtn").addEventListener("click", addHabit);
document.getElementById("habitInput").addEventListener("keydown", e => { if (e.key === "Enter") addHabit(); });

document.getElementById("habitList").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === "tick") toggleToday(id);
  if (btn.dataset.act === "del") deleteHabit(id);
});

// App load hone par check karega
checkUserSession(true);