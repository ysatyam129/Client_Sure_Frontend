'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useEditorShortcuts, FieldRow, Card, Sidebar, SenderBlock } from './components';
import { EmailsScreen, WhatsAppScreen, LinkedInScreen, ContractsScreen } from './screens';

type Tool = 'emails' | 'whatsapp' | 'linkedin' | 'contracts' | null;

const ALLOWED_TOOLS = new Set(['emails', 'whatsapp', 'linkedin', 'contracts', 'text']);

async function generateTextOnServer(prompt: string, tool: string, expectJson: boolean) {
  const safeTool = ALLOWED_TOOLS.has(tool) ? tool : 'text';
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, tool: safeTool, expectJson }),
  });

  if (!res.ok) {
    let msg = `Generation failed (${res.status})`;
    try {
      const err = await res.json();
      msg = err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const json = await res.json();
  return (json.text ?? '').toString();
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  
  // Create custom alert with black text
  const alertDiv = document.createElement('div');
  alertDiv.innerHTML = 'Copied!';
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    color: black;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: system-ui;
    font-weight: 500;
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => document.body.removeChild(alertDiv), 2000);
}

function estimateTokens(s: string) {
  return Math.ceil(s.length / 4);
}

function spamHints(txt: string) {
  const issues: string[] = [];
  const linkCount = (txt.match(/https?:\/\//g) || []).length;
  if (linkCount > 1) issues.push('Too many links (≤ 1 recommended)');
  if (/[A-Z]{6,}/.test(txt)) issues.push('ALL-CAPS detected');
  if (/\b(guarantee|buy now|free!!!|act now|risk[- ]?free)\b/i.test(txt)) issues.push('Spammy wording found');
  return issues;
}

function robustJsonParse<T = any>(raw: string): T {
  let src = (raw ?? '').trim();
  const fence = src.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) src = fence[1].trim();
  if (!fence) {
    const start = src.indexOf('{');
    const end = src.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) src = src.slice(start, end + 1);
  }
  if (!/^\s*\{/.test(src)) {
    const subj = src.match(/^\s*Subject:\s*(.*)$/im)?.[1]?.trim();
    const prev = src.match(/^\s*Preview:\s*(.*)$/im)?.[1]?.trim();
    const body = src.match(/^\s*Body:\s*([\s\S]*)$/im)?.[1]?.trim();
    if (subj || body) {
      return { subject: subj ?? '', preview: prev ?? '', body: body ?? src } as T;
    }
  }
  src = src.replace(/[\u2018-\u201B]/g, "'").replace(/[\u201C-\u201F]/g, '"');
  src = src.replace(/(\n|{|,)\s*([A-Za-z0-9_]+)\s*:/g, (_m, p1, p2) => `${p1} "${p2}":`);
  src = src.replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(src);
}

function saveTemplate(key: string, data: Record<string, any>) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function loadTemplate<T = any>(key: string): T | null {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
}

export default function ChatbotPage() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<Tool>('emails');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function openTool(t: Tool) {
    setActiveTool(t);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Navbar />
      
      <div className="min-h-screen pt-16">
        <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="hidden lg:block">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-blue-200 shadow-lg">
              <Sidebar activeTool={activeTool} openTool={openTool} />
            </div>
          </aside>

          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  className="fixed top-0 left-0 bottom-0 w-80 z-50 p-4 bg-white/95 backdrop-blur-sm border-r border-blue-200 shadow-xl"
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                >
                  <Sidebar activeTool={activeTool} openTool={openTool} />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <main className="min-h-[70vh]">
            {activeTool === 'emails' && <EmailsScreen />}
            {activeTool === 'whatsapp' && <WhatsAppScreen />}
            {activeTool === 'linkedin' && <LinkedInScreen />}
            {activeTool === 'contracts' && <ContractsScreen />}
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}