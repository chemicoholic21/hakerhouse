'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTerminal } from './terminal-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { repos, developers, roles } from '@/lib/data';

type Directory = '~' | 'repos' | 'devs' | 'roles';

const directoryToPath: Record<Directory, string> = {
  '~': '/',
  repos: '/repos',
  devs: '/devs',
  roles: '/roles',
};

const pathToDirectory: Record<string, Directory> = {
  '/': '~',
  '/repos': 'repos',
  '/devs': 'devs',
  '/roles': 'roles',
};

const BASE_COMMANDS = [
  'about',
  'cat',
  'cd',
  'clear',
  'date',
  'echo',
  'exit',
  'help',
  'ls',
  'logout',
  'pwd',
  'quit',
  'whoami',
] as const;

function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  const first = strings[0];
  if (!first) return '';
  const lows = strings.map((s) => s.toLowerCase());
  let i = 0;
  for (;;) {
    const ch = lows[0]?.[i];
    if (ch === undefined) break;
    if (!lows.every((s) => s[i] === ch)) break;
    i++;
  }
  return first.slice(0, i);
}

function wantsTrailingSpace(cmd: string): boolean {
  return cmd === 'cd' || cmd === 'cat' || cmd === 'echo';
}

function catItemList(currentDir: Directory): string[] {
  if (currentDir === 'repos') {
    return repos.map((r, i) => `${i + 1}_${r.name.split('/')[1]}`);
  }
  if (currentDir === 'devs') {
    return developers.map((d, i) => `${i + 1}_${d.username}`);
  }
  if (currentDir === 'roles') {
    return roles.map((r, i) => `${i + 1}_${r.title.toLowerCase().replace(/\s+/g, '_')}`);
  }
  return [];
}

type TabOutcome =
  | { kind: 'input'; value: string }
  | { kind: 'list'; matches: string[] }
  | { kind: 'none' };

function computeTabCompletion(input: string, currentDir: Directory): TabOutcome {
  const lead = input.match(/^(\s*)/)?.[1] ?? '';
  const body = input.slice(lead.length);

  const onlyCmd = body.match(/^(\S+)$/);
  if (onlyCmd && onlyCmd[1]) {
    const partial = onlyCmd[1].toLowerCase();
    const matches = BASE_COMMANDS.filter((c) => c.startsWith(partial));
    if (matches.length === 0) return { kind: 'none' };
    if (matches.length === 1) {
      const c = matches[0];
      return {
        kind: 'input',
        value: lead + c + (wantsTrailingSpace(c) ? ' ' : ''),
      };
    }
    const lcp = longestCommonPrefix([...matches]);
    if (lcp.length > partial.length) {
      return { kind: 'input', value: lead + lcp };
    }
    return { kind: 'list', matches: [...matches] };
  }

  const cmdAndRest = body.match(/^(\S+)\s+(.*)$/);
  if (!cmdAndRest || !cmdAndRest[1]) return { kind: 'none' };

  const cmd = cmdAndRest[1].toLowerCase();
  const rest = cmdAndRest[2] ?? '';

  if (cmd === 'echo') {
    return { kind: 'none' };
  }

  const firstWord = rest.split(/\s+/)[0] ?? '';
  const partial = firstWord.toLowerCase();
  const afterFirst = rest.slice(firstWord.length);

  if (cmd === 'cd') {
    if (rest.trim().split(/\s+/).filter(Boolean).length > 1) {
      return { kind: 'none' };
    }
    const partialNorm = partial.replace(/\/+$/, '');
    const candidates = currentDir === '~' ? ['repos', 'devs', 'roles', '~', '..'] : ['..', '~'];
    const matches = candidates.filter((d) => d.toLowerCase().startsWith(partialNorm));
    if (matches.length === 0) return { kind: 'none' };
    if (matches.length === 1) {
      return {
        kind: 'input',
        value: `${lead}cd ${matches[0]}${afterFirst}`,
      };
    }
    const lcp = longestCommonPrefix(matches);
    if (lcp.toLowerCase().length > partialNorm.length) {
      return { kind: 'input', value: `${lead}cd ${lcp}${afterFirst}` };
    }
    return { kind: 'list', matches };
  }

  if (cmd === 'cat') {
    if (rest.trim().split(/\s+/).filter(Boolean).length > 1) {
      return { kind: 'none' };
    }
    const items = catItemList(currentDir);
    if (items.length === 0) return { kind: 'none' };
    const matches = items.filter((it) => {
      const low = it.toLowerCase();
      if (low.startsWith(partial)) return true;
      const u = low.indexOf('_');
      if (u === -1) return false;
      return low.slice(u + 1).startsWith(partial);
    });
    if (matches.length === 0) return { kind: 'none' };
    if (matches.length === 1) {
      return {
        kind: 'input',
        value: `${lead}cat ${matches[0]}${afterFirst}`,
      };
    }
    const lcp = longestCommonPrefix(matches);
    if (lcp.toLowerCase().length > partial.length) {
      return { kind: 'input', value: `${lead}cat ${lcp}${afterFirst}` };
    }
    return { kind: 'list', matches };
  }

  return { kind: 'none' };
}

