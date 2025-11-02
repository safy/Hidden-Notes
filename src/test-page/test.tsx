/**
 * @file: test.tsx
 * @description: Тестовая страница для отладки Table Cell Menu
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { TiptapEditor } from '../components/TiptapEditor/TiptapEditor';
import '../styles/globals.css';

const TestApp = () => {
  const [editor, setEditor] = React.useState<any>(null);

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      console.log('✅ Таблица 3x3 вставлена через Tiptap команду!');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Table Cell Menu</h1>
      <p>Создайте таблицу и кликните на ячейку. Должна появиться фиолетовая рамка и круглая кнопка справа.</p>
      <button 
        onClick={insertTable}
        style={{ 
          marginBottom: '10px', 
          padding: '8px 16px', 
          background: '#9333ea', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Вставить таблицу 3x3
      </button>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <TiptapEditor 
          content="<p>Нажмите кнопку выше для вставки таблицы</p>"
          onUpdate={(html) => console.log('Content updated:', html)}
          onEditorReady={(ed) => setEditor(ed)}
        />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('test-root')!).render(<TestApp />);

