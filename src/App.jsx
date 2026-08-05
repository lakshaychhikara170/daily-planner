import React, { useState, useEffect, useContext } from 'react';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Routines from './pages/Routines';
import RoutinesV2 from './pages/RoutinesV2';
import Review from './pages/Review';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Upgrade from './pages/Upgrade';
import FloatingTimer from './components/FloatingTimer';
import FullscreenTimer from './components/FullscreenTimer';
import TaskCompletionPrompt from './components/TaskCompletionPrompt';
import ProUpsellNotification from './components/ProUpsellNotification';
import JurassicParkLock from './components/JurassicParkLock';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { EditModeProvider } from './context/EditModeContext';
import ThemeEditor from './components/ThemeEditor';
import GamificationHUD from './components/GamificationHUD';
import { useUpdateChecker } from './hooks/useUpdateChecker';
import UpdateBanner from './components/UpdateBanner';
import { startUnifiedNotificationScheduler } from './utils/notifications';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const { updateAvailable, setUpdateAvailable } = useUpdateChecker();
  
  // Honeypot state
  const { isPro, loading } = useContext(AuthContext);
  const [showJurassicLock, setShowJurassicLock] = useState(false);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    // Start unified progressive notifications engine
    startUnifiedNotificationScheduler();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Pirate Honeypot Detection
  useEffect(() => {
    if (loading) return;
    
    if (localStorage.getItem('execute_pro_license') === null) {
      localStorage.setItem('execute_pro_license', 'false');
    }
    
    const trapValue = localStorage.getItem('execute_pro_license');
    if (trapValue === 'true' && !isPro) {
      const punishmentStage = localStorage.getItem('punishment_stage');
      if (!punishmentStage) {
        localStorage.setItem('punishment_stage', '1');
        window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      } else {
        setShowJurassicLock(true);
      }
    } else if (trapValue === 'false') {
      setShowJurassicLock(false);
      localStorage.removeItem('punishment_stage');
    }
  }, [isPro, loading, currentHash]);

  const getNavOpacity = (path) => {
    return currentHash === path ? 1 : 0.5;
  };

  return (
    <ThemeProvider>
      <EditModeProvider>
        <CustomCursor />
        {showJurassicLock && <JurassicParkLock />}
        <UpdateBanner updateInfo={updateAvailable} onClose={() => setUpdateAvailable(null)} />
        <div style={{ paddingTop: updateAvailable ? '40px' : '0', transition: 'padding-top 0.3s ease' }}>
          
          {/* Top Navigation */}
          <header className="border-b px-content" style={{ padding: '1.5rem 4vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: 'var(--text-color)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>EXECUTE PRO<sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>©</sup></h2>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', fontWeight: 500 }}>
              <a href="#/" className="interactive" style={{ opacity: getNavOpacity('#/'), textDecoration: 'none', color: 'inherit' }}>00 Home</a>
              <a href="#/tasks" className="interactive" style={{ opacity: getNavOpacity('#/tasks'), textDecoration: 'none', color: 'inherit' }}>01 Tasks</a>
              <a href="#/schedule" className="interactive" style={{ opacity: getNavOpacity('#/schedule'), textDecoration: 'none', color: 'inherit' }}>02 Schedule</a>
              <a href="#/routines" className="interactive" style={{ opacity: getNavOpacity('#/routines'), textDecoration: 'none', color: 'inherit' }}>03 Routines</a>
              <a href="#/review" className="interactive" style={{ opacity: getNavOpacity('#/review'), textDecoration: 'none', color: 'inherit' }}>04 Review</a>
              <a href="#/profile" className="interactive" style={{ opacity: getNavOpacity('#/profile'), textDecoration: 'none', color: 'inherit' }}>05 Profile</a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>IST - 21:55</span>
              
              {currentHash === '#/tasks' && (
                <button className="interactive" 
                  onClick={() => {
                    const input = document.querySelector('.routine-input');
                    if (input) input.focus();
                  }}
                  style={{ 
                  backgroundColor: 'var(--text-color)', 
                  color: 'var(--bg-color)', 
                  border: 'none', 
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500,
                  }}>
                  New Task
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
                    +
                  </div>
                </button>
              )}
            </div>
          </header>

          {currentHash === '#/' && <Home />}
          {currentHash === '#/tasks' && <Tasks />}
          {currentHash === '#/schedule' && <Schedule />}
          {currentHash === '#/routines' && <Routines />}
          {currentHash === '#/review' && <Review />}
          {currentHash === '#/profile' && <Profile />}
          {currentHash === '#/login' && <Login />}
          {currentHash === '#/upgrade' && <Upgrade />}
          
          <FloatingTimer />
          <FullscreenTimer />
          <TaskCompletionPrompt />
          <ProUpsellNotification />
          
          <GamificationHUD />
          <ThemeEditor />
        </div>
      </EditModeProvider>
    </ThemeProvider>
  );
}

export default App;
