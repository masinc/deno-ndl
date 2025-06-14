/**
 * NDL library error types
 */
export type NDLErrorType =
  | "network"
  | "api"
  | "validation";

/**
 * NDL library error interface
 *
 * @template T - Type of the cause
 */
export interface NDLError<T = unknown> {
  readonly type: NDLErrorType;
  readonly message: string;
  readonly cause?: T;
}

/**
 * Create a network error
 *
 * @param message - Error message
 * @param cause - Original error cause
 * @returns Network error
 */
export function networkError<T = unknown>(
  message: string,
  cause?: T,
): NDLError<T> {
  return {
    type: "network",
    message,
    cause,
  };
}

/**
 * Create an API error
 *
 * @param message - Error message
 * @param cause - Original error cause (e.g., Response object, status code)
 * @returns API error
 */
export function apiError<T = unknown>(
  message: string,
  cause?: T,
): NDLError<T> {
  return {
    type: "api",
    message,
    cause,
  };
}

/**
 * Create a validation error
 *
 * @param message - Error message
 * @param cause - Validation errors (e.g., Zod issues)
 * @returns Validation error
 */
export function validationError<T = unknown>(
  message: string,
  cause?: T,
): NDLError<T> {
  return {
    type: "validation",
    message,
    cause,
  };
}

/**
 * Type guard to check error type
 *
 * @param error - Error to check
 * @param type - Expected error type
 * @returns Type predicate
 */
export function isErrorType<T = unknown>(
  error: NDLError<T>,
  type: NDLErrorType,
): boolean {
  return error.type === type;
}

/**
 * Type guard for network errors
 */
export function isNetworkError<T = unknown>(
  error: NDLError<T>,
): boolean {
  return isErrorType(error, "network");
}

/**
 * Type guard for API errors
 */
export function isAPIError<T = unknown>(
  error: NDLError<T>,
): boolean {
  return isErrorType(error, "api");
}

/**
 * Type guard for validation errors
 */
export function isValidationError<T = unknown>(
  error: NDLError<T>,
): boolean {
  return isErrorType(error, "validation");
}
