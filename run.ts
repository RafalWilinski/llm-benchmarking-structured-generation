import { generateObject, LanguageModel } from "ai";
import { z } from "zod";

export async function run(
  model: LanguageModel,
  schema: z.ZodType<any>,
  mode: "tool" | "json" = "json",
  inputCost: number,
  outputCost: number
) {
  const { object, usage } = await generateObject({
    model,
    schema,
    mode,
    prompt: "Generate a simple JSON object adhering to the provided schema",
  });

  const cost =
    usage.completionTokens * (outputCost / 1000000) + usage.promptTokens * (inputCost / 1000000);

  return { object, cost };
}
