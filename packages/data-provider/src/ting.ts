import { z } from 'zod';

const identifier = z.string().min(1);
const text = z.string().trim().min(1);
const timestamp = z.string().datetime();

export const TingProcedureTextSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(12000),
  })
  .strict();

export const TingPublishedProcedureSchema = TingProcedureTextSchema.extend({
  description: z.string().trim().min(1).max(12000),
  revisionId: z.string().uuid(),
  version: z.number().int().positive(),
  publishedAt: timestamp,
  publishedBy: identifier,
}).strict();

export const TingProcedureDtoSchema = z
  .object({
    procedureId: z.string().uuid(),
    draft: TingProcedureTextSchema,
    published: TingPublishedProcedureSchema.nullable(),
    editRevision: z.number().int().nonnegative(),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: identifier,
    updatedBy: identifier,
  })
  .strict();

const mutationShape = {
  ...TingProcedureTextSchema.shape,
  intent: z.enum(['save', 'publish']),
  requestId: z.string().uuid(),
};

const validPublication = (value: { intent: string; description: string }) =>
  value.intent !== 'publish' || value.description.length > 0;
const publicationError = {
  message: 'A published procedure needs a description.',
  path: ['description'],
};

export const TingProcedureCreateInputSchema = z
  .object(mutationShape)
  .strict()
  .refine(validPublication, publicationError);
export const TingProcedureUpdateInputSchema = z
  .object({
    ...mutationShape,
    expectedEditRevision: z.number().int().nonnegative(),
  })
  .strict()
  .refine(validPublication, publicationError);

export const TingProcedureListSchema = z
  .object({
    items: z.array(TingProcedureDtoSchema),
    nextCursor: identifier.nullable(),
  })
  .strict();

export const ProcedureRefSchema = z
  .object({
    procedureId: z.string().uuid(),
    revisionId: z.string().uuid(),
  })
  .strict();

export const CatalogEntrySchema = ProcedureRefSchema.extend({
  version: z.number().int().positive(),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(12000),
}).strict();

export const TingCatalogSchema = z
  .object({
    snapshotId: z.string().regex(/^[a-f0-9]{64}$/),
    entries: z.array(CatalogEntrySchema),
  })
  .strict();

export const TingCatalogResponseSchema = z
  .object({
    procedures: z.array(CatalogEntrySchema),
  })
  .strict();

export const TingEvidenceSchema = z.object({ messageId: identifier, quote: text }).strict();
export const TingMatchMessageSchema = z
  .object({
    messageId: identifier,
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })
  .strict();

export const tingMatchRequestSchema = z
  .object({
    contractVersion: z.literal('ting.matcher.v1'),
    requestId: identifier,
    conversationId: identifier,
    parentMessageId: identifier.nullable(),
    currentMessageId: identifier,
    locale: identifier,
    messages: z.array(TingMatchMessageSchema),
    priorConcerns: z.array(
      z
        .object({
          id: identifier,
          summary: text,
          evidence: z.array(TingEvidenceSchema),
          procedure: ProcedureRefSchema.nullable(),
        })
        .strict(),
    ),
    catalog: TingCatalogSchema,
  })
  .strict();

