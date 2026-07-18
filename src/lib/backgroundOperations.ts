import { ApiError, BackgroundOperation } from './api';

export const BACKGROUND_OPERATION_ATTEMPT_MS = 45_000;

export function isOperationTerminal(operation: BackgroundOperation): boolean {
  return ['succeeded', 'partially_succeeded', 'failed', 'interrupted'].includes(operation.status);
}

export async function waitForBackgroundOperation(
  initial: BackgroundOperation,
  getOperation: (id: string) => Promise<BackgroundOperation>,
  onUpdate: (operation: BackgroundOperation) => void,
  signal?: AbortSignal,
): Promise<BackgroundOperation> {
  let current = initial;
  onUpdate(current);
  while (!isOperationTerminal(current)) {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 750);
      signal?.addEventListener('abort', () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
    current = await getOperation(current.id);
    onUpdate(current);
  }
  return current;
}

export function operationFailure(operation: BackgroundOperation): ApiError {
  return new ApiError(
    operation.error_message || 'Операция не выполнена. Попробуйте ещё раз.',
    operation.status === 'interrupted' ? 503 : 400,
    operation.error_code || operation.status,
  );
}

