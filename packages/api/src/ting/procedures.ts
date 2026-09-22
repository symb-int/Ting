import { z } from 'zod';
import { logger, SystemCapabilities, TingProcedureError } from '@librechat/data-schemas';
import {
  tingConfigSchema,
  tingProcedureCreateSchema,
  tingProcedureUpdateSchema,
} from 'librechat-data-provider';
import type { AppConfig, TingProcedureMethods } from '@librechat/data-schemas';
import type { Request, Response } from 'express';
import type { HasCapabilityFn, CapabilityUser } from '~/middleware/capabilities';
import type { GetAppConfigOptions } from '~/app/service';

interface ProcedureRequest extends Request {
  user?: CapabilityUser & { _id?: { toString(): string } };
  config?: AppConfig;
}

interface ProcedureDependencies extends TingProcedureMethods {
  hasCapability: HasCapabilityFn;
  getAppConfig: (options: GetAppConfigOptions) => Promise<AppConfig>;
}

const idSchema = z.string().uuid();
const listQuerySchema = z.object({ cursor: z.string().min(1).max(1000).optional() }).strict();

function user(req: ProcedureRequest): CapabilityUser | null {
  const id = req.user?.id ?? req.user?._id?.toString();
  return id
    ? {
        id,
        role: req.user?.role ?? '',
        tenantId: req.user?.tenantId,
        idOnTheSource: req.user?.idOnTheSource ?? null,
      }
    : null;
}

function fail(res: Response, error: unknown): void {
  if (error instanceof z.ZodError) {
    res
      .status(422)
      .json({ message: 'Bitte prüfen Sie Ihre Eingaben.', errors: error.flatten().fieldErrors });
    return;
  }
  if (error instanceof TingProcedureError) {
    const status = { conflict: 409, not_found: 404, invalid_cursor: 422 }[error.code];
    res.status(status).json({ message: error.message });
    return;
  }
  logger.error('[ting/procedures] Request failed', {
    name: error instanceof Error ? error.name : 'Error',
  });
  res.status(500).json({
    message: 'Die Anfrage konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',
  });
}

type ProcedureHandler = (req: ProcedureRequest, res: Response) => Promise<void>;

export function createTingProcedureHandlers(deps: ProcedureDependencies): {
  capabilities: ProcedureHandler;
  catalog: ProcedureHandler;
  list: ProcedureHandler;
  get: ProcedureHandler;
  create: ProcedureHandler;
  update: ProcedureHandler;
} {
  const handle =
    (
      manage: boolean,
      operation: (req: ProcedureRequest, res: Response, actor: CapabilityUser) => Promise<void>,
    ) =>
    async (req: ProcedureRequest, res: Response): Promise<void> => {
      const actor = user(req);
      if (!actor) {
        res.status(401).json({ message: 'Bitte melden Sie sich an.' });
        return;
      }
      try {
        if (manage && !(await deps.hasCapability(actor, SystemCapabilities.MANAGE_PROCEDURES))) {
          res.status(403).json({ message: 'Sie haben keinen Zugriff auf die Werkstatt.' });
          return;
        }
        res.setHeader('Cache-Control', 'no-store');
        await operation(req, res, actor);
      } catch (error) {
        fail(res, error);
      }
    };

  return {
    capabilities: handle(false, async (_req, res, actor) => {
      res.json({
        manageProcedures: await deps.hasCapability(actor, SystemCapabilities.MANAGE_PROCEDURES),
      });
    }),
    catalog: handle(false, async (_req, res) => {
      res.json({ procedures: await deps.listPublishedTingProcedures() });
    }),
    list: handle(true, async (req, res, actor) => {
      const query = listQuerySchema.parse(req.query);
      const config =
        req.config ??
        (await deps.getAppConfig({
          userId: actor.id,
          role: actor.role,
          tenantId: actor.tenantId,
          idOnTheSource: actor.idOnTheSource,
          failClosed: true,
        }));
      const settings = tingConfigSchema.parse(config.ting ?? {});
      res.json(
        await deps.listTingProcedures({
          cursor: query.cursor,
          limit: settings.procedures.pageSize,
        }),
      );
    }),
    get: handle(true, async (req, res) => {
      const procedureId = idSchema.safeParse(req.params.procedureId);
      const procedure = procedureId.success ? await deps.getTingProcedure(procedureId.data) : null;
      if (!procedure) {
        res.status(404).json({ message: 'Das Verfahren wurde nicht gefunden.' });
        return;
      }
      res.json(procedure);
    }),
    create: handle(true, async (req, res, actor) => {
      const input = tingProcedureCreateSchema.parse(req.body);
      res.status(200).json(await deps.createTingProcedure(actor.id, input));
    }),
    update: handle(true, async (req, res, actor) => {
      const procedureId = idSchema.safeParse(req.params.procedureId);
      if (!procedureId.success) {
        res.status(404).json({ message: 'Das Verfahren wurde nicht gefunden.' });
        return;
      }
      const input = tingProcedureUpdateSchema.parse(req.body);
      res.json(await deps.updateTingProcedure(actor.id, procedureId.data, input));
    }),
  };
}
