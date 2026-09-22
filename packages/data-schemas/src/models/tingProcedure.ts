import type { Model } from 'mongoose';
import type { TingProcedureRecord } from '~/schema/tingProcedure';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import tingProcedureSchema from '~/schema/tingProcedure';

export function createTingProcedureModel(
  mongoose: typeof import('mongoose'),
): Model<TingProcedureRecord> {
  applyTenantIsolation(tingProcedureSchema);
  return (
    mongoose.models.TingProcedure ||
    mongoose.model<TingProcedureRecord>('TingProcedure', tingProcedureSchema)
  );
}
