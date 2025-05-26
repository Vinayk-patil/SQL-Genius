import type { TableDefinition, SampleData, SampleRow } from '@/types';

export function formatSchemaForAI(tables: TableDefinition[]): string {
  if (!tables || tables.length === 0) {
    return '-- No tables defined. Please define tables and columns in the Schema Editor.';
  }
  return tables
    .map(table => {
      if (table.columns.length === 0) {
        return `-- Table "${table.name}" has no columns defined.`;
      }
      const columns = table.columns
        .map(col => `  "${col.name}" ${col.type}`)
        .join(',\n');
      return `CREATE TABLE "${table.name}" (\n${columns}\n);`;
    })
    .join('\n\n');
}

function escapeSqlValue(value: string | number | boolean | null, type: string): string {
  if (value === null || value === undefined) return 'NULL';
  
  const upperType = type.toUpperCase();

  if (upperType.includes('INT') || upperType === 'REAL' || upperType === 'NUMERIC' || upperType === 'DECIMAL') {
    const num = Number(value);
    return isNaN(num) ? 'NULL' : num.toString();
  }
  
  if (upperType === 'BOOLEAN') {
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    const lowerStrVal = String(value).toLowerCase();
    if (lowerStrVal === 'true' || lowerStrVal === '1') return 'TRUE';
    if (lowerStrVal === 'false' || lowerStrVal === '0') return 'FALSE';
    return 'NULL'; // Or handle as error
  }
  
  // For TEXT, VARCHAR, DATE, DATETIME, etc., treat as string
  return `'${String(value).replace(/'/g, "''")}'`;
}


export function formatSampleDataForAI(
  tables: TableDefinition[],
  sampleData: SampleData
): string {
  let allInserts: string[] = [];
  tables.forEach(table => {
    const rows = sampleData[table.id];
    if (rows && rows.length > 0 && table.columns.length > 0) {
      const columnNames = table.columns.map(col => `"${col.name}"`).join(', ');
      const tableInserts = rows.map(row => {
        const values = table.columns
          .map(col => escapeSqlValue(row[col.name], col.type))
          .join(', ');
        return `INSERT INTO "${table.name}" (${columnNames}) VALUES (${values});`;
      });
      allInserts = allInserts.concat(tableInserts);
    }
  });
  if (allInserts.length === 0) {
    return '-- No sample data provided for the defined tables.';
  }
  return allInserts.join('\n');
}
