/**
 * @file: devtools-helpers.ts
 * @description: Утилиты для тестирования и отладки через Chrome DevTools
 * @created: 2025-10-19
 */

/**
 * Получить все заметки из Chrome Storage
 * Используйте в Console: await window.__devtools.getAllNotes()
 */
export const getAllNotes = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(['notes'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result.notes || []);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Добавить тестовую заметку
 * Используйте в Console: await window.__devtools.addTestNote('Название')
 */
export const addTestNote = (title: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(['notes'], (result) => {
        const notes = result.notes || [];
        const newNote = {
          id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: title || `Test Note ${new Date().toLocaleString()}`,
          content: `<p>Test content created at ${new Date().toLocaleTimeString()}</p>`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        notes.push(newNote);
        chrome.storage.local.set({ notes }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            console.log(`✅ Test note added: ${newNote.id}`);
            resolve();
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Очистить все заметки
 * Используйте в Console: await window.__devtools.clearAllNotes()
 */
export const clearAllNotes = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ notes: [] }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('✅ All notes cleared');
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Получить информацию об использовании Storage
 * Используйте в Console: await window.__devtools.getStorageInfo()
 */
export const getStorageInfo = (): Promise<{
  bytesUsed: number;
  percentUsed: number;
  quota: number;
  formattedSize: string;
}> => {
  return new Promise((resolve, reject) => {
    try {
      const QUOTA_BYTES = 10 * 1024 * 1024; // 10MB

      chrome.storage.local.getBytesInUse(null, (bytesUsed) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          const percentUsed = (bytesUsed / QUOTA_BYTES) * 100;
          const formattedSize = `${(bytesUsed / 1024).toFixed(2)} KB`;

          resolve({
            bytesUsed,
            percentUsed,
            quota: QUOTA_BYTES,
            formattedSize,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Экспортировать все данные в JSON
 * Используйте в Console: await window.__devtools.exportData()
 */
export const exportData = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          const json = JSON.stringify(result, null, 2);
          console.log('📊 Export ready:');
          console.log(json);
          resolve(json);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Начать отслеживать изменения Storage
 * Используйте в Console: window.__devtools.startMonitoring()
 */
export const startMonitoring = (): void => {
  console.log('📡 Storage monitoring started...\n');

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      console.log(`[${new Date().toLocaleTimeString()}] 📝 Storage changed:`);

      Object.keys(changes).forEach((key) => {
        const change = changes[key];
        if (!change) return;
        
        const hasOldValue = 'oldValue' in change;
        const hasNewValue = 'newValue' in change;

        console.log(`  ${key}:`, {
          oldValueSize: hasOldValue
            ? JSON.stringify(change.oldValue).length
            : 'N/A',
          newValueSize: hasNewValue
            ? JSON.stringify(change.newValue).length
            : 'N/A',
        });
      });

      console.log('');
    }
  });
};

/**
 * Выполнить тестовый сценарий
 * Используйте в Console: await window.__devtools.runTests()
 */
export const runTests = async (): Promise<void> => {
  console.log('🧪 Running tests...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as { name: string; status: 'PASS' | 'FAIL'; error?: string }[],
  };

  // Test 1: Storage API available
  try {
    if (!chrome.storage) throw new Error('Chrome Storage API not available');
    console.log('✅ Chrome Storage API available');
    results.passed++;
    results.tests.push({ name: 'Chrome Storage API available', status: 'PASS' });
  } catch (e) {
    console.error('❌ Chrome Storage API test failed');
    results.failed++;
    results.tests.push({
      name: 'Chrome Storage API available',
      status: 'FAIL',
      error: (e as Error).message,
    });
  }

  // Test 2: Can get storage
  try {
    const data = await getAllNotes();
    console.log(`✅ Can get notes (${data.length} notes found)`);
    results.passed++;
    results.tests.push({
      name: 'Can get storage',
      status: 'PASS',
    });
  } catch (e) {
    console.error('❌ Cannot get storage');
    results.failed++;
    results.tests.push({
      name: 'Can get storage',
      status: 'FAIL',
      error: (e as Error).message,
    });
  }

  // Test 3: Can add note
  try {
    await addTestNote('DevTools Test Note');
    const notes = await getAllNotes();
    const testNote = notes.find((n) => n.title === 'DevTools Test Note');
    if (!testNote) throw new Error('Added note not found');
    console.log('✅ Can add notes');
    results.passed++;
    results.tests.push({
      name: 'Can add notes',
      status: 'PASS',
    });
  } catch (e) {
    console.error('❌ Cannot add notes');
    results.failed++;
    results.tests.push({
      name: 'Can add notes',
      status: 'FAIL',
      error: (e as Error).message,
    });
  }

  // Test 4: Storage size
  try {
    const info = await getStorageInfo();
    console.log(`✅ Storage size: ${info.formattedSize} (${info.percentUsed.toFixed(2)}% used)`);
    results.passed++;
    results.tests.push({
      name: 'Get storage size',
      status: 'PASS',
    });
  } catch (e) {
    console.error('❌ Cannot get storage size');
    results.failed++;
    results.tests.push({
      name: 'Get storage size',
      status: 'FAIL',
      error: (e as Error).message,
    });
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📈 Success rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
  );

  return undefined;
};

/**
 * Инициализировать девтулз помощника
 * Вызывается автоматически при загрузке расширения
 */
export const initDevtoolsHelper = (): void => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__devtools = {
      getAllNotes,
      addTestNote,
      clearAllNotes,
      getStorageInfo,
      exportData,
      startMonitoring,
      runTests,
      help: () => {
        console.log(`
🎯 DevTools Helper Commands:

📝 Notes Management:
  window.__devtools.getAllNotes()           - Get all notes
  window.__devtools.addTestNote('title')    - Add test note
  window.__devtools.clearAllNotes()         - Clear all notes

📊 Storage Info:
  window.__devtools.getStorageInfo()        - Get storage usage
  window.__devtools.exportData()            - Export all data as JSON

📡 Monitoring:
  window.__devtools.startMonitoring()       - Start real-time monitoring
  window.__devtools.runTests()              - Run automated tests

ℹ️  window.__devtools.help()                - Show this help
        `);
      },
    };

    console.log('✅ DevTools Helper initialized. Type window.__devtools.help() for commands');
  }
};
