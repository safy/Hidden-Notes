/**
 * @file: SortDialog.tsx
 * @description: Диалог для выбора параметров сортировки папок и заметок
 * @created: 2025-11-26
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUpAZ,
  ArrowDownAZ,
  Calendar,
  CalendarClock,
  FolderOpen,
  FileText,
} from 'lucide-react';

export type SortField = 'name' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';
export type SortTarget = 'folders' | 'notes' | 'both';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
  target: SortTarget;
}

interface SortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSort: (options: SortOptions) => void;
  currentOptions?: SortOptions;
}

export const SortDialog: React.FC<SortDialogProps> = ({
  open,
  onOpenChange,
  onSort,
  currentOptions = {
    field: 'updatedAt',
    order: 'desc',
    target: 'both',
  },
}) => {
  const { t } = useTranslation();
  const [field, setField] = React.useState<SortField>(currentOptions.field);
  const [order, setOrder] = React.useState<SortOrder>(currentOptions.order);
  const [target, setTarget] = React.useState<SortTarget>(currentOptions.target);

  const handleApply = () => {
    onSort({ field, order, target });
    onOpenChange(false);
  };

  const handleReset = () => {
    setField('updatedAt');
    setOrder('desc');
    setTarget('both');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('sort.title', { defaultValue: 'Sort' })}</DialogTitle>
          <DialogDescription>
            {t('sort.description', { defaultValue: 'Choose how to sort folders and notes' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Что сортировать */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('sort.target', { defaultValue: 'What to sort' })}
            </Label>
            <RadioGroup value={target} onValueChange={(v: string) => setTarget(v as SortTarget)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="target-both" />
                <Label htmlFor="target-both" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FolderOpen className="h-4 w-4" />
                  <FileText className="h-4 w-4" />
                  {t('sort.both', { defaultValue: 'Folders and Notes' })}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="folders" id="target-folders" />
                <Label htmlFor="target-folders" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FolderOpen className="h-4 w-4" />
                  {t('sort.foldersOnly', { defaultValue: 'Folders only' })}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="notes" id="target-notes" />
                <Label htmlFor="target-notes" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileText className="h-4 w-4" />
                  {t('sort.notesOnly', { defaultValue: 'Notes only' })}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* По какому полю */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('sort.field', { defaultValue: 'Sort by' })}
            </Label>
            <RadioGroup value={field} onValueChange={(v: string) => setField(v as SortField)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name" id="field-name" />
                <Label htmlFor="field-name" className="flex items-center gap-2 cursor-pointer font-normal">
                  <ArrowUpAZ className="h-4 w-4" />
                  {t('sort.byName', { defaultValue: 'Name' })}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="createdAt" id="field-created" />
                <Label htmlFor="field-created" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Calendar className="h-4 w-4" />
                  {t('sort.byCreated', { defaultValue: 'Date created' })}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="updatedAt" id="field-updated" />
                <Label htmlFor="field-updated" className="flex items-center gap-2 cursor-pointer font-normal">
                  <CalendarClock className="h-4 w-4" />
                  {t('sort.byUpdated', { defaultValue: 'Date modified' })}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Порядок */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('sort.order', { defaultValue: 'Order' })}
            </Label>
            <RadioGroup value={order} onValueChange={(v: string) => setOrder(v as SortOrder)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asc" id="order-asc" />
                <Label htmlFor="order-asc" className="flex items-center gap-2 cursor-pointer font-normal">
                  <ArrowUpAZ className="h-4 w-4" />
                  {field === 'name'
                    ? t('sort.ascending', { defaultValue: 'A → Z' })
                    : t('sort.oldestFirst', { defaultValue: 'Oldest first' })}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="desc" id="order-desc" />
                <Label htmlFor="order-desc" className="flex items-center gap-2 cursor-pointer font-normal">
                  <ArrowDownAZ className="h-4 w-4" />
                  {field === 'name'
                    ? t('sort.descending', { defaultValue: 'Z → A' })
                    : t('sort.newestFirst', { defaultValue: 'Newest first' })}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleReset}>
            {t('sort.reset', { defaultValue: 'Reset' })}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleApply}>
              {t('sort.apply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
