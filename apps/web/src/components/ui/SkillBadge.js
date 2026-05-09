export default function SkillBadge({ name, icon }) {
  return (
    <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border-subtle hover:border-primary/40 hover:bg-surface-elevated transition-all duration-300">
      {icon && (
        <img
          src={icon}
          alt={name}
          className="w-4 h-4 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
        />
      )}
      <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
        {name}
      </span>
    </div>
  );
}
