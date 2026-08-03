export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function sendNotification(title, options = {}) {
  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    new Notification(title, {
      icon: '/favicon.svg', 
      ...options
    });
  }
}

const getNotificationInterval = (minsLeft) => {
  if (minsLeft <= 60) return 15; // < 1h left: every 15 mins
  if (minsLeft <= 120) return 30; // 1-2h left: every 30 mins
  if (minsLeft <= 720) return 120; // 2-12h left: every 2 hours (120 mins)
  return 240; // > 12h left: every 4 hours (240 mins)
};

let checkInterval = null;

export function startUnifiedNotificationScheduler() {
  if (checkInterval) clearInterval(checkInterval);
  if (typeof Notification === 'undefined' || Notification.permission !== "granted") return;
  
  // We run checking once every minute
  checkInterval = setInterval(() => {
    const now = new Date();
    const nowMs = now.getTime();
    
    let lastNotifiedMap = {};
    try {
      const stored = localStorage.getItem('dailyPlannerNotifHistory');
      if (stored) lastNotifiedMap = JSON.parse(stored);
    } catch(e) {}

    let mapModified = false;

    // Helper to evaluate notifications
    const evaluateItem = (idKey, title, body, deadlineMs, completed) => {
      if (completed) return;
      const minsLeft = Math.floor((deadlineMs - nowMs) / 60000);
      if (minsLeft < -60) return; // Expired over an hour ago, give up
      
      const intervalMins = getNotificationInterval(minsLeft);
      const lastNotified = lastNotifiedMap[idKey] || 0;
      const minsSinceLastNotified = Math.floor((nowMs - lastNotified) / 60000);

      // Handle Expired (< 0 mins left)
      if (minsLeft <= 0) {
        if (minsSinceLastNotified > 60) { // Send one final ping if we haven't pinged in the last hour
          sendNotification(title, { body: body || 'Time expired! Execute immediately if still pending.' });
          lastNotifiedMap[idKey] = nowMs;
          mapModified = true;
        }
      } 
      // Handle Pending
      else if (minsSinceLastNotified >= intervalMins) {
        let timeText = minsLeft < 60 ? `${minsLeft} mins` : `${Math.floor(minsLeft/60)} hours`;
        sendNotification(title, { body: body || `Only ${timeText} left to execute.` });
        lastNotifiedMap[idKey] = nowMs;
        mapModified = true;
      }
    };

    // Load data fresh from localStorage
    let tasks = [];
    let scheduleBlocks = [];
    let routines = [];
    try {
      const storedTasks = localStorage.getItem('dailyPlannerTasks');
      if (storedTasks) tasks = JSON.parse(storedTasks);
      const storedSchedule = localStorage.getItem('dailyPlannerScheduleV2');
      if (storedSchedule) scheduleBlocks = JSON.parse(storedSchedule);
      const storedRoutines = localStorage.getItem('dailyPlannerRoutinesV2');
      if (storedRoutines) routines = JSON.parse(storedRoutines);
    } catch(e) {}

    // 1. Process Tasks
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach(task => {
        // default deadline is createdAt + 24hrs
        const createdAt = task.createdAt ? new Date(task.createdAt).getTime() : nowMs - (12 * 60 * 60 * 1000); // fallback if missing
        const deadlineMs = task.deadline ? new Date(task.deadline).getTime() : (createdAt + 24 * 60 * 60 * 1000);
        evaluateItem(`task_${task.id}`, `Action Item: ${task.text}`, null, deadlineMs, task.completed);
      });
    }

    // 2. Process Schedule
    if (scheduleBlocks && Array.isArray(scheduleBlocks)) {
      scheduleBlocks.forEach(block => {
        if (!block.task || block.task.trim() === '') return;
        let deadlineMs = nowMs + (24 * 60 * 60 * 1000);
        if (block.time) {
           const [h, m] = block.time.split(':');
           if (h && m) {
             const d = new Date(now);
             d.setHours(parseInt(h), parseInt(m), 0, 0);
             const duration = block.duration || 60;
             deadlineMs = d.getTime() + (duration * 60 * 1000);
           }
        }
        evaluateItem(`block_${block.id}`, `Scheduled Block: ${block.task}`, null, deadlineMs, block.completed);
      });
    }

    // 3. Process Routines
    if (routines && Array.isArray(routines)) {
      routines.forEach(routine => {
         const todayStr = now.toISOString().split('T')[0];
         const completed = routine.history && routine.history[todayStr] === true;
         // Midnight deadline
         const d = new Date(now);
         d.setHours(23, 59, 59, 999);
         const bodyText = "Don't break the chain. Finish your daily routines today.";
         evaluateItem(`routine_${routine.id}`, `Daily Habit: ${routine.text}`, bodyText, d.getTime(), completed);
      });
    }

    if (mapModified) {
      localStorage.setItem('dailyPlannerNotifHistory', JSON.stringify(lastNotifiedMap));
    }
  }, 60000); // Check every minute
}
