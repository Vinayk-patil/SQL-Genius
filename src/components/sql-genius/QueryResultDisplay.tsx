
"use client";

import React from 'react';
import type { QueryValidationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Info } from 'lucide-react';

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
        <CardTitle className={`flex items-center text-lg ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>
          {result.isValid ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
          Query Output
        </CardTitle>
        <CardDescription>
          {result.isValid ? "Query processed successfully." : "Query has issues."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={result.isValid ? 'default' : 'destructive'}>
          <Info className="h-4 w-4" />
          <AlertTitle>Feedback</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {result.feedback || "No specific feedback provided."}
          </AlertDescription>
        </Alert>

        {!result.isValid && result.correctQuery && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Suggested Correct Query</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap bg-background p-3 rounded font-mono shadow">
                {result.correctQuery}
              </pre>
            </CardContent>
          </Card>
        )}

        {result.isValid && (
          <Card className="mt-4 bg-muted/30 shadow-inner">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">Simulated Query Output</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {hasResultSet && (
                <div className="border rounded-md overflow-x-auto max-h-80">
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
                <p className="text-sm text-muted-foreground mt-2">
                  Query executed successfully and returned no rows.
                </p>
              )}
              {!result.resultSet && ( // Covers cases like DDL, DML, or if AI couldn't simulate a SELECT
                <p className="text-sm text-muted-foreground mt-2">
                  Query validated successfully. No data output to display for this type of query, or simulation was not applicable.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
