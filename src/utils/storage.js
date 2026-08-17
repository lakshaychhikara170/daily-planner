import localforage from 'localforage';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

localforage.config({
  name: 'DailyPlanner',
  storeName: 'media_assets'
});

export const saveMediaBlob = async (blob, userId) => {
  const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // Save locally first (instant)
  await localforage.setItem(id, blob);
  
  // Upload to Firebase Storage in background if user is signed in
  if (storage && userId) {
    try {
      const storageRef = ref(storage, `users/${userId}/media/${id}`);
      await uploadBytes(storageRef, blob);
    } catch (err) {
      console.warn('Media cloud upload failed (saved locally):', err);
    }
  }
  
  return id;
};

export const getMediaBlob = async (id, userId) => {
  try {
    // Try local first (fast)
    const local = await localforage.getItem(id);
    if (local) return local;
    
    // If not found locally, try downloading from Firebase Storage
    if (storage && userId) {
      try {
        const storageRef = ref(storage, `users/${userId}/media/${id}`);
        const url = await getDownloadURL(storageRef);
        const response = await fetch(url);
        const blob = await response.blob();
        // Cache it locally for next time
        await localforage.setItem(id, blob);
        return blob;
      } catch (err) {
        console.warn('Media cloud download failed:', err);
      }
    }
    
    return null;
  } catch (err) {
    console.error("Failed to load media", err);
    return null;
  }
};

export const deleteMediaBlob = async (id, userId) => {
  await localforage.removeItem(id);
  
  // Also delete from Firebase Storage
  if (storage && userId) {
    try {
      const storageRef = ref(storage, `users/${userId}/media/${id}`);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Media cloud delete failed:', err);
    }
  }
};

// Sync all local media to cloud (call on sign-in to push existing local media)
export const syncAllMediaToCloud = async (userId, mediaIds) => {
  if (!storage || !userId || !mediaIds || mediaIds.length === 0) return;
  
  for (const id of mediaIds) {
    try {
      const blob = await localforage.getItem(id);
      if (blob) {
        const storageRef = ref(storage, `users/${userId}/media/${id}`);
        await uploadBytes(storageRef, blob);
      }
    } catch (err) {
      console.warn(`Failed to sync media ${id} to cloud:`, err);
    }
  }
};
