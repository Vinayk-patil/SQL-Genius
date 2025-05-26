
"use client";

import React from 'react';
import type { QueryValidationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Info, FileText, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryResultDisplayProps {
  result: QueryValidationResult;
  expectedSolution?: string; // Pass the expected solution if available
}

export function QueryResultDisplay({ result, expectedSolution }: QueryResultDisplayProps) {
  const hasResultSet = result.isSyntaxValid && result.resultSet && Array.isArray(result.resultSet) && result.resultSet.length > 0;
  const hasEmptyResultSet = result.isSyntaxValid && result.resultSet && Array.isArray(result.resultSet) && result.resultSet.length === 0;

  const columns = hasResultSet ? Object.keys(result.resultSet![0]) : [];

  return (
    <Card className="mt-4 shadow-md" data-testid="query-output-window" aria-label="Query Output Window">
      <CardContent className="space-y-4 p-4 md:p-6">
        {/* Syntax Validation Section */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className={cn(
              "flex items-center text-md",
              result.isSyntaxValid ? "text-primary" : "text-destructive"
            )}>
              {result.isSyntaxValid ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
              Syntax Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-sm">
            <p className="whitespace-pre-wrap">{result.syntaxFeedback}</p>
            {!result.isSyntaxValid && result.suggestedCorrectSyntaxQuery && (
              <div className="mt-2">
                <p className="font-semibold text-xs mb-1">Suggested Correction:</p>
                <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded font-mono shadow-sm">
                  {result.suggestedCorrectSyntaxQuery}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solution Correctness Section (only if applicable) */}
        {result.isSolutionCorrect !== null && result.isSolutionCorrect !== undefined && expectedSolution && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className={cn(
                "flex items-center text-md",
                result.isSolutionCorrect ? "text-primary" : "text-destructive"
              )}>
                {result.isSolutionCorrect ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
                Solution Correctness
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-sm">
              <p className="whitespace-pre-wrap">{result.solutionFeedback || (result.isSolutionCorrect ? "The solution logic is correct." : "The solution logic is incorrect or does not fully match.")}</p>
              {!result.isSolutionCorrect && (
                <div className="mt-2">
                  <p className="font-semibold text-xs mb-1">Expected Solution:</p>
                  <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded font-mono shadow-sm">
                    {expectedSolution}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* Simulated Query Output Section (only if syntax was valid) */}
        {result.isSyntaxValid && (
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
                Query executed successfully and returned no rows based on the sample data.
              </p>
            )}
            {/* This condition handles cases where query is valid SELECT but AI could not simulate or returned unexpected format, or non-SELECT queries */}
            {result.isSyntaxValid && !hasResultSet && !hasEmptyResultSet && (
              <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/30 rounded-md">
                Query syntax is valid. No data output to display because the query is not a SELECT, could not be simulated with sample data, or the simulation did not produce structured data.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
