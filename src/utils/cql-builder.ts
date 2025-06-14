/**
 * CQL Query Builder implementation using Zod schemas
 *
 * Type-safe CQL query construction for NDL SRU API
 *
 * @module
 */

import { err, ok, type Result } from "neverthrow";
import type {
  AdvancedSearchParams,
  CQLBuilderOptions,
  CQLOperator,
  DateRange,
  NDLLanguageCode,
  QueryValidationResult,
  SearchField,
  SimpleSearchParams,
} from "../schemas/sru/query-builder.ts";
import {
  AdvancedSearchParamsSchema,
  CQLBuilderOptionsSchema,
  DateRangeSchema,
  QueryValidationResultSchema,
  SimpleSearchParamsSchema,
} from "../schemas/sru/query-builder.ts";
import { safeParse } from "../schemas/utils.ts";
import { type NDLError, validationError } from "../errors.ts";

/**
 * CQL Query Builder class with Zod validation
 */
export class CQLQueryBuilder {
  private readonly options: CQLBuilderOptions;
  private conditions: string[] = [];

  constructor(options: Partial<CQLBuilderOptions> = {}) {
    const validationResult = safeParse(CQLBuilderOptionsSchema, options);
    if (validationResult.isErr()) {
      throw new Error(
        `Invalid builder options: ${validationResult.error.message}`,
      );
    }
    this.options = validationResult.value;
  }

  /**
   * Add a field search condition
   */
  field(field: string, value: string, operator: CQLOperator = "="): this {
    if (!value.trim()) {
      return this;
    }

    const escapedValue = this.options.autoEscape
      ? this.escapeValue(value)
      : value;
    const condition = this.buildFieldCondition(field, escapedValue, operator);
    this.conditions.push(condition);
    return this;
  }

  /**
   * Add multiple field conditions
   */
  fields(fields: SearchField[]): this {
    for (const field of fields) {
      this.field(field.field, field.value, field.operator);
    }
    return this;
  }

  /**
   * Add title search
   */
  title(title: string, operator: CQLOperator = "="): this {
    return this.field("title", title, operator);
  }

  /**
   * Add creator search
   */
  creator(creator: string, operator: CQLOperator = "="): this {
    return this.field("creator", creator, operator);
  }

  /**
   * Add subject search
   */
  subject(subject: string, operator: CQLOperator = "="): this {
    return this.field("subject", subject, operator);
  }

  /**
   * Add publisher search
   */
  publisher(publisher: string, operator: CQLOperator = "="): this {
    return this.field("publisher", publisher, operator);
  }

  /**
   * Add ISBN search
   */
  isbn(isbn: string): this {
    const cleanIsbn = isbn.replace(/[-\s]/g, "");
    return this.field("isbn", cleanIsbn, "=");
  }

  /**
   * Add ISSN search
   */
  issn(issn: string): this {
    return this.field("issn", issn, "=");
  }

  /**
   * Add language filter
   */
  language(languages: NDLLanguageCode | NDLLanguageCode[]): this {
    const langArray = Array.isArray(languages) ? languages : [languages];

    if (langArray.length === 1) {
      return this.field("language", langArray[0], "=");
    }

    const langConditions = langArray.map((lang) =>
      this.buildFieldCondition("language", lang, "=")
    );
    this.conditions.push(`(${langConditions.join(" OR ")})`);
    return this;
  }

  /**
   * Add date range search
   */
  dateRange(range: DateRange): this {
    const validationResult = safeParse(
      DateRangeSchema,
      range,
    );

    if (validationResult.isErr()) {
      throw new Error(`Invalid date range: ${validationResult.error.message}`);
    }

    const conditions: string[] = [];

    if (range.from) {
      conditions.push(`from="${range.from}"`);
    }

    if (range.to) {
      conditions.push(`until="${range.to}"`);
    }

    if (conditions.length > 0) {
      const dateCondition = conditions.length === 1
        ? conditions[0]
        : `(${conditions.join(" AND ")})`;
      this.conditions.push(dateCondition);
    }

    return this;
  }

