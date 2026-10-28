import { useId, type ReactNode } from 'react'
import { ChevronDownIcon } from '../icons/AccountIcons'
import { cn } from '../../lib/cn'

const controlClass =
  'h-10 w-full rounded-[3px] border bg-transparent text-sm text-ktext outline-none placeholder:text-sm placeholder:font-normal placeholder:leading-[15px] placeholder:text-kplaceholder focus:border-kprimary'

type Density = 'flush' | 'field' | 'wallet'

function labelGap(density: Density) {
  if (density === 'field') return 'gap-2.5'
  if (density === 'wallet') return 'gap-0'
  return 'gap-0'
}

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex h-[29px] items-center gap-1 text-[15px] leading-[15px] font-normal text-ktext"
    >
      {children}
      {required ? (
        <span className="text-[22px] leading-[29px] font-normal text-krequired">*</span>
      ) : null}
    </label>
  )
}

export function FormField({
  label,
  name,
  required,
  placeholder,
  type = 'text',
  defaultValue,
  error,
  hideLabel = false,
  density = 'flush',
  className,
  inputClassName,
}: {
  label: string
  name: string
  required?: boolean
  placeholder?: string
  type?: string
  defaultValue?: string
  error?: string
  hideLabel?: boolean
  density?: Density
  className?: string
  inputClassName?: string
}) {
  const reactId = useId()
  const id = `${name}-${reactId}`
  const errorId = `${id}-error`
  const input = (
    <input
      id={hideLabel ? undefined : id}
      name={name}
      type={type}
      required={required}
      placeholder={placeholder}
      defaultValue={defaultValue}
      aria-label={hideLabel ? label : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cn(
        controlClass,
        'px-3',
        density === 'wallet' && '-mt-1',
        error ? 'border-krequired' : 'border-kborder',
        inputClassName,
      )}
    />
  )

  return (
    <div className={cn('flex min-w-0 flex-col', hideLabel && 'justify-end', labelGap(density), className)}>
      {hideLabel ? null : (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      )}
      {input}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-krequired">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function SelectField({
  label,
  name,
  required,
  placeholder,
  options,
  defaultValue = '',
  error,
  density = 'flush',
  className,
}: {
  label: string
  name: string
  required?: boolean
  placeholder: string
  options: string[]
  defaultValue?: string
  error?: string
  density?: Density
  className?: string
}) {
  const reactId = useId()
  const id = `${name}-${reactId}`
  const errorId = `${id}-error`

  return (
    <div className={cn('flex min-w-0 flex-col', labelGap(density), className)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <span className={cn('relative block', density === 'wallet' && '-mt-1')}>
        <select
          id={id}
          name={name}
          required={required}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            controlClass,
            'appearance-none bg-none pr-8 pl-3',
            error ? 'border-krequired' : 'border-kborder',
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-kplaceholder"
        />
      </span>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-krequired">
          {error}
        </p>
      ) : null}
    </div>
  )
}
