import { Schema } from 'mongoose';
import type { TingProcedureDto } from 'librechat-data-provider';

export interface TingProcedureRecord
  extends Omit<TingProcedureDto, 'published' | 'createdAt' | 'updatedAt'> {
  published:
    | (Omit<NonNullable<TingProcedureDto['published']>, 'publishedAt'> & { publishedAt: Date })
    | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
  createRequestId: string;
  createPayloadHash: string;
  lastMutation: {
    actorId: string;
    requestId: string;
    payloadHash: string;
    resultingEditRevision: number;
  } | null;
}

const textFields = {
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 12000 },
};

const tingProcedureSchema: Schema<TingProcedureRecord> = new Schema<TingProcedureRecord>(
  {
    procedureId: { type: String, required: true },
    draft: { type: new Schema(textFields, { _id: false }), required: true },
    published: {
      type: new Schema(
        {
          ...textFields,
          description: { ...textFields.description, required: true, minlength: 1 },
          revisionId: { type: String, required: true },
          version: { type: Number, required: true, min: 1 },
          publishedAt: { type: Date, required: true },
          publishedBy: { type: String, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    editRevision: { type: Number, required: true, min: 1 },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    createRequestId: { type: String, required: true },
    createPayloadHash: { type: String, required: true },
    lastMutation: {
      type: new Schema(
        {
          actorId: { type: String, required: true },
          requestId: { type: String, required: true },
          payloadHash: { type: String, required: true },
          resultingEditRevision: { type: Number, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    tenantId: { type: String },
  },
  { timestamps: true, strict: 'throw' },
);

tingProcedureSchema.index({ tenantId: 1, procedureId: 1 }, { unique: true });
tingProcedureSchema.index({ tenantId: 1, createdBy: 1, createRequestId: 1 }, { unique: true });
tingProcedureSchema.index({ tenantId: 1, updatedAt: -1, procedureId: 1 });

export default tingProcedureSchema;
