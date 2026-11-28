import { PageBackButton } from "./page-back-button";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  hasUnsavedChanges,
  confirmTitle,
  confirmMessage,
  backButton,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  hasUnsavedChanges?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  backButton?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        {backButton ? (
          <div>{backButton}</div>
        ) : backHref ? (
          <div>
            <PageBackButton
              href={backHref}
              label={backLabel}
              hasUnsavedChanges={hasUnsavedChanges}
              confirmTitle={confirmTitle}
              confirmMessage={confirmMessage}
            />
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-3xl text-sm leading-6">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}