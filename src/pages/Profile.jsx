import React, { useState, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { useThemeEditor } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { updateProfile } from 'firebase/auth';
import { storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';
import { useUI } from '../context/UIContext';

export default function Profile() {
  const { currentTheme, loadPreset } = useThemeEditor();
  const { user, isPro, logout, deferredPrompt } = useContext(AuthContext);
  const { points, levelInfo } = useContext(AppContext);
  const { showConfirm, addToast } = useUI();
  const [refresh, setRefresh] = useState(0);
  const fileInputRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [notifsEnabled, setNotifsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user) {
      addToast("You must be logged in to edit your profile.", "error");
      return;
    }
    try {
      addToast("Uploading image...", "default");
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const newUrl = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: newUrl });
      setRefresh(r => r + 1);
      addToast("Profile picture updated!", "success");
    } catch (err) {
      console.error(err);
      addToast("Storage upload failed. Falling back to URL input.", "error");
      const fallbackUrl = window.prompt("Upload failed. Enter an image URL manually:", user.photoURL || "");
      if (fallbackUrl) {
         await updateProfile(user, { photoURL: fallbackUrl });
         setRefresh(r => r + 1);
         addToast("Profile picture updated via URL!", "success");
      }
    }
  };

  const handleEditAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditNameClick = () => {
    if (!user) {
      addToast("You must be logged in to edit your profile.", "error");
      return;
    }
    setEditNameValue(user.displayName || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: editNameValue });
      setRefresh(r => r + 1);
      setIsEditingName(false);
      addToast("Display name updated!", "success");
    } catch (e) {
      addToast("Failed to update display name.", "error");
    }
  };

  const memberSince = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date();
  const memberSinceMonth = memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  const diffTime = Math.abs(new Date() - memberSince);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const toggleNotifications = async () => {
    if (!notifsEnabled) {
      const granted = await requestNotificationPermission();
      setNotifsEnabled(granted);
      if (granted) {
        sendNotification('Execute Pro', { body: 'Push notifications are now successfully enabled!' });
        addToast('Notifications enabled.', 'success');
      }
    } else {
      addToast('Please disable notifications in your browser settings to turn them off.', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="px-content" 
      style={{ padding: '4rem 4vw', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}
    >
      <header>
        <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>
          Account <span className="italic" style={{ color: 'var(--dim-text)', fontWeight: 'normal' }}>& Settings</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--dim-text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Manage your planner preferences and license details.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
        
        {/* Profile Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, color: 'var(--text-color)', margin: 0 }}>
              Profile Details
            </h2>
            <button className="interactive" style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, padding: 0 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit
            </button>
          </div>
          
          {/* Avatar and Info */}
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '100px', height: '100px', backgroundColor: 'var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="var(--text-color)">
                    <path d="M12 2L22 7.77V16.23L12 22L2 16.23V7.77L12 2Z"/>
                  </svg>
                )}
              </div>
              <div 
                className="interactive"
                onClick={handleEditAvatarClick}
                style={{ position: 'absolute', bottom: '0', right: '0', width: '28px', height: '28px', backgroundColor: 'var(--accent-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-color)', cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--bg-color)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            </div>
            
            {/* Right side info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', fontWeight: 600 }}>Display Name</div>
                  {!isEditingName && (
                    <button onClick={handleEditNameClick} className="interactive" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-green)', cursor: 'pointer', display: 'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                </div>
                {isEditingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <input 
                      type="text" 
                      value={editNameValue} 
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 500, 
                        color: 'var(--text-color)', 
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--accent-green)',
                        outline: 'none',
                        padding: '0 0 2px 0',
                        width: '100%',
                        fontFamily: 'inherit',
                        boxShadow: '0 1px 0 0 rgba(0,0,0,0.3)'
                      }} 
                    />
                    <button onClick={handleSaveName} className="interactive" style={{ background: 'var(--accent-green)', border: 'none', padding: '0.25rem 0.5rem', color: 'var(--bg-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>SAVE</button>
                    <button onClick={() => setIsEditingName(false)} className="interactive" style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', color: 'var(--text-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>CANCEL</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-color)' }}>{user?.displayName || 'Add a name...'}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.35rem', fontWeight: 600 }}>Email Address</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-color)' }}>{user ? user.email : 'Local Operator (Offline)'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.5rem', fontWeight: 600 }}>License Status</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: `1px solid ${isPro ? 'var(--accent-green)' : 'var(--border-color)'}`, borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 'bold', filter: isPro ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'none', backgroundColor: 'var(--bg-color)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPro ? 'var(--accent-green)' : 'var(--dim-text)', boxShadow: isPro ? '0 1px 4px rgba(0,0,0,0.8)' : 'none' }}></div>
                  {isPro ? 'LIFETIME PRO ACTIVATED' : 'FREE / LOCAL ONLY'}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 0' }}>
            {/* CURRENT LEVEL */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.75rem', fontWeight: 600 }}>Current Level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>{levelInfo.level.toString().padStart(2, '0')}</span>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(196, 243, 70, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-color)" strokeWidth="2"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg>
                </div>
              </div>
              <div style={{ height: '3px', width: '100%', backgroundColor: 'var(--border-color)', marginBottom: '0.75rem' }}>
                <div style={{ width: `${levelInfo.progress}%`, height: '100%', backgroundColor: 'var(--accent-green)', boxShadow: '0 2px 4px rgba(0,0,0,0.8)' }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)' }}>{points.toLocaleString()} XP Total</div>
            </div>

            {/* NEXT LEVEL */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.75rem', fontWeight: 600 }}>Next Level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>{(levelInfo.level + 1).toString().padStart(2, '0')}</span>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/></svg>
                </div>
              </div>
              <div style={{ height: '3px', width: '100%', backgroundColor: 'var(--border-color)', marginBottom: '0.75rem' }}></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)' }}>{levelInfo.xpForNextLevel - levelInfo.xpRemaining} XP to go</div>
            </div>

            {/* MEMBER SINCE */}
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.75rem', fontWeight: 600 }}>Member Since</div>
              <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', lineHeight: 1.2, marginBottom: '0.75rem', whiteSpace: 'nowrap' }}>
                {memberSinceMonth}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)' }}>{diffDays} days ago</div>
              </div>
            </div>
          </div>

          {/* Consistency Box */}
          <div style={{ backgroundColor: 'rgba(196, 243, 70, 0.08)', border: '1px solid rgba(196, 243, 70, 0.2)', borderRadius: '8px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ flexShrink: 0 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--accent-green)" stroke="var(--text-color)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>Consistency is your superpower.</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)', lineHeight: 1.4 }}>Keep showing up. The results will<br/>take care of themselves.</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(196, 243, 70, 0.2)', paddingLeft: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0.25rem', fontWeight: 600 }}>XP Earned</div>
                <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', color: 'var(--text-color)', lineHeight: 1 }}>{points.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--dim-text)', marginTop: '0.25rem' }}>Keep building.</div>
              </div>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-color)', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', padding: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '6px', height: '40%', backgroundColor: 'var(--accent-green)', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.8)' }}></div>
                <div style={{ width: '6px', height: '70%', backgroundColor: 'var(--accent-green)', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.8)' }}></div>
                <div style={{ width: '6px', height: '100%', backgroundColor: 'var(--accent-green)', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.8)' }}></div>
              </div>
            </div>
          </div>

        </div>

        {/* Settings Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            Preferences
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Theme Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '1rem' }}>App Theme</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['Editorial Minimal', 'Dark Slate'].map((presetName) => {
                  const isActive = currentTheme['--bg-color'] === (presetName === 'Editorial Minimal' ? '#F0EEE9' : '#0f1115');
                  return (
                  <button
                    key={presetName}
                    onClick={() => {
                      loadPreset(presetName);
                      addToast(`Theme changed to ${presetName}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: isActive ? 'var(--text-color)' : 'var(--card-bg)',
                      color: isActive ? 'var(--bg-color)' : 'var(--text-color)',
                      border: `1px solid ${isActive ? 'var(--text-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      textTransform: 'capitalize',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      
                      transition: 'all 0.2s ease'
                    }}
                    className="interactive"
                  >
                    {presetName}
                  </button>
                )})}
              </div>
            </div>

            {/* Placeholder for Notifications */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '1rem' }}>Notifications</label>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Push Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dim-text)' }}>Receive alerts for daily habits and reminders.</div>
                </div>
                <button 
                  onClick={toggleNotifications}
                  className="interactive"
                  style={{ 
                    fontSize: '0.75rem', 
                    color: notifsEnabled ? '#000' : 'var(--text-color)', 
                    backgroundColor: notifsEnabled ? 'var(--accent-green)' : 'transparent',
                    fontWeight: 600, 
                    border: `1px solid ${notifsEnabled ? 'var(--accent-green)' : 'var(--border-color)'}`, 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px',
                    
                    transition: 'all 0.2s ease'
                  }}
                >
                  {notifsEnabled ? 'ENABLED' : 'ENABLE'}
                </button>
              </div>
            </div>

            {/* Data Export & Logout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0' }}>Data & Session</label>
              
              {isPro && (
                <button
                  className="interactive"
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      console.log(`User response to the install prompt: ${outcome}`);
                    } else {
                      alert("Execute Pro is already installed on your device, or your browser does not support automatic installation. Check your browser menu or taskbar.");
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--accent-green)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--accent-green)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span>Install Desktop App (PWA)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              )}

              <button
                className="interactive"
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    alert("PRO FEATURE LOCKED: Local Data Export requires a Pro License. Redirecting to initialization sequence...");
                    window.location.hash = '#/upgrade';
                    return;
                  }
                  const data = JSON.stringify({ ...localStorage }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `execute-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <span>Export Local Data (JSON) {!isPro && '🔒'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>

              <label
                className="interactive"
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    alert("PRO FEATURE LOCKED: Local Data Import requires a Pro License. Redirecting to initialization sequence...");
                    window.location.hash = '#/upgrade';
                  }
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'transparent',
                  color: 'var(--dim-text)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-color)'; e.currentTarget.style.color = 'var(--text-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--dim-text)'; }}
              >
                <span>Import Local Data (JSON) {!isPro && '🔒'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 0-2 2h-4a2 2 0 0 0-2 2v4"></path><polyline points="17 10 12 5 7 10"></polyline><line x1="12" y1="5" x2="12" y2="17"></line></svg>
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      try {
                        const data = JSON.parse(evt.target.result);
                        if (typeof data !== 'object') throw new Error('Invalid format');
                        Object.keys(data).forEach(key => {
                          localStorage.setItem(key, data[key]);
                        });
                        alert("Backup restored successfully. The system will now reboot.");
                        window.location.reload();
                      } catch (err) {
                        alert("Failed to parse backup file.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
              
              {user && (
                <button
                  onClick={() => {
                    showConfirm({
                      title: "Log out?",
                      message: "You will be logged out from this device.",
                      confirmText: "Log out",
                      isDestructive: true,
                      onConfirm: () => {
                        logout();
                        window.location.hash = '#/';
                        addToast("Logged out successfully.");
                      }
                    });
                  }}
                  className="interactive"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <span>Logout from Cloud Sync</span>
                </button>
              )}
            </div>

            {/* Support Developer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dim-text)', marginBottom: '0' }}>Support The Developer</label>
              <a
                href="https://buymeacoffee.com/lakshaychhikara"
                target="_blank"
                rel="noreferrer"
                className="interactive"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'var(--text-color)',
                  color: 'var(--bg-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                Buy Me A Coffee
              </a>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}
