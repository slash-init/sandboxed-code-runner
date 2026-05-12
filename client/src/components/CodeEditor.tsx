import { useRef, useEffect, useCallback } from 'react';
import MonacoEditor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type { editor as MonacoEditorAPI, IDisposable } from 'monaco-editor';
import { useTheme, type ThemeName } from '../context/ThemeContext';
import './CodeEditor.css';

export interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  fontSize?: number;
}

const MONACO_LANG_MAP: Record<string, string> = {
  python: 'python',
  cpp: 'cpp',
  javascript: 'javascript',
};

const TAB_SIZE_MAP: Record<string, number> = {
  python: 4,
  cpp: 4,
  javascript: 2,
};

/* ── Theme definitions ──────────────────────────────────────── */
type ThemeDef = Parameters<typeof import('monaco-editor').editor.defineTheme>[1];

function buildThemes(): Record<ThemeName, ThemeDef> {
  return {
    'dark-nebula': {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b6394', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c4b5fd' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '67e8f9' },
        { token: 'function', foreground: 'a78bfa' },
        { token: 'variable', foreground: 'eee8ff' },
        { token: 'operator', foreground: 'f0abfc' },
        { token: 'delimiter', foreground: '9ca3af' },
      ],
      colors: {
        'editor.background': '#0d0c1a',
        'editor.foreground': '#eee8ff',
        'editor.lineHighlightBackground': '#1e1c3820',
        'editor.selectionBackground': '#a78bfa40',
        'editorCursor.foreground': '#a78bfa',
        'editorLineNumber.foreground': '#6b639460',
        'editorLineNumber.activeForeground': '#a78bfa',
        'editorIndentGuide.background': '#ffffff0a',
        'editorIndentGuide.activeBackground': '#a78bfa30',
        'editorBracketMatch.background': '#a78bfa25',
        'editorBracketMatch.border': '#a78bfa50',
        'editorWidget.background': '#16152a',
        'editorWidget.border': '#ffffff15',
        'editorSuggestWidget.background': '#16152a',
        'editorSuggestWidget.border': '#ffffff15',
        'editorSuggestWidget.foreground': '#eee8ff',
        'editorSuggestWidget.selectedBackground': '#a78bfa30',
        'editorSuggestWidget.highlightForeground': '#c4b5fd',
        'editorHoverWidget.background': '#16152a',
        'editorHoverWidget.border': '#ffffff15',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#ffffff1a',
        'scrollbarSlider.hoverBackground': '#ffffff33',
      },
    },
    'midnight-ocean': {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4b7a8f', fontStyle: 'italic' },
        { token: 'keyword', foreground: '67e8f9' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '22d3ee' },
        { token: 'function', foreground: '7dd3fc' },
        { token: 'variable', foreground: 'e0f4ff' },
        { token: 'operator', foreground: 'a5f3fc' },
        { token: 'delimiter', foreground: '7a9bb0' },
      ],
      colors: {
        'editor.background': '#080f18',
        'editor.foreground': '#e0f4ff',
        'editor.lineHighlightBackground': '#0e203420',
        'editor.selectionBackground': '#22d3ee35',
        'editorCursor.foreground': '#22d3ee',
        'editorLineNumber.foreground': '#4b7a8f60',
        'editorLineNumber.activeForeground': '#22d3ee',
        'editorIndentGuide.background': '#64c8ff0a',
        'editorIndentGuide.activeBackground': '#22d3ee30',
        'editorBracketMatch.background': '#22d3ee25',
        'editorBracketMatch.border': '#22d3ee50',
        'editorWidget.background': '#0c1a2a',
        'editorWidget.border': '#64c8ff15',
        'editorSuggestWidget.background': '#0c1a2a',
        'editorSuggestWidget.border': '#64c8ff15',
        'editorSuggestWidget.foreground': '#e0f4ff',
        'editorSuggestWidget.selectedBackground': '#22d3ee28',
        'editorSuggestWidget.highlightForeground': '#67e8f9',
        'editorHoverWidget.background': '#0c1a2a',
        'editorHoverWidget.border': '#64c8ff15',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#64c8ff1a',
        'scrollbarSlider.hoverBackground': '#64c8ff33',
      },
    },
    'aura-light': {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: '16a34a' },
        { token: 'number', foreground: 'ea580c' },
        { token: 'type', foreground: '0891b2' },
        { token: 'function', foreground: '6d28d9' },
        { token: 'variable', foreground: '1e1b33' },
        { token: 'operator', foreground: '9333ea' },
        { token: 'delimiter', foreground: '6b7280' },
      ],
      colors: {
        'editor.background': '#faf9fe',
        'editor.foreground': '#1e1b33',
        'editor.lineHighlightBackground': '#f3f0ff60',
        'editor.selectionBackground': '#7c3aed25',
        'editorCursor.foreground': '#7c3aed',
        'editorLineNumber.foreground': '#1e1b3330',
        'editorLineNumber.activeForeground': '#7c3aed',
        'editorIndentGuide.background': '#1e1b3310',
        'editorIndentGuide.activeBackground': '#7c3aed25',
        'editorBracketMatch.background': '#7c3aed18',
        'editorBracketMatch.border': '#7c3aed40',
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#1e1b3315',
        'editorSuggestWidget.background': '#ffffff',
        'editorSuggestWidget.border': '#1e1b3312',
        'editorSuggestWidget.foreground': '#1e1b33',
        'editorSuggestWidget.selectedBackground': '#7c3aed15',
        'editorSuggestWidget.highlightForeground': '#7c3aed',
        'editorHoverWidget.background': '#ffffff',
        'editorHoverWidget.border': '#1e1b3312',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#1e1b3318',
        'scrollbarSlider.hoverBackground': '#1e1b3328',
      },
    },
    'cyber-neon': {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '2d5a3e', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00ff88' },
        { token: 'string', foreground: 'ffaa00' },
        { token: 'number', foreground: '00d4c8' },
        { token: 'type', foreground: '33ffaa' },
        { token: 'function', foreground: '00e676' },
        { token: 'variable', foreground: 'd0ffe0' },
        { token: 'operator', foreground: '66ffbb' },
        { token: 'delimiter', foreground: '4d8a6a' },
      ],
      colors: {
        'editor.background': '#030306',
        'editor.foreground': '#d0ffe0',
        'editor.lineHighlightBackground': '#00ff8808',
        'editor.selectionBackground': '#00ff8830',
        'editorCursor.foreground': '#00ff88',
        'editorLineNumber.foreground': '#00ff8830',
        'editorLineNumber.activeForeground': '#00ff88',
        'editorIndentGuide.background': '#00ff880a',
        'editorIndentGuide.activeBackground': '#00ff8825',
        'editorBracketMatch.background': '#00ff8820',
        'editorBracketMatch.border': '#00ff8845',
        'editorWidget.background': '#0a0a10',
        'editorWidget.border': '#00ff8815',
        'editorSuggestWidget.background': '#0a0a10',
        'editorSuggestWidget.border': '#00ff8815',
        'editorSuggestWidget.foreground': '#d0ffe0',
        'editorSuggestWidget.selectedBackground': '#00ff8820',
        'editorSuggestWidget.highlightForeground': '#00ff88',
        'editorHoverWidget.background': '#0a0a10',
        'editorHoverWidget.border': '#00ff8815',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#00ff881a',
        'scrollbarSlider.hoverBackground': '#00ff8833',
      },
    },
  };
}