  /**
   * Add anywhere (full-text) search
   */
  anywhere(text: string): this {
    return this.field("anywhere", text, this.options.defaultTextOperator);
  }

  /**
   * Combine with another builder using AND
   */
  and(builder: CQLQueryBuilder): this {
    const otherQuery = builder.build();
    if (otherQuery && this.conditions.length > 0) {
      const current = this.conditions.join(` ${this.options.defaultOperator} `);
      this.conditions = [
        this.options.addParentheses ? `(${current})` : current,
        this.options.addParentheses ? `(${otherQuery})` : otherQuery,
      ];
    } else if (otherQuery) {
      this.conditions.push(otherQuery);
    }
    return this;
  }

  /**
   * Combine with another builder using OR
   */
  or(builder: CQLQueryBuilder): this {
    const otherQuery = builder.build();
    if (otherQuery && this.conditions.length > 0) {
      const current = this.conditions.join(` ${this.options.defaultOperator} `);
      const combined = `(${current}) OR (${otherQuery})`;
      this.conditions = [combined];
    } else if (otherQuery) {
      this.conditions.push(otherQuery);
    }
    return this;
  }

  /**
   * Negate the current query
   */
  not(): this {
    if (this.conditions.length > 0) {
      const combined = this.conditions.join(
        ` ${this.options.defaultOperator} `,
      );
      this.conditions = [`NOT (${combined})`];
    }
    return this;
  }

  /**
   * Build the final CQL query string
   */
  build(): string {
    if (this.conditions.length === 0) {
      return "";
    }

    return this.conditions.join(` ${this.options.defaultOperator} `);
  }

  /**
   * Validate and build query with detailed result
   */
  validate(): Result<QueryValidationResult, NDLError> {
    const query = this.build();
    let complexity = Math.min(10, Math.max(1, this.conditions.length));
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!query) {
      errors.push("Query is empty");
    }

    // Check for potential issues
    if (this.conditions.length > 5) {
      warnings.push("Complex query with many conditions may be slow");
      complexity = Math.min(10, complexity + 2);
    }

    // Check for very broad searches
    if (this.conditions.some((c) => c.includes("anywhere"))) {
      warnings.push(
        "Full-text search across all fields may return many results",
      );
      complexity = Math.min(10, complexity + 1);
    }

    const result: QueryValidationResult = {
      isValid: errors.length === 0,
      query,
      errors,
      warnings,
      complexity,
    };

    const validationResult = safeParse(QueryValidationResultSchema, result);
    if (validationResult.isErr()) {
      return err(validationError(
        `Query validation failed: ${validationResult.error.message}`,
        validationResult.error,
      ));
    }

    return ok(validationResult.value);
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.conditions = [];
    return this;
  }

  /**
   * Build field condition string
   */
  private buildFieldCondition(
    field: string,
    value: string,
    operator: CQLOperator,
  ): string {
    switch (operator) {
      case "=":
      case "exact":
        return `${field}="${value}"`;
      case "adj":
        return `${field} adj "${value}"`;
      case "all":
        return `${field} all "${value}"`;
      case "any":
        return `${field} any "${value}"`;
      case "contains":
        return `${field} adj "${value}"`;
      case "starts":
        return `${field}="${value}*"`;
      case "ends":
        return `${field}="*${value}"`;
      default:
        return `${field}="${value}"`;
    }
  }

  /**
   * Escape special characters in search values
   */
  private escapeValue(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\*/g, "\\*")
      .replace(/\?/g, "\\?");
  }
}

