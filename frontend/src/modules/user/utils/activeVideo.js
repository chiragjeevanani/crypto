/**
 * Single-active-video coordinator for scrolling post feeds.
 *
 * The reels viewer gets "only one video plays at a time" for free: its
 * container is scroll-snapped and a single `activeReelIndex` decides who is
 * active. The home feed has no snap, and each PostCard used to decide for
 * itself off its own IntersectionObserver ratio — which meant two adjacent
 * cards could both clear the threshold and play simultaneously (a feed card's
 * media is ~590px inside an ~876px pitch, so there is a wide scroll band where
 * one card is 35% visible and the next is 60%+). Two concurrent decodes plus
 * two concurrent downloads is what made feed videos stutter while reels stayed
 * smooth.
 *
 * This registry restores the reels guarantee: every candidate reports its
 * current visibility ratio, and exactly one — the most visible — is told to
 * play. Everything else is told to pause.
 *
 * Hysteresis: the incumbent keeps the slot unless a challenger beats it by
 * TAKEOVER_MARGIN. Without that, two cards hovering near the same ratio during
 * a slow scroll would hand the slot back and forth every observer callback,
 * which is the pause/replay churn we are trying to eliminate in the first
 * place. A card below MIN_RATIO is never eligible, so when the user parks
 * between two cards nothing plays rather than something half-off-screen.
 *
 * Scopes: each scope owns one independent slot. The home feed and the
 * full-screen post modal are separate scopes because the feed's cards stay
 * mounted and still intersect the viewport underneath the modal — sharing one
 * slot would let a card hidden behind the modal win it and leave the card the
 * user is actually looking at silent.
 */

// Below this share of the media box being visible, a card is not worth playing.
const MIN_RATIO = 0.3
// A challenger must be this much more visible than the incumbent to take over.
const TAKEOVER_MARGIN = 0.15

export const FEED_SCOPE = 'feed'
export const MODAL_SCOPE = 'modal'

// scope -> { entries: Map<id, {ratio, onChange}>, activeId }
const scopes = new Map()

function getScope(name) {
  let scope = scopes.get(name)
  if (!scope) {
    scope = { entries: new Map(), activeId: null }
    scopes.set(name, scope)
  }
  return scope
}

function setActive(scope, nextId) {
  if (nextId === scope.activeId) return
  const previousId = scope.activeId
  scope.activeId = nextId

  // Deactivate first so the outgoing video has released its decoder and its
  // in-flight range requests before the incoming one starts asking for
  // bandwidth. Doing it the other way round briefly doubles both.
  if (previousId !== null) scope.entries.get(previousId)?.onChange(false)
  if (nextId !== null) scope.entries.get(nextId)?.onChange(true)
}

function recompute(scope) {
  let best = null
  let bestRatio = 0

  for (const [id, entry] of scope.entries) {
    if (entry.ratio < MIN_RATIO) continue
    if (entry.ratio > bestRatio) {
      best = id
      bestRatio = entry.ratio
    }
  }

  if (best === null) {
    setActive(scope, null)
    return
  }

  // Incumbent keeps the slot unless the challenger is clearly more visible.
  const incumbent = scope.activeId !== null ? scope.entries.get(scope.activeId) : null
  if (
    incumbent &&
    incumbent.ratio >= MIN_RATIO &&
    best !== scope.activeId &&
    bestRatio - incumbent.ratio < TAKEOVER_MARGIN
  ) {
    return
  }

  setActive(scope, best)
}

/**
 * Register a candidate in `scopeName`. `onChange(isActive)` fires only on
 * transitions, never redundantly. Returns an unregister function.
 */
export function registerVideo(scopeName, id, onChange) {
  const scope = getScope(scopeName)
  scope.entries.set(id, { ratio: 0, onChange })
  return () => {
    scope.entries.delete(id)
    if (scope.activeId === id) {
      scope.activeId = null
      recompute(scope)
    }
  }
}

/** Report a candidate's current visible ratio (0..1). */
export function reportRatio(scopeName, id, ratio) {
  const scope = scopes.get(scopeName)
  if (!scope) return
  const entry = scope.entries.get(id)
  if (!entry) return
  if (entry.ratio === ratio) return
  entry.ratio = ratio
  recompute(scope)
}

// Note: there is deliberately no "suspend everything" call here for the story
// viewer / post modal. Those cases are already handled inside PostCard, which
// plays only when it is active AND no overlay is open — so the slot stays
// assigned while an overlay is up and playback resumes on close, instead of
// the feed going silent until the next scroll nudges a ratio.
