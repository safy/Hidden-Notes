/**
 * @file: settings-dialog.tsx
 * @description: Выдвижная панель настроек (Sheet) с выбором языка интерфейса
 * @dependencies: shadcn/ui sheet, i18next, chrome.storage.local
 * @created: 2025-10-30
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenShortcuts?: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  theme = 'light',
  onToggleTheme,
  onOpenShortcuts,
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language?.startsWith('ru') ? 'ru' : 'en';

  const handleLanguageChange = async (lang: string) => {
    if ((lang === 'ru' || lang === 'en') && lang !== currentLanguage) {
      await i18n.changeLanguage(lang);
      try {
        await chrome.storage.local.set({ language: lang });
        // Принудительно обновляем все компоненты через событие storage
        window.dispatchEvent(new Event('storage'));
      } catch (error) {
        console.error('Error saving language to storage:', error);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:max-w-[340px] p-4">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-base">{t('settings.title', { defaultValue: 'Settings' })}</SheetTitle>
          <SheetDescription className="text-xs">
            {t('settings.languageDescription', { defaultValue: 'Choose interface language' })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-3">
          {/* Интерфейс */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('settings.interface', { defaultValue: 'Interface' })}
            </Label>
            <div className="flex items-center justify-between rounded-md border border-border p-2.5">
              <div className="flex items-center gap-2 text-sm">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{t('settings.theme', { defaultValue: 'Theme' })}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onToggleTheme?.()}>
                {theme === 'dark' ? t('settings.light', { defaultValue: 'Светлая' }) : t('settings.dark', { defaultValue: 'Темная' })}
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-2.5">
              <div className="flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>{t('settings.shortcuts', { defaultValue: 'Keyboard shortcuts' })}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenShortcuts?.()}>
                {t('settings.open', { defaultValue: 'Open' })}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Язык */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('settings.language', { defaultValue: 'Language' })}
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="justify-between w-full">
                  {currentLanguage === 'ru' ? '🇷🇺 Russian' : '🇬🇧 English'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={() => handleLanguageChange('ru')}>
                  🇷🇺 Russian
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          {/* О приложении */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('settings.about', { defaultValue: 'About' })}
            </Label>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                <span className="font-medium text-foreground">{t('settings.version', { defaultValue: 'Version' })}:</span> 1.0.0
              </div>
              <div>
                <span className="font-medium text-foreground">{t('app.title', { defaultValue: 'Hidden Notes' })}</span> — {t('app.slogan', { defaultValue: 'Secure notes' })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2" />
      </SheetContent>
    </Sheet>
  );
};
