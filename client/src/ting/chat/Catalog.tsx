import { Spinner } from '@librechat/client';
import { useGetTingCatalogQuery } from '~/data-provider/Ting';
import { TingButton, TingStatus } from '../components';
import useTingActionSubmission from './useSubmission';
import { useLocalize } from '~/hooks';

export default function TingCatalog() {
  const localize = useLocalize();
  const catalog = useGetTingCatalogQuery();
  const { submit, pending, submissionError } = useTingActionSubmission();

  if (catalog.isLoading) {
    return (
      <div className="ting-intake-catalog" role="status" aria-label={localize('com_ui_loading')}>
        <Spinner className="mx-auto text-text-secondary" />
      </div>
    );
  }
  if (catalog.isError) {
    return (
      <div className="ting-intake-catalog">
        <TingStatus variant="error" role="alert">
          {localize('com_ting_catalog_error')}
        </TingStatus>
        <TingButton variant="secondary" onClick={() => catalog.refetch()}>
          {localize('com_ui_retry')}
        </TingButton>
      </div>
    );
  }
  if (!catalog.data?.procedures.length) {
    return null;
  }

  return (
    <section className="ting-intake-catalog" aria-labelledby="ting-catalog-title">
      <h2 id="ting-catalog-title">{localize('com_ting_available_procedures')}</h2>
      <div className="ting-intake-replies">
        {catalog.data.procedures.map((procedure) => (
          <TingButton
            key={procedure.procedureId}
            variant="secondary"
            disabled={pending}
            onClick={() =>
              submit(
                {
                  type: 'select_procedure',
                  procedureId: procedure.procedureId,
                  revisionId: procedure.revisionId,
                },
                procedure.title,
              )
            }
          >
            {procedure.title}
          </TingButton>
        ))}
      </div>
      {submissionError && (
        <TingStatus variant="error" role="alert">
          {localize('com_ting_action_error')}
        </TingStatus>
      )}
    </section>
  );
}
