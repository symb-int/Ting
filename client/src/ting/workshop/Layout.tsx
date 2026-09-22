import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Blocks, KeyRound, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useGetTingCapabilitiesQuery } from '~/data-provider/Ting';
import { TingButton, TingStatus } from '~/ting/components';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import '../styles/workshop.css';

export function WorkshopShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const localize = useLocalize();
  return (
    <div className="ting-workshop">
      <aside
        className="ting-workshop-sidebar"
        aria-label={localize('com_ting_workshop_navigation')}
      >
        <Link className="ting-workshop-brand ting-link" to="/werkstatt/verfahren">
          {localize('com_ting_name')} <span>{localize('com_ting_workshop')}</span>
        </Link>
        <p className="ting-workshop-area">{localize('com_ting_procedure_management')}</p>
        <nav className="ting-workshop-nav">
          <Link className="ting-link" to="/werkstatt/verfahren" aria-current="page">
            <Blocks aria-hidden="true" strokeWidth={1.65} />
            {localize('com_ting_procedures')}
          </Link>
        </nav>
        <div className="ting-workshop-sidebar-foot">
          <span className="ting-workshop-access">
            <KeyRound aria-hidden="true" strokeWidth={1.65} />
            {localize('com_ting_developer_access')}
          </span>
          <Link className="ting-link" to="/c/new">
            <ArrowUpRight aria-hidden="true" strokeWidth={1.65} />
            {localize('com_ting_citizen_view')}
          </Link>
        </div>
      </aside>
      <main className="ting-workshop-main" id="main" tabIndex={-1}>
        <header className="ting-workshop-header">
          <div>
            <div className="ting-workshop-breadcrumb">
              <Link className="ting-link" to="/werkstatt/verfahren">
                {localize('com_ting_workshop')}
              </Link>
              <span aria-hidden="true">/</span>
              <span>{localize('com_ting_procedures')}</span>
            </div>
            <h1>{title}</h1>
          </div>
          <div className="ting-workshop-header-actions">{action}</div>
        </header>
        <div className="ting-workshop-scroll">
          <div className="ting-workshop-content">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default function WorkshopRoute() {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();
  const access = useGetTingCapabilitiesQuery();
  if (!isAuthenticated) {
    return null;
  }
  if (access.isLoading) {
    return (
      <WorkshopShell title={localize('com_ting_procedures')}>
        <p role="status">{localize('com_ting_workshop_loading')}</p>
      </WorkshopShell>
    );
  }
  if (access.isError && !access.data) {
    return (
      <WorkshopShell title={localize('com_ting_procedures')}>
        <div className="ting-workshop-stack">
          <TingStatus variant="error">{localize('com_ting_workshop_access_error')}</TingStatus>
          <div>
            <TingButton variant="secondary" onClick={() => void access.refetch()}>
              {localize('com_ting_retry')}
            </TingButton>
          </div>
        </div>
      </WorkshopShell>
    );
  }
  if (!access.data?.manageProcedures) {
    return (
      <WorkshopShell title={localize('com_ting_procedures')}>
        <TingStatus variant="error">{localize('com_ting_workshop_forbidden')}</TingStatus>
      </WorkshopShell>
    );
  }
  return <Outlet />;
}
