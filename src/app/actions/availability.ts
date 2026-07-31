"use server";

import { submitAvailabilityRequest } from "@/lib/inquiries";
import type { AvailabilityRequestField } from "@/lib/inquiries/contract";

export type AvailabilityActionState = {
  status: "idle" | "success" | "invalid" | "error";
  requestId?: string;
  issues?: Partial<Record<AvailabilityRequestField, string>>;
  message?: string;
};

export async function submitAvailabilityAction(
  _previousState: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const result = await submitAvailabilityRequest(formData);

  if (result.ok) {
    return { status: "success", requestId: result.requestId };
  }

  if (result.status === "invalid") {
    return {
      status: "invalid",
      issues: Object.fromEntries(result.issues.map((issue) => [issue.field, issue.message])),
    };
  }

  return {
    status: "error",
    requestId: result.requestId,
    message: result.message,
  };
}
