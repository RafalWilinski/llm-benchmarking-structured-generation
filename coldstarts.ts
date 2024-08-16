import { LanguageModel } from "ai";
import { z } from "zod";
import { complexJsonSchema, superComplexJsonSchema, wideJsonSchema } from "./schemas";
import { openai } from "@ai-sdk/openai";
import { run } from "./run";
import pLimit from "p-limit";

const schemas = [
  complexJsonSchema.describe("Complex JSON Schema"),
  wideJsonSchema.describe("Wide JSON Schema"),
  superComplexJsonSchema.describe("Super Complex JSON Schema"),
];

// Benchmark cold start cases
const coldStartModels = [
  {
    model: openai("gpt-4o-2024-08-06", { structuredOutputs: true }),
    inputCost: 2.5,
    outputCost: 10,
  },
  {
    model: openai("gpt-4o-mini", { structuredOutputs: true }),
    inputCost: 0.15,
    outputCost: 0.6,
  },
];

const coldStartRuns = 25;

async function measureColdStart(
  model: {
    model: LanguageModel;
    inputCost: number;
    outputCost: number;
  },
  schema: z.ZodObject<any>
) {
  let totalFirstRequestTime = 0;
  let totalSecondRequestTime = 0;

  const limit = pLimit(5);
  const runs = await Promise.all(
    Array.from({ length: coldStartRuns }, (_, i) =>
      limit(async () => {
        // Alter first top-level property to prevent caching
        const modifiedSchema = schema.extend({
          [`${+new Date()}_${model.model.modelId}_${i}`]: z.number(),
        });

        // First request (cold start)
        const startFirst = performance.now();
        await run(model.model, modifiedSchema, "json", model.inputCost, model.outputCost);
        const endFirst = performance.now();
        const firstRequestTime = endFirst - startFirst;

        // Second request (warm start)
        const startSecond = performance.now();
        await run(model.model, modifiedSchema, "json", model.inputCost, model.outputCost);
        const endSecond = performance.now();
        const secondRequestTime = endSecond - startSecond;

        console.log(
          `  [${model.model.modelId} - ${schema.description}] 1st: ${firstRequestTime.toFixed(
            4
          )} ms, 2nd: ${secondRequestTime.toFixed(4)} ms, Cold start penalty: ${
            ((firstRequestTime - secondRequestTime) / secondRequestTime) * 100
          }%`
        );

        return { firstRequestTime, secondRequestTime };
      })
    )
  );

  totalFirstRequestTime = runs.reduce((sum, run) => sum + run.firstRequestTime, 0);
  totalSecondRequestTime = runs.reduce((sum, run) => sum + run.secondRequestTime, 0);

  const avgFirstRequestTime = totalFirstRequestTime / coldStartRuns;
  const avgSecondRequestTime = totalSecondRequestTime / coldStartRuns;
  const coldStartPenalty =
    ((avgFirstRequestTime - avgSecondRequestTime) / avgFirstRequestTime) * 100;

  return { avgFirstRequestTime, avgSecondRequestTime, coldStartPenalty };
}

interface ColdStartResult {
  modelId: string;
  schema: string;
  avgFirstRequestTime: number;
  avgSecondRequestTime: number;
  coldStartPenalty: number;
}

const results: ColdStartResult[] = [];

console.log("\nCold Start Benchmark Results:");

await Promise.all(
  coldStartModels.map(async (model) => {
    await Promise.all(
      schemas.map(async (schema) => {
        const { avgFirstRequestTime, avgSecondRequestTime, coldStartPenalty } =
          await measureColdStart(model, schema);

        results.push({
          modelId: model.model.modelId,
          schema: schema.description!,
          avgFirstRequestTime,
          avgSecondRequestTime,
          coldStartPenalty,
        });

        console.log(`\n  Schema: ${schema.description}`);
        console.log(`    Model: ${model.model.modelId}`);
        console.log(`    Average First Request Time: ${avgFirstRequestTime.toFixed(4)} ms`);
        console.log(`    Average Second Request Time: ${avgSecondRequestTime.toFixed(4)} ms`);
        console.log(`    Cold Start Penalty: ${coldStartPenalty.toFixed(4)}%`);
      })
    );
  })
);

// Generate comprehensive report
console.log("\n\nComprehensive Cold Start Report:");

// Table for all results
console.table(
  results.map((result) => ({
    ...result,
    avgFirstRequestTime: result.avgFirstRequestTime.toFixed(4),
    avgSecondRequestTime: result.avgSecondRequestTime.toFixed(4),
    coldStartPenalty: result.coldStartPenalty.toFixed(4),
  }))
);

// Summary statistics
console.log("\nSummary Statistics:");

const modelIds = [...new Set(results.map((r) => r.modelId))];
const schemaNames = [...new Set(results.map((r) => r.schema))];

modelIds.forEach((modelId) => {
  console.log(`\nModel: ${modelId}`);
  const modelResults = results.filter((r) => r.modelId === modelId);
  const avgPenalty =
    modelResults.reduce((sum, r) => sum + r.coldStartPenalty, 0) / modelResults.length;
  console.log(`  Average Cold Start Penalty: ${avgPenalty.toFixed(4)}%`);
});

schemaNames.forEach((schema) => {
  console.log(`\nSchema: ${schema}`);
  const schemaResults = results.filter((r) => r.schema === schema);
  const avgPenalty =
    schemaResults.reduce((sum, r) => sum + r.coldStartPenalty, 0) / schemaResults.length;
  console.log(`  Average Cold Start Penalty: ${avgPenalty.toFixed(4)}%`);
});

// Overall statistics
const overallAvgPenalty = results.reduce((sum, r) => sum + r.coldStartPenalty, 0) / results.length;
console.log(`\nOverall Average Cold Start Penalty: ${overallAvgPenalty.toFixed(4)}%`);
