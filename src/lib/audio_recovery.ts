// When the connection carrying a track drops before it ends. A browser reads a
// few minutes of a long file ahead (Chrome about 7 MB, some 4 to 5 minutes of
// a 192 kbps MP3), then leaves the connection idle until it needs more; if that
// connection is gone by then and asking again fails, the audio element stops
// with a network error (or just waits for data that never comes). The player
// then asks for the same file again, from where it was, a few times with a
// growing wait (context/PlayerContext.tsx). (tests: scripts/site/audio_recovery.test.mjs)

/** Tries in a row before the player gives up (and shows the play button again) */
export const MAX_ATTEMPTS = 5;

/** Waiting for data this long without moving on: the connection is taken as lost */
export const STALL_MS = 15_000;

/** The wait before try [attempt] (0, 1, 2…): 1 s, 2 s, 4 s, 8 s, then 15 s at most */
export const retryDelay = (attempt: number): number => Math.min(1000 * 2 ** Math.max(0, attempt), 15_000);

/**
 * Whether an error of the audio element ([code], MediaError's) is worth asking
 * for the file again: a network failure always; a file the browser couldn't
 * read only if it had been playing (data cut short), not one that never could
 * (missing, or not audio); never one the page aborted itself (a new track).
 */
export function shouldRetry(code: number | null | undefined, started: boolean): boolean {
  if (code === 1) return false; // MEDIA_ERR_ABORTED
  if (code === 2) return true; // MEDIA_ERR_NETWORK
  return started; // MEDIA_ERR_DECODE, MEDIA_ERR_SRC_NOT_SUPPORTED, or none given
}
