
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
import { Lightbulb, Play, History, Sparkles, Loader2, Trash2, ClipboardCopy, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { generateSqlPracticeProblem } from '@/ai/flows/generate-sql-practice-problem';
import { validateSqlQuery } from '@/ai/flows/validate-sql-query';
import { formatSchemaForAI, formatSampleDataForAI } from '@/lib/sql-formatter';
import type { PracticeProblem, QueryValidationResult, QueryHistoryItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { QueryResultDisplay } from './QueryResultDisplay';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';


const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-sm">Loading Editor...</span></div>,
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

  const getStatusTextAndColor = (item: QueryHistoryItem) => {
    switch (item.status) {
      case 'validated_correct_solution':
        return { text: 'Correct Solution', color: 'text-green-600 dark:text-green-500' };
      case 'validated_incorrect_solution':
        return { text: 'Incorrect Solution', color: 'text-orange-600 dark:text-orange-500' };
      case 'validated_syntax_only':
        return { text: 'Syntax Valid', color: 'text-blue-600 dark:text-blue-500' };
      case 'error_syntax':
        return { text: 'Syntax Error', color: 'text-red-600 dark:text-red-500' };
      case 'error_ai_processing':
        return { text: 'AI Processing Error', color: 'text-destructive' };
      case 'generated_problem':
        return { text: 'Problem Generated', color: 'text-purple-600 dark:text-purple-500' };
      default:
        return { text: item.status.replace(/_/g, ' '), color: 'text-muted-foreground' };
    }
  };


  return (
    <div className="space-y-3">
      <Button onClick={onClearHistory} variant="outline" size="sm" className="mb-2 text-sm">
        <Trash2 className="mr-2 h-4 w-4" /> Clear History
      </Button>
      {history.map(item => {
        const {text: statusText, color: statusColor} = getStatusTextAndColor(item);
        return (
          <Card key={item.id} className="text-sm hover:shadow-lg transition-shadow bg-muted/20">
            <CardContent className="p-3">
              <div className="flex justify-between items-start gap-2">
                <pre
                  className="whitespace-pre-wrap break-all flex-grow cursor-pointer font-mono text-xs sm:text-sm"
                  onClick={() => onSelectQuery(item.sql)}
                >
                  {item.sql}
                </pre>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(item.sql); }}>
                  <ClipboardCopy className="h-3.5 w-3.5"/>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {new Date(item.timestamp).toLocaleString()} -
                <span className={cn("ml-1 font-medium", statusColor)}>
                  {statusText}
                </span>
              </p>
              {item.feedback && <p className="text-muted-foreground mt-1 text-xs italic">Feedback: {item.feedback}</p>}
            </CardContent>
          </Card>
        );
      })}
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
  const { resolvedTheme } = useTheme();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [activeMainTab, setActiveMainTab] = useState<'editor' | 'history' | 'outputs'>('editor');
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
    setCurrentQuery('');
    setShowSolution(false);
    try {
      const problem = await generateSqlPracticeProblem({
        databaseSchema: schemaString,
        sampleData: dataString,
        difficulty,
      });
      setCurrentProblem({ ...problem, difficulty });
      addQueryToHistory({
        sql: `Generated ${difficulty} problem: ${problem.problemStatement.substring(0,50)}...`,
        status: 'generated_problem',
        feedback: problem.problemStatement
      });
      setActiveMainTab('editor');
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
    
    setIsLoadingAi(true);
    setValidationResult(null);
    try {
      const result = await validateSqlQuery({
        userQuery: currentQuery,
        dbSchema: schemaString,
        sampleData: dataString,
        expectedSolutionQuery: currentProblem?.expectedSolution,
      });
      setValidationResult(result);

      let historyStatus: QueryHistoryItem['status'] = 'error_ai_processing';
      let toastTitle = "Query Processed";
      let toastDescription = result.syntaxFeedback;
      let toastVariant: "default" | "destructive" = "default";

      if (!result.isSyntaxValid) {
        historyStatus = 'error_syntax';
        toastTitle = "Syntax Error";
        toastVariant = "destructive";
      } else { // Syntax is valid
        if (result.isSolutionCorrect === true) {
          historyStatus = 'validated_correct_solution';
          toastTitle = "Correct Solution!";
          toastDescription = result.solutionFeedback || result.syntaxFeedback;
        } else if (result.isSolutionCorrect === false) {
          historyStatus = 'validated_incorrect_solution';
          toastTitle = "Incorrect Solution";
          toastDescription = result.solutionFeedback || "Check feedback for details.";
          toastVariant = "destructive";
        } else { // No solution to check against, or problem not active
          historyStatus = 'validated_syntax_only';
          toastTitle = "Syntax Valid";
        }
      }
      
      addQueryToHistory({
        sql: currentQuery,
        status: historyStatus,
        validationResult: result,
        feedback: result.solutionFeedback || result.syntaxFeedback,
      });

      setActiveMainTab('editor');
      toast({
        title: toastTitle,
        description: (toastDescription || "Review the output for details.").substring(0, 100) + ( (toastDescription||"").length > 100 ? "..." : ""),
        variant: toastVariant,
      });

    } catch (error) {
      console.error("Error validating query:", error);
      const errorFeedback = error instanceof Error ? error.message : "An unknown error occurred during AI validation.";
      const errorResult: QueryValidationResult = {
        isSyntaxValid: false, 
        syntaxFeedback: errorFeedback,
        isSolutionCorrect: null,
        solutionFeedback: null,
        resultSet: null
      };
      setValidationResult(errorResult);
      addQueryToHistory({
        sql: currentQuery,
        status: 'error_ai_processing',
        feedback: 'AI validation service error.',
        validationResult: errorResult
      });
      toast({ title: "AI Error", description: errorFeedback, variant: "destructive" });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const handleEditorChange = (value?: string) => {
    setCurrentQuery(value || '');
  };

  const selectQueryFromHistory = (sql: string) => {
    setCurrentQuery(sql);
    setActiveMainTab('editor');
    toast({title: "Query Loaded", description: "Query loaded into editor from history."})
  };
  
  const getStatusIconAndColorForOutputTab = (status: QueryHistoryItem['status']) => {
    switch (status) {
        case 'validated_correct_solution':
            return { icon: <CheckCircle className="mr-1.5 h-3.5 w-3.5" />, text: 'Correct Solution', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' };
        case 'validated_incorrect_solution':
            return { icon: <XCircle className="mr-1.5 h-3.5 w-3.5" />, text: 'Incorrect Solution', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' };
        case 'validated_syntax_only':
            return { icon: <CheckCircle className="mr-1.5 h-3.5 w-3.5" />, text: 'Syntax Valid', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' };
        case 'error_syntax':
            return { icon: <XCircle className="mr-1.5 h-3.5 w-3.5" />, text: 'Syntax Error', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' };
        case 'error_ai_processing':
            return { icon: <AlertCircle className="mr-1.5 h-3.5 w-3.5" />, text: 'AI Processing Error', color: 'bg-destructive/10 text-destructive dark:bg-destructive/30' };
        default:
            return { icon: <FileText className="mr-1.5 h-3.5 w-3.5" />, text: status.replace(/_/g, ' '), color: 'bg-muted text-muted-foreground' };
    }
};


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          SQL Workspace
        </CardTitle>
        <CardDescription>Write queries, tackle AI-generated problems, and get instant feedback.</CardDescription>
      </CardHeader>
      
      <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as 'editor' | 'history' | 'outputs')} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-2 my-4 md:m-4 self-center max-w-lg">
          <TabsTrigger value="editor">Query Editor & Problems</TabsTrigger>
          <TabsTrigger value="history">Query History</TabsTrigger>
          <TabsTrigger value="outputs">Execution Outputs</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-grow px-2 md:px-0 pb-4">
          <TabsContent value="editor" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                  AI Practice Problem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
                    <SelectTrigger className="h-10 text-sm w-full sm:w-auto sm:min-w-[150px]">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy" className="text-sm">Easy</SelectItem>
                      <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                      <SelectItem value="hard" className="text-sm">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateProblem} disabled={isLoadingAi || tables.length === 0} className="h-10 text-sm">
                    {isLoadingAi && currentProblem === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate New Problem
                  </Button>
                </div>
                {tables.length === 0 && <Alert variant="default" className="mt-2"><AlertDescription className="text-sm">Please define tables and columns in the Schema Editor to generate problems.</AlertDescription></Alert>}
                {isLoadingAi && !currentProblem && (
                    <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating problem...</div>
                )}
                {currentProblem && (
                  <Alert variant="default" className="mt-2 bg-muted/30">
                    <AlertTitle className="font-semibold text-base">Problem ({currentProblem.difficulty}):</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap text-sm">{currentProblem.problemStatement}</AlertDescription>
                    {currentProblem.expectedSolution && (
                      <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-sm" onClick={() => setShowSolution(!showSolution)}>
                        {showSolution ? "Hide Solution" : "Show Solution"}
                      </Button>
                    )}
                    {showSolution && currentProblem.expectedSolution && (
                       <Card className="mt-2 bg-background/70">
                         <CardContent className="p-3">
                            <p className="text-xs font-semibold mb-1">Expected Solution:</p>
                            <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded font-mono">{currentProblem.expectedSolution}</pre>
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
              <CardContent className="space-y-4">
                <div className="border rounded-md overflow-hidden min-h-[200px] h-[30vh] shadow-inner">
                  <Suspense fallback={<div className="flex items-center justify-center h-full bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-sm">Loading Editor...</span></div>}>
                    <MonacoEditor
                      height="100%"
                      language="sql"
                      theme={activeMainTab === 'editor' && resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                      value={currentQuery}
                      onChange={handleEditorChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 10, bottom: 10 },
                      }}
                    />
                  </Suspense>
                </div>
                <Button onClick={handleRunQuery} disabled={isLoadingAi || tables.length === 0} size="lg" className="text-sm">
                  {isLoadingAi && !validationResult ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Run & Validate Query
                </Button>
              </CardContent>
            </Card>
            
            {isLoadingAi && !validationResult && ( 
                <div className="text-sm text-muted-foreground flex items-center mt-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing query...</div>
            )}
            {validationResult && ( 
              <QueryResultDisplay result={validationResult} expectedSolution={currentProblem?.expectedSolution} />
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

          <TabsContent value="outputs" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" /> Execution Outputs
                </CardTitle>
                <CardDescription className="text-sm">Detailed output for each query you've run.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {queryHistory.filter(item => item.validationResult).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No query execution outputs to display yet. Run a query from the editor.</p>
                )}
                {queryHistory
                  .filter(item => item.validationResult && (item.status !== 'generated_problem')) // Filter out problem generation logs
                  .map(item => {
                    const {icon: statusIcon, text: statusText, color: statusColor} = getStatusIconAndColorForOutputTab(item.status);
                    // Find the problem associated with this query if it was a solution attempt
                    // This is a simplification; a more robust way might be to link problem ID to query history item
                    const problemForThisQuery = queryHistory.find(p => p.status === 'generated_problem' && p.timestamp < item.timestamp);
                    const expectedSolutionForThisItem = problemForThisQuery?.validationResult?.isSyntaxValid === undefined ? problemForThisQuery?.feedback : undefined;


                    return (
                      <div key={item.id} className="space-y-2 border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                          <span className={cn("flex items-center font-medium px-2 py-0.5 rounded-full text-xs", statusColor)}>
                            {statusIcon} {statusText}
                          </span>
                        </div>
                        <pre className="text-xs sm:text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded font-mono mb-2 shadow-sm">{item.sql}</pre>
                        <QueryResultDisplay result={item.validationResult!} expectedSolution={expectedSolutionForThisItem} />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
