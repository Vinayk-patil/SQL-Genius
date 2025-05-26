'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate SQL practice problems based on a user-defined database schema and data.
 *
 * - generateSqlPracticeProblem - A function that generates SQL practice problems.
 * - GenerateSqlPracticeProblemInput - The input type for the generateSqlPracticeProblem function.
 * - GenerateSqlPracticeProblemOutput - The return type for the generateSqlPracticeProblem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSqlPracticeProblemInputSchema = z.object({
  databaseSchema: z
    .string()
    .describe('The SQL schema of the database, including table definitions and column types.'),
  sampleData: z
    .string()
    .describe('Sample data for the tables in the database, in a format suitable for insertion.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The desired difficulty level of the practice problem.'),
});
export type GenerateSqlPracticeProblemInput = z.infer<
  typeof GenerateSqlPracticeProblemInputSchema
>;

const GenerateSqlPracticeProblemOutputSchema = z.object({
  problemStatement: z.string().describe('The text of the SQL practice problem.'),
  expectedSolution: z
    .string()
    .optional()
    .describe('The expected SQL query that solves the problem.'),
});
export type GenerateSqlPracticeProblemOutput = z.infer<
  typeof GenerateSqlPracticeProblemOutputSchema
>;

export async function generateSqlPracticeProblem(
  input: GenerateSqlPracticeProblemInput
): Promise<GenerateSqlPracticeProblemOutput> {
  return generateSqlPracticeProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSqlPracticeProblemPrompt',
  input: {schema: GenerateSqlPracticeProblemInputSchema},
  output: {schema: GenerateSqlPracticeProblemOutputSchema},
  prompt: `You are an expert SQL problem generator. You will generate SQL practice problems based on a user-provided database schema and sample data.

Database Schema:
\\\`\\\`\\\`sql
{{{databaseSchema}}}
\\\`\\\`\\\`

Sample Data:
\\\`\\\`\\\`sql
{{{sampleData}}}
\\\`\\\`\\\`

Difficulty Level: {{{difficulty}}}

Generate a relevant and challenging SQL practice problem, suitable for the given difficulty level. Provide the practice problem as the "problemStatement" output.

Optionally, if you are able to, provide the "expectedSolution" - the SQL query that would solve the problem.
`,
});

const generateSqlPracticeProblemFlow = ai.defineFlow(
  {
    name: 'generateSqlPracticeProblemFlow',
    inputSchema: GenerateSqlPracticeProblemInputSchema,
    outputSchema: GenerateSqlPracticeProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
