import { z } from "zod";

export const UOM_OPTIONS = ["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"] as const;

export const goalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  uom: z.enum(UOM_OPTIONS, { message: "Select a unit of measure" }),
  target: z.number().min(0, "Target must be ≥ 0"),
  weightage: z
    .number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