const THEME_DEFS = buildThemes();

/* ── Keyword lists ──────────────────────────────────────────── */
const PYTHON_KW = [
  'False','None','True','and','as','assert','async','await','break','class',
  'continue','def','del','elif','else','except','finally','for','from','global',
  'if','import','in','is','lambda','nonlocal','not','or','pass','raise','return',
  'try','while','with','yield','print','input','len','range','int','str','float',
  'list','dict','set','tuple','bool','enumerate','zip','map','filter','sorted',
  'reversed','open','isinstance','super','abs','max','min','sum','round',
];

const CPP_KW = [
  'auto','bool','break','case','catch','char','class','const','constexpr',
  'continue','default','delete','do','double','else','enum','explicit','extern',
  'false','float','for','friend','goto','if','inline','int','long','mutable',
  'namespace','new','noexcept','nullptr','operator','private','protected',
  'public','return','short','signed','sizeof','static','static_cast','struct',
  'switch','template','this','throw','true','try','typedef','typename','union',
  'unsigned','using','virtual','void','volatile','while','cout','cin','endl',
  'string','vector','map','set','pair','queue','stack','sort','iostream',
  'algorithm','include','define','printf','scanf',
];

const JS_KW = [
  'async','await','break','case','catch','class','const','continue','debugger',
  'default','delete','do','else','export','extends','false','finally','for',
  'function','if','import','in','instanceof','let','new','null','of','return',
  'static','super','switch','this','throw','true','try','typeof','undefined',
  'var','void','while','with','yield','console','log','Math','JSON','Array',
  'Object','String','Number','Boolean','Date','Promise','Map','Set','parseInt',
  'parseFloat','setTimeout','setInterval','fetch','require',
];

const KW_MAP: Record<string, string[]> = {
  python: PYTHON_KW,
  cpp: CPP_KW,
  javascript: JS_KW,
};

