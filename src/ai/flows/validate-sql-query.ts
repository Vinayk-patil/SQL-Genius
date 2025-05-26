'use server';

/**
 * @fileOverview Validates a SQL query against a given database schema and data, providing feedback on correctness and suggestions for improvement.
 *
 * - validateSqlQuery - A function that validates a SQL query.
 * - ValidateSqlQueryInput - The input type for the validateSqlQuery function.
 * - ValidateSqlQueryOutput - The return type for the validateSqlQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateSqlQueryInputSchema = z.object({
  query: z.string().describe('The SQL query to validate.'),
  schema: z.string().describe('The database schema as a string.'),
  data: z.string().describe('Sample data for the database as a string.'),
});
export type ValidateSqlQueryInput = z.infer<typeof ValidateSqlQueryInputSchema>;

const ValidateSqlQueryOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the query is valid or not.'),
  feedback: z.string().describe('Feedback on the query, including suggestions for improvement.'),
  correctQuery: z.string().optional().describe('The correct SQL query, if the provided query is incorrect.'),
});
export type ValidateSqlQueryOutput = z.infer<typeof ValidateSqlQueryOutputSchema>;

export async function validateSqlQuery(input: ValidateSqlQueryInput): Promise<ValidateSqlQueryOutput> {
  return validateSqlQueryFlow(input);
}

const validateSqlQueryPrompt = ai.definePrompt({
  name: 'validateSqlQueryPrompt',
  input: {schema: ValidateSqlQueryInputSchema},
  output: {schema: ValidateSqlQueryOutputSchema},
  prompt: `You are an expert SQL validator. You will receive an SQL query, a database schema, and sample data. Your task is to validate the query and provide feedback on its correctness. If the query is incorrect, provide suggestions on how to fix it and provide a correct SQL query.

SQL Query: {{{query}}}
Database Schema: {{{schema}}}
Sample Data: {{{data}}}

Respond in JSON format.
`,
});

const validateSqlQueryFlow = ai.defineFlow(
  {
    name: 'validateSqlQueryFlow',
    inputSchema: ValidateSqlQueryInputSchema,
    outputSchema: ValidateSqlQueryOutputSchema,
  },
  async input => {
    const {output} = await validateSqlQueryPrompt(input);
    return output!;
  }
);
