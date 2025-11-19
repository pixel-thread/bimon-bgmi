export class EmailError extends Error {
  status?: number;
  originalError?: unknown;

  constructor(
    message: string = 'Failed to send email',
    status: number = 500,
    originalError?: unknown,
  ) {
    super(message);
    this.name = 'EmailError';
    this.status = status;
    this.originalError = originalError;

    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailError);
    }
  }
}