/**
 * 新しいCQLクエリビルダーを作成します
 *
 * 型安全でチェーン可能なAPIを提供し、複雑なCQL検索クエリを構築できます。
 * 自動エスケープ、演算子設定、括弧の自動付与などのオプションを設定可能です。
 *
 * @param options - ビルダーの設定オプション
 * @param options.defaultOperator - デフォルトの論理演算子（"AND" | "OR"、デフォルト: "AND"）
 * @param options.defaultTextOperator - テキスト検索のデフォルト演算子（デフォルト: "="）
 * @param options.autoEscape - 特殊文字の自動エスケープ（デフォルト: true）
 * @param options.addParentheses - 複合条件の自動括弧付与（デフォルト: true）
 *
 * @returns 新しいCQLQueryBuilderインスタンス
 *
 * @example 基本的な使用例
 * ```typescript
 * import { createCQLBuilder } from "@masinc/ndl";
 *
 * const builder = createCQLBuilder();
 * const query = builder
 *   .title("夏目漱石")
 *   .creator("夏目金之助")
 *   .language("jpn")
 *   .build();
 *
 * console.log(query); // title="夏目漱石" AND creator="夏目金之助" AND language="jpn"
 * ```
 *
 * @example カスタムオプション付き
 * ```typescript
 * const builder = createCQLBuilder({
 *   defaultOperator: "OR",
 *   autoEscape: false,
 *   addParentheses: false
 * });
 * ```
 *
 * @example 複雑な検索クエリ構築
 * ```typescript
 * const query = createCQLBuilder()
 *   .title("吾輩は猫である")
 *   .or(
 *     createCQLBuilder().title("坊っちゃん")
 *   )
 *   .and(
 *     createCQLBuilder().creator("夏目漱石")
 *   )
 *   .build();
 * ```
 */
export function createCQLBuilder(
  options?: Partial<CQLBuilderOptions>,
): CQLQueryBuilder {
  return new CQLQueryBuilder(options);
}

/**
 * 簡単な検索パラメータからCQLクエリを構築します
 *
 * 個別の検索フィールドを指定することで、適切なCQLクエリを自動生成します。
 * 除外条件、日付範囲、言語フィルタなど、よく使用される検索パターンに対応しています。
 *
 * @param params - 簡単な検索パラメータ
 * @param params.title - タイトル検索
 * @param params.creator - 作成者検索
 * @param params.subject - 件名検索
 * @param params.publisher - 出版者検索
 * @param params.isbn - ISBN検索
 * @param params.issn - ISSN検索
 * @param params.language - 言語フィルタ
 * @param params.dateRange - 出版日範囲
 * @param params.type - 資料種別
 * @param params.anywhere - 全文検索
 * @param params.description - 内容記述検索
 * @param params.exclude - 除外条件
 *
 * @returns CQLクエリ文字列。失敗時はバリデーションエラー
 *
 * @example 基本的なタイトル検索
 * ```typescript
 * import { buildSimpleCQLQuery } from "@masinc/ndl";
 *
 * const result = buildSimpleCQLQuery({
 *   title: "夏目漱石",
 *   creator: "夏目金之助"
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // title="夏目漱石" AND creator="夏目金之助"
 * }
 * ```
 *
 * @example 除外条件付き検索
 * ```typescript
 * const result = buildSimpleCQLQuery({
 *   title: "文学作品",
 *   language: "jpn",
 *   exclude: {
 *     creator: "太宰治",
 *     type: "雑誌"
 *   }
 * });
 * ```
 *
 * @example 日付範囲指定
 * ```typescript
 * const result = buildSimpleCQLQuery({
 *   subject: "プログラミング",
 *   dateRange: {
 *     from: "2020",
 *     to: "2024"
 *   },
 *   language: ["jpn", "eng"]
 * });
 * ```
 */
