#!/usr/bin/env node

import 'dotenv/config';
import mongoose from 'mongoose';
import { parseArgs } from 'node:util';
import { PrincipalType } from 'librechat-data-provider';
import {
  createModels,
  createMethods,
  tenantStorage,
  runAsSystem,
  SystemCapabilities,
} from '@librechat/data-schemas';

const { values, positionals } = parseArgs({
  options: { 'user-id': { type: 'string' } },
  allowPositionals: true,
  strict: true,
});
const [action] = positionals;

try {
  if (
    positionals.length !== 1 ||
    !['grant', 'revoke'].includes(action) ||
    !mongoose.isObjectIdOrHexString(values['user-id'])
  ) {
    throw new Error(
      'Aufruf: node scripts/ting/procedures-access.mjs grant|revoke --user-id <bestehende Konto-ID>',
    );
  }
  if (!process.env.MONGO_URI) {
    throw new Error(
      'MONGO_URI fehlt. Den Befehl mit der Datenbankkonfiguration der Installation ausführen.',
    );
  }
  await mongoose.connect(process.env.MONGO_URI);
  const { User, SystemGrant } = createModels(mongoose);
  await SystemGrant.init();
  const methods = createMethods(mongoose);
  const account = await runAsSystem(async () =>
    User.findById(values['user-id']).select('_id tenantId role').lean(),
  );
  if (!account) {
    throw new Error('Das angegebene Konto existiert nicht.');
  }
  await tenantStorage.run(
    { tenantId: account.tenantId, userId: account._id.toString() },
    async () => {
      const target = {
        principalType: PrincipalType.USER,
        principalId: account._id.toString(),
        capability: SystemCapabilities.MANAGE_PROCEDURES,
        tenantId: account.tenantId,
      };
      if (action === 'grant') {
        const result = await methods.grantCapability(target);
        console.log(
          result.created
            ? 'Werkstattberechtigung erteilt.'
            : 'Werkstattberechtigung bereits vorhanden.',
        );
        return;
      }
      const result = await methods.revokeCapability(target);
      console.log(
        result.deletedCount
          ? 'Direkte Werkstattberechtigung entzogen.'
          : 'Keine direkte Werkstattberechtigung vorhanden.',
      );
      const principals = await methods.getUserPrincipals({
        userId: account._id,
        role: account.role,
        idOnTheSource: null,
      });
      if (
        await methods.hasCapabilityForPrincipals({
          principals,
          capability: target.capability,
          tenantId: account.tenantId,
        })
      ) {
        console.log(
          'Das Konto erhält die Werkstattberechtigung weiterhin über seine Rolle oder Gruppe.',
        );
      }
    },
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Die Berechtigung konnte nicht geändert werden.',
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
