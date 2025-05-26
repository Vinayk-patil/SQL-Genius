
export type SqlDataType =
  | 'TEXT'
  | 'VARCHAR(255)'
  | 'INTEGER'
  | 'REAL'
  | 'NUMERIC'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'BLOB';

export const SQL_DATA_TYPES: SqlDataType[] = [
  'TEXT',
  'VARCHAR(255)',
  'INTEGER',
  'REAL',
  'NUMERIC',
  'DECIMAL',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'BLOB',
];

export interface ColumnDefinition {
  id: string;
  name: string;
  type: SqlDataType;
  isPrimaryKey?: boolean;
  isNotNull?: boolean;
  isUnique?: boolean;
  checkConstraint?: string;
}

export interface TableDefinition {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

export type SampleRow = Record<string, string | number | boolean | null | any[] | Record<string, any>>;
export interface SampleData {
  [tableId: string]: SampleRow[];
}

// Represents the structure of a single row in a query's result set.
export type QueryResultRow = Record<string, string | number | boolean | null>;

export interface QueryValidationResult {
  // Syntax Validation
  isSyntaxValid: boolean;
  syntaxFeedback: string; // If invalid, this is the error. If valid, a confirmation.
  suggestedCorrectSyntaxQuery?: string; // If syntax was wrong

  // Solution Match Validation (only if an expectedSolution was provided for checking)
  isSolutionCorrect?: boolean | null; // boolean if checked, null if not applicable or syntax was invalid
  solutionFeedback?: string | null; // Feedback on solution match. Null if not applicable.

  // Data Simulation Output (based on user's query if syntactically valid)
  resultSet?: QueryResultRow[] | null; // Array of objects, or null/empty if not applicable/error/no rows
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: Date;
  // status is now derived from validationResult's isSyntaxValid and isSolutionCorrect
  status: 'validated_correct_solution' | 'validated_incorrect_solution' | 'validated_syntax_only' | 'error_syntax' | 'error_ai_processing' | 'generated_problem';
  feedback?: string; // General top-level feedback if needed, or can be derived
  validationResult?: QueryValidationResult;
}

export interface PracticeProblem {
  problemStatement: string;
  expectedSolution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
