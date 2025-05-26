
"use client";

import React from 'react';
import type { QueryValidationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Info, FileText } from 'lucide-react';

interface QueryResultDisplayProps {
  result: QueryValidationResult;
}

export function QueryResultDisplay({ result }: QueryResultDisplayProps) {
  const hasResultSet = result.resultSet && Array.isArray(result.resultSet) && result.resultSet.length > 0;
  const hasEmptyResultSet = result.resultSet && Array.isArray(result.resultSet) && result.resultSet.length === 0;

  const columns = hasResultSet ? Object.keys(result.resultSet![0]) : [];

  return (
    <Card className="mt-4 shadow-md">
      <CardHeader>
        <CardTitle className={`flex items-center text-lg ${!result.isValid ? 'text-destructive' : ''}`}>
          {result.isValid ? <CheckCircle className="mr-2 h-5 w-5 text-primary" /> : <XCircle className="mr-2 h-5 w-5 text-destructive" />}
          Query Validation
        </CardTitle>
        <CardDescription>
          {result.isValid ? "Query processed successfully." : "Query has issues that need attention."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={result.isValid ? 'default' : 'destructive'}>
          <Info className="h-4 w-4" /> {/* Icon will be colored by alert variant */}
          <AlertTitle>AI Feedback</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {result.feedback || "No specific feedback provided."}
          </AlertDescription>
        </Alert>

        {!result.isValid && result.correctQuery && (
          <Card className="bg-muted/50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">Suggested Correct Query</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <pre className="text-sm whitespace-pre-wrap bg-background p-3 rounded font-mono shadow">
                {result.correctQuery}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Unified Simulated Output Section - directly in CardContent */}
        {result.isValid && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-base font-semibold mb-3 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Simulated Query Output
            </h3>
            {hasResultSet && (
              <div className="border rounded-md overflow-x-auto max-h-80 bg-background shadow-sm">
                <Table>
                  <TableHeader className="bg-muted sticky top-0">
                    <TableRow>
                      {columns.map((colName) => (
                        <TableHead key={colName} className="font-semibold">{colName}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.resultSet!.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((colName) => (
                          <TableCell key={`${rowIndex}-${colName}`}>
                            {row[colName] === null || row[colName] === undefined
                              ? <span className="text-muted-foreground italic">NULL</span>
                              : String(row[colName])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasEmptyResultSet && (
              <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/30 rounded-md">
                Query executed successfully and returned no rows.
              </p>
            )}
            {(!result.resultSet) && ( // Covers cases like DDL, DML, or if AI couldn't simulate a SELECT
              <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/30 rounded-md">
                Query validated successfully. No data output to display for this type of query, or simulation was not applicable.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
