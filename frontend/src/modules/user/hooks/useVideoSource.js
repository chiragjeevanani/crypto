import { useEffect, useRef } from 'react'

const WARM_MAX_BUFFER_SECONDS = 2

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
 *   attaches it.
 * - warmOnly=true caps buffering (small maxBufferLength + a capped auto
 *   quality level) instead of the unrestricted default — the analogue of
 *   the old preload="metadata"/"auto" distinction, since the `preload`
 *   HTML attribute is inert once hls.js owns the media source. Changing
 *   `warmOnly` on an already-attached instance adjusts it LIVE (hls.js
 *   config mutation + autoLevelCapping) rather than tearing the instance
 *   down and reattaching — recreating it every time a reel becomes/stops
 *   being active would discard whatever it already buffered and force a
 *   full reload, defeating fast-forward/backward between nearby reels.
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
    if (warmOnly) {
      hls.config.maxBufferLength = WARM_MAX_BUFFER_SECONDS
      hls.config.maxMaxBufferLength = WARM_MAX_BUFFER_SECONDS
      hls.autoLevelCapping = 0
    } else {
      hls.config.maxBufferLength = 30
      hls.config.maxMaxBufferLength = 30
      hls.autoLevelCapping = -1
    }
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
      const startWarm = warmOnlyRef.current
      const hls = new HlsCtor(
        startWarm
          ? { maxBufferLength: WARM_MAX_BUFFER_SECONDS, maxMaxBufferLength: WARM_MAX_BUFFER_SECONDS, startLevel: 0 }
          : {}
      )
      if (startWarm) hls.autoLevelCapping = 0
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
