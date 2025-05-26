
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
  checkConstraint?: string; // e.g., "Age > 18"
}

export interface TableDefinition {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

export type SampleRow = Record<string, string | number | boolean | null | any[] | Record<string, any>>; // Made SampleRow value more flexible
export interface SampleData {
  [tableId: string]: SampleRow[];
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: Date;
  status: 'validated_correct' | 'validated_incorrect' | 'error' | 'generated_problem';
  feedback?: string;
  validationResult?: QueryValidationResult; // Added to store full validation result
}

export interface PracticeProblem {
  problemStatement: string;
  expectedSolution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Represents the structure of a single row in a query's result set.
// Values can be basic types, or null. Using z.any() on AI side for flexibility.
export type QueryResultRow = Record<string, string | number | boolean | null>;

export interface QueryValidationResult {
  isValid: boolean;
  feedback: string;
  correctQuery?: string;
  resultSet?: QueryResultRow[] | null; // Array of objects, or null if not applicable/error
}
