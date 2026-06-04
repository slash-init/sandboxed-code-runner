import { useRef, useEffect, useCallback } from 'react';
import MonacoEditor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type { editor as MonacoEditorAPI, IDisposable } from 'monaco-editor';

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

/* ── Light theme matching the new design ───────────────────── */
const SANDBOXED_LIGHT_THEME = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '777587', fontStyle: 'italic' },
    { token: 'keyword', foreground: '3525cd' },
    { token: 'string', foreground: 'a44100' },
    { token: 'number', foreground: 'a44100' },
    { token: 'type', foreground: '7e3000' },
    { token: 'function', foreground: '4f46e5' },
    { token: 'variable', foreground: '1a1c1c' },
    { token: 'operator', foreground: '5f5e5e' },
    { token: 'delimiter', foreground: '777587' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#1a1c1c',
    'editor.lineHighlightBackground': '#f4f4f320',
    'editor.selectionBackground': '#e2dfff',
    'editorCursor.foreground': '#4f46e5',
    'editorLineNumber.foreground': '#77758760',
    'editorLineNumber.activeForeground': '#4f46e5',
    'editorIndentGuide.background': '#1a1c1c0a',
    'editorIndentGuide.activeBackground': '#4f46e530',
    'editorBracketMatch.background': '#e2dfff40',
    'editorBracketMatch.border': '#4f46e550',
    'editorWidget.background': '#f9f9f8',
    'editorWidget.border': '#c7c4d8',
    'editorSuggestWidget.background': '#f9f9f8',
    'editorSuggestWidget.border': '#c7c4d8',
    'editorSuggestWidget.foreground': '#1a1c1c',
    'editorSuggestWidget.selectedBackground': '#e2dfff',
    'editorSuggestWidget.highlightForeground': '#3525cd',
    'editorHoverWidget.background': '#f9f9f8',
    'editorHoverWidget.border': '#c7c4d8',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#e2e2e1',
    'scrollbarSlider.hoverBackground': '#c7c4d8',
  },
};

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
  fontSize = 13,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditorAPI.IStandaloneCodeEditor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const disposablesRef = useRef<IDisposable[]>([]);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme('sandboxed-light', SANDBOXED_LIGHT_THEME);
  }, []);

  const registerProviders = useCallback((monaco: any, lang: string) => {
    disposablesRef.current.forEach(d => d.dispose());
    disposablesRef.current = [];

    const monacoLang = MONACO_LANG_MAP[lang] || lang;
    const keywords = KW_MAP[lang] || [];
    const tabSize = TAB_SIZE_MAP[lang] || 4;

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
            if (lang === 'cpp' && trimmed.startsWith('}')) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
            let currentIndent = indentLevel;
            if (lang === 'cpp' && (trimmed.startsWith('public:') || trimmed.startsWith('private:') || trimmed.startsWith('protected:'))) {
              currentIndent = Math.max(0, indentLevel - 1);
            }
            const result = indentStr.repeat(currentIndent) + trimmed;
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
      if (wrapperRef.current) {
        (wrapperRef.current as any).__monacoEditor = editor;
      }
    },
    [language, registerProviders]
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    import('@monaco-editor/react').then(({ loader }) => {
      loader.init().then((monaco) => {
        registerProviders(monaco, language);
      });
    });
  }, [language, registerProviders]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const tabSize = TAB_SIZE_MAP[language] || 4;
    editor.getModel()?.updateOptions({ tabSize, insertSpaces: true });
  }, [language]);

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
        theme="sandboxed-light"
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
            verticalScrollbarSize: 4,
            horizontalScrollbarSize: 4,
            verticalSliderSize: 4,
            horizontalSliderSize: 4,
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
