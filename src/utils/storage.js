import localforage from 'localforage';

localforage.config({
  name: 'DailyPlanner',
  storeName: 'media_assets'
});

export const saveMediaBlob = async (blob) => {
  const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await localforage.setItem(id, blob);
  return id;
};

export const getMediaBlob = async (id) => {
  try {
    return await localforage.getItem(id);
  } catch (err) {
    console.error("Failed to load media", err);
    return null;
  }
};

export const deleteMediaBlob = async (id) => {
  await localforage.removeItem(id);
};
