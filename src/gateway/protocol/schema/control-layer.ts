import { Type } from "@sinclair/typebox";
import { NonEmptyString } from "./primitives.js";

export const ConfigValidateParamsSchema = Type.Object(
  {
    raw: NonEmptyString,
  },
  { additionalProperties: false },
);

export const ApprovalsListParamsSchema = Type.Object({}, { additionalProperties: false });

export const ApprovalsGetParamsSchema = Type.Object(
  {
    requestId: NonEmptyString,
  },
  { additionalProperties: false },
);

export const ApprovalsDecideParamsSchema = Type.Object(
  {
    requestId: NonEmptyString,
    decision: Type.Union([Type.Literal("approve"), Type.Literal("deny")]),
    reason: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const ApprovalsRevokeGrantParamsSchema = Type.Object(
  {
    grantId: NonEmptyString,
  },
  { additionalProperties: false },
);

export const AuditQueryParamsSchema = Type.Object(
  {
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 500 })),
    offset: Type.Optional(Type.Integer({ minimum: 0 })),
    kind: Type.Optional(NonEmptyString),
  },
  { additionalProperties: false },
);

export const AuditGetParamsSchema = Type.Object(
  {
    index: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
);

export const AuditExportParamsSchema = Type.Object({}, { additionalProperties: false });

export const AuditVerifyParamsSchema = Type.Object({}, { additionalProperties: false });

export const CapabilitiesListParamsSchema = Type.Object({}, { additionalProperties: false });

export const CapabilitiesGetParamsSchema = Type.Object(
  {
    toolName: NonEmptyString,
  },
  { additionalProperties: false },
);

export const CapabilitiesReloadParamsSchema = Type.Object({}, { additionalProperties: false });

export const RuntimeSnapshotParamsSchema = Type.Object({}, { additionalProperties: false });

export const RuntimeLogsTailParamsSchema = Type.Object(
  {
    cursor: Type.Optional(Type.Integer({ minimum: 0 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 5000 })),
    maxBytes: Type.Optional(Type.Integer({ minimum: 1, maximum: 1_000_000 })),
  },
  { additionalProperties: false },
);

export const RuntimeLogsStopParamsSchema = Type.Object({}, { additionalProperties: false });
