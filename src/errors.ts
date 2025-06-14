/**
 * NDL library error types
 */
export type NDLErrorType =
  | "network"
  | "api"
  | "validation"
  | "sru_diagnostic"
  | "query_syntax"
  | "rate_limit";

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

/**
 * Create an SRU diagnostic error
 *
 * @param message - Error message
 * @param cause - SRU diagnostic information
 * @returns SRU diagnostic error
 */
export function sruDiagnosticError<T = unknown>(
  message: string,
  cause?: T,
): NDLError<T> {
  return {
    type: "sru_diagnostic",
    message,
    cause,
  };
}

/**
 * Create a query syntax error
 *
 * @param message - Error message
 * @param cause - Query syntax information
 * @returns Query syntax error
 */
export function querySyntaxError<T = unknown>(
  message: string,
  cause?: T,
): NDLError<T> {
  return {
    type: "query_syntax",
    message,
    cause,
  };
}

/**
 * Create a rate limit error
 *
 * @param message - Error message
 * @param cause - Rate limit information
 * @returns Rate limit error
 */
export function rateLimitError<T = unknown>(
  message: string,
  cause?: T,
): NDLError<T> {
  return {
    type: "rate_limit",
    message,
    cause,
  };
}

/**
 * Type guard for SRU diagnostic errors
 */
export function isSRUDiagnosticError<T = unknown>(
  error: NDLError<T>,
): boolean {
  return isErrorType(error, "sru_diagnostic");
}

/**
 * Type guard for query syntax errors
 */
export function isQuerySyntaxError<T = unknown>(
  error: NDLError<T>,
): boolean {
  return isErrorType(error, "query_syntax");
}

/**
 * Type guard for rate limit errors
 */
export function isRateLimitError<T = unknown>(
  error: NDLError<T>,
): boolean {
  return isErrorType(error, "rate_limit");
}

/**
 * Create user-friendly error message from NDL error
 *
 * @param error - NDL error
 * @returns User-friendly error message in Japanese
 */
export function formatUserFriendlyErrorMessage(error: NDLError): string {
  switch (error.type) {
    case "network":
      return "ネットワークエラーが発生しました。インターネット接続を確認してください。";

    case "api":
      if (typeof error.cause === "number") {
        const statusCode = error.cause;
        switch (statusCode) {
          case 400:
            return "リクエストに問題があります。検索条件を確認してください。";
          case 401:
            return "認証が必要です。API キーを確認してください。";
          case 403:
            return "アクセス権限がありません。";
          case 404:
            return "指定されたリソースが見つかりません。";
          case 429:
            return "リクエスト回数の制限に達しました。しばらくお待ちください。";
          case 500:
            return "サーバーエラーが発生しました。しばらく時間をおいて再試行してください。";
          case 503:
            return "サービスが一時的に利用できません。しばらく時間をおいて再試行してください。";
          default:
            return `APIエラーが発生しました（ステータス: ${statusCode}）。`;
        }
      }
      return "APIエラーが発生しました。しばらく時間をおいて再試行してください。";

    case "validation":
      return "入力データの形式に問題があります。検索条件を見直してください。";

    case "sru_diagnostic":
      return "検索処理でエラーが発生しました。検索条件を確認してください。";

    case "query_syntax":
      return "検索クエリの構文に問題があります。検索条件を見直してください。";

    case "rate_limit":
      return "リクエスト回数の制限に達しました。しばらくお待ちください。";

    default:
      return "予期しないエラーが発生しました。";
  }
}
