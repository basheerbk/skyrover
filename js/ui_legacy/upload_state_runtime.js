(function (w) {
  'use strict';
  if (!w) return;

  var state = 'idle';
  var runId = 0;
  /** Prevents side-panel and toolbar upload from running concurrently. */
  var uploadLockHeld = false;

  function begin() {
    runId += 1;
    state = 'connecting';
    return runId;
  }

  function currentRunId() {
    return runId;
  }

  function move(next, id) {
    if (id !== runId) return false;
    state = next;
    return true;
  }

  function getState() {
    return state;
  }

  function tryAcquireUploadLock() {
    if (uploadLockHeld) return false;
    uploadLockHeld = true;
    return true;
  }

  function releaseUploadLock() {
    uploadLockHeld = false;
  }

  /** Reset FSM to idle for this run (e.g. aborted upload). */
  function resetToIdle(id) {
    return move('idle', id);
  }

  w.BlockIDEUploadState = {
    begin: begin,
    currentRunId: currentRunId,
    move: move,
    getState: getState,
    tryAcquireUploadLock: tryAcquireUploadLock,
    releaseUploadLock: releaseUploadLock,
    resetToIdle: resetToIdle,
  };
})(typeof window !== 'undefined' ? window : null);

