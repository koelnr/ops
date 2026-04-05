interface EmptyStateProps {
  message: string;
  description?: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border">
      <div className="px-4 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
