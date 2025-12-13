import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useEditorShortcuts, FieldRow, Card, SenderBlock } from './components';

async function generateTextOnServer(prompt: string, tool: string, expectJson: boolean) {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, tool, expectJson }),
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
  
  // Remove markdown code blocks
  const fence = src.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) src = fence[1].trim();
  
  // Extract JSON from text
  if (!fence) {
    const start = src.indexOf('{');
    const end = src.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) src = src.slice(start, end + 1);
  }
  
  // Handle plain text format
  if (!/^\s*\{/.test(src)) {
    const subj = src.match(/^\s*Subject:\s*(.*)$/im)?.[1]?.trim();
    const prev = src.match(/^\s*Preview:\s*(.*)$/im)?.[1]?.trim();
    const body = src.match(/^\s*Body:\s*([\s\S]*)$/im)?.[1]?.trim();
    if (subj || body) {
      return { subject: subj ?? '', preview: prev ?? '', body: body ?? src } as T;
    }
    // If no structured format, treat as body
    return { subject: '', preview: '', body: src } as T;
  }
  
  // Clean up JSON
  src = src.replace(/[\u2018-\u201B]/g, "'").replace(/[\u201C-\u201F]/g, '"');
  src = src.replace(/(\n|{|,)\s*([A-Za-z0-9_]+)\s*:/g, (_m, p1, p2) => `${p1} "${p2}":`);
  src = src.replace(/,\s*([}\]])/g, '$1');
  
  try {
    return JSON.parse(src);
  } catch {
    // Final fallback - return as body text
    return { subject: '', preview: '', body: raw } as T;
  }
}

function saveTemplate(key: string, data: Record<string, any>) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function loadTemplate<T = any>(key: string): T | null {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
}

