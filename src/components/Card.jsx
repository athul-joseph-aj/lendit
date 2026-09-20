// src/components/Card.jsx
export default function Card({
  children,
  className = '',
  padding = 'p-6',
  hover = false,
  onClick,
}) {
  return (
    <div
      className={`${hover ? 'card-hover cursor-pointer' : 'card'} ${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
