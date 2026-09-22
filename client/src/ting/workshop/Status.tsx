import React from 'react';
import type { TingProcedureDto } from 'librechat-data-provider';
import TingBadge from '~/ting/components/TingBadge';
import { useLocalize } from '~/hooks';

export default function ProcedureStatus({ procedure }: { procedure?: TingProcedureDto }) {
  const localize = useLocalize();
  const published = procedure?.published;
  const changed =
    published &&
    (procedure.draft.title !== published.title ||
      procedure.draft.description !== published.description);
  let label = localize('com_ting_procedure_new');
  if (procedure) label = localize('com_ting_draft');
  if (published) label = localize(changed ? 'com_ting_draft_changes' : 'com_ting_published');
  return <TingBadge variant={published ? 'success' : 'neutral'}>{label}</TingBadge>;
}
