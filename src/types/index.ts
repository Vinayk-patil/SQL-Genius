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
}

export interface TableDefinition {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

export type SampleRow = Record<string, string | number | boolean | null>;
export interface SampleData {
  [tableId: string]: SampleRow[];
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: Date;
  status: 'validated_correct' | 'validated_incorrect' | 'error' | 'generated_problem';
  feedback?: string;
}

export interface PracticeProblem {
  problemStatement: string;
  expectedSolution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QueryValidationResult {
  isValid: boolean;
  feedback: string;
  correctQuery?: string;
}
