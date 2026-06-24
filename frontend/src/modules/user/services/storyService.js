const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USER_STORIES = `${API_BASE}/user/stories`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("crypto_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const storyService = {
  async getFeedStories() {
    const res = await fetch(`${USER_STORIES}/feed`, {
      headers: getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load stories");
    return data.stories || [];
  },

  async getUserStories(userId) {
    const res = await fetch(`${USER_STORIES}/user/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load stories");
    return data.stories || [];
  },

  async createStory({ file, caption, musicTrackId, musicId, musicStartTime, captionPosX, captionPosY, captionTextColor, captionBgColor, filter, mediaScale, mediaPosX, mediaPosY, aspectRatio }) {
    const form = new FormData();
    if (file) form.append("media", file);
    if (caption) form.append("caption", caption);
    if (musicId) form.append("musicId", musicId);
    if (musicStartTime) form.append("musicStartTime", String(musicStartTime));
    if (musicTrackId) form.append("musicTrackId", musicTrackId);
    if (filter) form.append("filter", filter);
    if (typeof mediaScale === "number") form.append("mediaScale", String(mediaScale));
    if (typeof mediaPosX === "number") form.append("mediaPosX", String(mediaPosX));
    if (typeof mediaPosY === "number") form.append("mediaPosY", String(mediaPosY));
    if (typeof musicPosX === "number") form.append("musicPosX", String(musicPosX));
    if (typeof musicPosY === "number") form.append("musicPosY", String(musicPosY));
    if (typeof captionPosX === "number") form.append("captionPosX", String(captionPosX));
    if (typeof captionPosY === "number") form.append("captionPosY", String(captionPosY));
    if (captionTextColor) form.append("captionTextColor", captionTextColor);
    if (captionBgColor) form.append("captionBgColor", captionBgColor);
    if (aspectRatio) form.append("aspectRatio", aspectRatio);

    const controller = new AbortController();
    const timeoutMs = file && file.type && file.type.startsWith("video/") ? 60000 : 25000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(USER_STORIES, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to create story");
    return data.story;
  },

  async deleteStory(id) {
    const res = await fetch(`${USER_STORIES}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to delete story");
    return true;
  }
};