export function Terminal() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, closeTerminal, openTerminal } = useTerminal();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dockedContentHeight, setDockedContentHeight] = useState(248);
  const [input, setInput] = useState('');
  const [currentDir, setCurrentDir] = useState<Directory>('~');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingKeysRef = useRef('');
  /** When false, next close skips reset (Escape); exit/X still reset. */
  const closeResetsTerminalRef = useRef(true);
  const isOpenRef = useRef(isOpen);
  const openTerminalRef = useRef(openTerminal);
  const closeTerminalRef = useRef(closeTerminal);
  isOpenRef.current = isOpen;
  openTerminalRef.current = openTerminal;
  closeTerminalRef.current = closeTerminal;

  const resetTerminalUi = useCallback(() => {
    setHistory([]);
    setInput('');
    setCommandHistory([]);
    setHistoryIndex(-1);
    pendingKeysRef.current = '';
    setIsMaximized(false);
    setCollapsed(false);
    setDockedContentHeight(248);
  }, []);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      if (closeResetsTerminalRef.current) {
        resetTerminalUi();
      }
      closeResetsTerminalRef.current = true;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, resetTerminalUi]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeResetsTerminalRef.current = false;
      closeTerminalRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync directory with current pathname
  useEffect(() => {
    if (!mounted) return;
    const dir = pathToDirectory[pathname];
    if (dir) {
      setCurrentDir(dir);
    }
  }, [pathname, mounted]);

  useEffect(() => {
    if (!isOpen || collapsed) return;
    const pending = pendingKeysRef.current;
    if (pending) {
      setInput((prev) => prev + pending);
      pendingKeysRef.current = '';
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen, collapsed]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Allow alphanumeric and common terminal symbols
      if (e.key.length !== 1 || !/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]$/.test(e.key))
        return;

      const target = e.target;
      const inputEl = inputRef.current;
      if (isOpenRef.current && target === inputEl) return;

      if (target instanceof Element) {
        const field = target.closest("input, textarea, [contenteditable='true']");
        if (field !== null) return;
      }

      if (isOpenRef.current && document.activeElement === inputEl) {
        return;
      }

      e.preventDefault();
      if (!isOpenRef.current) {
        pendingKeysRef.current += e.key;
        openTerminalRef.current();
      } else {
        setInput((prev) => prev + e.key);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history]);

  const getPrompt = () => {
    return `${currentDir} $`;
  };

  const navigateTo = (dir: Directory) => {
    if (!mounted) return;
    setCurrentDir(dir);
    router.push(directoryToPath[dir]);
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    const parts = trimmedCmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const arg = parts[1];
    const arg2 = parts[2];
    let output: string[] = [];

    if (trimmedCmd) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
      setHistoryIndex(-1);
    }

    switch (command) {
      case 'help':
        output = [
          'Available commands:',
          '',
          '  help              Show this help message',
          '  about             About hackerhou.se',
          '  whoami            Display current user',
          '  date              Show current date/time',
          '  echo <text>       Print text to terminal',
          '',
          '  ls                List directory contents',
          '  cd <dir>          Change directory',
          '  cd ..             Go to parent directory',
          '  pwd               Print working directory',
          '',
          '  cat <item>        Show item details (in repos/devs/roles)',
          '',
          '  clear             Clear terminal',
          '  exit              Close terminal and reset',
          '  quit, logout      Same as exit',
          '  Esc               Close terminal (keeps session)',
          '',
          'Directories: ~, repos, devs, roles',
        ];
        break;

      case 'about':
        output = [
          'hackerhou.se v1.0',
          'A home for human programmers',
          '',
          'Discover open source, learn new skills, and get hired.',
        ];
        break;

      case 'whoami':
        output = ['guest'];
        break;

      case 'date':
        output = [new Date().toString()];
        break;

      case 'echo':
        output = [parts.slice(1).join(' ') || ''];
        break;

      case 'pwd':
        if (currentDir === '~') {
          output = ['/'];
        } else {
          output = [`/${currentDir}`];
        }
        break;

      case 'ls':
        if (currentDir === '~') {
          output = ['repos/  devs/  roles/'];
        } else if (currentDir === 'repos') {
          output = repos.map((r, i) => `${i + 1}_${r.name.split('/')[1]}`);
        } else if (currentDir === 'devs') {
          output = developers.map((d, i) => `${i + 1}_${d.username}`);
        } else if (currentDir === 'roles') {
          output = roles.map((r, i) => `${i + 1}_${r.title.toLowerCase().replace(/\s+/g, '_')}`);
        }
        break;

      case 'cd':
        if (!arg || arg === '~' || arg === '/') {
          navigateTo('~');
          output = [];
        } else if (arg === '..') {
          if (currentDir !== '~') {
            navigateTo('~');
            output = [];
          } else {
            output = ['Already at root'];
          }
        } else if (arg === '.') {
          output = [];
        } else {
          const targetDir = arg.replace(/\/$/, '').toLowerCase() as Directory;
          if (currentDir === '~' && ['repos', 'devs', 'roles'].includes(targetDir)) {
            navigateTo(targetDir);
            output = [];
          } else if (currentDir !== '~') {
            output = [`cd: no such directory: ${arg}`];
          } else {
            output = [`cd: no such directory: ${arg}`];
          }
        }
        break;

      case 'cat':
        if (!arg) {
          output = ['Usage: cat <item>'];
        } else {
          const num = parseInt(arg.split('_')[0]) - 1;
          if (currentDir === 'repos' && num >= 0 && num < repos.length) {
            const r = repos[num];
            output = [
              `Name: ${r.name}`,
              `Description: ${r.description}`,
              `Language: ${r.language}`,
              `Tags: ${r.tags.join(', ')}`,
              `Stars: ${r.stars} | Forks: ${r.forks}`,
              `Category: ${r.category} | Difficulty: ${r.difficulty}`,
            ];
          } else if (currentDir === 'devs' && num >= 0 && num < developers.length) {
            const d = developers[num];
            output = [
              `Username: ${d.username}`,
              `Skills: ${d.skills.join(', ')}`,
              `Language: ${d.language}`,
              `Country: ${d.country}`,
              `Repos: ${d.repos} | Followers: ${d.followers}`,
            ];
          } else if (currentDir === 'roles' && num >= 0 && num < roles.length) {
            const r = roles[num];
            output = [
              `Title: ${r.title}`,
              `Company: ${r.company}`,
              `Location: ${r.location}`,
              `Workplace: ${r.workplace}`,
              `Area: ${r.area}`,
              `Skills: ${r.skills.length ? r.skills.join(', ') : '—'}`,
              `Tags: ${r.tags.join(', ')}`,
            ];
          } else if (currentDir === '~') {
            output = ["cat: use 'cd' to enter a directory first"];
          } else {
            output = [`cat: ${arg}: No such file`];
          }
        }
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'exit':
      case 'quit':
      case 'logout':
        closeTerminal();
        return;

      case '':
        break;

      default:
        output = [`${command}: command not found`];
    }

    setHistory((prev) => [...prev, `${getPrompt()} ${trimmedCmd}`, ...output]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const outcome = computeTabCompletion(input, currentDir);
      if (outcome.kind === 'list') {
        setHistory((prev) => [...prev, outcome.matches.join('  ')]);
      } else if (outcome.kind === 'input') {
        setInput(outcome.value);
      }
    }
  };

  if (!isOpen) return null;

  /* Docked terminal: bottom sheet on md+; narrow centered strip on small screens */
  const dockedFrame =
    'fixed z-[100] border-2 border-foreground bg-background/90 backdrop-blur-sm bottom-0 max-md:left-1/2 max-md:right-auto max-md:w-[min(90vw,480px)] max-md:-translate-x-1/2 md:left-5 md:right-auto md:w-[min(480px,calc(100vw-2.5rem))]';

  const mobileBackdrop =
    isMobile && !isMaximized ? (
      <div
        className="fixed inset-0 z-[99] bg-foreground/25 md:hidden"
        aria-hidden
        onClick={closeTerminal}
      />
    ) : null;

  if (collapsed && !isMaximized) {
    return (
      <>
        {mobileBackdrop}
        <div
          ref={terminalRef}
          className={`${dockedFrame} flex items-center justify-between gap-2 px-3 py-2 select-none`}
          onDoubleClick={() => setCollapsed(false)}
        >
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="min-w-0 flex-1 text-left text-sm font-bold text-highlight truncate hover:underline underline-offset-2"
            aria-expanded="false"
          >
            Terminal
          </button>
          <div
            className="flex items-center gap-0.5 shrink-0"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="p-1 hover:bg-foreground/10"
              onClick={() => setCollapsed(false)}
              aria-label="Expand"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-foreground/10"
              onClick={closeTerminal}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  const onResizeDragMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = dockedContentHeight;
    document.body.style.userSelect = 'none';

    const maxContent = () => Math.min(560, window.innerHeight - 140);
    const onMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      setDockedContentHeight(Math.max(120, Math.min(maxContent(), startH + delta)));
    };
    const onUp = () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {mobileBackdrop}
      <div
        ref={terminalRef}
        className={`fixed z-[100] border-2 border-foreground bg-background/90 backdrop-blur-sm flex flex-col ${
          isMaximized
            ? 'inset-0 h-dvh w-full'
            : 'max-md:left-1/2 max-md:top-1/2 max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:bottom-auto max-md:right-auto max-md:w-[90vw] max-md:h-[90dvh] max-md:max-h-[90dvh] md:bottom-0 md:left-5 md:right-auto md:top-auto md:translate-x-0 md:translate-y-0 md:w-[min(480px,calc(100vw-2.5rem))]'
        }`}
      >
        {/* Inner wrapper: `relative` here — never on the fixed shell (would override `fixed`). */}
        <div
          className={
            isMaximized
              ? 'flex min-h-0 min-w-0 flex-1 flex-col'
              : 'relative flex w-full flex-col max-md:min-h-0 max-md:flex-1 max-md:flex max-md:flex-col'
          }
        >
          {!isMaximized && !isMobile ? (
            <div
              className="absolute top-0 right-0 left-0 z-20 h-3 cursor-ns-resize touch-none"
              onMouseDown={onResizeDragMouseDown}
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize terminal height"
            />
          ) : null}
          {/* Title bar — same layout as message dock: title left, icons right */}
          <div
            className="shrink-0 border-b-2 border-foreground bg-transparent px-3 py-2 flex items-center justify-between gap-2 select-none cursor-default"
            onDoubleClick={() => {
              if (isMaximized) {
                setIsMaximized(false);
              } else {
                setCollapsed(true);
              }
            }}
          >
            <p className="text-sm font-bold text-highlight truncate min-w-0">Terminal</p>
            <div
              className="flex items-center gap-0.5 shrink-0"
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {!isMaximized ? (
                <button
                  type="button"
                  className="p-1 hover:bg-foreground/10"
                  onClick={() => setCollapsed(true)}
                  aria-label="Collapse"
                >
                  <Minus className="w-4 h-4" />
                </button>
              ) : null}
              <button
                type="button"
                className="p-1 hover:bg-foreground/10"
                onClick={() => {
                  setIsMaximized((m) => {
                    const next = !m;
                    if (next) setCollapsed(false);
                    return next;
                  });
                }}
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                className="p-1 hover:bg-foreground/10"
                onClick={closeTerminal}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terminal content */}
          <div
            ref={contentRef}
            className={`p-3 overflow-y-auto font-mono text-sm ${
              isMaximized || isMobile ? 'min-h-0 flex-1' : 'shrink-0'
            }`}
            style={isMaximized || isMobile ? undefined : { height: dockedContentHeight }}
            onClick={() => inputRef.current?.focus()}
          >
            {history.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {line}
              </div>
            ))}
            <div className="flex">
              <span>{getPrompt()}&nbsp;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent outline-none border-none caret-transparent"
                  spellCheck={false}
                  autoComplete="off"
                />
                <span
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ paddingLeft: `${input.length}ch` }}
                >
                  <span className="bg-foreground text-background">&nbsp;</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