export const TingMatcherProvenanceSchema = z
  .object({
    matcherId: identifier,
    implementationVersion: identifier,
    policyVersion: identifier,
    components: z
      .array(
        z
          .object({
            componentId: identifier,
            configuredModelId: identifier.nullable(),
            reportedModelId: identifier.nullable(),
            promptVersion: identifier.nullable(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const TingMatchConcernSchema = z
  .object({
    key: identifier,
    existingId: identifier.nullable(),
    summary: text,
    evidence: z.array(TingEvidenceSchema),
    assessment: z.enum(['matched', 'needs_information', 'unsupported']),
    candidates: z.array(
      z
        .object({
          procedure: ProcedureRefSchema,
          evidence: z.array(TingEvidenceSchema),
          scores: z.array(
            z
              .object({
                metricId: identifier,
                value: z.number().finite(),
                calibrationId: identifier.nullable(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    selected: ProcedureRefSchema.nullable(),
    missingInformation: z.array(text),
  })
  .strict();

/** Only this payload comes from the LLM; envelope and provenance are adapter-owned. */
export const TingLlmMatchPayloadSchema = z
  .object({
    concerns: z.array(TingMatchConcernSchema),
  })
  .strict();

export const TingMatcherErrorSchema = z
  .object({
    code: z.enum([
      'configuration',
      'unsupported_contract',
      'context_limit',
      'timeout',
      'unavailable',
      'invalid_output',
      'cancelled',
    ]),
    retryable: z.boolean(),
  })
  .strict();

const matchEnvelope = {
  contractVersion: z.literal('ting.matcher.v1'),
  requestId: identifier,
  catalogSnapshotId: identifier,
  provenance: TingMatcherProvenanceSchema,
};

export const tingMatchResultSchema = z.discriminatedUnion('status', [
  z
    .object({
      ...matchEnvelope,
      status: z.literal('ok'),
      concerns: z.array(TingMatchConcernSchema),
    })
    .strict(),
  z
    .object({ ...matchEnvelope, status: z.literal('error'), error: TingMatcherErrorSchema })
    .strict(),
]);

export const TingIntakeDecisionSchema = z
  .object({
    outcome: z.enum(['clarify', 'start', 'unsupported', 'multiple', 'continue', 'respond']),
    reply: text,
    concerns: z.array(
      z
        .object({
          key: identifier,
          existingId: identifier.nullable(),
          summary: text,
        })
        .strict(),
    ),
    focusKey: identifier.nullable(),
    focusEvidence: z.array(TingEvidenceSchema),
    candidate: z
      .object({
        ...ProcedureRefSchema.shape,
        evidence: z.array(TingEvidenceSchema),
        unresolvedQuestions: z.array(text),
      })
      .strict()
      .nullable(),
    quickReplies: z.array(z.object({ label: text, text }).strict()).max(3),
  })
  .strict();

export const TingIntakeStateSchema = z
  .object({
    concerns: z.array(
      z
        .object({
          id: identifier,
          summary: text,
          evidence: z.array(TingEvidenceSchema),
          assessment: z.enum(['needs_information', 'unsupported', 'matched', 'started']),
          procedure: CatalogEntrySchema.nullable(),
        })
        .strict(),
    ),
    focusConcernId: identifier.nullable(),
  })
  .strict();

export const TingReplyActionSchema = z
  .object({
    id: identifier,
    type: z.literal('reply'),
    label: text,
    text,
  })
  .strict();

export const tingActionSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('reply'),
      actionId: identifier,
      sourceMessageId: identifier,
      requestId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      type: z.literal('select_procedure'),
      ...ProcedureRefSchema.shape,
      requestId: z.string().uuid(),
    })
    .strict(),
]);

export const TingIntakeAuditSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('matcher'),
      result: tingMatchResultSchema,
      catalog: TingCatalogSchema,
      messageIds: z.array(identifier),
      chatPromptVersion: identifier,
      chatReportedModelId: identifier.nullable(),
    })
    .strict(),
  z
    .object({
      mode: z.literal('selection'),
      requestId: identifier,
      currentMessageId: identifier,
      procedure: CatalogEntrySchema,
    })
    .strict(),
]);

export const tingIntakeSchema = z
  .object({
    schemaVersion: z.literal('ting.intake.v1'),
    state: TingIntakeStateSchema,
    actions: z.array(TingReplyActionSchema).max(3),
    audit: TingIntakeAuditSchema,
    operation: z
      .object({
        requestId: z.string().uuid(),
        action: tingActionSchema,
        sourceParentMessageId: identifier.nullable(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type TingProcedureDto = z.infer<typeof TingProcedureDtoSchema>;
export type TingProcedureCreateInput = z.infer<typeof TingProcedureCreateInputSchema>;
export type TingProcedureUpdateInput = z.infer<typeof TingProcedureUpdateInputSchema>;
export type TingProcedureList = z.infer<typeof TingProcedureListSchema>;
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;
export type ProcedureRef = z.infer<typeof ProcedureRefSchema>;
export type TingCatalogEntry = CatalogEntry;
export type TingCatalogSnapshot = z.infer<typeof TingCatalogSchema>;
export type TingCatalogResponse = z.infer<typeof TingCatalogResponseSchema>;
export type TingEvidence = z.infer<typeof TingEvidenceSchema>;
export type TingMatchRequest = z.infer<typeof tingMatchRequestSchema>;
export type TingMatchResult = z.infer<typeof tingMatchResultSchema>;
export type TingMatchConcern = z.infer<typeof TingMatchConcernSchema>;
export type TingMatcherProvenance = z.infer<typeof TingMatcherProvenanceSchema>;
export type TingMatcherError = z.infer<typeof TingMatcherErrorSchema>;
export type TingIntakeDecision = z.infer<typeof TingIntakeDecisionSchema>;
export type TingIntakeState = z.infer<typeof TingIntakeStateSchema>;
export type TingIntake = z.infer<typeof tingIntakeSchema>;
export type TingAction = z.infer<typeof tingActionSchema>;
export type TingReplyAction = z.infer<typeof TingReplyActionSchema>;
export const tingProcedureSchema = TingProcedureDtoSchema;
export const tingProcedureCreateSchema = TingProcedureCreateInputSchema;
export const tingProcedureUpdateSchema = TingProcedureUpdateInputSchema;
export const tingCatalogEntrySchema = CatalogEntrySchema;
