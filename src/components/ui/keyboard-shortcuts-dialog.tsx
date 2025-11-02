/**
 * @file: keyboard-shortcuts-dialog.tsx
 * @description: Диалог для отображения справки по горячим клавишам
 * @dependencies: React, shadcn/ui dialog, KEYBOARD_SHORTCUTS
 * @created: 2025-10-17
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS } from '@/lib/utils';
import { Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title', { defaultValue: 'Keyboard Shortcuts' })}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description', { defaultValue: 'All available keyboard shortcuts for the editor' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {KEYBOARD_SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-muted rounded border border-border text-xs font-mono">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
