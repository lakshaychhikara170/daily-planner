import React from 'react';
import { useUI } from '../../context/UIContext';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import NotificationFeed from './NotificationFeed';
import CelebrationModal from './CelebrationModal';

export default function UIProvider() {
  const { 
    toasts, removeToast,
    notifications, removeNotification,
    confirmConfig, hideConfirm,
    celebration, hideCelebration,
    reminder, hideReminder
  } = useUI();

  return (
    <>
      {/* Notifications - Top Right */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {notifications.map(n => (
          <NotificationFeed key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
        ))}
      </div>

      {/* Confirmation Dialogs - Center */}
      {confirmConfig && (
        <ConfirmDialog config={confirmConfig} onClose={hideConfirm} />
      )}

      {/* Celebrations - Center/Full Screen */}
      {celebration && (
        <CelebrationModal celebration={celebration} onClose={hideCelebration} />
      )}

      {/* Toasts - Bottom Center */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Smart Reminders - Bottom Right */}
      {/* ... (To be implemented later if needed) */}
    </>
  );
}
