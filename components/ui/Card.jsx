import styles from '@/styles/components/Card.module.css'

const paddingMap = {
  none: styles.noPadding,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
}

export default function Card({
  children,
  padding = 'md',
  hover = false,
  onClick,
  selected = false,
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      className={[
        styles.card,
        paddingMap[padding],
        hover ? styles.hover : '',
        onClick ? styles.clickable : '',
        selected ? styles.selected : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}