import React, { useState, useEffect, useRef } from "react";
import { Terminal, X, Minus, Square } from "lucide-react";

// Target redirect URL for story terminal recovery sequence
export const TARGET_REDIRECT_URL = "https://learningz497-pro.github.io/KBS-8-bit-game/";

// Root directory prompt address
export const TERMINAL_ROOT_PATH = "root@bloom-system:/var/www/instagram/assets/stories/krs-krish108#";

// Admin authentication password (DOB: 10222005)
export const ADMIN_AUTH_PASSWORD = "10222005";

// Integrated 7-step rich command flow mixing developer & user custom commands
// Each output line has a progressive delay (around 700ms - 1050ms) so items print one by one
export const INTEGRATED_TERMINAL_STEPS = [
  {
    id: "check_stream",
    type: "command",
    command: "status --check-stream",
    aliases: [
      "status --check-stream",
      "status",
      "check_stream",
      "status --target=krs-krish-108",
      "status -v",
    ],
    helpText: "Inspect story media descriptors and buffer health for user krs-krish-108.",
    output: [
      { text: "[●] Stream descriptor: /dev/shm/krs_krish108_stream.raw", delay: 600 },
      { text: "    Target:  krs-krish-108 (Sector #108 wish buffer unreadable)", delay: 700 },
      { text: "    State:   FAULT_DETECTED (1 degraded media block at 0x7FFF98A2)", delay: 750 },
      { text: "    Headers: CRC32 checksum mismatch in story block #108", delay: 700 },
      { text: "", delay: 250 },
      { text: "[!] ERR_WISH_STREAM_CORRUPTED: Media buffer faulted in story assets.", delay: 800 },
      { text: "[i] To run targeted deep diagnostics on damaged sectors, enter command:", delay: 500 },
      { text: "    $ run_diagnosis --target=krs-krish-108", delay: 400 },
    ],
    nextInstruction: "Execute command: 'run_diagnosis --target=krs-krish-108'",
  },
  {
    id: "run_diagnosis",
    type: "command",
    command: "run_diagnosis --target=krs-krish-108",
    aliases: [
      "run_diagnosis --target=krs-krish-108",
      "run_diagnosis",
      "run_diagnosis --target=krs-krish108",
      "diagnose",
      "diagnosis",
      "./run_diagnosis",
    ],
    helpText: "Execute kernel diagnostic routine on Krs-Krish108 wish stream.",
    output: [
      { text: "[*] Initializing kernel diagnosis for target: krs-krish-108...", delay: 750 },
      { text: "    [SCAN 1/4] Media stream parity check........... [OK]", delay: 800 },
      { text: "    [SCAN 2/4] Story frame alignment............... [OK]", delay: 850 },
      { text: "    [SCAN 3/4] Birthday wish descriptor tree...... [CORRUPTED]", delay: 1000 },
      { text: "    [SCAN 4/4] Asset cache synchronizer............ [DEGRADED]", delay: 850 },
      { text: "", delay: 250 },
      { text: "[!] Anomaly isolated: 2 damaged wish blocks in /var/log/wishes/krs108.", delay: 900 },
      { text: "[i] Diagnostic complete. To pull remote hotfix bundle, enter command:", delay: 550 },
      { text: "    $ fetch --patch-bundle=v108.bin", delay: 450 },
    ],
    nextInstruction: "Execute command: 'fetch --patch-bundle=v108.bin'",
  },
  {
    id: "fetch_patch",
    type: "command",
    command: "fetch --patch-bundle=v108.bin",
    aliases: [
      "fetch --patch-bundle=v108.bin",
      "fetch",
      "fetch --patch-bundle",
      "fetch patch",
      "fetch_patch",
    ],
    helpText: "Download remote hotfix recovery bundle v108.bin from CDN.",
    output: [
      { text: "Connecting to https://cdn.bloom-internal.net/patches/v108.bin ...", delay: 750 },
      { text: "Downloading payload: [========>                           ] 25% (2.1MB)", delay: 850 },
      { text: "Downloading payload: [================>                   ] 60% (5.0MB)", delay: 850 },
      { text: "Downloading payload: [====================================>] 100% (8.4MB)", delay: 900 },
      { text: "[✓] Checksum verified: SHA256:4a8f9c2e0b108_krs", delay: 700 },
      { text: "[✓] Hotfix binary cached to /var/cache/patches/v108.bin", delay: 750 },
      { text: "", delay: 250 },
      { text: "[i] Hotfix bundle ready. To rebuild and apply wish repair, enter command:", delay: 550 },
      { text: "    $ repair_wishes --apply-patch", delay: 450 },
    ],
    nextInstruction: "Execute command: 'repair_wishes --apply-patch'",
  },
  {
    id: "repair_wishes",
    type: "command",
    command: "repair_wishes --apply-patch",
    aliases: [
      "repair_wishes --apply-patch",
      "repair_wishes",
      "repair_wish",
      "repair",
      "patch",
      "./repair_wishes",
    ],
    helpText: "Rebuild and restore corrupted wish descriptors using cached patch.",
    // Total duration: ~5.3 seconds with realistic step-by-step reconstruction logs
    output: [
      { text: "[*] Initializing wish hotfix binary (v108.bin) into execution buffer...", delay: 900 },
      { text: "    [+] Allocating scratch memory at offset 0x7FFF98A2...", delay: 850 },
      { text: "    [+] Reconstructing wish block 0x004F2: [====================] 100%", delay: 1050 },
      { text: "    [+] Reconstructing wish block 0x004F3: [====================] 100%", delay: 1050 },
      { text: "    [+] Re-aligning frame headers & applying repair matrix: Restored.", delay: 950 },
      { text: "[✓] Wish descriptors successfully rebuilt and verified.", delay: 850 },
      { text: "", delay: 250 },
      { text: "[i] Changes staged. To audit story stream integrity, enter command:", delay: 550 },
      { text: "    $ verify --integrity-scan", delay: 450 },
    ],
    nextInstruction: "Execute command: 'verify --integrity-scan'",
  },
  {
    id: "verify",
    type: "command",
    command: "verify --integrity-scan",
    aliases: [
      "verify --integrity-scan",
      "verify",
      "verify repair",
      "verify --repair",
      "verify_repair",
      "integrity_check",
    ],
    helpText: "Audit repaired story stream integrity before deployment.",
    output: [
      { text: "[*] Running full integrity audit on /var/www/instagram/assets/stories/krs-krish108...", delay: 750 },
      { text: "    [AUDIT 1/3] Frame buffer integrity: 100% HEALTHY", delay: 800 },
      { text: "    [AUDIT 2/3] Wish stream consistency: VERIFIED", delay: 850 },
      { text: "    [AUDIT 3/3] Permissions check: RESTRICTED_WRITE", delay: 800 },
      { text: "", delay: 250 },
      { text: "[!] SECURITY POLICY: Elevated administrator clearance required to commit to production.", delay: 850 },
      { text: "[i] To authenticate root administrator session, enter command:", delay: 550 },
      { text: "    $ auth", delay: 450 },
    ],
    nextInstruction: "Administrative clearance required. Execute command: 'auth'",
  },
  {
    id: "auth",
    type: "auth",
    command: "auth",
    aliases: ["auth", "sudo auth", "su admin"],
    helpText: "Authenticate as root administrator using DOB password.",
    expectedPassword: ADMIN_AUTH_PASSWORD,
    output: [
      { text: "Verifying administrator credentials against PAM subsystem...", delay: 750 },
      { text: "[✓] Authentication successful. Access granted to root operator.", delay: 800 },
      { text: "    Identity: Administrator session verified (DOB: 10222005)", delay: 700 },
    ],
    nextInstruction: "Do you want to continue? Yes or no? (Y/N):",
  },
  {
    id: "deploy_wish",
    type: "command",
    command: "deploy_wish --live",
    aliases: [
      "deploy_wish --live",
      "deploy_wish",
      "deploy_wishes",
      "deploy",
      "deploy_wish --pipeline=production",
      "./deploy_wish",
    ],
    helpText: "Deploy repaired wish payload to live production stream.",
    output: [
      { text: "[*] Staging wish payload into production pipeline...", delay: 850 },
      { text: "    [+] Synchronizing media buffers with host storage... [100%]", delay: 950 },
      { text: "    [+] Propagating hotfix to live CDN nodes... [100%]", delay: 950 },
      { text: "[SUCCESS] Wish hotfix deployed successfully to live story stream!", delay: 850 },
      { text: "", delay: 300 },
      { text: "[●] Initializing final target redirection...", delay: 1000 },
    ],
    nextInstruction: "Wish deployed. Initializing redirection protocol...",
  },
];

