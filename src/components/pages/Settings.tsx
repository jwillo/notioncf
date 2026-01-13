import { useState, useEffect } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { useDatabaseStore } from '../../stores/databaseStore';

const SETTINGS_KEY = 'notioncf-settings';

interface AppSettings {
  defaultPageId: string | null;
  defaultPageType: 'page' | 'database' | null;
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { defaultPageId: null, defaultPageType: null };
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getDefaultRoute(): string {
  const settings = loadSettings();
  if (settings.defaultPageId && settings.defaultPageType) {
    return settings.defaultPageType === 'database' 
      ? `/database/${settings.defaultPageId}`
      : `/page/${settings.defaultPageId}`;
  }
  return '/';
}

export function Settings() {
  const { pages, fetchPages } = usePageStore();
  const { databases, fetchDatabases } = useDatabaseStore();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPages();
    fetchDatabases();
  }, [fetchPages, fetchDatabases]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSelectChange = (value: string) => {
    if (value === '') {
      setSettings({ defaultPageId: null, defaultPageType: null });
    } else {
      const [type, id] = value.split(':');
      setSettings({ 
        defaultPageId: id, 
        defaultPageType: type as 'page' | 'database' 
      });
    }
  };

  const currentValue = settings.defaultPageId && settings.defaultPageType
    ? `${settings.defaultPageType}:${settings.defaultPageId}`
    : '';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-notion-text mb-6">Settings</h1>
      
      <div className="bg-white border border-notion-border rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-notion-text mb-2">
            Default Home Page
          </label>
          <p className="text-sm text-notion-text-secondary mb-3">
            Choose which page or database to show when you open the app.
          </p>
          <select
            value={currentValue}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full px-3 py-2 border border-notion-border rounded-md focus:outline-none focus:ring-2 focus:ring-notion-accent"
          >
            <option value="">Welcome page (default)</option>
            
            {pages.length > 0 && (
              <optgroup label="Pages">
                {pages.map((page) => (
                  <option key={page.id} value={`page:${page.id}`}>
                    {page.icon || '📄'} {page.title || 'Untitled'}
                  </option>
                ))}
              </optgroup>
            )}
            
            {databases.length > 0 && (
              <optgroup label="Databases">
                {databases.map((db) => (
                  <option key={db.id} value={`database:${db.id}`}>
                    🗃️ {db.title || 'Untitled Database'}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-notion-accent text-white rounded hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
          {saved && (
            <span className="text-sm text-green-600">Settings saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}
