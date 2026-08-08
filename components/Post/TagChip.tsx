import { FC } from 'react';

type Variant = 'filter' | 'inline';

type Props = {
  label: string;
  variant?: Variant;
  active?: boolean;
  onClick?: () => void;
};

const base =
  'inline-flex items-center font-body text-[11px] uppercase tracking-widest ' +
  'px-2.5 py-1 rounded-pill border transition-colors duration-200 ' +
  'leading-none';

const TagChip: FC<Props> = ({ label, variant = 'inline', active = false, onClick }) => {
  if (variant === 'filter') {
    const stateClasses = active
      ? 'bg-ink text-on-primary border-ink dark:bg-on-dark dark:text-ink dark:border-on-dark'
      : 'border-hairline text-muted hover:text-primary hover:border-primary ' +
        'dark:border-surface-dark-elevated dark:text-muted-soft dark:hover:text-primary dark:hover:border-primary';

    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${base} ${stateClasses}`}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={
        `${base} border-hairline text-muted bg-canvas ` +
        `dark:border-surface-dark-elevated dark:text-muted-soft dark:bg-surface-dark-soft`
      }
    >
      {label}
    </span>
  );
};

export default TagChip;
