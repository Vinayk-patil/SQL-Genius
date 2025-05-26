
'use server';

/**
 * @fileOverview Validates a SQL query against a given database schema and data.
 * It checks for syntax validity and, if an expected solution is provided,
 * compares the user's query against it. It also attempts to simulate
 * SELECT queries to return a result set.
 *
 * - validateSqlQuery - A function that validates a SQL query.
 * - ValidateSqlQueryInput - The input type for the validateSqlQuery function.
 * - ValidateSqlQueryOutput - The return type for the validateSqlQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { QueryValidationResult, QueryResultRow } from '@/types';


const ValidateSqlQueryInputSchema = z.object({
  userQuery: z.string().describe('The SQL query submitted by the user.'),
  dbSchema: z.string().describe('The database schema as a SQL CREATE TABLE statements string.'),
  sampleData: z.string().describe('Sample data for the database as SQL INSERT statements string.'),
  expectedSolutionQuery: z.string().optional().describe('An optional expected SQL query for the current problem. If provided, the user_s query will be compared against it for logical correctness if syntactically valid.'),
});
export type ValidateSqlQueryInput = z.infer<typeof ValidateSqlQueryInputSchema>;

// Schema for what the client-side expects for a single row in the result set
const ClientFacingQueryResultRowSchema = z.record(z.string(), z.any())
  .describe("A single row object from a query result, where keys are column names.");

// Schema for the AI's direct response. resultSet is a JSON string.
const AIResponseSchema = z.object({
  isSyntaxValid: z.boolean().describe('Whether the user_s query is syntactically valid SQL against the provided schema.'),
  syntaxFeedback: z.string().describe('Feedback on the SQL syntax. If invalid, this should explain the syntax error. If valid, a confirmation message like "Query syntax is valid."'),
  suggestedCorrectSyntaxQuery: z.string().optional().describe('If isSyntaxValid is false, this is a suggested syntactically correct version of the user_s query.'),
  isSolutionCorrect: z.boolean().nullable().optional().describe('If an expectedSolutionQuery was provided and syntax is valid, this indicates if the user_s query matches the expected solution_s logic. Null if syntax was invalid or no expectedSolutionQuery was provided.'),
  solutionFeedback: z.string().nullable().optional().describe('Feedback on the solution match. If incorrect, hints or reasons (e.g., "Your query logic differs..."). If correct, confirmation (e.g., "Correct! Your query matches..."). Null if not applicable.'),
  resultSet: z.string().nullable().optional().describe('A JSON string representing the simulated result set. This should be a stringified array of objects for data (e.g., \'[{"col":"val"}]\'), a stringified empty array \'[]\' for no rows, or null if the query is not a SELECT, if simulation fails, or if syntax is invalid.'),
});

// Schema for the flow's final output, matching QueryValidationResult type.
const FinalFlowOutputSchema = z.object({
  isSyntaxValid: z.boolean(),
  syntaxFeedback: z.string(),
  suggestedCorrectSyntaxQuery: z.string().optional(),
  isSolutionCorrect: z.boolean().nullable().optional(),
  solutionFeedback: z.string().nullable().optional(),
  resultSet: z.array(ClientFacingQueryResultRowSchema).nullable().optional(),
}) satisfies z.ZodType<QueryValidationResult>;

export type ValidateSqlQueryOutput = z.infer<typeof FinalFlowOutputSchema>;


export async function validateSqlQuery(input: ValidateSqlQueryInput): Promise<ValidateSqlQueryOutput> {
  try {
    // The flow now handles the parsing and conforms to FinalFlowOutputSchema
    return await validateSqlQueryFlow(input);
  } catch (error) {
    console.error("Error in validateSqlQuery function calling flow:", error);
    let errorMessage = "An unexpected error occurred during AI validation wrapper.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      isSyntaxValid: false,
      syntaxFeedback: `AI processing error: ${errorMessage}`,
      isSolutionCorrect: null,
      solutionFeedback: null,
      resultSet: null,
    };
  }
}

const validateSqlQueryPrompt = ai.definePrompt({
  name: 'validateSqlQueryPrompt',
  input: {schema: ValidateSqlQueryInputSchema},
  output: {schema: AIResponseSchema}, // AI outputs according to AIResponseSchema
  prompt: `You are an expert SQL validator and teaching assistant. You will receive a user's SQL query, a database schema, sample data, and an optional expected solution query. Your task is to perform up to three types of validation and simulation.

User's SQL Query:
\`\`\`sql
{{{userQuery}}}
\`\`\`

Database Schema (CREATE TABLE statements):
\`\`\`sql
{{{dbSchema}}}
\`\`\`

Sample Data (INSERT statements):
\`\`\`sql
{{{sampleData}}}
\`\`\`

{{#if expectedSolutionQuery}}
Expected Solution Query (for comparison if user's query is syntactically valid):
\`\`\`sql
{{{expectedSolutionQuery}}}
\`\`\`
{{/if}}

Please provide your response in JSON format according to the output schema.

Follow these steps:

1.  **Syntax Validation**:
    *   Determine if the \`userQuery\` is syntactically valid SQL based on the provided \`dbSchema\`.
    *   Set \`isSyntaxValid\` to \`true\` or \`false\`.
    *   Set \`syntaxFeedback\`:
        *   If \`isSyntaxValid\` is \`true\`, set \`syntaxFeedback\` to "Query syntax is valid."
        *   If \`isSyntaxValid\` is \`false\`, set \`syntaxFeedback\` to a specific error message (e.g., "Syntax Error: Unexpected token near 'FROM' at line X, column Y."). Also, provide a \`suggestedCorrectSyntaxQuery\` if possible.

2.  **Solution Correctness Validation (Proceed only if \`isSyntaxValid\` is \`true\` AND \`expectedSolutionQuery\` was provided)**:
    *   Compare the logic and expected output of the \`userQuery\` against the \`expectedSolutionQuery\`. The match does not need to be word-for-word but should be logically equivalent.
    *   Set \`isSolutionCorrect\` to \`true\` or \`false\`.
    *   Set \`solutionFeedback\`:
        *   If \`isSolutionCorrect\` is \`true\`, set \`solutionFeedback\` to "Correct! Your query matches the expected solution logic."
        *   If \`isSolutionCorrect\` is \`false\`, set \`solutionFeedback\` to an explanation of why it's incorrect (e.g., "Incorrect query. Your query logic seems to miss the condition for X." or "Your query does not filter by Y as expected.").
    *   If \`expectedSolutionQuery\` was NOT provided, or if \`isSyntaxValid\` is \`false\`, set \`isSolutionCorrect\` and \`solutionFeedback\` to \`null\`.

3.  **Data Simulation (Proceed only if \`isSyntaxValid\` is \`true\` AND the \`userQuery\` is a \`SELECT\` or similar data-retrieving statement)**:
    *   Attempt to simulate the execution of the \`userQuery\` against the \`dbSchema\` and \`sampleData\`.
    *   Set \`resultSet\` (as a JSON string):
        *   If the query returns data: A JSON STRING representing an array of objects, where each object represents a row and keys are column names (e.g., \`'[{"column1": "value1"}, {"column2": "value2"}]'\`).
        *   If the query executes successfully but returns no rows: A JSON STRING representing an empty array (\`'[]'\`).
        *   If the query is not a \`SELECT\` statement (e.g., INSERT, UPDATE, DDL), or if simulation is not possible/fails: \`null\` (the JSON value null, not the string "null").
    *   If \`isSyntaxValid\` is \`false\`, set \`resultSet\` to \`null\`.

**Important Notes for your JSON response:**
*   Ensure all fields in the output schema are addressed.
*   For \`isSolutionCorrect\` and \`solutionFeedback\`, if an \`expectedSolutionQuery\` is not provided in the input, these fields MUST be \`null\`. They should not be \`false\` or an empty string.
*   Similarly, if \`isSyntaxValid\` is \`false\`, then \`isSolutionCorrect\` and \`solutionFeedback\` MUST be \`null\`, and \`resultSet\` (the JSON string field) MUST be \`null\`.
`,
});

const validateSqlQueryFlow = ai.defineFlow(
  {
    name: 'validateSqlQueryFlow',
    inputSchema: ValidateSqlQueryInputSchema,
    outputSchema: FinalFlowOutputSchema, // Flow's external contract uses the final, parsed schema
  },
  async (input): Promise<ValidateSqlQueryOutput> => {
    const aiCallResult = await validateSqlQueryPrompt(input);

    if (!aiCallResult.output) {
        return {
            isSyntaxValid: false,
            syntaxFeedback: "AI Error: The model's response was not structured correctly for processing.",
            suggestedCorrectSyntaxQuery: undefined,
            isSolutionCorrect: null,
            solutionFeedback: null,
            resultSet: null,
        };
    }
    const rawAiOutput = aiCallResult.output; // This matches AIResponseSchema

    let parsedResultSet: QueryResultRow[] | null = null;
    if (typeof rawAiOutput.resultSet === 'string') {
      try {
        const data = JSON.parse(rawAiOutput.resultSet);
        // Expect an array of objects, or an empty array.
        if (Array.isArray(data)) {
          // A simple check: if not empty, ensure first item is an object (or array itself is empty)
          if (data.length === 0 || (data.length > 0 && typeof data[0] === 'object' && data[0] !== null)) {
             parsedResultSet = data as QueryResultRow[];
          } else if (data.length > 0) {
            // Parsed into an array, but not an array of objects.
            console.warn("AI returned a JSON string for resultSet, it parsed to an array, but not an array of objects:", data);
            // Treat as if no valid resultSet was provided by setting feedback.
            // Or, keep parsedResultSet as null and let the generic message in UI handle it.
            // For now, we'll let it be null, which implies simulation failure or non-SELECT.
          }
          // If data.length === 0, parsedResultSet is already correctly an empty array via the cast.
        } else {
          console.warn("AI returned a JSON string for resultSet, but it did not parse into an array:", rawAiOutput.resultSet);
        }
      } catch (e) {
        console.error("Failed to parse resultSet JSON string from AI:", e, "\nString was:", rawAiOutput.resultSet);
        // Fallback, treat as if no valid resultSet was provided.
      }
    }
    // If rawAiOutput.resultSet was null or undefined, parsedResultSet remains null by default.

    return {
      isSyntaxValid: rawAiOutput.isSyntaxValid,
      syntaxFeedback: rawAiOutput.syntaxFeedback,
      suggestedCorrectSyntaxQuery: rawAiOutput.suggestedCorrectSyntaxQuery,
      isSolutionCorrect: rawAiOutput.isSolutionCorrect,
      solutionFeedback: rawAiOutput.solutionFeedback,
      resultSet: parsedResultSet, // Use the parsed (or null) resultSet
    };
  }
);

    