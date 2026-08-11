import { fetchVideoFeed } from "./supabaseClient";
import type { VideoRow } from "./types";

export let preloadedVideos: VideoRow[] | null = null;
export let preloadPromise: Promise<VideoRow[]> | null = null;
export let preloadProgress = 0;

export type PreloadListener = (progress: number) => void;
const listeners = new Set<PreloadListener>();

export function subscribeToPreload(listener: PreloadListener) {
  listeners.add(listener);
  listener(preloadProgress);
  return () => listeners.delete(listener);
}

function updateProgress(p: number) {
  preloadProgress = p;
  listeners.forEach((l) => l(p));
}

export function startPreload() {
  if (preloadPromise) return preloadPromise;

  preloadPromise = fetchVideoFeed().then(async (rows) => {
    // Shuffle the order of the videos
    const shuffledVideos = [...(rows as VideoRow[])];
    for (let i = shuffledVideos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledVideos[i], shuffledVideos[j]] = [shuffledVideos[j], shuffledVideos[i]];
    }

    preloadedVideos = shuffledVideos;
    updateProgress(0);

    let loaded = 0;
    await Promise.all(
      shuffledVideos.map(async (v) => {
        try {
          const res = await fetch(v.video_url);
          await res.blob();
        } catch (e) {
          console.warn("Failed to preload", v.video_url);
        }
        loaded++;
        updateProgress(Math.round((loaded / shuffledVideos.length) * 100));
      })
    );

    return shuffledVideos;
  });

  return preloadPromise;
}