const AdminTerminalModal = ({
  isOpen,
  onClose,
  steps = INTEGRATED_TERMINAL_STEPS,
  redirectUrl = TARGET_REDIRECT_URL,
  rootPath = TERMINAL_ROOT_PATH,
}) => {
  const [history, setHistory] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Sub-states:
  // 1. Password input mode when running "auth"
  const [isAwaitingPassword, setIsAwaitingPassword] = useState(false);
  // 2. Post-auth continue confirmation mode ("Do you want to continue? Yes or no? (Y/N)")
  const [isAwaitingAuthContinue, setIsAwaitingAuthContinue] = useState(false);

  // Command history navigation (Up / Down arrows)
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);
  const isCancelledRef = useRef(false);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isProcessing, isRedirecting, isAwaitingPassword, isAwaitingAuthContinue]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isProcessing && !isRedirecting) {
      inputRef.current.focus();
    }
  }, [isOpen, currentStepIndex, isProcessing, isRedirecting, isAwaitingPassword, isAwaitingAuthContinue]);

  // Global Escape key listener to close terminal and return to story
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        isCancelledRef.current = true;
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Reset cancellation token & terminal state on modal open
  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
      setHistory([
        {
          type: "system",
          text: `Bloom Diagnostic Terminal (GNU/Linux 6.8.0-x86_64)\n[CRITICAL] Asset stream degraded: /var/www/instagram/assets/stories/krs-krish108\nError code 108: Wish descriptor corrupt in sector 0x7FFF98A2.\n\n[!] System fault detected. To inspect stream status, execute command:\n    $ status --check-stream\n(Or run diagnosis directly with: 'run_diagnosis --target=krs-krish-108')\nType 'exit' or click [Exit ✕] to return to story.`,
        },
      ]);
      setCurrentStepIndex(0);
      setCurrentInput("");
      setIsProcessing(false);
      setIsRedirecting(false);
      setIsAwaitingPassword(false);
      setIsAwaitingAuthContinue(false);
      setCommandHistory([]);
      setHistoryPointer(-1);
    } else {
      isCancelledRef.current = true;
    }
  }, [isOpen]);

  const currentStep = currentStepIndex < steps.length ? steps[currentStepIndex] : null;

  // Progressive line-by-line streaming function
  const streamLines = async (lines, nextInstruction, onComplete) => {
    setIsProcessing(true);

    for (let i = 0; i < lines.length; i++) {
      if (isCancelledRef.current) return;
      const item = lines[i];
      const text = typeof item === "string" ? item : item.text;
      const delay = typeof item === "object" && item.delay ? item.delay : 750;

      await new Promise((resolve) => setTimeout(resolve, delay));
      if (isCancelledRef.current) return;

      setHistory((prev) => [
        ...prev,
        {
          type: "output",
          text: text,
        },
      ]);
    }

    if (nextInstruction) {
      await new Promise((resolve) => setTimeout(resolve, 550));
      if (isCancelledRef.current) return;
      setHistory((prev) => [
        ...prev,
        {
          type: "instruction",
          text: nextInstruction,
        },
      ]);
    }

    if (!isCancelledRef.current) {
      setIsProcessing(false);
      onComplete?.();
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing || isRedirecting) return;

    const trimmedInput = currentInput.trim();
    if (!trimmedInput) return;

    // Support exiting via command ("exit", "quit", ":q")
    if (
      !isAwaitingPassword &&
      (trimmedInput.toLowerCase() === "exit" ||
        trimmedInput.toLowerCase() === "quit" ||
        trimmedInput.toLowerCase() === ":q")
    ) {
      isCancelledRef.current = true;
      onClose();
      return;
    }

    // Track command history (excluding secret password entry)
    if (!isAwaitingPassword) {
      setCommandHistory((prev) => [...prev, trimmedInput]);
      setHistoryPointer(-1);
    }

    const lowerInput = trimmedInput.toLowerCase();

    // GLOBAL: Help command support ("help", "//help", "?")
    if (
      !isAwaitingPassword &&
      !isAwaitingAuthContinue &&
      (lowerInput === "help" ||
        lowerInput === "//help" ||
        lowerInput === "--help" ||
        lowerInput === "-h" ||
        lowerInput === "?")
    ) {
      const userCommandLine = {
        type: "command",
        prompt: `${rootPath} `,
        text: currentInput,
      };
      setHistory((prev) => [
        ...prev,
        userCommandLine,
        {
          type: "help_block",
          lines: [
            "----------------------------------------------------------------",
            "Bloom Diagnostic Subsystem [Help & Audit Utility]",
            `Current Action: ${currentStep ? currentStep.helpText : "All diagnostic steps completed."}`,
            `Recommended Command: '${currentStep ? currentStep.command : "None"}'`,
            "Exit Terminal: Enter 'exit' or click [Exit ✕]",
            "----------------------------------------------------------------",
          ],
        },
        {
          type: "instruction",
          text: `[i] Next step: Execute command '${currentStep?.command}' to proceed.`,
        },
      ]);
      setCurrentInput("");
      return;
    }

    // CASE 1: Post-Auth Continuation Confirmation ("Do you want to continue? Yes or no? (Y/N)")
    if (isAwaitingAuthContinue) {
      const confirmLine = {
        type: "confirm_input",
        prompt: "Do you want to continue? Yes or no? (Y/N): ",
        text: currentInput,
      };

      if (lowerInput === "y" || lowerInput === "yes") {
        setHistory((prev) => [...prev, confirmLine]);
        setCurrentInput("");

        await streamLines(
          [
            {
              text: "[✓] Authorization accepted. Session verified for live deployment.",
              delay: 600,
            },
          ],
          "[i] System ready. To deploy wish hotfix to live pipeline, execute command:\n    $ deploy_wish --live",
          () => {
            setIsAwaitingAuthContinue(false);
            setCurrentStepIndex((prev) => prev + 1);
          }
        );
      } else {
        setHistory((prev) => [
          ...prev,
          confirmLine,
          {
            type: "error",
            text: "[-] Deployment paused. Type 'Y' or 'Yes' to continue, or 'exit' to return to story.",
          },
        ]);
        setCurrentInput("");
      }
      return;
    }

    // CASE 2: Awaiting Password for "auth" command (Admin DOB: 10222005)
    if (isAwaitingPassword) {
      const passwordLine = {
        type: "password_entry",
        prompt: "[sudo] password for admin: ",
        text: "••••••••",
      };

      if (trimmedInput === ADMIN_AUTH_PASSWORD) {
        setHistory((prev) => [...prev, passwordLine]);
        setCurrentInput("");

        await streamLines(
          currentStep.output,
          "[?] Confirmation required before deploying hotfix to live pipeline.\nDo you want to continue? Yes or no? (Y/N):",
          () => {
            setIsAwaitingPassword(false);
            setIsAwaitingAuthContinue(true);
          }
        );
      } else {
        setHistory((prev) => [
          ...prev,
          passwordLine,
          {
            type: "error",
            text: "auth: Authentication failure. Incorrect administrator DOB password. Try again.",
          },
        ]);
        setCurrentInput("");
      }
      return;
    }

    // CASE 3: Normal Command Execution
    const userCommandLine = {
      type: "command",
      prompt: `${rootPath} `,
      text: currentInput,
    };

    const normalizedInput = lowerInput.replace(/\s+/g, " ");
    const isDirectMatch =
      normalizedInput === currentStep.command.toLowerCase().replace(/\s+/g, " ");
    const isAliasMatch = currentStep.aliases?.some(
      (alias) => normalizedInput === alias.toLowerCase().replace(/\s+/g, " ")
    );

    // Fast-path: if user is at Step 0 ("status") and types "run_diagnosis", jump straight to step 1
    if (
      currentStepIndex === 0 &&
      (normalizedInput.startsWith("run_diagnosis") ||
        normalizedInput.startsWith("./run_diagnosis") ||
        normalizedInput === "diagnose")
    ) {
      setHistory((prev) => [...prev, userCommandLine]);
      setCurrentInput("");

      const diagnosisStep = steps[1]; // run_diagnosis
      await streamLines(
        diagnosisStep.output,
        diagnosisStep.nextInstruction,
        () => {
          setCurrentStepIndex(2); // advance to fetch_patch
        }
      );
      return;
    }

    if (isDirectMatch || isAliasMatch) {
      setHistory((prev) => [...prev, userCommandLine]);
      setCurrentInput("");

      // If this step is "auth", transition into password mode immediately
      if (currentStep.type === "auth") {
        setIsAwaitingPassword(true);
        return;
      }

      // Stream lines one by one with authentic Unix terminal delay
      await streamLines(
        currentStep.output,
        currentStep.id === "deploy_wish" ? null : currentStep.nextInstruction,
        () => {
          if (currentStep.id === "deploy_wish") {
            setHistory((prev) => [
              ...prev,
              {
                type: "success",
                text: "[✓] Story pipeline hotfix synchronized. Redirecting session...",
              },
            ]);
            setIsRedirecting(true);

            // Redirect directly in same page/tab
            setTimeout(() => {
              if (redirectUrl) {
                window.location.href = redirectUrl;
              } else {
                window.location.reload();
              }
            }, 1200);
          } else {
            setCurrentStepIndex((prev) => prev + 1);
          }
        }
      );
    } else {
      // Command mismatch: give technical error with exact hint and //help advice
      setHistory((prev) => [
        ...prev,
        userCommandLine,
        {
          type: "error",
          text: `bash: ${trimmedInput}: command not found.\n[!] Technical instruction: To proceed with recovery, enter command: '${currentStep.command}' (or enter '//help', or 'exit' to return to story)`,
        },
      ]);
      setCurrentInput("");
    }
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e) => {
    if (isAwaitingPassword) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextPointer =
        historyPointer === -1
          ? commandHistory.length - 1
          : Math.max(0, historyPointer - 1);
      setHistoryPointer(nextPointer);
      setCurrentInput(commandHistory[nextPointer] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer === -1) return;
      const nextPointer = historyPointer + 1;
      if (nextPointer >= commandHistory.length) {
        setHistoryPointer(-1);
        setCurrentInput("");
      } else {
        setHistoryPointer(nextPointer);
        setCurrentInput(commandHistory[nextPointer] || "");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={() => {
        isCancelledRef.current = true;
        onClose();
      }}
    >
      {/* Terminal Window Box */}
      <div
        className="relative w-full max-w-[740px] h-[540px] max-h-[90vh] bg-[#0c0c0e] rounded-xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden font-mono text-[13px] leading-relaxed text-neutral-200 select-text"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
      >
        {/* Terminal Window Top Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#18181b] border-b border-neutral-800 select-none">
          {/* Top Left Window Controls with prominent red Close button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                isCancelledRef.current = true;
                onClose();
              }}
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#ff453a] transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title="Close terminal (Return to Story)"
              aria-label="Close terminal"
            >
              <X className="w-2 h-2 text-black/80 font-bold" />
            </button>
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center">
              <Minus className="w-2 h-2 text-black/70 opacity-0" />
            </div>
            <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center">
              <Square className="w-1.5 h-1.5 text-black/70 opacity-0" />
            </div>
          </div>

          {/* Top Center Title */}
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold truncate px-2">
            <Terminal className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">root@bloom-system: /var/www/instagram/assets/stories/krs-krish108</span>
          </div>

          {/* Top Right Controls: bash indicator + Prominent Close (X) button */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">bash</span>
            <button
              type="button"
              onClick={() => {
                isCancelledRef.current = true;
                onClose();
              }}
              className="px-2 py-0.5 rounded bg-neutral-800/90 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 border border-neutral-700/60 hover:border-rose-500/40 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans shadow-sm"
              title="Close terminal and return to story (Esc)"
              aria-label="Close terminal and return to story"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Exit</span>
            </button>
          </div>
        </div>

        {/* Terminal Canvas */}
        <div className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {history.map((entry, idx) => {
            if (entry.type === "system") {
              return (
                <div
                  key={idx}
                  className="text-neutral-400 text-xs pb-2 border-b border-neutral-800/80 whitespace-pre-line leading-relaxed"
                >
                  {entry.text}
                </div>
              );
            }
            if (entry.type === "instruction") {
              return (
                <div
                  key={idx}
                  className="text-amber-300/90 text-xs font-mono whitespace-pre-line bg-amber-500/5 px-2.5 py-1.5 rounded border-l-2 border-amber-500/40 my-1.5 animate-in fade-in duration-150"
                >
                  {entry.text}
                </div>
              );
            }
            if (entry.type === "command") {
              return (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5 pt-1">
                  <span className="text-emerald-400 font-semibold">{entry.prompt}</span>
                  <span className="text-white font-medium">{entry.text}</span>
                </div>
              );
            }
            if (entry.type === "password_entry") {
              return (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5 pt-1">
                  <span className="text-yellow-400 font-semibold">{entry.prompt}</span>
                  <span className="text-neutral-400">{entry.text}</span>
                </div>
              );
            }
            if (entry.type === "confirm_input") {
              return (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5 pt-1">
                  <span className="text-amber-300 font-semibold">{entry.prompt}</span>
                  <span className="text-white font-bold">{entry.text}</span>
                </div>
              );
            }
            if (entry.type === "output") {
              if (entry.text === "") {
                return <div key={idx} className="h-1.5" />;
              }
              return (
                <div
                  key={idx}
                  className="pl-2 text-neutral-300 font-mono text-[13px] leading-relaxed animate-in fade-in duration-150"
                >
                  {entry.text}
                </div>
              );
            }
            if (entry.type === "help_block") {
              return (
                <div key={idx} className="space-y-0.5 pl-2 text-neutral-300 font-mono text-[12.5px]">
                  {entry.lines.map((l, lineIdx) => (
                    <div key={lineIdx}>{l}</div>
                  ))}
                </div>
              );
            }
            if (entry.type === "error") {
              return (
                <div key={idx} className="text-rose-400 pl-2 whitespace-pre-line animate-in fade-in duration-150">
                  {entry.text}
                </div>
              );
            }
            if (entry.type === "success") {
              return (
                <div key={idx} className="text-emerald-400 font-semibold pl-2 animate-in fade-in duration-150">
                  {entry.text}
                </div>
              );
            }
            return null;
          })}

          {/* Running Spinner when command is actively executing and printing */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-amber-300 pl-2 py-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
              <span className="text-xs text-amber-300/90 font-mono">Processing routine...</span>
            </div>
          )}

          {/* Redirect animation state */}
          {isRedirecting && (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold animate-pulse pl-2 py-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Redirecting session to target URL...</span>
            </div>
          )}

          {/* Interactive Shell Input Line */}
          {!isProcessing && !isRedirecting && (
            <form onSubmit={handleFormSubmit} className="flex items-baseline gap-1.5 pt-1.5">
              {isAwaitingAuthContinue ? (
                <span className="text-amber-300 font-semibold shrink-0">
                  Do you want to continue? Yes or no? (Y/N):
                </span>
              ) : isAwaitingPassword ? (
                <span className="text-yellow-400 font-semibold shrink-0">
                  [sudo] password for admin:
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold shrink-0">
                  {rootPath}
                </span>
              )}

              <div className="relative flex-1 flex items-center">
                <input
                  ref={inputRef}
                  type={isAwaitingPassword ? "password" : "text"}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder={
                    isAwaitingAuthContinue
                      ? "Type Y or Yes and press Enter"
                      : isAwaitingPassword
                      ? "Enter admin DOB password"
                      : `Enter command (e.g. ${currentStep?.command}) or //help`
                  }
                  className="w-full bg-transparent border-none outline-none text-white font-mono text-[13px] caret-emerald-400 placeholder:text-neutral-600"
                />
              </div>
            </form>
          )}

          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};

export default AdminTerminalModal;



