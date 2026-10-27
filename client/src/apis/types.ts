export type ApiErrorDetail = Readonly<{field: string; message: string}>;
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly detail: readonly ApiErrorDetail[];
  constructor(code: string, message: string, status = 0, detail: readonly ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
  hasField(field: string) {
    return this.detail.some(detail => detail.field === field);
  }
  getFieldMessage(field: string) {
    return this.detail.find(detail => detail.field === field)?.message;
  }
}
