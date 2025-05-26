"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, Play, History, Sparkles, CheckCircle, XCircle, Loader2, Trash2, ClipboardCopy } from 'lucide-react';
import { generateSqlPracticeProblem } from '@/ai/flows/generate-sql-practice-problem';
import { validateSqlQuery } from '@/ai/flows/validate-sql-query';
import { formatSchemaForAI, formatSampleDataForAI } from '@/lib/sql-formatter';
import type { PracticeProblem, QueryValidationResult, QueryHistoryItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Dynamically import Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Editor...</span></div>,
});


interface QueryHistoryDisplayProps {
  history: QueryHistoryItem[];
  onSelectQuery: (sql: string) => void;
  onClearHistory: () => void;
}

function QueryHistoryDisplay({ history, onSelectQuery, onClearHistory }: QueryHistoryDisplayProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No queries in history yet.</p>;
  }
  return (
    <div className="space-y-2">
      <Button onClick={onClearHistory} variant="outline" size="sm" className="mb-2">
        <Trash2 className="mr-2 h-4 w-4" /> Clear History
      </Button>
      {history.map(item => (
        <Card key={item.id} className="text-xs hover:shadow-md transition-shadow">
          <CardContent className="p-2">
            <div className="flex justify-between items-start">
              <pre
                className="whitespace-pre-wrap break-all flex-grow cursor-pointer font-mono"
                onClick={() => onSelectQuery(item.sql)}
              >
                {item.sql}
              </pre>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(item.sql); }}>
                <ClipboardCopy className="h-3 w-3"/>
              </Button>
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(item.timestamp).toLocaleString()} -
              <span className={`ml-1 font-medium ${
                item.status === 'validated_correct' ? 'text-green-600' :
                item.status === 'validated_incorrect' ? 'text-red-600' :
                item.status === 'error' ? 'text-destructive' : 'text-blue-600'
              }`}>
                {item.status.replace('_', ' ')}
              </span>
            </p>
            {item.feedback && <p className="text-muted-foreground mt-1 text-xs italic">Feedback: {item.feedback}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


export function QueryWorkspacePanel() {
  const {
    tables,
    sampleData,
    currentProblem,
    setCurrentProblem,
    queryHistory,
    addQueryToHistory,
    clearHistory,
    currentQuery,
    setCurrentQuery,
    validationResult,
    setValidationResult,
    isLoadingAi,
    setIsLoadingAi,
  } = useWorkspace();
  const { toast } = useToast();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [activeMainTab, setActiveMainTab] = useState<'editor' | 'history'>('editor');
  const [showSolution, setShowSolution] = useState(false);

  const schemaString = formatSchemaForAI(tables);
  const dataString = formatSampleDataForAI(tables, sampleData);

  const handleGenerateProblem = async () => {
    if (tables.length === 0) {
      toast({ title: "Schema Required", description: "Please define tables and columns first.", variant: "destructive" });
      return;
    }
    setIsLoadingAi(true);
    setValidationResult(null);
    setShowSolution(false);
    try {
      const problem = await generateSqlPracticeProblem({
        databaseSchema: schemaString,
        sampleData: dataString,
        difficulty,
      });
      setCurrentProblem({ ...problem, difficulty });
      addQueryToHistory({ sql: `Generated ${difficulty} problem.`, status: 'generated_problem', feedback: problem.problemStatement });
      toast({ title: "New Problem Generated!", description: "A new SQL practice problem is ready." });
    } catch (error) {
      console.error("Error generating problem:", error);
      toast({ title: "AI Error", description: "Could not generate a problem. Please try again.", variant: "destructive" });
      setCurrentProblem(null);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleRunQuery = async () => {
    if (!currentQuery.trim()) {
      toast({ title: "Empty Query", description: "Please enter an SQL query.", variant: "destructive" });
      return;
    }
    if (!currentProblem) {
      toast({ title: "No Problem Active", description: "Generate a practice problem first or select one.", variant: "destructive" });
      // Potentially allow running queries without a problem for general practice later
      addQueryToHistory({ sql: currentQuery, status: 'error', feedback: 'No practice problem active for validation.' });
      return;
    }

    setIsLoadingAi(true);
    setValidationResult(null);
    setShowSolution(false);
    try {
      const result = await validateSqlQuery({
        query: currentQuery,
        schema: schemaString,
        data: dataString,
        // Note: The validateSqlQuery flow doesn't explicitly use the problem statement,
        // but it's good practice to have it in context if the AI could implicitly use it.
        // For now, schema + data + query is the main input for validation logic.
      });
      setValidationResult(result);
      addQueryToHistory({
        sql: currentQuery,
        status: result.isValid ? 'validated_correct' : 'validated_incorrect',
        feedback: result.feedback,
      });
      toast({
        title: result.isValid ? "Query Correct!" : "Query Needs Review",
        description: result.feedback.substring(0, 100) + (result.feedback.length > 100 ? "..." : ""),
        variant: result.isValid ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Error validating query:", error);
      toast({ title: "AI Error", description: "Could not validate the query. Please try again.", variant: "destructive" });
      setValidationResult({isValid: false, feedback: "An error occurred during validation."});
      addQueryToHistory({ sql: currentQuery, status: 'error', feedback: 'AI validation service error.' });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const handleEditorChange = (value?: string) => {
    setCurrentQuery(value || '');
  };

  const selectQueryFromHistory = (sql: string) => {
    setCurrentQuery(sql);
    setActiveMainTab('editor'); // Switch to editor tab
    toast({title: "Query Loaded", description: "Query loaded into editor from history."})
  };

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-xl">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          SQL Workspace
        </CardTitle>
        <CardDescription>Write queries, tackle AI-generated problems, and get instant feedback.</CardDescription>
      </CardHeader>
      
      <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as 'editor' | 'history')} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4">
          <TabsTrigger value="editor">Query Editor & Problems</TabsTrigger>
          <TabsTrigger value="history">Query History</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-grow p-4 pt-0">
          <TabsContent value="editor" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                  AI Practice Problem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateProblem} disabled={isLoadingAi || tables.length === 0}>
                    {isLoadingAi && currentProblem === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate New Problem
                  </Button>
                </div>
                {tables.length === 0 && <Alert variant="default" className="mt-2"><AlertDescription>Please define tables and columns in the Schema Editor to generate problems.</AlertDescription></Alert>}
                {isLoadingAi && currentProblem === null && (
                    <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating problem...</div>
                )}
                {currentProblem && (
                  <Alert variant="default" className="mt-2">
                    <AlertTitle className="font-semibold">Problem ({currentProblem.difficulty}):</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap">{currentProblem.problemStatement}</AlertDescription>
                    {currentProblem.expectedSolution && (
                      <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => setShowSolution(!showSolution)}>
                        {showSolution ? "Hide Solution" : "Show Solution"}
                      </Button>
                    )}
                    {showSolution && currentProblem.expectedSolution && (
                       <Card className="mt-2 bg-muted/50">
                         <CardContent className="p-3">
                            <p className="text-xs font-semibold mb-1">Expected Solution:</p>
                            <pre className="text-xs whitespace-pre-wrap bg-background p-2 rounded font-mono">{currentProblem.expectedSolution}</pre>
                         </CardContent>
                       </Card>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SQL Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border rounded-md overflow-hidden min-h-[200px] h-[30vh]">
                  <Suspense fallback={<div className="flex items-center justify-center h-full bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Editor...</span></div>}>
                    <MonacoEditor
                      height="100%"
                      language="sql"
                      theme="vs-light" // TODO: Add dark theme support, or make it 'vs' and let it adapt?
                      value={currentQuery}
                      onChange={handleEditorChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </Suspense>
                </div>
                <Button onClick={handleRunQuery} disabled={isLoadingAi || !currentProblem}>
                  {isLoadingAi && validationResult === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Run & Validate Query
                </Button>
              </CardContent>
            </Card>
            
            {isLoadingAi && validationResult === null && (
                <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validating query...</div>
            )}
            {validationResult && (
              <Card>
                <CardHeader>
                   <CardTitle className={`flex items-center text-lg ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResult.isValid ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
                    Validation Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant={validationResult.isValid ? 'default' : 'destructive'}>
                    <AlertDescription className="whitespace-pre-wrap">{validationResult.feedback}</AlertDescription>
                  </Alert>
                  {!validationResult.isValid && validationResult.correctQuery && (
                    <Card className="mt-3 bg-muted/50">
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold mb-1">Suggested Correct Query:</p>
                        <pre className="text-sm whitespace-pre-wrap bg-background p-2 rounded font-mono">{validationResult.correctQuery}</pre>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
             <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <History className="mr-2 h-5 w-5" /> Query History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <QueryHistoryDisplay history={queryHistory} onSelectQuery={selectQueryFromHistory} onClearHistory={clearHistory} />
                </CardContent>
              </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
