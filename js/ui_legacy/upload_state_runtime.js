(function (w) {
  'use strict';
  if (!w) return;

  var state = 'idle';
  var runId = 0;

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

  w.BlockIDEUploadState = {
    begin: begin,
    currentRunId: currentRunId,
    move: move,
    getState: getState,
  };
})(typeof window !== 'undefined' ? window : null);