function EmailsScreen() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEditorShortcuts(textareaRef);

  const [role, setRole] = useState('Founder');
  const [senderName, setSenderName] = useState('Aman Kumar');
  const [senderEmail, setSenderEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState<'Simple'|'Intermediate'|'Advanced'>('Simple');

  const [niche, setNiche] = useState('Roofing');
  const [target, setTarget] = useState('Homeowners');
  const [prospectName, setProspectName] = useState('');
  const [company, setCompany] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');
  const [tone, setTone] = useState('Sales — Short');

  const [ctaText, setCtaText] = useState('Book a 15-minute call');
  const [wordLimit, setWordLimit] = useState<number | ''>(120);
  const [spamFree, setSpamFree] = useState(true);

  const [variants, setVariants] = useState(1);
  const [jsonMode, setJsonMode] = useState(true);
  const [promptOverride, setPromptOverride] = useState<string | null>(null);

  const [results, setResults] = useState<string[]>([]);
  const [parsedEmails, setParsedEmails] = useState<Array<{subject:string; preview?:string; body:string}>>([]);
  const [softWarning, setSoftWarning] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function readingInstruction() {
    if (level === 'Simple') return 'Write in simple, conversational language. Use short sentences and common words.';
    if (level === 'Intermediate') return 'Write in professional, clear language suitable for business audiences.';
    return 'Write in formal and detailed language with precise wording.';
  }

  function buildPrompt() {
    const senderLines = [
      `Sender role: ${role}.`,
      senderName ? `Sender name: ${senderName}.` : '',
      senderEmail ? `Sender email: ${senderEmail}.` : '',
    ].filter(Boolean).join(' ');

    const keywordsLine = `Keywords (use naturally in the messaging): ${niche}, ${target}.`;
    const spamInstruction = spamFree ? 'Ensure the email uses non-spammy language: avoid ALL-CAPS, excessive punctuation, words like "Buy now", "Guarantee", or long lists; sound human and helpful.' : '';
    const wl = wordLimit && Number(wordLimit) > 0 ? `Keep it under ${wordLimit} words.` : '';

    const languageInstruction = language !== 'English' 
      ? `MANDATORY LANGUAGE REQUIREMENT: You MUST respond ONLY in ${language} language. Write the ENTIRE email (subject line, preview text, and body content) completely in ${language}. Do NOT use any English words or phrases. Use proper ${language} grammar, vocabulary, and sentence structure. If you need to use technical terms, translate them accurately to ${language}. This is a strict requirement - no exceptions allowed.`
      : `Language: English.`;

    const base = [
      languageInstruction,
      `You are a professional sales copywriter writing emails from the sender's perspective.`,
      `Reading level: ${readingInstruction()}`,
      senderLines,
      keywordsLine,
      `Niche: ${niche}. Target audience: ${target}.`,
      prospectName ? `Prospect name: ${prospectName}.` : '',
      company ? `Prospect company: ${company}.` : '',
      prospectEmail ? `Prospect email: ${prospectEmail}.` : '',
      `Tone/variant: ${tone}.`,
      `Include this clear CTA (exact): "${ctaText}".`,
      spamInstruction,
      `Write the email that:`,
      `- Introduces the sender briefly, using the sender role/name provided above.`,
      `- Mentions one specific benefit relevant to ${niche}.`,
      `- Uses the keywords naturally and includes the CTA above.`,
      wl,
      `Keep language simple, friendly and conversion-oriented. Don't include extra links or marketing fluff.`,
    ];

    if (jsonMode) {
      base.unshift(
        `Return only valid JSON with this exact schema: {"subject": string, "preview": string, "body": string}. No markdown or backticks.`
      );
    }

    return base.filter(Boolean).join('\n\n');
  }

  const prompt = useMemo(() => promptOverride ?? buildPrompt(), [
    promptOverride, role, senderName, senderEmail, language, level,
    niche, target, prospectName, company, prospectEmail, tone, ctaText, wordLimit, spamFree, jsonMode
  ]);

  const tokenEst = estimateTokens(prompt);
  const hints = useMemo(() => spamHints(prompt), [prompt]);

  const onGenerateInner = useCallback(async () => {
    setError(null); setSoftWarning(null); setResults([]); setParsedEmails([]);
    if (!role.trim()) { setError('Please enter your profession/role'); return; }
    if (!niche.trim() || !target.trim()) { setError('Please enter niche and target'); return; }
    if (!ctaText.trim()) { setError('Please provide a CTA'); return; }
    if (wordLimit !== '' && (Number(wordLimit) <= 0 || Number(wordLimit) > 1000)) { setError('Word limit must be 1–1000 or empty'); return; }

    setLoading(true);
    try {
      const outs: string[] = [];
      for (let i = 0; i < Math.min(Math.max(variants,1),5); i++) {
        const text = await generateTextOnServer(prompt, 'emails', jsonMode);
        outs.push(text.trim());
      }
      setResults(outs);

      if (jsonMode) {
        try {
          const parsed = outs.map(o => {
            const j = robustJsonParse(o);
            return {
              subject: String(j.subject ?? ''),
              preview: String(j.preview ?? ''),
              body: String(j.body ?? (typeof j === 'string' ? j : JSON.stringify(j)))
            };
          });
          setParsedEmails(parsed);
        } catch {
          setParsedEmails([]);
          setSoftWarning('Model returned non-JSON. Showing raw text instead.');
        }
      }
      textareaRef.current?.blur();
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [role, niche, target, ctaText, wordLimit, variants, jsonMode, prompt]);

  useEffect(() => {
    const h = () => onGenerateInner();
    window.addEventListener('ai-tools:generate', h);
    return () => window.removeEventListener('ai-tools:generate', h);
  }, [onGenerateInner]);

  function fillExample() {
    setRole('Founder'); setSenderName('Aman Kumar'); setSenderEmail('aman@toproof.co');
    setLanguage('English'); setLevel('Simple');
    setNiche('Roofing'); setTarget('Homeowners in Los Angeles');
    setProspectName('John'); setCompany('TopRoof Co'); setTone('Sales — Short');
    setCtaText('Book a quick 15-min call'); setWordLimit(90); setSpamFree(true);
    setJsonMode(true); setVariants(2);
    setPromptOverride(null);
  }

  const templateKey = 'aiTools:emailsTemplate';
  function onSaveTemplate() {
    const state = { role, senderName, senderEmail, language, level, niche, target, prospectName, company, prospectEmail, tone, ctaText, wordLimit, spamFree, jsonMode, variants, promptOverride };
    saveTemplate(templateKey, state);
    // Create custom alert with black text
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = 'Template saved!';
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
  function onLoadTemplate() {
    const t = loadTemplate<any>(templateKey);
    if (!t) { 
      // Create custom alert with black text
      const alertDiv = document.createElement('div');
      alertDiv.innerHTML = 'No template saved!';
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
      return; 
    }
    setRole(t.role ?? role); setSenderName(t.senderName ?? senderName); setSenderEmail(t.senderEmail ?? '');
    setLanguage(t.language ?? 'English'); setLevel(t.level ?? 'Simple');
    setNiche(t.niche ?? niche); setTarget(t.target ?? target);
    setProspectName(t.prospectName ?? ''); setCompany(t.company ?? ''); setProspectEmail(t.prospectEmail ?? '');
    setTone(t.tone ?? 'Sales — Short'); setCtaText(t.ctaText ?? ctaText);
    setWordLimit(t.wordLimit ?? wordLimit); setSpamFree(!!t.spamFree);
    setJsonMode(!!t.jsonMode); setVariants(t.variants ?? 1);
    setPromptOverride(t.promptOverride ?? null);
  }
  function onReset() {
    setRole('Founder'); setSenderName('Aman Kumar'); setSenderEmail('');
    setLanguage('English'); setLevel('Simple');
    setNiche('Roofing'); setTarget('Homeowners');
    setProspectName(''); setCompany(''); setProspectEmail('');
    setTone('Sales — Short'); setCtaText('Book a 15-minute call');
    setWordLimit(120); setSpamFree(true); setJsonMode(true); setVariants(1);
    setPromptOverride(null); setResults([]); setParsedEmails([]); setError(null); setSoftWarning(null);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-black">📧 Email Generator</h2>

      <SenderBlock
        role={role} setRole={setRole}
        senderName={senderName} setSenderName={setSenderName}
        senderEmail={senderEmail} setSenderEmail={setSenderEmail}
        language={language} setLanguage={setLanguage}
        level={level} setLevel={setLevel}
      />

      <Card>
        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Niche (keyword)</label>
            <input list="nicheListEmails"
                   className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={niche} onChange={(e)=>setNiche(e.target.value)} placeholder="Type or pick a niche" />
            <datalist id="nicheListEmails">
              <option value="Roofing" /><option value="HVAC" /><option value="Solar" />
              <option value="Realtors" /><option value="Plumbing" /><option value="Marketing" />
            </datalist>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Target (keyword)</label>
            <input list="targetListEmails"
                   className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Type or pick a target" />
            <datalist id="targetListEmails">
              <option value="Homeowners" /><option value="Commercial Owners" />
              <option value="Property Managers" /><option value="General Contractors" /><option value="Founders" />
            </datalist>
          </div>

          <div className="w-full sm:w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Tone / Variant</label>
            <select
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 text-blue-900 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={tone} onChange={(e)=>setTone(e.target.value)}
            >
              <option>Sales — Short</option><option>Follow-up — Medium</option><option>Onboarding — Long</option>
            </select>
          </div>
        </FieldRow>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-900 font-semibold">Optional prospect details</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-blue-900 font-semibold">Prospect name</label>
              <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                     value={prospectName} onChange={e=>setProspectName(e.target.value)} placeholder="e.g., John" />
            </div>
            <div>
              <label className="text-xs text-blue-900 font-semibold">Company</label>
              <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                     value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g., TopRoof Co" />
            </div>
            <div>
              <label className="text-xs text-blue-900 font-semibold">Prospect email</label>
              <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                     value={prospectEmail} onChange={e=>setProspectEmail(e.target.value)} placeholder="john@company.com" />
            </div>
          </div>
        </details>

        <div className="h-2" />

        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">CTA (exact text)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={ctaText} onChange={e=>setCtaText(e.target.value)} placeholder="e.g., Book a 15-minute call" />
          </div>

          <div className="w-[160px]">
            <label className="text-xs text-blue-900 font-semibold">Word limit</label>
            <input type="number" min={1} max={1000}
                   className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={String(wordLimit)} onChange={e=>setWordLimit(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <details className="ml-2">
            <summary className="cursor-pointer text-sm text-blue-900 font-semibold">Advanced options</summary>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-blue-900">
                <input type="checkbox" checked={spamFree} onChange={e=>setSpamFree(e.target.checked)} /> Spam-free wording
              </label>
              <label className="inline-flex items-center gap-2 text-blue-900">
                <input type="checkbox" checked={jsonMode} onChange={e=>setJsonMode(e.target.checked)} /> Structured JSON
              </label>
              <div className="inline-flex items-center gap-2">
                <span className="text-blue-900 text-sm font-semibold">Variants</span>
                <input className="w-24 rounded-lg bg-white border border-blue-300 px-3 py-2 outline-none text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                       type="number" min={1} max={5} value={variants} onChange={e=>setVariants(Number(e.target.value))} />
              </div>
            </div>
          </details>
        </FieldRow>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm" onClick={fillExample}>Use Template</button>
          <button className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm" onClick={() => { safeCopy(prompt); }}>Copy Prompt</button>
          <button className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm" onClick={onSaveTemplate}>Save Template</button>
          <button className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm" onClick={onLoadTemplate}>Load Template</button>
          <button className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm" onClick={onReset}>Reset</button>
        </div>
      </Card>

      <label className="block text-xs text-blue-900 font-semibold">Preview prompt (editable)</label>
      <textarea
        ref={textareaRef}
        className="w-full min-h-[220px] rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        value={prompt}
        onChange={(e)=>setPromptOverride(e.target.value)}
        aria-busy={loading}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm text-blue-700">
        <span>~{tokenEst} tokens</span>
        {hints.length ? <span>· ⚠ {hints.join(' · ')}</span> : null}
      </div>

      <div className="flex justify-end">
        <button
          className="px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:-translate-y-0.5 shadow-lg"
          onClick={onGenerateInner}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate Email(s)'}
        </button>
      </div>

      {error && <div className="mt-3 rounded-xl bg-red-500/15 border border-red-400/30 p-3 text-sm">{error}</div>}
      {softWarning && <div className="mt-3 rounded-xl bg-yellow-400/15 border border-yellow-400/30 p-3 text-sm">{softWarning}</div>}

      {(jsonMode ? parsedEmails.length>0 : results.length>0) ? (
        <div className="mt-4 space-y-3">
          {jsonMode ? parsedEmails.map((e,i)=>(
            <Card key={i}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-semibold text-blue-700">Variant {i+1}: {e.subject || 'No subject'}</h4>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-sm" onClick={()=>safeCopy(`${e.subject}\n\n${e.body}`)}>Copy</button>
                  <button
                    className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm"
                    onClick={()=>{
                      const content = `Subject: ${e.subject}\n\nPreview: ${e.preview ?? ''}\n\n${e.body}`;
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `email-variant-${i+1}.txt`; a.click(); URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
              {e.preview ? <p className="text-blue-700 mt-1">{e.preview}</p> : null}
              <pre className="whitespace-pre-wrap mt-2 text-blue-900">{e.body}</pre>
            </Card>
          )) : results.map((r,i)=>(
            <Card key={i}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-blue-700">Variant {i+1}</h4>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-sm" onClick={()=>safeCopy(r)}>Copy</button>
                  <button
                    className="px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 font-medium transition-colors shadow-sm"
                    onClick={()=>{
                      const blob = new Blob([r], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `email-variant-${i+1}.txt`; a.click(); URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap mt-2 text-blue-900">{r}</pre>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-blue-700">Generated output will appear here</div></Card>
      )}
    </div>
  );
}

function WhatsAppScreen() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEditorShortcuts(textareaRef);

  const [role, setRole] = useState('Founder');
  const [senderName, setSenderName] = useState('Aman Kumar');
  const [senderEmail, setSenderEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState<'Simple'|'Intermediate'|'Advanced'>('Simple');

  const [niche, setNiche] = useState('Roofing');
  const [target, setTarget] = useState('Homeowners');
  const [prospectName, setProspectName] = useState('');
  const [variant, setVariant] = useState('Cold Outreach');

  const [ctaText, setCtaText] = useState('Reply "YES" to schedule');
  const [wordLimit, setWordLimit] = useState<number | ''>(40);
  const [spamFree, setSpamFree] = useState(true);
  const [variants, setVariants] = useState(1);
  const [promptOverride, setPromptOverride] = useState<string | null>(null);

  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function readingInstruction() {
    if (level === 'Simple') return 'Use short sentences and plain words.';
    if (level === 'Intermediate') return 'Use clear, professional phrasing.';
    return 'Use formal, detailed phrasing.';
  }

  function buildPrompt() {
    const senderLines = [
      `Sender role: ${role}.`,
      senderName ? `Sender name: ${senderName}.` : '',
      senderEmail ? `Sender email: ${senderEmail}.` : ''
    ].filter(Boolean).join(' ');
    const keywordsLine = `Keywords (use naturally): ${niche}, ${target}.`;
    const spamInstruction = spamFree ? 'Avoid spammy phrasing; sound human and brief.' : '';
    const wl = wordLimit && Number(wordLimit) > 0 ? `Keep it under ${wordLimit} words.` : '';

    const languageInstruction = language !== 'English' 
      ? `MANDATORY LANGUAGE REQUIREMENT: You MUST respond ONLY in ${language} language. Write the ENTIRE WhatsApp message completely in ${language}. Do NOT use any English words or phrases. Use proper ${language} grammar, vocabulary, and sentence structure. This is a strict requirement - no exceptions allowed.`
      : `Language: English.`;

    return [
      languageInstruction,
      `You are a short, conversion-focused WhatsApp copywriter writing from the sender's perspective.`,
      `Reading level: ${readingInstruction()}`,
      senderLines,
      keywordsLine,
      `Niche: ${niche}. Target: ${target}.`,
      prospectName ? `Prospect: ${prospectName}.` : '',
      `Goal: ${variant}.`,
      `Include this CTA (exact): "${ctaText}".`,
      spamInstruction,
      wl,
      `Write a 1–3 line WhatsApp message with a direct CTA (call or reply).`
    ].filter(Boolean).join('\n\n');
  }

  const prompt = useMemo(() => promptOverride ?? buildPrompt(), [
    promptOverride, role, senderName, senderEmail, language, level,
    niche, target, prospectName, variant, ctaText, wordLimit, spamFree
  ]);

  const tokenEst = estimateTokens(prompt);
  const hints = useMemo(() => spamHints(prompt), [prompt]);

  const onGenerate = useCallback(async () => {
    setError(null); setResults([]);
    if (!role.trim()) { setError('Please enter your profession/role'); return; }
    if (!niche || !target) { setError('Please enter niche and target'); return; }
    if (!ctaText.trim()) { setError('Please provide a CTA'); return; }
    setLoading(true);
    try {
      const outs: string[] = [];
      for (let i = 0; i < Math.min(Math.max(variants,1),5); i++) {
        const text = await generateTextOnServer(prompt, 'whatsapp', false);
        outs.push(text.trim());
      }
      setResults(outs);
      textareaRef.current?.blur();
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [role, niche, target, ctaText, variants, prompt]);

  useEffect(() => {
    const h = () => onGenerate();
    window.addEventListener('ai-tools:generate', h);
    return () => window.removeEventListener('ai-tools:generate', h);
  }, [onGenerate]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-black">💬 WhatsApp Message Generator</h2>

      <SenderBlock
        role={role} setRole={setRole}
        senderName={senderName} setSenderName={setSenderName}
        senderEmail={senderEmail} setSenderEmail={setSenderEmail}
        language={language} setLanguage={setLanguage}
        level={level} setLevel={setLevel}
      />

      <Card>
        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Niche</label>
            <input list="nicheListWhatsapp"
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={niche} onChange={(e)=>setNiche(e.target.value)} placeholder="Type or pick a niche" />
            <datalist id="nicheListWhatsapp">
              <option value="Roofing" /><option value="HVAC" /><option value="Solar" /><option value="Real Estate" /><option value="Marketing" />
            </datalist>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Target</label>
            <input list="targetListWhatsapp"
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Type or pick a target" />
            <datalist id="targetListWhatsapp">
              <option value="Homeowners" /><option value="Commercial Owners" /><option value="Property Managers" />
            </datalist>
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Variant</label>
            <select
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 text-blue-900 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={variant} onChange={e=>setVariant(e.target.value)}
            >
              <option>Cold Outreach</option><option>Follow-up</option><option>Reminder</option>
            </select>
          </div>
        </FieldRow>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-700">Advanced</summary>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-blue-700 text-sm">Variants</span>
              <input className="w-24 rounded-xl bg-white/10 border border-blue-700 px-3 py-2 outline-none"
                     type="number" min={1} max={5} value={variants} onChange={e=>setVariants(Number(e.target.value))} />
            </div>
            <label className="inline-flex items-center gap-2 text-white/80">
              <input type="checkbox" checked={spamFree} onChange={e=>setSpamFree(e.target.checked)} /> Spam-free wording
            </label>
          </div>
        </details>

        <div className="h-2" />

        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-700 font-semibold">Prospect name (optional)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={prospectName} onChange={e=>setProspectName(e.target.value)} placeholder="e.g., Priya" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">CTA (exact)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={ctaText} onChange={e=>setCtaText(e.target.value)} placeholder='e.g., "Reply YES to schedule"' />
          </div>
          <div className="w-[160px]">
            <label className="text-xs text-blue-900 font-semibold">Word limit</label>
            <input type="number" min={1} max={200}
                   className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={String(wordLimit)} onChange={e=>setWordLimit(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </FieldRow>
      </Card>

      <label className="block text-xs text-blue-700">Preview prompt</label>
      <textarea
        ref={textareaRef}
        className="w-full min-h-[180px] rounded-2xl bg-white/10 border border-blue-700 px-3 py-3 outline-none text-blue-700"
        value={prompt}
        onChange={(e)=>setPromptOverride(e.target.value)}
        aria-busy={loading}
      />    

      <div className="flex flex-wrap items-center gap-3 text-sm text-blue-700">
        <span>~{tokenEst} tokens</span>
        {hints.length ? <span>· ⚠ {hints.join(' · ')}</span> : null}
      </div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 hover:brightness-110 shadow-[0_12px_30px_rgba(14,165,233,0.35)]"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate Message(s)'}
        </button>
      </div>

      {error && <div className="mt-3 rounded-xl bg-red-500/15 border border-red-400/30 p-3 text-sm">{error}</div>}

      {results.length ? (
        <div className="mt-4 space-y-3">
          {results.map((r,i)=>(
            <Card key={i}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-semibold text-blue-700">Variant {i+1}</h4>
                <button className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-sm" onClick={()=>safeCopy(r)}>Copy</button>
              </div>
              <pre className="whitespace-pre-wrap mt-2 text-blue-900">{r}</pre>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-blue-700">Generated message will appear here.</div></Card>
      )}
    </div>
  );
}

function LinkedInScreen() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEditorShortcuts(textareaRef);

  const [role, setRole] = useState('Founder');
  const [senderName, setSenderName] = useState('Aman Kumar');
  const [senderEmail, setSenderEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState<'Simple'|'Intermediate'|'Advanced'>('Simple');

  const [niche, setNiche] = useState('Marketing');
  const [target, setTarget] = useState('Founders');
  const [prospectName, setProspectName] = useState('');
  const [variant, setVariant] = useState('Connection Request');

  const [ctaText, setCtaText] = useState('Can we connect for a quick chat?');
  const [wordLimit, setWordLimit] = useState<number | ''>(40);
  const [spamFree, setSpamFree] = useState(true);
  const [variants, setVariants] = useState(1);
  const [promptOverride, setPromptOverride] = useState<string | null>(null);

  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function readingInstruction() {
    if (level === 'Simple') return 'Use short, conversational sentences.';
    if (level === 'Intermediate') return 'Use clear professional phrasing.';
    return 'Use formal, polished language.';
  }

  function buildPrompt() {
    const senderLines = [
      `Sender role: ${role}.`,
      senderName ? `Sender name: ${senderName}.` : '',
      senderEmail ? `Sender email: ${senderEmail}.` : ''
    ].filter(Boolean).join(' ');
    const keywordsLine = `Keywords (use naturally): ${niche}, ${target}.`;
    const spamInstruction = spamFree ? 'Avoid spammy phrasing; keep it professional.' : '';
    const wl = wordLimit && Number(wordLimit) > 0 ? `Keep it under ${wordLimit} words.` : '';

    const languageInstruction = language !== 'English' 
      ? `MANDATORY LANGUAGE REQUIREMENT: You MUST respond ONLY in ${language} language. Write the ENTIRE LinkedIn message completely in ${language}. Do NOT use any English words or phrases. Use proper ${language} grammar, vocabulary, and sentence structure. This is a strict requirement - no exceptions allowed.`
      : `Language: English.`;

    return [
      languageInstruction,
      `You are a concise LinkedIn outreach copywriter writing from the sender's perspective.`,
      `Reading level: ${readingInstruction()}`,
      senderLines,
      keywordsLine,
      `Niche: ${niche}. Target: ${target}.`,
      prospectName ? `Prospect: ${prospectName}.` : '',
      `Variant: ${variant}.`,
      `Include this CTA (exact): "${ctaText}".`,
      spamInstruction,
      wl,
      `Write a 1–2 sentence LinkedIn message with a professional tone and a clear CTA.`
    ].filter(Boolean).join('\n\n');
  }

  const prompt = useMemo(() => promptOverride ?? buildPrompt(), [
    promptOverride, role, senderName, senderEmail, language, level, niche, target, prospectName, variant, ctaText, wordLimit, spamFree
  ]);

  const tokenEst = estimateTokens(prompt);
  const hints = useMemo(() => spamHints(prompt), [prompt]);

  const onGenerate = useCallback(async () => {
    setError(null); setResults([]);
    if (!role.trim()) { setError('Please enter your profession/role'); return; }
    if (!niche || !target) { setError('Please enter niche and target'); return; }
    if (!ctaText.trim()) { setError('Please provide a CTA'); return; }
    setLoading(true);
    try {
      const outs: string[] = [];
      for (let i = 0; i < Math.min(Math.max(variants,1),5); i++) {
        const text = await generateTextOnServer(prompt, 'linkedin', false);
        outs.push(text.trim());
      }
      setResults(outs);
      textareaRef.current?.blur();
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [role, niche, target, ctaText, variants, prompt]);

  useEffect(() => {
    const h = () => onGenerate();
    window.addEventListener('ai-tools:generate', h);
    return () => window.removeEventListener('ai-tools:generate', h);
  }, [onGenerate]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-black">🔗 LinkedIn Message Generator</h2>

      <SenderBlock
        role={role} setRole={setRole}
        senderName={senderName} setSenderName={setSenderName}
        senderEmail={senderEmail} setSenderEmail={setSenderEmail}
        language={language} setLanguage={setLanguage}
        level={level} setLevel={setLevel}
      />

      <Card>
        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Niche</label>
            <input list="nicheListLinkedin"
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={niche} onChange={(e)=>setNiche(e.target.value)} placeholder="Type or pick a niche" />
            <datalist id="nicheListLinkedin">
              <option value="Marketing" /><option value="Sales" /><option value="Roofing" /><option value="Realtors" />
            </datalist>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Target</label>
            <input list="targetListLinkedin"
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Type or pick a target" />
            <datalist id="targetListLinkedin">
              <option value="Founders" /><option value="Operations Managers" /><option value="Property Managers" />
            </datalist>
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Variant</label>
            <select
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 text-blue-900 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={variant} onChange={e=>setVariant(e.target.value)}
            >
              <option>Connection Request</option><option>Follow-up</option>
            </select>
          </div>
        </FieldRow>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-700">Advanced</summary>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-blue-700 text-sm">Variants</span>
              <input className="w-24 rounded-xl bg-white/10 border border-blue-700 px-3 py-2 outline-none"
                     type="number" min={1} max={5} value={variants} onChange={e=>setVariants(Number(e.target.value))} />
            </div>
            <label className="inline-flex items-center gap-2 text-white/80">
              <input type="checkbox" checked={spamFree} onChange={e=>setSpamFree(e.target.checked)} /> Spam-free wording
            </label>
          </div>
        </details>

        <div className="h-2" />

        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Prospect name (optional)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={prospectName} onChange={e=>setProspectName(e.target.value)} placeholder="e.g., Anjali" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">CTA (exact)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={ctaText} onChange={e=>setCtaText(e.target.value)} placeholder='e.g., "Can we connect for a quick chat?"' />
          </div>
          <div className="w-[160px]">
            <label className="text-xs text-blue-900 font-semibold">Word limit</label>
            <input type="number" min={1} max={120}
                   className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={String(wordLimit)} onChange={e=>setWordLimit(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </FieldRow>
      </Card>

      <label className="block text-xs text-blue-700">Preview prompt</label>
      <textarea
        ref={textareaRef}
        className="w-full min-h-[180px] rounded-2xl bg-white/10 border border-blue-700 px-3 py-3 outline-none text-blue-700"
        value={prompt}
        onChange={(e)=>setPromptOverride(e.target.value)}
        aria-busy={loading}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm text-blue-700">
        <span>~{tokenEst} tokens</span>
        {hints.length ? <span>· ⚠ {hints.join(' · ')}</span> : null}
      </div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 hover:brightness-110 shadow-[0_12px_30px_rgba(14,165,233,0.35)]"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate Message(s)'}
        </button>
      </div>

      {error && <div className="mt-3 rounded-xl bg-red-500/15 border border-red-400/30 p-3 text-sm">{error}</div>}

      {results.length ? (
        <div className="mt-4 space-y-3">
          {results.map((r,i)=>(
            <Card key={i}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-semibold text-blue-700">Variant {i+1}</h4>
                <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-blue-700" onClick={()=>safeCopy(r)}>Copy</button>
              </div>
              <pre className="whitespace-pre-wrap mt-2">{r}</pre>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-blue-700">Generated LinkedIn message will appear here.</div></Card>
      )}
    </div>
  );
}

function ContractsScreen() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEditorShortcuts(textareaRef);

  const [role, setRole] = useState('Founder');
  const [senderName, setSenderName] = useState('Aman Kumar');
  const [senderEmail, setSenderEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState<'Simple'|'Intermediate'|'Advanced'>('Intermediate');

  const [niche, setNiche] = useState('Web Development');
  const [clientName, setClientName] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [variant, setVariant] = useState('Simple SOW');

  const [ctaText, setCtaText] = useState('Sign to confirm and send PO');
  const [wordLimit, setWordLimit] = useState<number | ''>(400);
  const [variants, setVariants] = useState(1);
  const [promptOverride, setPromptOverride] = useState<string | null>(null);

  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function readingInstruction() {
    if (level === 'Simple') return 'Use plain language and short sentences.';
    if (level === 'Intermediate') return 'Use professional and clear legal-adjacent language.';
    return 'Use precise and detailed legal-style language.';
  }

  function buildPrompt() {
    const senderLines = [
      `Sender role: ${role}.`,
      senderName ? `Sender name: ${senderName}.` : '',
      senderEmail ? `Sender email: ${senderEmail}.` : ''
    ].filter(Boolean).join(' ');
    const keywordsLine = `Keywords (use naturally): ${niche}.`;
    const wl = wordLimit && Number(wordLimit) > 0 ? `Aim for approximately ${wordLimit} words.` : '';

    const languageInstruction = language !== 'English' 
      ? `MANDATORY LANGUAGE REQUIREMENT: You MUST respond ONLY in ${language} language. Write the ENTIRE contract completely in ${language}. Do NOT use any English words or phrases. Use proper ${language} grammar, vocabulary, and legal expressions. This is a strict requirement - no exceptions allowed.`
      : `Language: English.`;

    return [
      languageInstruction,
      `You are a legal-savvy assistant drafting a short contract/statement-of-work. Write from the sender's perspective.`,
      `Reading level: ${readingInstruction()}`,
      senderLines,
      keywordsLine,
      `Niche: ${niche}.`,
      clientName ? `Client: ${clientName}.` : '',
      projectScope ? `Scope: ${projectScope}.` : 'Scope: <brief description of work>.',
      `Variant: ${variant}.`,
      `Include this CTA (exact): "${ctaText}".`,
      wl,
      `Write a clear draft with scope, deliverables, payment terms, change requests, IP/ownership basics, and a one-line sign-off. Keep it professional and concise.`
    ].filter(Boolean).join('\n\n');
  }

  const prompt = useMemo(() => promptOverride ?? buildPrompt(), [
    promptOverride, role, senderName, senderEmail, language, level, niche, clientName, projectScope, variant, ctaText, wordLimit
  ]);

  const tokenEst = estimateTokens(prompt);

  const onGenerate = useCallback(async () => {
    setError(null); setResults([]);
    if (!role.trim()) { setError('Please enter your profession/role'); return; }
    if (!projectScope.trim()) { setError('Please enter project scope'); return; }
    setLoading(true);
    try {
      const outs: string[] = [];
      for (let i = 0; i < Math.min(Math.max(variants,1),5); i++) {
        const text = await generateTextOnServer(prompt, 'contracts', false);
        outs.push(text.trim());
      }
      setResults(outs);
      textareaRef.current?.blur();
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [role, projectScope, variants, prompt]);

  useEffect(() => {
    const h = () => onGenerate();
    window.addEventListener('ai-tools:generate', h);
    return () => window.removeEventListener('ai-tools:generate', h);
  }, [onGenerate]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-black">📄 Contract Draft Generator</h2>

      <SenderBlock
        role={role} setRole={setRole}
        senderName={senderName} setSenderName={setSenderName}
        senderEmail={senderEmail} setSenderEmail={setSenderEmail}
        language={language} setLanguage={setLanguage}
        level={level} setLevel={setLevel}
      />

      <Card>
        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Niche</label>
            <input list="nicheListContracts"
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={niche} onChange={(e)=>setNiche(e.target.value)} placeholder="Type or pick a niche" />
            <datalist id="nicheListContracts">
              <option value="Web Development" /><option value="Design" /><option value="Marketing" /><option value="Consulting" />
            </datalist>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Project scope</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={projectScope} onChange={e=>setProjectScope(e.target.value)} placeholder="e.g., Website + CMS" />
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Variant</label>
            <select
              className="mt-2 w-full rounded-lg bg-white border border-blue-300 text-blue-900 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={variant} onChange={e=>setVariant(e.target.value)}
            >
              <option>Simple SOW</option><option>Payment + Retainer</option><option>Project + Milestones</option>
            </select>
          </div>
        </FieldRow>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-700">Advanced</summary>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-blue-700 text-sm">Variants</span>
              <input className="w-24 rounded-xl bg-white/10 border border-blue-700 px-3 py-2 outline-none"
                     type="number" min={1} max={5} value={variants} onChange={e=>setVariants(Number(e.target.value))} />
            </div>
          </div>
        </details>

        <div className="h-2" />

        <FieldRow>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">Client name (optional)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g., Acme Corp" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-blue-900 font-semibold">CTA (exact)</label>
            <input className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none placeholder:text-blue-400 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={ctaText} onChange={e=>setCtaText(e.target.value)} placeholder="e.g., Sign to confirm and send PO" />
          </div>
          <div className="w-[160px]">
            <label className="text-xs text-blue-900 font-semibold">Word limit</label>
            <input type="number" min={50} max={1000}
                   className="mt-2 w-full rounded-lg bg-white border border-blue-300 px-4 py-3 outline-none text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                   value={String(wordLimit)} onChange={e=>setWordLimit(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </FieldRow>
      </Card>

      <label className="block text-xs text-blue-700">Preview prompt</label>
      <textarea
        ref={textareaRef}
        className="w-full min-h-[220px] rounded-2xl bg-white/10 border border-blue-700 px-3 py-3 outline-none text-blue-700"
        value={prompt}
        onChange={(e)=>setPromptOverride(e.target.value)}
        aria-busy={loading}
      />

      <div className="text-sm text-blue-700 mt-1">~{tokenEst} tokens</div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 hover:brightness-110 shadow-[0_12px_30px_rgba(14,165,233,0.35)]"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate Draft(s)'}
        </button>
      </div>

      {error && <div className="mt-3 rounded-xl bg-red-500/15 border border-red-400/30 p-3 text-sm">{error}</div>}

      {results.length ? (
        <div className="mt-4 space-y-3">
          {results.map((r,i)=>(
            <Card key={i}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-semibold text-blue-700">Variant {i+1}</h4>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-blue-700" onClick={()=>safeCopy(r)}>Copy</button>
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-blue-700"
                    onClick={()=>{
                      const blob = new Blob([r], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `contract-variant-${i+1}.txt`; a.click(); URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap mt-2">{r}</pre>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-blue-700">Generated draft will appear here.</div></Card>
      )}
    </div>
  );
}

export { EmailsScreen, WhatsAppScreen, LinkedInScreen, ContractsScreen };
