// lib/query-builder.ts
// Type-safe query builder to prevent SQL injection through structural fragments

/**
 * Allowed SQL join clauses - strictly typed to prevent injection
 */
export type SafeJoinClause =
  | ""
  | "INNER JOIN user_skill_scores uss ON l.username = uss.username"

/**
 * Allowed SQL order by clauses - strictly typed to prevent injection
 */
export type SafeOrderByClause =
  | "ORDER BY l.total_score DESC"
  | "ORDER BY uss.score DESC, l.total_score DESC"

/**
 * Build a safe WHERE clause from parameterized conditions
 * Each condition must use $N parameter placeholders
 */
export function buildWhereClause(conditions: string[]): string {
  if (conditions.length === 0) return ""
  return "WHERE " + conditions.join(" AND ")
}

/**
 * Validate that a condition only contains safe patterns
 * Conditions must:
 * - Use $N parameter placeholders for values
 * - Only reference allowed column names
 * - Not contain dangerous keywords
 */
const ALLOWED_COLUMNS = [
  "l.username",
  "l.name",
  "l.location",
  "l.total_score",
  "a.languages_json",
  "l.unique_skills_json",
  "uss.skill_slug",
  "uss.score",
  "uss.username",
  // For topic filtering with EXISTS subquery
  "urs.username",
  "urs.repo_name",
  "gr.repo_name",
  "gr.full_name",
  "gr.topics",
] as const

const DANGEROUS_PATTERNS = [
  /;\s*$/,           // Statement terminator
  /--/,              // SQL comment
  /\/\*/,            // Block comment start
  /\*\//,            // Block comment end
  /\bUNION\b/i,      // UNION injection
  /\bDROP\b/i,       // DROP statement
  /\bDELETE\b/i,     // DELETE statement
  /\bINSERT\b/i,     // INSERT statement
  /\bUPDATE\b/i,     // UPDATE statement (except in context)
  /\bEXEC\b/i,       // EXEC statement
  /\bEXECUTE\b/i,    // EXECUTE statement
  /\bTRUNCATE\b/i,   // TRUNCATE statement
  /\bALTER\b/i,      // ALTER statement
  /\bCREATE\b/i,     // CREATE statement
]

export function validateCondition(condition: string): boolean {
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(condition)) {
      console.error(`Dangerous SQL pattern detected: ${condition}`)
      return false
    }
  }

  // Ensure all column references are in our allowed list
  // This is a basic check - conditions should reference our schema columns
  const columnPattern = /([a-z]+\.[a-z_]+)/gi
  const matches = condition.match(columnPattern) || []

  for (const match of matches) {
    const normalizedMatch = match.toLowerCase()
    if (!ALLOWED_COLUMNS.some(col => col.toLowerCase() === normalizedMatch)) {
      console.error(`Unknown column reference in condition: ${match}`)
      return false
    }
  }

  return true
}

/**
 * Get the appropriate join clause for skill filtering
 */
export function getSkillJoinClause(useSkillScoring: boolean): SafeJoinClause {
  return useSkillScoring
    ? "INNER JOIN user_skill_scores uss ON l.username = uss.username"
    : ""
}

/**
 * Get the appropriate order by clause
 */
export function getOrderByClause(useSkillScoring: boolean): SafeOrderByClause {
  return useSkillScoring
    ? "ORDER BY uss.score DESC, l.total_score DESC"
    : "ORDER BY l.total_score DESC"
}

/**
 * Build the SELECT clause for skill scoring
 */
export function getSkillSelectFragment(useSkillScoring: boolean): string {
  return useSkillScoring ? "uss.score as skill_score," : ""
}

/**
 * Safely build pagination clause with validated numbers
 */
export function buildPaginationClause(limit: number, offset: number): string {
  // Ensure these are valid positive integers
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)))
  const safeOffset = Math.max(0, Math.floor(Number(offset) || 0))
  return `LIMIT ${safeLimit} OFFSET ${safeOffset}`
}
