export function getErrorMessage(error: unknown, fallback = 'リクエストを処理できませんでした。') {
  return error instanceof Error ? error.message : fallback;
}
