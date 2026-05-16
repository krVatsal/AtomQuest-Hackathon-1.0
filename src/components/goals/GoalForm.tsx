"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSchema, UOM_OPTIONS, type GoalFormValues } from "@/lib/validations/goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric (Min)",
  NUMERIC_MAX: "Numeric (Max)",
  TIMELINE: "Timeline",
  ZERO: "Zero",
};

interface GoalFormProps {
  defaultValues?: Partial<GoalFormValues>;
  isShared?: boolean;
  onSubmit: (data: GoalFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GoalForm({
  defaultValues,
  isShared = false,
  onSubmit,
  onCancel,
  isLoading = false,
}: GoalFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      thrustArea: "",
      title: "",
      description: "",
      uom: "NUMERIC_MAX",
      target: 0,
      weightage: 10,
      ...defaultValues,
    },
  });

  const uomValue = watch("uom");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Thrust Area */}
      <div className="space-y-1.5">
        <Label htmlFor="thrustArea">Thrust Area</Label>
        <Input
          id="thrustArea"
          placeholder="e.g. Revenue Growth"
          disabled={isShared}
          {...register("thrustArea")}
          className={cn(errors.thrustArea && "border-red-500")}
        />
        {errors.thrustArea && (
          <p className="text-xs text-red-500">{errors.thrustArea.message}</p>
        )}
      </div>

      {/* Goal Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          placeholder="e.g. Increase quarterly revenue by 15%"
          disabled={isShared}
          {...register("title")}
          className={cn(errors.title && "border-red-500")}
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Additional details about this goal..."
          disabled={isShared}
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* UoM */}
        <div className="space-y-1.5">
          <Label>Unit of Measure</Label>
          <Select
            value={uomValue}
            onValueChange={(val) =>
              setValue("uom", val as GoalFormValues["uom"], {
                shouldValidate: true,
              })
            }
            disabled={isShared}
          >
            <SelectTrigger className={cn(errors.uom && "border-red-500")}>
              <SelectValue placeholder="Select UoM" />
            </SelectTrigger>
            <SelectContent>
              {UOM_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {UOM_LABELS[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.uom && (
            <p className="text-xs text-red-500">{errors.uom.message}</p>
          )}
        </div>

        {/* Target */}
        <div className="space-y-1.5">
          <Label htmlFor="target">Target</Label>
          <Input
            id="target"
            type="number"
            step="any"
            disabled={isShared}
            {...register("target", { valueAsNumber: true })}
            className={cn(errors.target && "border-red-500")}
          />
          {errors.target && (
            <p className="text-xs text-red-500">{errors.target.message}</p>
          )}
        </div>

        {/* Weightage */}
        <div className="space-y-1.5">
          <Label htmlFor="weightage">Weightage (%)</Label>
          <Input
            id="weightage"
            type="number"
            min={10}
            max={100}
            {...register("weightage", { valueAsNumber: true })}
            className={cn(errors.weightage && "border-red-500")}
          />
          {errors.weightage && (
            <p className="text-xs text-red-500">{errors.weightage.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : defaultValues?.title ? "Update Goal" : "Add Goal"}
        </Button>
      </div>
    </form>
  );
}
