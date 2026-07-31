import "server-only";

export {
  createInquiryService,
  DEFAULT_INQUIRY_FALLBACK,
  submitAvailabilityRequest,
  type CreateInquiryServiceOptions,
  type InquiryFallbackContact,
  type InquiryService,
  type PublicInquirySubmissionResult,
} from "./service";

export {
  createResendInquiryDelivery,
  type InquiryDeliveryAdapter,
  type InquiryDeliveryResult,
} from "./delivery";

export {
  createSupabaseInquiryPersistence,
  type InquiryPersistenceAdapter,
  type InquiryPersistenceResult,
} from "./supabase";

export {
  databaseErrorCode,
  isMissingSchemaError,
  isPermissionDeniedError,
} from "./errors";

export type {
  AvailabilityRequest,
  AvailabilityRequestField,
  AvailabilityRequestInput,
  AvailabilityValidationIssue,
} from "./contract";
