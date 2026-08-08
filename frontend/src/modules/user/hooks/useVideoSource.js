import { useEffect, useRef } from 'react'

const WARM_MAX_BUFFER_SECONDS = 2
const SLOW_MAX_BUFFER_SECONDS = 10
const DEFAULT_MAX_BUFFER_SECONDS = 30

// navigator.connection is a hint, not a guarantee — unsupported on Safari/iOS
// entirely, so every read here is feature-detected and treated as advisory.
// Exported only for testing (pure, no DOM side effects) — internal otherwise.
export function getNetworkHint() {
  if (typeof navigator === 'undefined') return null
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!conn) return null
  return { effectiveType: conn.effectiveType, saveData: Boolean(conn.saveData) }
}

export function isSlowConnection(hint) {
  if (!hint) return false
  if (hint.saveData) return true
  return hint.effectiveType === 'slow-2g' || hint.effectiveType === '2g' || hint.effectiveType === '3g'
}

/**
 * Buffer/quality config for a given priority + current network hint. Only
 * ever affects the STARTING point (startLevel) and how far ahead hls.js
 * buffers (maxBufferLength) — never autoLevelCapping based on network alone,
 * so a slow-start connection can still climb to full quality once hls.js's
 * own bandwidth estimation sees it's actually fast. Quality is never
 * permanently locked by a network reading.
 */
export function computeBufferConfig(warm) {
  const slow = isSlowConnection(getNetworkHint())
  if (warm) {
    return { maxBufferLength: WARM_MAX_BUFFER_SECONDS, maxMaxBufferLength: WARM_MAX_BUFFER_SECONDS, startLevel: 0, levelCap: 0 }
  }
  if (slow) {
    return { maxBufferLength: SLOW_MAX_BUFFER_SECONDS, maxMaxBufferLength: SLOW_MAX_BUFFER_SECONDS, startLevel: 0, levelCap: -1 }
  }
  return { maxBufferLength: DEFAULT_MAX_BUFFER_SECONDS, maxMaxBufferLength: DEFAULT_MAX_BUFFER_SECONDS, startLevel: -1, levelCap: -1 }
}

/**
 * Feeds a <video> element's source without ever touching playback state.
 * This hook ONLY sets `video.src` / attaches an hls.js instance — it never
 * calls play()/pause(), never touches .muted, never touches .currentTime.
 * Existing autoplay-on-intersection / global-mute / pause-on-deactivate
 * effects in PostCard.jsx and PostFeedModal.jsx already own that behavior
 * via the same <video ref>; this hook just changes what feeds it.
 *
 * Behavior by input:
 * - enabled=false (e.g. a reel outside the render window, or a home-feed
 *   card off screen) -> no source attached at all, zero network, any
 *   existing hls.js instance destroyed.
 * - no hlsUrl (legacy post, still processing, or processing failed) ->
 *   plain `video.src = mp4Url`, identical to today's behavior.
 * - native HLS support (Safari/iOS) -> `video.src = hlsUrl` directly, no
 *   library loaded.
 * - otherwise -> dynamically imports the hls.js "light" build (no
 *   subtitles/EME/alt-audio-track support — matches this pipeline's
 *   single-muxed-audio-track HLS output, never in the main bundle) and
 *   attaches it, with a buffer/starting-quality config from
 *   computeBufferConfig() above (priority + a network hint).
 * - warmOnly=true caps buffering hard (2s) regardless of network — the
 *   analogue of the old preload="metadata"/"auto" distinction, since the
 *   `preload` HTML attribute is inert once hls.js owns the media source.
 *   Changing `warmOnly` on an already-attached instance adjusts it LIVE
 *   (hls.js config mutation + autoLevelCapping) rather than tearing the
 *   instance down and reattaching — recreating it every time a reel
 *   becomes/stops being active would discard whatever it already buffered
 *   and force a full reload, defeating fast-forward/backward between
 *   nearby reels.
 * - Any fatal hls.js error gets one retry, then falls back to the plain
 *   MP4 (re-issuing play() only if playback was already in progress) —
 *   this must never throw past the hook or crash the reel viewer.
 */
export function useVideoSource({ videoRef, hlsUrl, mp4Url, enabled, warmOnly = false }) {
  const hlsRef = useRef(null)
  const warmOnlyRef = useRef(warmOnly)
  warmOnlyRef.current = warmOnly

  // Live-adjust an already-attached instance's buffering aggressiveness
  // instead of recreating it when only `warmOnly` changes.
  useEffect(() => {
    const hls = hlsRef.current
    if (!hls) return
    const cfg = computeBufferConfig(warmOnly)
    hls.config.maxBufferLength = cfg.maxBufferLength
    hls.config.maxMaxBufferLength = cfg.maxMaxBufferLength
    hls.autoLevelCapping = cfg.levelCap
  }, [warmOnly])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    const destroyHls = () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy()
        } catch {
          // ignore — element/hls instance may already be torn down
        }
        hlsRef.current = null
      }
    }

    if (!enabled) {
      destroyHls()
      if (video.hasAttribute('src')) {
        video.removeAttribute('src')
        video.load()
      }
      return destroyHls
    }

    if (!hlsUrl) {
      destroyHls()
      if (video.src !== mp4Url) video.src = mp4Url || ''
      return destroyHls
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      destroyHls()
      if (video.src !== hlsUrl) video.src = hlsUrl
      return destroyHls
    }

    let cancelled = false

    ;(async () => {
      let HlsCtor
      try {
        ({ default: HlsCtor } = await import('hls.js/light'))
      } catch {
        if (!cancelled && mp4Url) video.src = mp4Url
        return
      }
      if (cancelled) return

      if (!HlsCtor.isSupported()) {
        if (mp4Url) video.src = mp4Url
        return
      }

      destroyHls()
      const cfg = computeBufferConfig(warmOnlyRef.current)
      const hls = new HlsCtor({
        maxBufferLength: cfg.maxBufferLength,
        maxMaxBufferLength: cfg.maxMaxBufferLength,
        startLevel: cfg.startLevel,
      })
      hls.autoLevelCapping = cfg.levelCap
      hlsRef.current = hls

      let fatalRetried = false
      hls.on(HlsCtor.Events.ERROR, (_event, data) => {
        if (!data?.fatal) return
        if (!fatalRetried && data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
          fatalRetried = true
          hls.startLoad()
          return
        }
        if (!fatalRetried && data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
          fatalRetried = true
          hls.recoverMediaError()
          return
        }
        // Give up on HLS for this element — fall back to the plain MP4.
        const wasPlaying = !video.paused
        destroyHls()
        if (mp4Url) {
          video.src = mp4Url
          if (wasPlaying) video.play().catch(() => {})
        }
      })

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
    })()

    return () => {
      cancelled = true
      destroyHls()
    }
    // warmOnly intentionally excluded — handled by the live-adjust effect
    // above so toggling it doesn't tear down and reattach the source.
  }, [videoRef, hlsUrl, mp4Url, enabled])
}
