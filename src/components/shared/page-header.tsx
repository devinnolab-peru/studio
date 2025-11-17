import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  tertiary?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, tertiary, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">{title}</h1>
            {tertiary && <div className="flex-shrink-0">{tertiary}</div>}
        </div>
        {description && <p className="mt-1 text-sm sm:text-base text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0 w-full sm:w-auto">{children}</div>}
    </div>
  );
}
