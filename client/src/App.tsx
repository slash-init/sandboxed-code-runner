import { useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import './App.css';

function AppContent() {
  const [langInfo, setLangInfo] = useState({ language: 'Python', ext: '.py' });
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);

  const handleLanguageChange = useCallback((lang: string, ext: string) => {
    const labelMap: Record<string, string> = {
      python: 'Python',
      cpp: 'C++',
      javascript: 'JavaScript',
    };
    const label = labelMap[lang] || lang;
    setLangInfo({ language: label, ext });
  }, []);

  const handleExecTime = useCallback((ms: number | null) => {
    setExecTimeMs(ms);
  }, []);

  return (
    <div className="app-layout">
      <a href="#editor-main" className="skip-link">
        Skip to editor
      </a>
      <Header />
      <main className="app-main" id="main-content">
        <Editor
          onLanguageChange={handleLanguageChange}
          onExecTime={handleExecTime}
        />
      </main>
      <StatusBar
        language={langInfo.language}
        extension={langInfo.ext}
        execTimeMs={execTimeMs}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;