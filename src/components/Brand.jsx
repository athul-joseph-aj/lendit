export default function Brand({ className = '', iconClassName = 'w-8 h-8', textClassName = 'text-xl' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <img
        src="/lendit-mark.png"
        alt=""
        aria-hidden="true"
        className={`${iconClassName} object-contain`}
      />
      <span className={textClassName}>
        <span className="text-[#14284a]">lend</span>
        <span className="text-[#2777eb]">it</span>
      </span>
    </span>
  );
}
