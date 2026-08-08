import React, { createContext, useContext, useState, useCallback } from 'react';

export const UIContext = createContext();

export function useUI() {
  return useContext(UIContext);
}

export function UIContextProvider({ children }) {
  // Toasts: small inline notifications (bottom center)
  const [toasts, setToasts] = useState([]);
  
  // Notifications: feed style notifications (top right)
  const [notifications, setNotifications] = useState([]);
  
  // Confirmations: single active confirmation modal
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // Celebrations: full screen/large celebration modal
  const [celebration, setCelebration] = useState(null);
  
  // Smart Reminders: contextual popups (bottom right)
  const [reminder, setReminder] = useState(null);

  // Notification Aesthetic Style
  const [notificationStyle, setNotificationStyle] = useState(() => {
    return localStorage.getItem('dailyPlannerNotificationStyle') || 'minimal';
  });

  const changeNotificationStyle = useCallback((style) => {
    setNotificationStyle(style);
    localStorage.setItem('dailyPlannerNotificationStyle', style);
  }, []);

  // --- Actions ---

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, isDestructive = false }) => {
    setConfirmConfig({ title, message, confirmText, cancelText, onConfirm, isDestructive });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmConfig(null);
  }, []);

  const addNotification = useCallback(({ title, message, type = 'success', duration = 5000, icon }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type, icon, timestamp: new Date() }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showCelebration = useCallback(({ title, subtitle, details, primaryAction, secondaryAction }) => {
    setCelebration({ title, subtitle, details, primaryAction, secondaryAction });
  }, []);

  const hideCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const showReminder = useCallback(({ title, message, primaryAction, secondaryAction }) => {
    setReminder({ title, message, primaryAction, secondaryAction });
  }, []);

  const hideReminder = useCallback(() => {
    setReminder(null);
  }, []);

  const value = {
    toasts, addToast, removeToast,
    notifications, addNotification, removeNotification,
    confirmConfig, showConfirm, hideConfirm,
    celebration, showCelebration, hideCelebration,
    reminder, showReminder, hideReminder,
    notificationStyle, changeNotificationStyle
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}
