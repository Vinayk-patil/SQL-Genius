
"use client";

import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { ColumnDefinition, SqlDataType, TableDefinition, SampleRow } from '@/types';
import { SQL_DATA_TYPES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2, Table as TableIcon, Columns as ColumnsIcon, DatabaseBackup } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

function getColumnConstraintString(col: ColumnDefinition): string {
  const parts: string[] = [];
  if (col.isPrimaryKey) parts.push('PK');
  if (col.isNotNull) parts.push('NOT NULL');
  if (col.isUnique) parts.push('UNIQUE');
  if (col.checkConstraint) parts.push(`CHECK(${col.checkConstraint})`);
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

export function SchemaEditorPanel() {
  const {
    tables,
    setTables,
    sampleData,
    setSampleData,
    activeTab,
    setActiveTab,
    selectedTableIdForData,
    setSelectedTableIdForData
  } = useWorkspace();
  const { toast } = useToast();

  const [newTableName, setNewTableName] = useState('');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<SqlDataType>('TEXT');
  const [newColumnIsPrimaryKey, setNewColumnIsPrimaryKey] = useState(false);
  const [newColumnIsNotNull, setNewColumnIsNotNull] = useState(false);
  const [newColumnIsUnique, setNewColumnIsUnique] = useState(false);
  const [newColumnCheckConstraint, setNewColumnCheckConstraint] = useState('');
  
  const [currentSampleDataRow, setCurrentSampleDataRow] = useState<SampleRow>({});

  const resetColumnInputs = () => {
    setNewColumnName('');
    setNewColumnType('TEXT');
    setNewColumnIsPrimaryKey(false);
    setNewColumnIsNotNull(false);
    setNewColumnIsUnique(false);
    setNewColumnCheckConstraint('');
  };

  const handleAddTable = () => {
    if (!newTableName.trim()) {
      toast({ title: "Error", description: "Table name cannot be empty.", variant: "destructive" });
      return;
    }
    if (tables.find(table => table.name.toLowerCase() === newTableName.trim().toLowerCase())) {
      toast({ title: "Error", description: "A table with this name already exists.", variant: "destructive" });
      return;
    }
    const newTable: TableDefinition = {
      id: uuidv4(),
      name: newTableName.trim(),
      columns: [],
    };
    setTables(prev => [...prev, newTable]);
    setNewTableName('');
    toast({ title: "Success", description: `Table "${newTable.name}" added.` });
  };

  const handleRemoveTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
    setSampleData(prev => {
      const newData = { ...prev };
      delete newData[tableId];
      return newData;
    });
    if (selectedTableIdForData === tableId) {
      setSelectedTableIdForData(null);
    }
    if (editingTableId === tableId) {
      setEditingTableId(null);
      resetColumnInputs();
    }
    toast({ title: "Success", description: "Table removed." });
  };

  const handleAddColumn = (tableId: string) => {
    if (!newColumnName.trim()) {
      toast({ title: "Error", description: "Column name cannot be empty.", variant: "destructive" });
      return;
    }
    setTables(prev =>
      prev.map(table => {
        if (table.id === tableId) {
          if (table.columns.find(col => col.name.toLowerCase() === newColumnName.trim().toLowerCase())) {
            toast({ title: "Error", description: "A column with this name already exists in this table.", variant: "destructive" });
            return table;
          }
          const newColumn: ColumnDefinition = {
            id: uuidv4(),
            name: newColumnName.trim(),
            type: newColumnType,
            isPrimaryKey: newColumnIsPrimaryKey,
            isNotNull: newColumnIsNotNull,
            isUnique: newColumnIsUnique,
            checkConstraint: newColumnCheckConstraint.trim() ? newColumnCheckConstraint.trim() : undefined,
          };
          return { ...table, columns: [...table.columns, newColumn] };
        }
        return table;
      })
    );
    resetColumnInputs(); // Reset all column inputs, editingTableId remains so user can add another col to same table
    toast({ title: "Success", description: `Column "${newColumnName.trim()}" added.` });
  };

  const handleRemoveColumn = (tableId: string, columnId: string) => {
    setTables(prev =>
      prev.map(table =>
        table.id === tableId
          ? { ...table, columns: table.columns.filter(col => col.id !== columnId) }
          : table
      )
    );
    // Also remove data for this column from sampleData
    setSampleData(prevSampleData => {
      const updatedSampleData = { ...prevSampleData };
      if (updatedSampleData[tableId]) {
        updatedSampleData[tableId] = updatedSampleData[tableId].map(row => {
          const newRow = { ...row };
          const columnToRemove = tables.find(t => t.id === tableId)?.columns.find(c => c.id === columnId);
          if (columnToRemove) {
            delete newRow[columnToRemove.name];
          }
          return newRow;
        });
      }
      return updatedSampleData;
    });
    toast({ title: "Success", description: "Column removed." });
  };

  const handleAddSampleRow = () => {
    if (!selectedTableIdForData) return;
    const table = tables.find(t => t.id === selectedTableIdForData);
    if (!table) return;

    const newRow = { ...currentSampleDataRow };
    table.columns.forEach(col => {
      if (newRow[col.name] === undefined) {
        newRow[col.name] = null; 
      }
    });

    setSampleData(prev => ({
      ...prev,
      [selectedTableIdForData]: [...(prev[selectedTableIdForData] || []), newRow],
    }));
    setCurrentSampleDataRow({}); 
    toast({ title: "Success", description: "Sample row added." });
  };
  
  const handleSampleDataInputChange = (columnName: string, value: string) => {
    setCurrentSampleDataRow(prev => ({ ...prev, [columnName]: value }));
  };

  const selectedTableForData = tables.find(t => t.id === selectedTableIdForData);

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-xl">
          <DatabaseBackup className="mr-2 h-6 w-6 text-primary" />
          Database Designer
        </CardTitle>
        <CardDescription>Define your database schema and add sample data.</CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'schema' | 'data')} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4">
          <TabsTrigger value="schema">Schema Editor</TabsTrigger>
          <TabsTrigger value="data">Data Editor</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-grow p-4 pt-0">
          <TabsContent value="schema" className="mt-0">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Table</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label htmlFor="new-table-name">Table Name</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="new-table-name"
                      value={newTableName}
                      onChange={e => setNewTableName(e.target.value)}
                      placeholder="e.g., Customers"
                    />
                    <Button onClick={handleAddTable} variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Table
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {tables.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">No tables defined yet. Add a table to get started.</p>
              )}

              {tables.map(table => (
                <Card key={table.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 flex flex-row items-center justify-between py-3 px-4">
                    <CardTitle className="text-md flex items-center">
                      <TableIcon className="mr-2 h-5 w-5" /> {table.name}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveTable(table.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {table.columns.length === 0 && (
                      <p className="text-xs text-muted-foreground">No columns defined for this table.</p>
                    )}
                    {table.columns.map(col => (
                      <div key={col.id} className="flex items-center justify-between p-2 bg-background rounded border">
                        <div className="flex items-center">
                           <ColumnsIcon className="mr-2 h-4 w-4 text-muted-foreground"/>
                           <span className="font-mono text-xs">{col.name}</span>
                           <span className="ml-2 text-xs text-muted-foreground">({col.type}{getColumnConstraintString(col)})</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveColumn(table.id, col.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="mt-2 p-3 border rounded-md shadow-sm bg-background">
                      <Label className="text-xs font-medium block mb-1.5">Add New Column to "{table.name}"</Label>
                      <div className="flex items-end space-x-2 mb-2">
                        <div className="flex-grow">
                          <Label htmlFor={`col-name-${table.id}`} className="sr-only">Column Name</Label>
                          <Input
                            id={`col-name-${table.id}`}
                            value={editingTableId === table.id ? newColumnName : ''}
                            onFocus={() => { 
                              setEditingTableId(table.id); 
                              if(editingTableId !== table.id) resetColumnInputs();
                            }}
                            onChange={e => setNewColumnName(e.target.value)}
                            placeholder="Column Name"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex-grow">
                          <Label htmlFor={`col-type-${table.id}`} className="sr-only">Column Type</Label>
                          <Select
                            value={editingTableId === table.id ? newColumnType : 'TEXT'}
                            onValueChange={(value: SqlDataType) => {setNewColumnType(value); setEditingTableId(table.id);}}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {SQL_DATA_TYPES.map(type => (
                                <SelectItem key={type} value={type} className="text-xs">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 mb-2">
                        <Label className="text-xs font-medium">Constraints:</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-pk-${table.id}`}
                            checked={editingTableId === table.id ? newColumnIsPrimaryKey : false}
                            onCheckedChange={(checked) => setNewColumnIsPrimaryKey(!!checked)}
                            disabled={editingTableId !== table.id}
                          />
                          <Label htmlFor={`col-pk-${table.id}`} className="text-xs font-normal">Primary Key</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-nn-${table.id}`}
                            checked={editingTableId === table.id ? newColumnIsNotNull : false}
                            onCheckedChange={(checked) => setNewColumnIsNotNull(!!checked)}
                            disabled={editingTableId !== table.id}
                          />
                          <Label htmlFor={`col-nn-${table.id}`} className="text-xs font-normal">Not Null</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-uq-${table.id}`}
                            checked={editingTableId === table.id ? newColumnIsUnique : false}
                            onCheckedChange={(checked) => setNewColumnIsUnique(!!checked)}
                            disabled={editingTableId !== table.id}
                          />
                          <Label htmlFor={`col-uq-${table.id}`} className="text-xs font-normal">Unique</Label>
                        </div>
                        <div>
                          <Label htmlFor={`col-check-${table.id}`} className="text-xs font-normal">CHECK Constraint</Label>
                          <Input
                            id={`col-check-${table.id}`}
                            value={editingTableId === table.id ? newColumnCheckConstraint : ''}
                            onChange={e => setNewColumnCheckConstraint(e.target.value)}
                            placeholder="e.g. Age > 18"
                            className="h-8 text-xs mt-1"
                            disabled={editingTableId !== table.id}
                          />
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs" 
                        onClick={() => handleAddColumn(table.id)}
                        disabled={editingTableId !== table.id || !newColumnName.trim()}
                      >
                        <PlusCircle className="mr-1 h-3 w-3" /> Add Column
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="data" className="mt-0">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Table for Data Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  {tables.length === 0 ? (
                     <p className="text-sm text-muted-foreground">Define tables in the Schema Editor first.</p>
                  ) : (
                  <Select
                    value={selectedTableIdForData || ''}
                    onValueChange={setSelectedTableIdForData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                </CardContent>
              </Card>

              {selectedTableForData && selectedTableForData.columns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Sample Row to "{selectedTableForData.name}"</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedTableForData.columns.map(col => (
                      <div key={col.id} className="space-y-1">
                        <Label htmlFor={`sample-${col.id}`} className="text-xs">
                          {col.name} <span className="text-muted-foreground">({col.type})</span>
                        </Label>
                        <Input
                          id={`sample-${col.id}`}
                          value={currentSampleDataRow[col.name]?.toString() ?? ''}
                          onChange={e => handleSampleDataInputChange(col.name, e.target.value)}
                          placeholder={`Enter ${col.type.toLowerCase()} value`}
                          className="text-sm"
                        />
                      </div>
                    ))}
                    <Button onClick={handleAddSampleRow} variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Row
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {selectedTableForData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Data for "{selectedTableForData.name}"</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(sampleData[selectedTableForData.id]?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground">No sample data added for this table yet.</p>
                    ) : (
                      <div className="overflow-x-auto max-h-60 border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              {selectedTableForData.columns.map(col => (
                                <th key={col.id} className="p-2 text-left font-medium">{col.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sampleData[selectedTableForData.id]?.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b last:border-b-0">
                                {selectedTableForData.columns.map(col => (
                                  <td key={col.id} className="p-2 whitespace-nowrap">
                                    {String(row[col.name] ?? 'NULL')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
