export type RollBand = "critical_fail" | "fail" | "success" | "moderate_success" | "critical_success";

export function classifyD20(value: number): RollBand {
  if (value <= 1) return "critical_fail";
  if (value <= 9) return "fail";
  if (value === 10) return "success";
  if (value <= 19) return "moderate_success";
  return "critical_success";
}

export function clampDc(dc: number): number {
  return Math.max(5, Math.min(20, Math.trunc(dc)));
}

