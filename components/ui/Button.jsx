import styles from '@/styles/components/Button.module.css'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className,
      ].join(' ')}
    >
      {loading && (
        <span
          className={
            variant === 'secondary' || variant === 'ghost'
              ? styles.spinnerDark
              : styles.spinner
          }
        />
      )}
      {children}
    </button>
  )
}