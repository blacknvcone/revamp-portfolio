export default function GradientBlur({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-20 ${className}`}
      style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(6,182,212,0.2) 100%)',
      }}
    />
  );
}