export function buildSimpleCQLQuery(
  params: SimpleSearchParams,
): Result<string, NDLError> {
  const validationResult = safeParse(SimpleSearchParamsSchema, params);
  if (validationResult.isErr()) {
    return err(validationError(
      "検索パラメータの形式が正しくありません。検索条件を確認してください。",
      validationResult.error,
    ));
  }

  const validatedParams = validationResult.value;
  const builder = createCQLBuilder();

  if (validatedParams.title) {
    builder.title(validatedParams.title);
  }

  if (validatedParams.creator) {
    builder.creator(validatedParams.creator);
  }

  if (validatedParams.subject) {
    builder.subject(validatedParams.subject);
  }

  if (validatedParams.publisher) {
    builder.publisher(validatedParams.publisher);
  }

  if (validatedParams.isbn) {
    builder.isbn(validatedParams.isbn);
  }

  if (validatedParams.issn) {
    builder.issn(validatedParams.issn);
  }

  if (validatedParams.language) {
    builder.language(validatedParams.language);
  }

  if (validatedParams.dateRange) {
    builder.dateRange(validatedParams.dateRange);
  }

  if (validatedParams.type) {
    builder.field("type", validatedParams.type);
  }

  if (validatedParams.anywhere) {
    builder.anywhere(validatedParams.anywhere);
  }

  if (validatedParams.description) {
    builder.field("description", validatedParams.description);
  }

  // Handle exclusions
  if (validatedParams.exclude) {
    const excludeBuilder = createCQLBuilder();

    if (validatedParams.exclude.title) {
      excludeBuilder.title(validatedParams.exclude.title);
    }

    if (validatedParams.exclude.creator) {
      excludeBuilder.creator(validatedParams.exclude.creator);
    }

    if (validatedParams.exclude.language) {
      excludeBuilder.language(validatedParams.exclude.language);
    }

    if (validatedParams.exclude.type) {
      excludeBuilder.field("type", validatedParams.exclude.type);
    }

    const excludeQuery = excludeBuilder.build();
    if (excludeQuery) {
      builder.and(excludeBuilder.not());
    }
  }

  return ok(builder.build());
}

/**
 * 高度な検索パラメータからCQLクエリを構築します
 *
 * 複数のフィールド検索条件を組み合わせて、より柔軟で詳細な検索クエリを構築できます。
 * カスタム演算子、複数フィールド条件などの高度な機能を提供します。
 *
 * @param params - 高度な検索パラメータ
 * @param params.fields - 検索フィールドの配列
 * @param params.operator - 条件間の論理演算子（"AND" | "OR"、デフォルト: "AND"）
 *
 * @returns CQLクエリ文字列。失敗時はバリデーションエラー
 *
 * @example 複数フィールド検索
 * ```typescript
 * import { buildAdvancedCQLQuery } from "@masinc/ndl";
 *
 * const result = buildAdvancedCQLQuery({
 *   fields: [
 *     { field: "title", value: "夏目漱石", operator: "contains" },
 *     { field: "creator", value: "夏目", operator: "starts" },
 *     { field: "subject", value: "文学", operator: "=" }
 *   ],
 *   operator: "AND"
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value);
 *   // title adj "夏目漱石" AND creator="夏目*" AND subject="文学"
 * }
 * ```
 *
 * @example OR演算子を使用した検索
 * ```typescript
 * const result = buildAdvancedCQLQuery({
 *   fields: [
 *     { field: "title", value: "吾輩は猫である" },
 *     { field: "title", value: "坊っちゃん" },
 *     { field: "title", value: "こころ" }
 *   ],
 *   operator: "OR"
 * });
 * ```
 *
 * @example 異なる演算子の組み合わせ
 * ```typescript
 * const result = buildAdvancedCQLQuery({
 *   fields: [
 *     { field: "creator", value: "夏目", operator: "starts" },
 *     { field: "language", value: "jpn", operator: "exact" },
 *     { field: "subject", value: "小説 文学", operator: "all" }
 *   ]
 * });
 * ```
 */