/* ── Component ──────────────────────────────────────────────── */
export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
  height = '100%',
  fontSize = 14,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditorAPI.IStandaloneCodeEditor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const disposablesRef = useRef<IDisposable[]>([]);
  const { theme } = useTheme();

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    for (const [name, def] of Object.entries(THEME_DEFS)) {
      monaco.editor.defineTheme(name, def as Parameters<typeof monaco.editor.defineTheme>[1]);
    }
  }, []);

  const registerProviders = useCallback((monaco: any, lang: string) => {
    // Clear old disposables
    disposablesRef.current.forEach(d => d.dispose());
    disposablesRef.current = [];

    const monacoLang = MONACO_LANG_MAP[lang] || lang;
    const keywords = KW_MAP[lang] || [];
    const tabSize = TAB_SIZE_MAP[lang] || 4;

    // 1. Register Completion Provider
    disposablesRef.current.push(
      monaco.languages.registerCompletionItemProvider(monacoLang, {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: keywords.map((kw) => ({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              range,
            })),
          };
        },
      })
    );

    // 2. Register Formatting Provider for C++ and Python
    if (lang === 'cpp' || lang === 'python') {
      const provider = {
        provideDocumentFormattingEdits(model: any) {
          const text = model.getValue();
          const lines = text.split('\n');
          let indentLevel = 0;
          const indentStr = ' '.repeat(tabSize);
          
          const formattedLines = lines.map((line: string) => {
            let trimmed = line.trim();
            if (!trimmed) return '';
            
            // Decrease indent BEFORE the line for closing braces (C++)
            if (lang === 'cpp' && trimmed.startsWith('}')) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Special case for C++ access modifiers
            let currentIndent = indentLevel;
            if (lang === 'cpp' && (trimmed.startsWith('public:') || trimmed.startsWith('private:') || trimmed.startsWith('protected:'))) {
              currentIndent = Math.max(0, indentLevel - 1);
            }
            
            const result = indentStr.repeat(currentIndent) + trimmed;
            
            // Increase indent AFTER the line
            if (lang === 'cpp' && trimmed.endsWith('{')) {
              indentLevel++;
            } else if (lang === 'python' && trimmed.endsWith(':')) {
              indentLevel++;
            }
            
            return result;
          });

          return [{
            range: model.getFullModelRange(),
            text: formattedLines.join('\n')
          }];
        }
      };
      
      disposablesRef.current.push(
        monaco.languages.registerDocumentFormattingEditProvider(monacoLang, provider)
      );
    }
  }, []);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      editor.focus();

      registerProviders(monaco, language);

      // Expose editor on the wrapper ref for parent access
      if (wrapperRef.current) {
        (wrapperRef.current as any).__monacoEditor = editor;
      }
    },
    [language, registerProviders]
  );

  // Re-register providers on language change
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    import('@monaco-editor/react').then(({ loader }) => {
      loader.init().then((monaco) => {
        registerProviders(monaco, language);
      });
    });
  }, [language, registerProviders]);

  // Update tab size on language change
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const tabSize = TAB_SIZE_MAP[language] || 4;
    editor.getModel()?.updateOptions({ tabSize, insertSpaces: true });
  }, [language]);

  // Cleanup
  useEffect(() => {
    return () => {
      disposablesRef.current.forEach(d => d.dispose());
    };
  }, []);

  const monacoLang = MONACO_LANG_MAP[language] || language;
  const tabSize = TAB_SIZE_MAP[language] || 4;

  return (
    <div className="monaco-wrapper" ref={wrapperRef}>
      <MonacoEditor
        height={height}
        language={monacoLang}
        value={value}
        theme={theme}
        onChange={(val) => onChange(val ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        loading={
          <div className="monaco-loading">
            <div className="monaco-loading-spinner" />
            <span>Loading editor…</span>
          </div>
        }
        options={{
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontLigatures: true,
          lineHeight: 1.7,
          tabSize,
          insertSpaces: true,
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          foldingStrategy: 'indentation',
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoSurround: 'languageDefined',
          matchBrackets: 'always',
          minimap: { enabled: false },
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            verticalSliderSize: 6,
            horizontalSliderSize: 6,
          },
          quickSuggestions: { other: true, comments: false, strings: false },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'currentDocument',
          suggestSelection: 'first',
          renderLineHighlight: 'line',
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 16, bottom: 16 },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          readOnly,
          wordWrap: 'on',
          contextmenu: true,
          accessibilitySupport: 'auto',
        }}
      />
    </div>
  );
}

/**
 * Get the Monaco editor instance from a container element.
 * Used by the parent to trigger format actions.
 */
export function getEditorInstance(
  containerEl: HTMLElement | null
): MonacoEditorAPI.IStandaloneCodeEditor | null {
  if (!containerEl) return null;
  const wrapper = containerEl.querySelector('.monaco-wrapper') as any;
  return wrapper?.__monacoEditor ?? null;
}
