/**
 * @file: generate-icons.js
 * @description: Скрипт для генерации иконок Chrome Extension
 * @dependencies: canvas
 * @created: 2025-10-15
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SIZES = [16, 48, 128];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Создаем директорию если не существует
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Создает иконку с замком
 */
function createLockIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Фон с градиентом
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#1e40af');
  ctx.fillStyle = gradient;
  
  // Скругленный прямоугольник
  const radius = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Рисуем замок
  const lockSize = size * 0.5;
  const lockX = (size - lockSize) / 2;
  const lockY = (size - lockSize) / 2;

  // Дужка замка
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.arc(
    lockX + lockSize / 2,
    lockY + lockSize * 0.35,
    lockSize * 0.25,
    Math.PI,
    0,
    true
  );
  ctx.stroke();

  // Тело замка
  ctx.fillStyle = 'white';
  ctx.fillRect(lockX, lockY + lockSize * 0.35, lockSize, lockSize * 0.5);
  
  // Скругленные углы тела замка
  const bodyRadius = size * 0.05;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  const bodyY = lockY + lockSize * 0.35;
  ctx.moveTo(lockX + bodyRadius, bodyY);
  ctx.lineTo(lockX + lockSize - bodyRadius, bodyY);
  ctx.quadraticCurveTo(lockX + lockSize, bodyY, lockX + lockSize, bodyY + bodyRadius);
  ctx.lineTo(lockX + lockSize, bodyY + lockSize * 0.5 - bodyRadius);
  ctx.quadraticCurveTo(
    lockX + lockSize,
    bodyY + lockSize * 0.5,
    lockX + lockSize - bodyRadius,
    bodyY + lockSize * 0.5
  );
  ctx.lineTo(lockX + bodyRadius, bodyY + lockSize * 0.5);
  ctx.quadraticCurveTo(lockX, bodyY + lockSize * 0.5, lockX, bodyY + lockSize * 0.5 - bodyRadius);
  ctx.lineTo(lockX, bodyY + bodyRadius);
  ctx.quadraticCurveTo(lockX, bodyY, lockX + bodyRadius, bodyY);
  ctx.closePath();
  ctx.fill();

  // Замочная скважина
  ctx.fillStyle = '#2563eb';
  const keyHoleX = lockX + lockSize / 2;
  const keyHoleY = lockY + lockSize * 0.55;
  ctx.beginPath();
  ctx.arc(keyHoleX, keyHoleY, lockSize * 0.08, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillRect(
    keyHoleX - lockSize * 0.03,
    keyHoleY,
    lockSize * 0.06,
    lockSize * 0.2
  );

  return canvas;
}

// Генерируем иконки
console.log('🎨 Generating icons...\n');

ICON_SIZES.forEach((size) => {
  const canvas = createLockIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Created ${filename} (${size}x${size})`);
});

console.log('\n🎉 All icons generated successfully!');
console.log(`📁 Location: ${OUTPUT_DIR}`);









