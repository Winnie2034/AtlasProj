export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus: number,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(message, code, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(message, code, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", code = "UNAUTHORIZED") {
    super(message, code, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, code, 409);
  }
}

export class HevyApiError extends AppError {
  constructor(message: string, code = "HEVY_API_ERROR", httpStatus = 502) {
    super(message, code, httpStatus);
  }
}
