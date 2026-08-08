// Minimal in-process job queue: no Redis, no external queue, just a FIFO array
// and an active-job counter. Bounds how many ffmpeg jobs run at once (the same
// Node process also serves API traffic) and guarantees a hung job can never
// block the pipeline forever.

const DEFAULT_MAX_CONCURRENT = Number(process.env.VIDEO_MAX_CONCURRENT) || 1;
const DEFAULT_TIMEOUT_MS = Number(process.env.VIDEO_JOB_TIMEOUT_MS) || 20 * 60 * 1000; // 20 min

class JobQueue {
  constructor({ maxConcurrent = DEFAULT_MAX_CONCURRENT, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
    this.timeoutMs = timeoutMs;
    this.active = 0;
    this.queue = [];
    this.stats = { completed: 0, failed: 0, timedOut: 0 };
  }

  /**
   * @param {() => Promise<any>} taskFn
   * @param {{ label?: string, onTimeout?: () => void }} [opts] onTimeout should
   *   forcibly kill whatever the task started (e.g. an ffmpeg child process) —
   *   the queue itself has no way to cancel an arbitrary in-flight promise.
   */
  enqueue(taskFn, { label = "job", onTimeout } = {}) {
    return new Promise((resolve, reject) => {
      const run = () => {
        this.active += 1;
        let settled = false;
        let timer = null;

        const finish = (err, result) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          this.active -= 1;
          if (err) {
            this.stats.failed += 1;
            reject(err);
          } else {
            this.stats.completed += 1;
            resolve(result);
          }
          this._dequeueNext();
        };

        timer = setTimeout(() => {
          this.stats.timedOut += 1;
          try {
            onTimeout?.();
          } catch (cleanupErr) {
            console.error(`[jobQueue] cleanup after timeout failed for "${label}":`, cleanupErr.message);
          }
          finish(new Error(`Job "${label}" timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);

        Promise.resolve()
          .then(() => taskFn())
          .then((result) => finish(null, result))
          .catch((err) => finish(err));
      };

      this.queue.push(run);
      this._dequeueNext();
    });
  }

  _dequeueNext() {
    if (this.active >= this.maxConcurrent) return;
    const next = this.queue.shift();
    if (next) next();
  }

  getStats() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      ...this.stats,
    };
  }
}

// Single shared queue for all video-encoding work in this process.
const videoJobQueue = new JobQueue();

module.exports = { JobQueue, videoJobQueue };
