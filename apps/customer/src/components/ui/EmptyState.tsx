interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span style={{ fontSize: '40px', lineHeight: 1 }} className="mb-4 opacity-70">{icon}</span>
      <p className="font-semibold text-white mb-1">{title}</p>
      {description && <p className="text-sm mt-0.5 mb-4" style={{ color: '#475569' }}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
