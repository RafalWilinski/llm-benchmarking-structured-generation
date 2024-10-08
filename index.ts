import { LanguageModel } from "ai";
import { z } from "zod";
import { complexJsonSchema, superComplexJsonSchema, wideJsonSchema } from "./schemas";
import { openai } from "@ai-sdk/openai";
import { run } from "./run";

const modelConfigs = [
  {
    name: "gpt-4o-2024-08-06",
    inputCost: 2.5,
    outputCost: 10,
  },
  {
    name: "gpt-4o-mini",
    inputCost: 0.15,
    outputCost: 0.6,
  },
];

const schemas = [
  complexJsonSchema.describe("Complex JSON Schema"),
  wideJsonSchema.describe("Wide JSON Schema"),
  superComplexJsonSchema.describe("Super Complex JSON Schema"),
];
const modes = ["json", "tool"];
const structuredOutputsOptions = [false, true];

const cases = modelConfigs
  .flatMap(({ name, inputCost, outputCost }) =>
    schemas.flatMap((schema) =>
      modes.flatMap((mode) =>
        structuredOutputsOptions.flatMap((structuredOutputs) => {
          if (mode === "tool" && structuredOutputs === true) {
            return []; // Skip strict-tool cases
          }
          return [
            {
              model: openai(name, { structuredOutputs }),
              mode,
              inputCost,
              outputCost,
              schema,
            },
          ];
        })
      )
    )
  )
  .filter(Boolean); // Remove empty arrays resulting from skipped cases

const n = 50;
const performances: Record<string, number[]> = {};
const successes: Record<string, number> = {};
const costs: Record<string, number> = {};
const firstCallPerformances = {};

await Promise.all(
  cases.map(async ({ model, mode, inputCost, outputCost, schema }) => {
    const key = `${model.modelId}${
      model.settings.structuredOutputs ? "-strict" : "-non-strict"
    }-${mode} (${schema.description})`;

    performances[key] = [];
    successes[key] = 0;
    firstCallPerformances[key] = null;
    costs[key] = 0;
    for (let i = 0; i < n; i++) {
      const startTime = performance.now();

      try {
        const { cost } = await run(model, schema, mode as "tool" | "json", inputCost, outputCost);
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        costs[key] += cost;
        performances[key].push(executionTime);

        if (i === 0) {
          firstCallPerformances[key] = executionTime;
        }

        console.log(`[${key}] Run ${i + 1}: ${executionTime.toFixed(4)} ms`);
        successes[key]++;
      } catch (error) {
        console.error(`[${key}] Run ${i + 1} failed`);
        // console.error(error);
      }
    }

    const avgTime = performances[key].reduce((a, b) => a + b, 0) / n;
    if (firstCallPerformances[key]) {
      const coldStartPenalty = ((firstCallPerformances[key] - avgTime) / avgTime) * 100;
      console.log(`[${key}] First call time: ${firstCallPerformances[key].toFixed(4)} ms`);
      console.log(`[${key}] Cold-start penalty: ${coldStartPenalty.toFixed(4)}%`);
    }

    console.log(`[${key}] Average time: ${avgTime.toFixed(4)} ms`);
    console.log(`[${key}] Success rate: ${((successes[key] / n) * 100).toFixed(4)}%`);
    console.log(`[${key}] Cost: ${costs[key].toFixed(4)}`);
  })
);

// Generate a comprehensive report sorting methods by performance and cost
console.log("\nComprehensive Report:");

// Create an array of all methods with their metrics
const methodMetrics = Object.entries(performances).map(([key, perf]) => {
  const avgTime = perf.reduce((a, b) => a + b, 0) / n;
  const successRate = (successes[key] / n) * 100;
  const cost = costs[key];
  const schema = key.split("(")[1].split(")")[0].trim();
  return { key, avgTime, successRate, cost, schema };
});

// Group methods by schema
const groupedBySchema: Record<string, any[]> = methodMetrics.reduce((acc, method) => {
  if (!acc[method.schema]) {
    acc[method.schema] = [];
  }
  acc[method.schema].push(method);
  return acc;
}, {});

// Report for each schema
Object.entries(groupedBySchema).forEach(([schema, methods]) => {
  console.log(`\nReport for schema: ${schema}`);

  // Sort by average time (performance)
  const sortedByPerformance = [...methods].sort((a, b) => {
    if (a.successRate < 80 && b.successRate >= 80) return 1;
    if (b.successRate < 80 && a.successRate >= 80) return -1;
    return a.avgTime - b.avgTime;
  });

  console.log("\nMethods sorted by performance (fastest to slowest):");
  sortedByPerformance.forEach((method, index) => {
    console.log(`${index + 1}. ${method.key}`);
    console.log(`   Average time: ${method.avgTime.toFixed(4)} ms`);
    console.log(`   Success rate: ${method.successRate.toFixed(4)}%`);
    console.log(`   Cost: ${method.cost.toFixed(4)}`);
  });

  // Sort by cost (cheapest to most expensive)
  const sortedByCost = [...methods].sort((a, b) => {
    if (a.successRate < 80 && b.successRate >= 80) return 1;
    if (b.successRate < 80 && a.successRate >= 80) return -1;
    return a.cost - b.cost;
  });

  console.log("\nMethods sorted by cost (cheapest to most expensive):");
  sortedByCost.forEach((method, index) => {
    console.log(`${index + 1}. ${method.key}`);
    console.log(`   Cost: ${method.cost.toFixed(4)}`);
    console.log(`   Average time: ${method.avgTime.toFixed(4)} ms`);
    console.log(`   Success rate: ${method.successRate.toFixed(4)}%`);
  });
});

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

const coldStartRuns = 50;

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
  const jsonSchema = schema.shape;

  for (let i = 0; i < coldStartRuns; i++) {
    // Alter first top-level property to prevent caching
    const modifiedSchema = {
      ...jsonSchema,
      [Object.keys(jsonSchema)[0]]: `${jsonSchema[Object.keys(jsonSchema)[0]]}_${Math.random()
        .toString(36)
        .substring(7)}`,
    };

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

    totalFirstRequestTime += firstRequestTime;
    totalSecondRequestTime += secondRequestTime;
  }

  const avgFirstRequestTime = totalFirstRequestTime / coldStartRuns;
  const avgSecondRequestTime = totalSecondRequestTime / coldStartRuns;
  const coldStartPenalty =
    ((avgFirstRequestTime - avgSecondRequestTime) / avgFirstRequestTime) * 100;

  return { avgFirstRequestTime, avgSecondRequestTime, coldStartPenalty };
}

console.log("\nCold Start Benchmark Results:");

for (const model of coldStartModels) {
  console.log(`\nModel: ${model}`);

  for (const schema of schemas) {
    const { avgFirstRequestTime, avgSecondRequestTime, coldStartPenalty } = await measureColdStart(
      model,
      schema
    );
    console.log(`\n  Schema: ${schema}`);
    console.log(`    Average First Request Time: ${avgFirstRequestTime.toFixed(4)} ms`);
    console.log(`    Average Second Request Time: ${avgSecondRequestTime.toFixed(4)} ms`);
    console.log(`    Speedup: ${coldStartPenalty.toFixed(4)}%`);
  }
}
