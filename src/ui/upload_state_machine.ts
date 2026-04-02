export type UploadState =
  | 'idle'
  | 'connecting'
  | 'compile'
  | 'flashing'
  | 'done'
  | 'error';

export class UploadStateMachine {
  private state: UploadState = 'idle';
  private runId = 0;

  begin(): number {
    this.runId += 1;
    this.state = 'connecting';
    return this.runId;
  }

  getState(): UploadState {
    return this.state;
  }

  move(next: UploadState, runId: number): boolean {
    if (runId !== this.runId) return false;
    this.state = next;
    return true;
  }

  currentRunId(): number {
    return this.runId;
  }
}

