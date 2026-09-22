import React, { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useToastContext } from '@librechat/client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TingProcedureCreateInputSchema } from 'librechat-data-provider';
import type {
  TingProcedureDto,
  TingProcedureCreateInput,
  TingProcedureError,
} from 'librechat-data-provider';
import type { FormEvent } from 'react';
import { useTingProcedureMutations, useTingProcedureQuery } from '~/data-provider/Ting';
import { TingButton, TingEmptyState, TingField, TingStatus } from '~/ting/components';
import { TingTextareaField } from '~/ting/components/TingField';
import { WorkshopShell } from './Layout';
import ProcedureStatus from './Status';
import { useLocalize } from '~/hooks';

function ProcedureForm({ initial }: { initial?: TingProcedureDto }) {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { create, update } = useTingProcedureMutations();
  const [procedure, setProcedure] = useState(initial);
  const [values, setValues] = useState(initial?.draft ?? { title: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({});
  const [error, setError] = useState('');
  const pendingRequest = useRef<{ signature: string; requestId: string }>();
  const submitting = useRef(false);
  const pending = create.isLoading || update.isLoading;
  const dirty =
    values.title !== (procedure?.draft.title ?? '') ||
    values.description !== (procedure?.draft.description ?? '');
  let footer = localize('com_ting_draft_help');
  if (procedure?.published) {
    footer = localize('com_ting_published_edit_help', { version: procedure.published.version });
  }
  if (dirty) footer = localize('com_ting_unsaved_changes');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const intent =
      submitter instanceof HTMLButtonElement && submitter.value === 'publish' ? 'publish' : 'save';
    const signature = JSON.stringify({
      title: values.title.trim(),
      description: values.description.trim(),
      intent,
      expectedEditRevision: procedure?.editRevision,
    });
    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = {
        signature,
        requestId:
          !procedure && pendingRequest.current
            ? pendingRequest.current.requestId
            : crypto.randomUUID(),
      };
    }
    const parsed = TingProcedureCreateInputSchema.safeParse({
      ...values,
      intent,
      requestId: pendingRequest.current.requestId,
    });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const errors = {
        title: fields.title ? localize('com_ting_title_error') : undefined,
        description: fields.description
          ? localize(
              intent === 'publish'
                ? 'com_ting_description_publish_error'
                : 'com_ting_description_error',
            )
          : undefined,
      };
      setFieldErrors(errors);
      document.getElementById(errors.title ? 'procedure-title' : 'procedure-description')?.focus();
      return;
    }
    submitting.current = true;
    setFieldErrors({});
    setError('');
    try {
      const input: TingProcedureCreateInput = parsed.data;
      const saved = procedure
        ? await update.mutateAsync({
            procedureId: procedure.procedureId,
            input: { ...input, expectedEditRevision: procedure.editRevision },
          })
        : await create.mutateAsync(input);
      setProcedure(saved);
      setValues(saved.draft);
      pendingRequest.current = undefined;
      showToast({
        status: 'success',
        message: localize(
          intent === 'publish' ? 'com_ting_publish_success' : 'com_ting_save_success',
        ),
      });
      if (!procedure)
        navigate(`/werkstatt/verfahren/${encodeURIComponent(saved.procedureId)}`, {
          replace: true,
        });
    } catch (failure) {
      if (isAxiosError<TingProcedureError>(failure)) {
        const status = failure.response?.status;
        const fields = failure.response?.data?.errors;
        if (status === 422 && fields) {
          setFieldErrors({
            title: fields.title ? localize('com_ting_title_error') : undefined,
            description: fields.description
              ? localize(
                  intent === 'publish'
                    ? 'com_ting_description_publish_error'
                    : 'com_ting_description_error',
                )
              : undefined,
          });
        }
        let message = localize('com_ting_save_error');
        if (status === 409) message = localize('com_ting_save_conflict');
        if (status === 403) message = localize('com_ting_workshop_forbidden');
        setError(message);
      } else {
        setError(localize('com_ting_save_error'));
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <WorkshopShell
      title={procedure?.draft.title ?? localize('com_ting_procedure_create')}
      action={<ProcedureStatus procedure={procedure} />}
    >
      <form className="ting-workshop-form" onSubmit={submit} noValidate aria-busy={pending}>
        <div className="ting-workshop-form-fields">
          <TingField
            appearance="workshop"
            id="procedure-title"
            name="title"
            label={
              <>
                {localize('com_ting_title')} <span className="ting-workshop-required">*</span>
              </>
            }
            required
            maxLength={160}
            autoComplete="off"
            disabled={pending}
            value={values.title}
            error={fieldErrors.title}
            onChange={(event) => {
              setValues({ ...values, title: event.target.value });
              setFieldErrors({ ...fieldErrors, title: undefined });
            }}
          />
          <TingTextareaField
            appearance="workshop"
            id="procedure-description"
            name="description"
            label={
              <>
                {localize('com_ting_description')} <span className="ting-workshop-required">*</span>
              </>
            }
            rows={7}
            maxLength={12000}
            disabled={pending}
            value={values.description}
            error={fieldErrors.description}
            description={localize('com_ting_description_help')}
            onChange={(event) => {
              setValues({ ...values, description: event.target.value });
              setFieldErrors({ ...fieldErrors, description: undefined });
            }}
          />
        </div>
        {error && (
          <div className="ting-workshop-feedback">
            <TingStatus variant="error">{error}</TingStatus>
          </div>
        )}
        <div className="ting-workshop-form-footer">
          <p className="ting-workshop-help" role="status">
            {footer}
          </p>
          <div className="ting-workshop-actions">
            <TingButton
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => navigate('/werkstatt/verfahren')}
            >
              {localize('com_ui_cancel')}
            </TingButton>
            <TingButton
              type="submit"
              name="intent"
              value="save"
              variant="secondary"
              disabled={pending}
            >
              {localize('com_ting_save_draft')}
            </TingButton>
            <TingButton type="submit" name="intent" value="publish" disabled={pending}>
              {localize(procedure?.published ? 'com_ting_publish_changes' : 'com_ting_publish')}
            </TingButton>
          </div>
        </div>
      </form>
    </WorkshopShell>
  );
}

export function NewProcedure() {
  return <ProcedureForm />;
}

export default function ProcedureEditor() {
  const localize = useLocalize();
  const { procedureId = '' } = useParams();
  const query = useTingProcedureQuery(procedureId);
  if (query.isLoading)
    return (
      <WorkshopShell title={localize('com_ting_procedures')}>
        <p role="status">{localize('com_ting_workshop_loading')}</p>
      </WorkshopShell>
    );
  if (query.error?.response?.status === 404)
    return (
      <WorkshopShell title={localize('com_ting_procedure_not_found')}>
        <TingEmptyState
          title={localize('com_ting_procedure_unavailable')}
          action={
            <TingButton asChild variant="secondary">
              <Link to="/werkstatt/verfahren">{localize('com_ting_back_to_procedures')}</Link>
            </TingButton>
          }
        />
      </WorkshopShell>
    );
  if (query.isError || !query.data)
    return (
      <WorkshopShell title={localize('com_ting_procedures')}>
        <div className="ting-workshop-stack">
          <TingStatus variant="error">{localize('com_ting_procedures_load_error')}</TingStatus>
          <div>
            <TingButton variant="secondary" onClick={() => void query.refetch()}>
              {localize('com_ting_retry')}
            </TingButton>
          </div>
        </div>
      </WorkshopShell>
    );
  return <ProcedureForm key={procedureId} initial={query.data} />;
}
