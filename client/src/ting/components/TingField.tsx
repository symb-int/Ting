import React from 'react';
import { Input, SecretInput, cn } from '@librechat/client';
import type { InputProps, SecretInputProps } from '@librechat/client';

const inputClasses =
  'ting-input ting-control h-auto min-h-10 w-full rounded-[2px] border-border-medium bg-surface-primary px-3 py-2 text-sm leading-5 text-text-primary placeholder:text-text-tertiary aria-[invalid=true]:border-status-error focus:border-accent-primary focus-visible:border-accent-primary focus-visible:ring-0';

export type TingInputProps = InputProps;

export const TingInput = React.forwardRef<HTMLInputElement, TingInputProps>(
  ({ className, ...props }, ref) => (
    <Input ref={ref} className={cn(inputClasses, className)} {...props} />
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
  ({ className, error, hideSecretLabel, id, label, showSecretLabel, type, ...props }, ref) => {
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
        <label htmlFor={id} className="mb-[6px] text-sm font-bold leading-[1.45] text-text-primary">
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
          <TingInput ref={ref} type={type} {...fieldProps} />
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

export default TingField;
