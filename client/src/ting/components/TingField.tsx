import React from 'react';
import { Input, SecretInput, Textarea, cn } from '@librechat/client';
import type { InputProps, SecretInputProps } from '@librechat/client';

const inputClasses =
  'ting-input ting-control h-auto min-h-10 w-full rounded-[2px] border-border-medium bg-surface-primary px-3 py-2 text-sm leading-5 text-text-primary placeholder:text-text-tertiary aria-[invalid=true]:border-status-error focus:border-accent-primary focus-visible:border-accent-primary focus-visible:ring-0';

export interface TingInputProps extends InputProps {
  appearance?: 'default' | 'workshop';
}

const workshopClasses = 'min-h-[38px] rounded-[5px]';

export const TingInput = React.forwardRef<HTMLInputElement, TingInputProps>(
  ({ appearance = 'default', className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(inputClasses, appearance === 'workshop' && workshopClasses, className)}
      {...props}
    />
  ),
);

TingInput.displayName = 'TingInput';

export interface TingSecretInputProps extends SecretInputProps {
  hideLabel: string;
  showLabel: string;
}

export const TingSecretInput = React.forwardRef<HTMLInputElement, TingSecretInputProps>(
  ({ buttonClassName, className, controlsClassName, ...props }, ref) => (
    <SecretInput
      ref={ref}
      className={cn(inputClasses, 'pr-12', className)}
      controlsClassName={cn('right-[6px]', controlsClassName)}
      buttonClassName={cn(
        'ting-secret-button ting-control size-[30px] rounded-[5px] border-0 bg-transparent p-[6px] text-text-secondary hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-0 [&_svg]:size-[18px]',
        buttonClassName,
      )}
      {...props}
    />
  ),
);

TingSecretInput.displayName = 'TingSecretInput';

interface TingFieldBaseProps {
  error?: React.ReactNode;
  hideSecretLabel?: string;
  label: React.ReactNode;
  showSecretLabel?: string;
}

export interface TingFieldProps
  extends Omit<TingInputProps, 'aria-describedby' | 'aria-invalid' | 'id' | 'onCopy'>,
    TingFieldBaseProps {
  id: string;
}

const TingField = React.forwardRef<HTMLInputElement, TingFieldProps>(
  (
    {
      appearance = 'default',
      className,
      error,
      hideSecretLabel,
      id,
      label,
      showSecretLabel,
      type,
      ...props
    },
    ref,
  ) => {
    const errorId = `${id}-error`;
    const fieldProps = {
      ...props,
      'aria-describedby': error == null ? undefined : errorId,
      'aria-invalid': error == null ? undefined : true,
      className,
      id,
    };

    return (
      <div className="ting-field flex flex-col">
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-bold leading-[1.45] text-text-primary',
            appearance === 'workshop' ? 'mb-3' : 'mb-[6px]',
          )}
        >
          {label}
        </label>
        {type === 'password' ? (
          <TingSecretInput
            ref={ref}
            hideLabel={hideSecretLabel ?? String(label)}
            showLabel={showSecretLabel ?? String(label)}
            {...fieldProps}
          />
        ) : (
          <TingInput ref={ref} type={type} appearance={appearance} {...fieldProps} />
        )}
        {error != null && (
          <span id={errorId} role="alert" className="mt-1 text-sm leading-[1.45] text-status-error">
            {error}
          </span>
        )}
      </div>
    );
  },
);

TingField.displayName = 'TingField';

export interface TingTextareaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  appearance?: 'default' | 'workshop';
}

export const TingTextareaField = React.forwardRef<HTMLTextAreaElement, TingTextareaFieldProps>(
  ({ appearance = 'default', className, description, error, id, label, ...props }, ref) => (
    <div className="ting-field flex min-w-0 flex-col">
      <label
        htmlFor={id}
        className={cn(
          'text-sm font-bold leading-[1.45] text-text-primary',
          appearance === 'workshop' ? 'mb-3' : 'mb-[6px]',
        )}
      >
        {label}
      </label>
      <Textarea
        ref={ref}
        id={id}
        className={cn(
          inputClasses,
          appearance === 'workshop' && [workshopClasses, 'leading-[1.5]'],
          'min-h-20 resize-y',
          className,
        )}
        aria-describedby={
          [description != null ? `${id}-help` : '', error != null ? `${id}-error` : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={error != null || undefined}
        {...props}
      />
      {description != null && (
        <p
          id={`${id}-help`}
          className={cn(
            'text-[13px] leading-[1.45] text-text-secondary',
            appearance === 'workshop' ? 'mt-3' : 'mt-[6px]',
          )}
        >
          {description}
        </p>
      )}
      {error != null && (
        <span
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-sm leading-[1.45] text-status-error"
        >
          {error}
        </span>
      )}
    </div>
  ),
);

TingTextareaField.displayName = 'TingTextareaField';

export default TingField;
