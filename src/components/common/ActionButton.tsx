import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActionButtonType = 'view' | 'edit' | 'delete';

export interface ActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type: ActionButtonType;
  iconClassName?: string;
}

const actionStyles: Record<ActionButtonType, { button: string; icon: React.ComponentType<{ className?: string }>; defaultTitle: string }> = {
  view: {
    button: 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus-visible:ring-blue-500',
    icon: Eye,
    defaultTitle: 'ดูรายละเอียด',
  },
  edit: {
    button: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 focus-visible:ring-amber-500',
    icon: Edit3,
    defaultTitle: 'แก้ไขข้อมูล',
  },
  delete: {
    button: 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 focus-visible:ring-red-500',
    icon: Trash2,
    defaultTitle: 'ลบข้อมูล',
  },
};

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ type, className, iconClassName, title, ...props }, ref) => {
    const styleConfig = actionStyles[type];
    const Icon = styleConfig.icon;

    return (
      <button
        ref={ref}
        type="button"
        title={title || styleConfig.defaultTitle}
        aria-label={title || styleConfig.defaultTitle}
        className={cn(
          'inline-flex items-center justify-center rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          styleConfig.button,
          className
        )}
        {...props}
      >
        <Icon className={cn('h-4 w-4', iconClassName)} />
      </button>
    );
  }
);

ActionButton.displayName = 'ActionButton';
