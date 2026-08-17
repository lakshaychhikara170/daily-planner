import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

// Detect if running inside Electron
export const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export const AppContext = createContext();

export function AppProvider({ children }) {
  const { user, isPro } = useContext(AuthContext);
  const [cloudSyncLoaded, setCloudSyncLoaded] = useState(false);

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('dailyPlannerTasks');
    if (savedTasks) return JSON.parse(savedTasks);
    return [
      { id: 1, text: 'Review Strategy Deck', completed: false },
      { id: 2, text: 'Finalize Branding Assets', completed: false },
      { id: 3, text: 'Client Sync', completed: true },
    ];
  });
  
  const [activeTask, setActiveTask] = useState(null);
  const [trackedTask, setTrackedTask] = useState(null);
  
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [isFocusTimerActive, setIsFocusTimerActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);

  // Gamification State
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerPoints');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isGamified, setIsGamified] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerGamified');
    return saved ? JSON.parse(saved) : false;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerSound');
    return saved ? JSON.parse(saved) : true;
  });
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerStreak');
    return saved ? JSON.parse(saved) : { count: 0, lastActiveDate: null };
  });
  const [dailyQuests, setDailyQuests] = useState(() => {
    const saved = localStorage.getItem('dailyPlannerQuests');
    return saved ? JSON.parse(saved) : null;
  });

  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);

  // Audio System
  const playSound = (type) => {
    if (!soundEnabled || !isGamified) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'score') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'levelup') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch(e) {}
  };

  // Level Logic
  const getLevelInfo = (totalXP) => {
    let lvl = 1;
    let xpForNext = 500;
    let xpRem = totalXP;
    while (xpRem >= xpForNext) { xpRem -= xpForNext; lvl++; xpForNext += 500; }
    return { level: lvl, xpRemaining: xpRem, xpForNextLevel: xpForNext, progress: (xpRem/xpForNext)*100 };
  };
  const levelInfo = getLevelInfo(points);

  // Multiplier
  let xpMultiplier = 1;
  if (streak.count >= 7) xpMultiplier = 2.0;
  else if (streak.count >= 3) xpMultiplier = 1.5;

  const registerActivity = () => {
    const today = new Date().toISOString().split('T')[0];
    if (streak.lastActiveDate === today) return;
    
    setStreak(prev => {
      let newCount = 1;
      if (prev.lastActiveDate) {
        const last = new Date(prev.lastActiveDate);
        const curr = new Date(today);
        const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) newCount = prev.count + 1;
        else if (diffDays > 1) newCount = 1;
      }
      return { count: newCount, lastActiveDate: today };
    });
  };

  // Quests logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!dailyQuests || dailyQuests.date !== today) {
      setDailyQuests({
        date: today,
        quests: [
          { id: 'tasks', text: 'Complete 3 Tasks', progress: 0, target: 3, completed: false },
          { id: 'focus', text: 'Focus for 25 mins', progress: 0, target: 25, completed: false },
          { id: 'routine', text: 'Check 2 Habits', progress: 0, target: 2, completed: false }
        ],
        rewardClaimed: false
      });
    }
  }, []);

  const updateQuest = (questId, amount) => {
    setDailyQuests(prev => {
      if (!prev || prev.date !== new Date().toISOString().split('T')[0]) return prev;
      let allDone = true;
      const newQuests = prev.quests.map(q => {
        if (q.id === questId && !q.completed) {
          const newProg = Math.min(q.target, q.progress + amount);
          return { ...q, progress: newProg, completed: newProg >= q.target };
        }
        if (!q.completed) allDone = false;
        return q;
      });
      return { ...prev, quests: newQuests };
    });
  };

  useEffect(() => {
    if (dailyQuests && !dailyQuests.rewardClaimed) {
      const allDone = dailyQuests.quests.every(q => q.completed);
      if (allDone) {
        setDailyQuests(prev => ({ ...prev, rewardClaimed: true }));
        setPoints(p => {
          playSound('levelup');
          return p + 2000;
        });
      }
    }
  }, [dailyQuests]);

  const addPoints = (baseAmount) => {
    if (!isGamified) return;
    let amount = baseAmount > 0 ? Math.round(baseAmount * xpMultiplier) : baseAmount;
    
    setPoints(prev => {
      const oldLevel = getLevelInfo(prev).level;
      const newPoints = Math.max(0, prev + amount);
      const newLevel = getLevelInfo(newPoints).level;
      
      if (amount > 0) {
        if (newLevel > oldLevel) playSound('levelup');
        else playSound('score');
        
        setLastPointsGained(amount);
        setShowPointsAnimation(true);
        setTimeout(() => setShowPointsAnimation(false), 2000);
        registerActivity();
      }
      return newPoints;
    });
  };

  // Sync state to localStorage
  useEffect(() => { localStorage.setItem('dailyPlannerTasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('dailyPlannerPoints', points); }, [points]);
  useEffect(() => { localStorage.setItem('dailyPlannerGamified', JSON.stringify(isGamified)); }, [isGamified]);
  useEffect(() => { localStorage.setItem('dailyPlannerSound', JSON.stringify(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('dailyPlannerStreak', JSON.stringify(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('dailyPlannerQuests', JSON.stringify(dailyQuests)); }, [dailyQuests]);

  // Sync state to Cloud
  useEffect(() => {
    let unsubscribe = null;
    if (user && db) {
      const docRef = doc(db, 'users', user.uid, 'data', 'sync');
      
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // To prevent infinite loops, only apply incoming data if it's not the exact same as local state
          if (data.tasks && JSON.stringify(data.tasks) !== JSON.stringify(tasks)) setTasks(data.tasks);
          if (data.points !== undefined && data.points !== points) setPoints(data.points);
          if (data.streak && JSON.stringify(data.streak) !== JSON.stringify(streak)) setStreak(data.streak);
          if (data.isGamified !== undefined && data.isGamified !== isGamified) setIsGamified(data.isGamified);
          
          // Sync goals, schedule, routines to localStorage
          let updatedLocalStorage = false;
          if (data.goals && JSON.stringify(data.goals) !== localStorage.getItem('dailyPlannerGoals')) {
            localStorage.setItem('dailyPlannerGoals', JSON.stringify(data.goals));
            updatedLocalStorage = true;
          }
          if (data.schedule && JSON.stringify(data.schedule) !== localStorage.getItem('dailyPlannerScheduleV2')) {
            localStorage.setItem('dailyPlannerScheduleV2', JSON.stringify(data.schedule));
            updatedLocalStorage = true;
          }
          if (data.routines && JSON.stringify(data.routines) !== localStorage.getItem('dailyPlannerRoutines')) {
            localStorage.setItem('dailyPlannerRoutines', JSON.stringify(data.routines));
            updatedLocalStorage = true;
          }
          
          if (updatedLocalStorage) {
            window.dispatchEvent(new Event('cloudDataLoaded'));
            // Trigger internal update events so components re-render
            window.dispatchEvent(new Event('goalsUpdated'));
            window.dispatchEvent(new Event('scheduleUpdated'));
            window.dispatchEvent(new Event('routinesUpdated'));
          }
        }
        setCloudSyncLoaded(true);
      }, (error) => {
        console.error("Error with cloud sync listener:", error);
        setCloudSyncLoaded(true);
      });
    } else {
      setCloudSyncLoaded(true);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Listen for external updates so we can trigger cloud sync
  const [externalSyncTrigger, setExternalSyncTrigger] = useState(0);
  useEffect(() => {
    const triggerSync = () => setExternalSyncTrigger(p => p + 1);
    window.addEventListener('goalsUpdated', triggerSync);
    window.addEventListener('scheduleUpdated', triggerSync);
    window.addEventListener('routinesUpdated', triggerSync);
    return () => {
      window.removeEventListener('goalsUpdated', triggerSync);
      window.removeEventListener('scheduleUpdated', triggerSync);
      window.removeEventListener('routinesUpdated', triggerSync);
    };
  }, []);

  useEffect(() => {
    if (user && cloudSyncLoaded && db) {
      const syncTimeout = setTimeout(() => {
        const goals = JSON.parse(localStorage.getItem('dailyPlannerGoals') || '[]');
        const schedule = JSON.parse(localStorage.getItem('dailyPlannerScheduleV2') || '[]');
        const routines = JSON.parse(localStorage.getItem('dailyPlannerRoutines') || '[]');
        const docRef = doc(db, 'users', user.uid, 'data', 'sync');
        setDoc(docRef, {
          tasks, points, streak, isGamified,
          goals, schedule, routines,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.error("Cloud Sync error:", err));
      }, 1500);
      return () => clearTimeout(syncTimeout);
    }
  }, [tasks, points, streak, isGamified, user, cloudSyncLoaded, externalSyncTrigger]);

  // ─── Electron IPC: Sync localStorage between main window ↔ widget window ───
  useEffect(() => {
    if (!window.electronAPI) return;

    const isWidget = window.location.hash.includes('/widget');

    // Gather all localStorage keys relevant for sync
    const gatherSyncData = () => ({
      dailyPlannerTasks: localStorage.getItem('dailyPlannerTasks'),
      dailyPlannerGoals: localStorage.getItem('dailyPlannerGoals'),
      dailyPlannerScheduleV2: localStorage.getItem('dailyPlannerScheduleV2'),
      dailyPlannerRoutines: localStorage.getItem('dailyPlannerRoutines'),
      dailyPlannerPoints: localStorage.getItem('dailyPlannerPoints'),
      dailyPlannerStreak: localStorage.getItem('dailyPlannerStreak'),
      dailyPlannerGamified: localStorage.getItem('dailyPlannerGamified'),
      dailyPlannerQuests: localStorage.getItem('dailyPlannerQuests'),
      dailyPlannerSound: localStorage.getItem('dailyPlannerSound'),
    });

    const applySyncData = (data) => {
      if (!data) return;
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          localStorage.setItem(key, value);
        }
      });
      // Update React state from the received localStorage data
      try {
        if (data.dailyPlannerTasks) setTasks(JSON.parse(data.dailyPlannerTasks));
        if (data.dailyPlannerPoints) setPoints(parseInt(data.dailyPlannerPoints, 10));
        if (data.dailyPlannerStreak) setStreak(JSON.parse(data.dailyPlannerStreak));
        if (data.dailyPlannerGamified) setIsGamified(JSON.parse(data.dailyPlannerGamified));
      } catch (e) { console.error('Error applying synced data:', e); }
      // Dispatch events so StickyWidget picks up schedule/routines/goals changes
      window.dispatchEvent(new Event('goalsUpdated'));
      window.dispatchEvent(new Event('scheduleUpdated'));
      window.dispatchEvent(new Event('routinesUpdated'));
    };

    // Listen for incoming synced data
    window.electronAPI.onDataSync((data) => {
      applySyncData(data);
    });

    if (isWidget) {
      // Widget: request initial data from the main window on load
      window.electronAPI.requestDataFromMain();
    } else {
      // Main window: respond to data requests from widget
      window.electronAPI.onDataRequest(() => {
        window.electronAPI.sendDataToWidget(gatherSyncData());
      });

      // Main window: push data to widget whenever relevant state changes
      const pushTimer = setTimeout(() => {
        window.electronAPI.sendDataToWidget(gatherSyncData());
      }, 500);
      return () => clearTimeout(pushTimer);
    }
  }, [tasks, points, streak, isGamified, externalSyncTrigger]);

  // Timers
  useEffect(() => {
    let interval = null;
    if (countdown !== null && countdown > 0) interval = setInterval(() => setCountdown(p => p - 1), 1000);
    else if (countdown === 0) { setCountdown(null); setIsFocusTimerActive(true); }
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    let interval = null;
    if (isFocusTimerActive && focusTimeLeft > 0 && countdown === null) {
      interval = setInterval(() => setFocusTimeLeft(p => p - 1), 1000);
    } else if (focusTimeLeft === 0 && isFocusTimerActive) {
      setIsFocusTimerActive(false);
      setShowCompletionPrompt(true);
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(e => console.log(e));
      setIsFocusMode(false);
      updateQuest('focus', 25);
    }
    return () => clearInterval(interval);
  }, [isFocusTimerActive, focusTimeLeft, countdown]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
      if (isFocusMode) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (isFocusTimerActive) setIsFocusTimerActive(false);
          else if (countdown !== null) setCountdown(null);
          else setCountdown(3);
        } else if (e.key === 'Escape') {
          setIsFocusMode(false);
          if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(e => console.log(e));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, isFocusTimerActive, countdown]);

  return (
    <AppContext.Provider value={{
      tasks, setTasks, activeTask, setActiveTask, trackedTask, setTrackedTask,
      focusTimeLeft, setFocusTimeLeft, isFocusTimerActive, setIsFocusTimerActive,
      countdown, setCountdown, isFocusMode, setIsFocusMode, showCompletionPrompt, setShowCompletionPrompt,
      points, isGamified, setIsGamified, addPoints, lastPointsGained, showPointsAnimation,
      soundEnabled, setSoundEnabled, levelInfo, xpMultiplier, streak, dailyQuests, updateQuest
    }}>
      {children}
    </AppContext.Provider>
  );
}
