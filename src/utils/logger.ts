export function logCheckpoint(checkpoint: number, message: string) {
  console.log(
    `=== [CHECKPOINT ${checkpoint}] ${message} ===` // English log with checkpoint number
  );
}

export function logCheckpointError(checkpoint: number, message: string) {
  console.error(
    `=== [CHECKPOINT ${checkpoint}][ERROR] ${message} ===` // English error log with checkpoint number
  );
}
