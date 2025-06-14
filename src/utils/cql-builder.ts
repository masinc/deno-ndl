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
 * Create a new CQL query builder
 */
export function createCQLBuilder(
  options?: Partial<CQLBuilderOptions>,
): CQLQueryBuilder {
  return new CQLQueryBuilder(options);
}

/**
 * Build CQL query from simple search parameters
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
 * Build CQL query from advanced search parameters
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
 * Validate a CQL query string
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