export function buildAdvancedCQLQuery(
  params: AdvancedSearchParams,
): Result<string, NDLError> {
  const validationResult = safeParse(AdvancedSearchParamsSchema, params);
  if (validationResult.isErr()) {
    return err(validationError(
      "高度な検索パラメータの形式が正しくありません。検索条件を確認してください。",
      validationResult.error,
    ));
  }

  const validatedParams = validationResult.value as AdvancedSearchParams;
  const builder = createCQLBuilder({
    defaultOperator: validatedParams.operator || "AND",
  });

  if (validatedParams.fields) {
    builder.fields(validatedParams.fields);
  }

  // TODO: Handle nested groups in future version

  return ok(builder.build());
}

/**
 * CQLクエリ文字列を検証し、詳細な検証結果を返します
 *
 * クエリの構文エラー、バランスの取れていない括弧や引用符、
 * クエリの複雑さなどを分析し、警告やエラーメッセージを提供します。
 *
 * @param query - 検証するCQLクエリ文字列
 *
 * @returns 検証結果。成功時は詳細な分析結果、失敗時はエラー情報
 *
 * @example 基本的なクエリ検証
 * ```typescript
 * import { validateCQLQuery } from "@masinc/ndl";
 *
 * const result = validateCQLQuery('title="夏目漱石" AND creator="夏目金之助"');
 * if (result.isOk()) {
 *   const validation = result.value;
 *   console.log(`有効: ${validation.isValid}`);
 *   console.log(`複雑さ: ${validation.complexity}/10`);
 *   console.log(`警告: ${validation.warnings.length}件`);
 * }
 * ```
 *
 * @example 構文エラーのあるクエリ
 * ```typescript
 * const result = validateCQLQuery('title="未閉じの引用符');
 * if (result.isOk()) {
 *   const validation = result.value;
 *   if (!validation.isValid) {
 *     console.log("エラー:", validation.errors);
 *     // エラー: ["Unmatched quotes in query"]
 *   }
 * }
 * ```
 *
 * @example 複雑なクエリの警告
 * ```typescript
 * const complexQuery = 'title="A" AND creator="B" OR subject="C" AND anywhere="D" NOT type="E"';
 * const result = validateCQLQuery(complexQuery);
 * if (result.isOk()) {
 *   const validation = result.value;
 *   console.log(`複雑さ: ${validation.complexity}`);
 *   console.log("警告:", validation.warnings);
 *   // 警告: ["Very complex query may be slow"]
 * }
 * ```
 *
 * @remarks
 * 検証結果には以下の情報が含まれます：
 * - isValid: クエリが有効かどうか
 * - query: 正規化されたクエリ文字列
 * - errors: 構文エラーの配列
 * - warnings: パフォーマンスや使用上の警告
 * - complexity: クエリの複雑さ（1-10のスケール）
 */
export function validateCQLQuery(
  query: string,
): Result<QueryValidationResult, NDLError> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let complexity = 1;

  if (!query || !query.trim()) {
    errors.push("Query cannot be empty");
  }

  // Basic syntax validation
  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;

  if (openParens !== closeParens) {
    errors.push("Unmatched parentheses in query");
  }

  // Check for unescaped quotes
  const quotes = (query.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 !== 0) {
    errors.push("Unmatched quotes in query");
  }

  // Calculate complexity
  const andCount = (query.match(/\bAND\b/gi) || []).length;
  const orCount = (query.match(/\bOR\b/gi) || []).length;
  const notCount = (query.match(/\bNOT\b/gi) || []).length;

  complexity = Math.min(10, 1 + andCount + orCount + (notCount * 2));

  if (complexity > 7) {
    warnings.push("Very complex query may be slow");
  }

  const result: QueryValidationResult = {
    isValid: errors.length === 0,
    query: query.trim(),
    errors,
    warnings,
    complexity,
  };

  const validationResult = safeParse(QueryValidationResultSchema, result);
  if (validationResult.isErr()) {
    return err(validationError(
      `Query validation failed: ${validationResult.error.message}`,
      validationResult.error,
    ));
  }

  return ok(validationResult.value);
}
