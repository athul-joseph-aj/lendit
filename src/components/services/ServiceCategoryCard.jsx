// src/components/services/ServiceCategoryCard.jsx
// Clickable category card used on the Services home page.

import { Link } from 'react-router-dom';

/**
 * @param {string}   emoji    - display emoji
 * @param {string}   label    - translated category label
 * @param {string}   slug     - URL slug, e.g. 'electrician'
 * @param {boolean}  active   - whether this category is currently selected
 * @param {function} onClick  - optional click handler (for search-page inline use)
 */
export default function ServiceCategoryCard({ emoji, label, slug, active = false, onClick }) {
  const inner = (
    <div
      className={`
        flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border
        transition-all duration-200 cursor-pointer select-none h-full
        ${active
          ? 'bg-primary border-primary shadow-sm'
          : 'bg-white border-gray-200 hover:border-primary/40 hover:bg-primary-50 hover:shadow-sm'
        }
      `}
    >
      <span className="text-3xl leading-none">{emoji}</span>
      <span
        className={`text-xs font-semibold text-center leading-tight ${
          active ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="block h-full w-full text-left">
        {inner}
      </button>
    );
  }

  return (
    <Link to={`/services/${slug}`} className="block h-full">
      {inner}
    </Link>
  );
}
