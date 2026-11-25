export function Icon({ id, className = '' }: { id: string; className?: string }) {
  return (
    <svg className={`ic ${className}`} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  )
}
