/**
 * @file: ColorPicker.tsx
 * @description: Компонент для выбора цвета заметки
 * @dependencies: React, shadcn/ui components
 * @created: 2025-10-15
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  children: React.ReactNode;
}

const noteColors = [
  { name: 'По умолчанию', value: 'default', class: 'bg-background border-border' },
  { name: 'Синий', value: 'blue', class: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' },
  { name: 'Зеленый', value: 'green', class: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' },
  { name: 'Желтый', value: 'yellow', class: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' },
  { name: 'Красный', value: 'red', class: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' },
  { name: 'Фиолетовый', value: 'purple', class: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  children,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="p-3">
          <div className="text-sm font-medium mb-3">Выберите цвет</div>
          <div className="flex gap-1.5">
            {noteColors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-1 focus:ring-ring ${
                  currentColor === color.value
                    ? 'border-foreground ring-1 ring-ring'
                    : 'border-muted-foreground/30'
                } ${color.class}`}
                onClick={() => onColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
