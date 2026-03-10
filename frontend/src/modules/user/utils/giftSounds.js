// Simple client-side sound helper for gifts.
// Expects small audio files to be placed in `frontend/public/sounds`.
// Example filenames:
// - /sounds/gift-heart.mp3
// - /sounds/gift-rose.mp3
// - /sounds/gift-generic.mp3

const soundMap = {
  heart: '/sounds/gift-heart.mp3',
  rose: '/sounds/gift-rose.mp3',
};

const cache = {};

const getAudioForGift = (giftId) => {
  const key = giftId || 'generic';
  if (cache[key]) return cache[key];

  const src = soundMap[key] || '/sounds/gift-generic.mp3';
  const audio = new Audio(src);
  audio.volume = 0.35;
  cache[key] = audio;
  return audio;
};

export const playGiftSound = (giftId) => {
  if (typeof window === 'undefined') return;
  try {
    const audio = getAudioForGift(giftId);
    // Restart from beginning for rapid taps
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        // Ignore autoplay / user-gesture restrictions
      });
    }
  } catch {
    // Fail silently; core UX should not break from audio issues
  }
};

