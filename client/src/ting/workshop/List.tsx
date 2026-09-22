import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { TingButton, TingEmptyState, TingStatus } from '~/ting/components';
import { useTingProceduresQuery } from '~/data-provider/Ting';
import { WorkshopShell } from './Layout';
import ProcedureStatus from './Status';
import { useLocalize } from '~/hooks';

export default function ProcedureList() {
  const localize = useLocalize();
  const query = useTingProceduresQuery();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <WorkshopShell
      title={localize('com_ting_procedures')}
      action={
        <TingButton asChild>
          <Link to="/werkstatt/verfahren/neu">
            <Plus aria-hidden="true" strokeWidth={1.65} />
            {localize('com_ting_procedure_create')}
          </Link>
        </TingButton>
      }
    >
      <div className="ting-workshop-stack">
        {query.isLoading && <p role="status">{localize('com_ting_workshop_loading')}</p>}
        {query.isError && (
          <TingStatus variant="error">{localize('com_ting_procedures_load_error')}</TingStatus>
        )}
        {query.isError && (
          <div>
            <TingButton variant="secondary" onClick={() => void query.refetch()}>
              {localize('com_ting_retry')}
            </TingButton>
          </div>
        )}
        {query.isSuccess && !items.length && (
          <TingEmptyState
            title={localize('com_ting_procedures_empty')}
            description={localize('com_ting_procedures_empty_description')}
          />
        )}
        {items.map((procedure) => (
          <article className="ting-workshop-record" key={procedure.procedureId}>
            <div className="ting-workshop-record-title">
              <h2>{procedure.draft.title}</h2>
              <ProcedureStatus procedure={procedure} />
            </div>
            {procedure.draft.description && (
              <p className="ting-workshop-record-description">{procedure.draft.description}</p>
            )}
            <div className="ting-workshop-record-actions">
              <TingButton asChild variant="secondary">
                <Link to={`/werkstatt/verfahren/${encodeURIComponent(procedure.procedureId)}`}>
                  <Pencil aria-hidden="true" strokeWidth={1.65} />
                  {localize('com_ui_edit')}
                </Link>
              </TingButton>
              {procedure.published && (
                <span className="ting-workshop-record-meta">
                  {localize('com_ting_version_available', { version: procedure.published.version })}
                </span>
              )}
            </div>
          </article>
        ))}
        {query.hasNextPage && (
          <div>
            <TingButton
              variant="secondary"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {localize('com_ting_load_more')}
            </TingButton>
          </div>
        )}
      </div>
    </WorkshopShell>
  );
}
