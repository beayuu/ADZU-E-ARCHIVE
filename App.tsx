import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  Archive, ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, ChevronDown,
  CircleHelp, CloudOff, Copy, FileArchive, FileCheck2, FileImage, FilePlus2, FileText,
  FolderClosed, History, LayoutDashboard, ListFilter, Menu,
  Plus, Search as SearchIcon, Settings, ShieldCheck, SlidersHorizontal, Upload,
  WifiOff, X, RotateCcw
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type ArchiveDocument = { id: string; studentName: string; type: string; fileName: string; kind: string; status: string; thumbnail?: string; rotation?: number; crop?: 'auto' | 'manual' };
type StudentFolder = { name: string; schoolId: string; documentCount: number; lastUpdated: string; status: string };
type Activity = { id: string; timestamp: string; action: string; subject: string; status: string };

const initialFolders: StudentFolder[] = [];

const initialDocuments: ArchiveDocument[] = [];

const initialActivity: Activity[] = [];

const documentTypes = [
  'BIRTH CERTIFICATE',
  'OFFICIAL RECEIPT',
  'CERTIFICATE OF GOOD MORAL',
  'TRANSCRIPT OF RECORDS',
  'CERTIFICATE OF REGISTRATION',
  'DIPLOMA',
  'TRANSFER CREDENTIAL',
  'CLEARANCE',
  'CERTIFICATION',
  'REGISTRAR FORM',
  'ENROLLMENT DOCUMENT',
  'GRADUATION DOCUMENT',
  'OTHER',
];

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Workspace' },
  { href: '/search', label: 'Search archives', icon: SearchIcon, section: 'Workspace' },
  { href: '/scan', label: 'Scan documents', icon: Camera, section: 'Archive management' },
  { href: '/folders', label: 'Folders', icon: FolderClosed, section: 'Archive management' },
  { href: '/documents', label: 'Documents', icon: FileArchive, section: 'Archive management' },
  { href: '/activity', label: 'Activity', icon: History, section: 'Archive management' },
];

function Badge({ children, tone = 'muted', className = '' }: { children: ReactNode; tone?: 'muted' | 'green' | 'amber' | 'blue'; className?: string }) {
  const tones = { muted: 'bg-muted text-muted-foreground', green: 'bg-emerald-50 text-emerald-700 border-emerald-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', blue: 'bg-blue-50 text-primary border-blue-200' };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'quiet' | 'gold' }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm',
    outline: 'border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary',
    quiet: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    gold: 'bg-accent text-accent-foreground hover:brightness-105 shadow-sm',
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><div className="mono mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary/70">{eyebrow}</div><h1 className="serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>{description && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = (href: string) => href === '/' ? location === '/' : location.startsWith(href);
  return <div className="app-shell flex min-h-[100dvh] text-foreground">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[238px] flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="brand-rule h-1.5 shrink-0" />
      <div className="flex h-[66px] items-center border-b border-sidebar-border px-5">
        <Link href="/" data-testid="link-brand" className="flex items-center gap-2.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm"><img src="/ADZULOGO.png" alt="AdZU Logo" className="h-full w-full object-contain" /></div>
          <div><div className="text-[14px] font-bold leading-tight text-white">AdZU Registrar</div><div className="mono mt-0.5 text-[8px] uppercase tracking-[.12em] text-sidebar-foreground/60">E-Archive System</div></div>
        </Link>
      </div>
       <div className="px-5 pt-6">
         <nav className="space-y-4">{['Workspace', 'Archive management'].map(section => <div key={section}><div className="mono mb-2 px-2 text-[9px] font-bold uppercase tracking-[.14em] text-sidebar-foreground/40">{section}</div><div className="space-y-1">{nav.filter(item => item.section === section).map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} data-active={active(href)} onClick={() => setMobileOpen(false)} className="sidebar-link flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-white"><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{href === '/scan' && <span className="ml-auto rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-sidebar">NEW</span>}</Link>)}</div></div>)}</nav>
      </div>
      <div className="mt-auto px-5 pb-6">
        <div className="mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3.5"><div className="flex items-center gap-2 text-xs font-semibold text-white"><span className="h-2 w-2 rounded-full bg-emerald-400" />Offline-ready</div><p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/55">Changes are saved on this device and ready to sync.</p></div>
         <Link href="/settings" data-testid="link-settings" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"><Settings size={17} /><span>Settings</span></Link>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Close menu" data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden" />}
    <main className="min-w-0 flex-1">
       <header className="flex h-[58px] items-center justify-between border-b border-primary/20 bg-primary px-4 text-primary-foreground shadow-sm md:px-7">
         <div className="flex items-center gap-3"><Button variant="quiet" className="px-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden" data-testid="button-open-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></Button><div className="hidden items-center gap-2 text-xs text-primary-foreground/80 md:flex"><ShieldCheck size={15} className="text-accent" /> Private registrar workspace <span className="text-primary-foreground/35">/</span> <span className="font-semibold text-white">{nav.find(n => active(n.href))?.label ?? 'Settings'}</span></div></div>
          <div className="flex items-center gap-3"><Link href="/settings" className="hidden items-center gap-2 text-xs font-semibold text-primary-foreground/80 hover:text-white sm:flex"><Settings size={15} /> Settings</Link><div className="flex items-center gap-2 border border-accent/40 bg-primary-foreground/10 px-2.5 py-1.5 text-xs font-semibold text-white"><span className="h-2 w-2 rounded-full bg-accent" /> Archive active</div></div>
      </header>
       <div className="paper-grid min-h-[calc(100dvh-58px)] px-4 py-5 md:px-7 md:py-6">{children}</div>
    </main>
  </div>;
}

function Dashboard({ folders, activity }: { folders: StudentFolder[]; activity: Activity[] }) {
  const [, setLocation] = useLocation();
  const totalDocuments = folders.reduce((sum, folder) => sum + folder.documentCount, 0);
  const metrics: Array<{ label: string; value: string; sub: string; Icon: typeof FolderClosed; color: string }> = [
    { label: 'Total folders', value: String(folders.length), sub: 'student folders', Icon: FolderClosed, color: 'text-primary' },
    { label: 'Total documents', value: String(totalDocuments), sub: 'files indexed', Icon: FileCheck2, color: 'text-emerald-700' },
    { label: 'Archive status', value: 'ACTIVE', sub: '[Archive Location]', Icon: ShieldCheck, color: 'text-emerald-700' },
  ];
  return <div className="mx-auto max-w-[1340px] animate-enter">
    <SectionTitle eyebrow="Registrar E-Archiving System" title="Archive Dashboard" description="Current state of the local student document archive." action={<Button data-testid="button-dashboard-scan" onClick={() => setLocation('/scan')}><Plus size={16} /> Scan documents</Button>} />
    <div className="mb-5 grid gap-3 md:grid-cols-3">
      {metrics.map(({ label, value, sub, Icon, color }, i) => <div key={label} className="rounded-md border border-border bg-card p-4 shadow-[0_2px_6px_hsl(var(--primary)/.06)] hover:shadow-[0_5px_12px_hsl(var(--primary)/.1)] transition-shadow duration-300"><div className="flex items-start justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className={`rounded-md bg-secondary p-2 ${color}`}><Icon size={17} strokeWidth={1.8} /></div></div><div className="mt-3 flex items-end gap-2"><span className="mono text-3xl font-bold tracking-tight text-foreground">{value}</span><span className="mb-1 text-[11px] text-muted-foreground">{sub}</span></div><div className="mt-3 h-1 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${i === 2 ? 'w-[18%] bg-accent' : i === 1 ? 'w-[74%] bg-emerald-500' : 'w-[88%] bg-primary'}`} /></div></div>)}
    </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Link href="/scan" className="rounded-md border border-primary/40 bg-primary p-4 text-primary-foreground transition-all hover:shadow-lg hover:border-primary/60 hover:brightness-105"><div className="mb-2 w-fit rounded-md bg-primary-foreground/10 p-2"><Camera size={19} className="text-accent" /></div><h2 className="font-semibold">Scan documents</h2><p className="mt-1 text-xs text-primary-foreground/75">Capture or upload documents for a new student archive.</p></Link>
        <Link href="/search" className="rounded-md border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-secondary/50 hover:shadow-md"><div className="mb-2 w-fit rounded-md bg-secondary p-2"><SearchIcon size={19} className="text-primary" /></div><h2 className="font-semibold">Search archives</h2><p className="mt-1 text-xs text-muted-foreground">Find a student folder by name or school ID.</p></Link>
        <Link href="/scan" className="rounded-md border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-secondary/50 hover:shadow-md"><div className="mb-2 w-fit rounded-md bg-secondary p-2"><FolderClosed size={19} className="text-primary" /></div><h2 className="font-semibold">Create folder</h2><p className="mt-1 text-xs text-muted-foreground">Start a batch to create a student archive folder.</p></Link>
     </div>
      <div className="mt-5 rounded-md border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-4"><div><h2 className="text-base font-bold text-foreground">Archive location</h2><p className="mt-1 text-xs text-muted-foreground">The local folder used for new student archives.</p></div><Link href="/settings" className="text-xs font-bold text-primary hover:underline">Change location</Link></div><div className="flex items-center gap-3 rounded-md border border-primary/25 bg-secondary/60 px-3 py-3 text-sm hover:bg-secondary/80 transition-colors"><FolderClosed size={17} className="text-primary flex-shrink-0" /><span className="mono text-xs flex-1">[Archive Location]</span><Badge tone="green" className="flex-shrink-0">ACTIVE</Badge></div></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-md border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold text-foreground">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">Latest work completed on this device.</p></div><Link href="/activity" className="text-xs font-bold text-primary hover:underline">View all</Link></div>
          {activity.length ? <div className="divide-y divide-border">{activity.slice(0, 3).map(item => <div key={item.id} className="flex items-center gap-3 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary"><History size={15} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.action}</div><div className="truncate text-xs text-muted-foreground">{item.subject}</div></div><span className="text-[10px] text-muted-foreground">{item.timestamp}</span></div>)}</div> : <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-secondary/30 px-4 py-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-primary"><History size={15} /></div><div><div className="text-sm font-semibold">No activity yet</div><div className="mt-0.5 text-xs text-muted-foreground">Your saved batches will appear here.</div></div></div>}
        </div>
        <div className="rounded-md border border-primary/30 bg-primary p-5 text-primary-foreground shadow-sm">
          <div className="flex items-center gap-2 text-accent"><CircleHelp size={17} /><span className="text-xs font-bold uppercase tracking-wide">Getting started</span></div>
          <h2 className="mt-3 text-base font-bold text-white">Build a student archive</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-primary-foreground/75">Capture the documents, label each file, then save the complete batch locally.</p>
          <Link href="/scan" className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-bold text-accent-foreground hover:brightness-105">Start a batch <ArrowRight size={14} /></Link>
        </div>
      </div>
  </div>;
}

function SearchPage({ folders, documents }: { folders: StudentFolder[]; documents: ArchiveDocument[] }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => { const q = query.toLowerCase().trim(); if (!q) return folders; return folders.filter(f => `${f.name} ${f.schoolId}`.toLowerCase().includes(q)); }, [query, folders]);
  return <div className="mx-auto max-w-[1120px] animate-enter"><SectionTitle eyebrow="Find in archive" title="Search records" description="Look up a student by name or school ID. Results stay on this device." />
    <div className="relative mb-5"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={19} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} data-testid="input-search-records" placeholder="Search a student name or school ID…" className="h-14 w-full rounded-lg border border-primary/30 bg-card pl-12 pr-12 text-base shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary" />{query && <button aria-label="Clear search" data-testid="button-clear-search" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={17} /></button>}</div>
    <div className="mb-5 flex items-center justify-between"><span className="text-xs text-muted-foreground">{query ? `${results.length} matches for “${query}”` : 'Recent student folders'}</span><Button variant="outline" data-testid="button-search-filter"><SlidersHorizontal size={15} /> Filters</Button></div>
    <div className="overflow-hidden rounded-lg border border-border bg-card">{results.length ? <div className="divide-y divide-border">{results.map(folder => <div key={folder.schoolId} data-testid={`result-folder-${folder.schoolId}`} className="flex flex-wrap items-center gap-4 p-4 hover:bg-secondary/40"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary"><FolderClosed size={18} /></div><div className="min-w-[180px] flex-1"><div className="font-semibold">{folder.name}</div><div className="mono mt-1 text-[11px] text-muted-foreground">{folder.schoolId}</div></div><div className="hidden text-right sm:block"><div className="text-sm font-semibold">{folder.documentCount}</div><div className="text-[11px] text-muted-foreground">documents</div></div><div className="w-32"><Badge tone={folder.status === 'Complete' ? 'green' : folder.status === 'Needs review' ? 'amber' : 'blue'}>{folder.status}</Badge><div className="mt-1 text-[10px] text-muted-foreground">{folder.lastUpdated}</div></div><Button variant="outline" data-testid={`button-open-result-${folder.schoolId}`}>Open folder <ArrowRight size={14} /></Button></div>)}</div> : <EmptyState icon={<SearchIcon size={23} />} title="No records found" description="Try a full student name or a different school ID." action={<Button variant="outline" data-testid="button-reset-search" onClick={() => setQuery('')}>Clear search</Button>} />}</div>
     <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-lg border border-border bg-card/70 p-4"><div className="mono text-[10px] text-muted-foreground">SEARCH BY NAME</div><div className="mt-2 text-sm font-semibold">Use the complete student name</div><div className="mt-1 text-xs text-muted-foreground">Search results are matched against the local archive index.</div></div><div className="rounded-lg border border-border bg-card/70 p-4"><div className="mono text-[10px] text-muted-foreground">SEARCH BY ID</div><div className="mt-2 text-sm font-semibold">Enter the school ID</div><div className="mt-1 text-xs text-muted-foreground">Use the full student identifier for the most precise result.</div></div></div>
  </div>;
}

function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">{icon}</div><h3 className="serif mt-4 text-xl font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function ScanPage({ onActivity }: { onActivity: (action: string, subject: string, status?: string) => void }) {
  const [step, setStep] = useState(0);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [docs, setDocs] = useState<ArchiveDocument[]>([]);
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [manualCrop, setManualCrop] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const studentName = [lastName.trim(), [firstName.trim(), middleName.trim()].filter(Boolean).join(' ')].filter(Boolean).join(', ').toUpperCase();
  const folderName = studentName || '[LAST NAME], [FIRST NAME] [MIDDLE NAME]';
  const selected = docs.find(doc => doc.id === selectedDoc) ?? docs[0];
  const setName = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => setter(event.target.value.toUpperCase());
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    files.forEach((file, index) => {
      const add = (thumbnail?: string) => {
        const newDoc = { id: `${Date.now()}-${index}`, studentName, type: '', fileName: file.name, kind: file.type.includes('image') ? 'IMAGE' : 'PDF', status: 'Needs label', thumbnail };
        setDocs(prev => {
          const next = [...prev, newDoc];
          if (!selectedDoc) setSelectedDoc(newDoc.id);
          return next;
        });
      };
      if (file.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = () => add(typeof reader.result === 'string' ? reader.result : undefined);
        reader.readAsDataURL(file);
      } else add();
    });
    if (files.length) setStep(1);
    event.target.value = '';
  };
  const attachStream = (stream: MediaStream | null) => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  };
  useEffect(() => { attachStream(cameraStream); }, [cameraStream]);
  const startCamera = async (deviceId?: string) => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not available in this browser.');
      streamRef.current?.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraStream(stream);
      setCamera(true);
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'videoinput');
      setCameraDevices(devices);
      setSelectedCamera(deviceId ?? devices[0]?.deviceId ?? '');
    } catch {
      setCameraError('Unable to access camera. Please verify that the camera is connected and not being used by another application.');
    }
  };
  const openCamera = () => startCamera(selectedCamera || undefined);
  const changeCamera = (event: ChangeEvent<HTMLSelectElement>) => { setSelectedCamera(event.target.value); startCamera(event.target.value); };
  useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), []);
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const newDoc = { id: `${Date.now()}`, studentName, type: '', fileName: `CAMERA-CAPTURE-${docs.length + 1}.jpg`, kind: 'IMAGE', status: 'Needs label', thumbnail: canvas.toDataURL('image/jpeg', 0.92) };
    setDocs(prev => [...prev, newDoc]);
    setSelectedDoc(newDoc.id);
    setStep(1);
  };
  const updateLabel = (id: string, type: string) => setDocs(prev => prev.map(doc => doc.id === id ? { ...doc, type, studentName, status: type ? 'Labeled' : 'Needs label' } : doc));
  const deleteDoc = (id: string) => { setDocs(prev => prev.filter(doc => doc.id !== id)); setSelectedDoc(null); };
  const rotateDoc = (id: string) => setDocs(prev => prev.map(doc => doc.id === id ? { ...doc, rotation: ((doc.rotation ?? 0) + 90) % 360 } : doc));
  const cropDoc = (id: string, mode: 'auto' | 'manual') => { setManualCrop(mode === 'manual'); setDocs(prev => prev.map(doc => doc.id === id ? { ...doc, crop: mode } : doc)); };
  const complete = () => { onActivity('Archived batch', `${folderName} · ${docs.length} documents`); setStep(4); };
  const steps = ['Identify student', 'Add documents', 'Label documents', 'Review batch', 'Complete'];
  return <div className="mx-auto max-w-[1160px] animate-enter"><SectionTitle eyebrow="Archive operations" title="Scan documents" description="Capture, label, review, and archive a student document batch." />
    <div className="mb-7 flex items-center gap-1 overflow-x-auto pb-2">{steps.map((item, i) => <div key={item} className="flex min-w-max items-center gap-2"><div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step > i ? <Check size={14} /> : i + 1}</div><span className={`text-xs font-semibold ${step >= i ? 'text-foreground' : 'text-muted-foreground'}`}>{item}</span>{i < steps.length - 1 && <div className="mx-2 h-px w-8 bg-border md:w-14" />}</div>)}</div>
    {step === 0 && <div className="rounded-lg border border-border bg-card p-6"><div className="mb-5 flex items-center gap-2"><FolderClosed size={18} className="text-primary" /><h2 className="serif text-xl font-semibold">Student information</h2></div><p className="mb-6 text-sm text-muted-foreground">Enter the information used to identify and name the local archive folder.</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">LAST NAME *<input value={lastName} onChange={setName(setLastName)} data-testid="input-last-name" placeholder="[LAST NAME]" className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal uppercase outline-none focus:border-primary" /></label><label className="text-sm font-semibold">FIRST NAME *<input value={firstName} onChange={setName(setFirstName)} data-testid="input-first-name" placeholder="[FIRST NAME]" className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal uppercase outline-none focus:border-primary" /></label><label className="text-sm font-semibold">MIDDLE NAME<input value={middleName} onChange={setName(setMiddleName)} data-testid="input-middle-name" placeholder="[MIDDLE NAME]" className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal uppercase outline-none focus:border-primary" /></label><label className="text-sm font-semibold">STUDENT ID *<input value={schoolId} onChange={e => setSchoolId(e.target.value.toUpperCase())} data-testid="input-school-id" placeholder="[STUDENT ID]" className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal uppercase outline-none focus:border-primary" /></label></div><div className="mt-6 rounded-md border border-primary/20 bg-secondary/40 p-4"><div className="mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Folder name preview</div><div className="mt-2 font-semibold">{folderName}</div></div><Button className="mt-7" disabled={!lastName.trim() || !firstName.trim() || !schoolId.trim()} data-testid="button-begin-batch" onClick={() => setStep(1)}>Begin batch <ArrowRight size={16} /></Button></div>}
    {step === 1 && <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start justify-between"><div><h2 className="serif text-xl font-semibold">Scanned documents</h2><p className="mt-1 text-sm text-muted-foreground">{folderName} · {schoolId}</p></div><Badge tone="blue">{docs.length} documents</Badge></div><div className="mt-5 flex gap-2 overflow-x-auto border-b border-border pb-2">{docs.map((doc, index) => <button key={doc.id} type="button" onClick={() => setSelectedDoc(doc.id)} onMouseEnter={() => setHoveredDoc(doc.id)} onMouseLeave={() => setHoveredDoc(null)} className={`relative min-w-[122px] rounded-t-md border px-3 py-2 text-left text-xs font-semibold ${selected?.id === doc.id ? 'border-primary bg-secondary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:bg-secondary/50'}`}><span className="block truncate">{doc.type || `DOCUMENT ${index + 1}`}</span><span className="mt-1 block truncate text-[10px] font-normal">{doc.fileName}</span>{hoveredDoc === doc.id && <span className="absolute bottom-full left-0 z-20 mb-2 w-48 rounded-md border border-border bg-card p-2 shadow-lg">{doc.thumbnail ? <img src={doc.thumbnail} alt="" className="h-32 w-full rounded object-contain bg-muted" /> : <span className="flex h-32 items-center justify-center text-muted-foreground"><FileText size={24} /></span>}</span>}</button>)}<button type="button" onClick={openCamera} className="flex h-12 min-w-[54px] items-center justify-center rounded-md border border-dashed border-primary/40 text-primary hover:bg-secondary" aria-label="Add scan"><Plus size={18} /></button></div><label data-testid="dropzone-upload" className="scan-dash mt-5 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/25 bg-secondary/30 p-6 text-center hover:border-primary/60 hover:bg-secondary"><Upload className="text-primary" size={25} /><span className="mt-2 text-sm font-bold">Add scanned documents</span><span className="mt-1 text-xs text-muted-foreground">PDF, JPG, JPEG, PNG · files stay on this device</span><input data-testid="input-upload-documents" type="file" accept=".pdf,.jpg,.jpeg,.png,image/*" multiple className="hidden" onChange={addFiles} /></label><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" data-testid="button-camera-permission" onClick={openCamera}><Camera size={16} /> Scan document</Button><Button variant="quiet" data-testid="button-to-label" onClick={() => setStep(2)}>Continue to labeling <ArrowRight size={15} /></Button></div>{cameraError && <div role="alert" className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{cameraError}</div>}{camera && <div className="mt-5 overflow-hidden rounded-md border border-primary/20 bg-slate-950"><div className="flex items-center justify-between gap-3 border-b border-white/10 p-3"><span className="text-xs font-semibold text-white">Camera source</span><select value={selectedCamera} onChange={changeCamera} className="max-w-[220px] rounded border border-white/20 bg-slate-900 px-2 py-1 text-xs text-white"><option value="">Select camera</option>{cameraDevices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></div><div className="relative"><video ref={videoRef} autoPlay playsInline className="aspect-video w-full object-cover" /><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="flex aspect-[4/3] w-[72%] items-center justify-center rounded border-2 border-dashed border-accent/80 text-xs font-bold uppercase tracking-wider text-accent">Place document here</div></div></div><div className="flex items-center justify-between p-3"><span className="flex items-center gap-2 text-xs text-white"><span className="h-2 w-2 rounded-full bg-emerald-400" />Live camera feed</span><Button variant="gold" data-testid="button-capture-photo" onClick={capturePhoto}><Camera size={15} /> Capture</Button></div></div>}</div><div className="rounded-lg border border-border bg-card p-6"><div className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Current batch</div><div className="mt-4 rounded-md bg-secondary p-4"><div className="mono text-xs font-bold text-primary">{schoolId || '[STUDENT ID]'}</div><div className="mt-2 text-sm font-semibold">{folderName}</div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><WifiOff size={14} /> Local capture enabled</div></div>{selected && <div className="mt-5 overflow-hidden rounded-md border border-border bg-muted p-3"><div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected document</div>{selected.thumbnail ? <img src={selected.thumbnail} alt="" style={{ transform: `rotate(${selected.rotation ?? 0}deg)` }} className={`h-40 w-full rounded object-contain ${selected.crop ? 'bg-card' : ''}`} /> : <div className="flex h-40 items-center justify-center text-muted-foreground"><FileText size={32} /></div>}<div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" data-testid="button-auto-crop" onClick={() => cropDoc(selected.id, 'auto')}>Auto crop</Button><Button variant="outline" data-testid="button-manual-crop" onClick={() => cropDoc(selected.id, 'manual')}>Manual crop</Button><Button variant="outline" data-testid="button-rotate-document" onClick={() => rotateDoc(selected.id)}>Rotate</Button></div>{manualCrop && <p className="mt-2 text-[11px] text-muted-foreground">Manual crop mode enabled. Adjustments will be available in the desktop capture editor.</p>}<Button variant="quiet" className="mt-2 w-full" data-testid="button-delete-document" onClick={() => deleteDoc(selected.id)}>Delete document</Button></div>}<Button className="mt-6 w-full" disabled={!docs.length} data-testid="button-to-label" onClick={() => setStep(2)}>Next: label documents <ArrowRight size={15} /></Button></div></div>}
    {step === 2 && <div className="rounded-lg border border-border bg-card p-6"><div className="mb-5"><h2 className="serif text-xl font-semibold">Label documents</h2><p className="mt-1 text-sm text-muted-foreground">Assign a document type to each scanned file. Each label is independent.</p></div>{docs.length ? <div className="overflow-x-auto"><div className="min-w-[650px] divide-y divide-border rounded-md border border-border"><div className="grid grid-cols-[1.2fr_160px_1fr] gap-4 bg-secondary/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>Document</span><span>Preview</span><span>Label</span></div>{docs.map((doc, i) => <div key={doc.id} data-testid={`row-batch-document-${doc.id}`} className="grid grid-cols-[1.2fr_160px_1fr] items-center gap-4 px-4 py-4"><div><div className="truncate text-sm font-semibold">{doc.fileName}</div><div className="mono mt-1 text-[10px] text-muted-foreground">DOCUMENT {i + 1} · {doc.kind}</div></div><div className="h-16 w-24 overflow-hidden rounded border border-border bg-muted">{doc.thumbnail ? <img src={doc.thumbnail} alt="" style={{ transform: `rotate(${doc.rotation ?? 0}deg)` }} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><FileText size={20} /></div>}</div><div className="flex items-center gap-3"><select value={doc.type} onChange={event => updateLabel(doc.id, event.target.value)} data-testid={`select-document-type-${doc.id}`} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-xs font-semibold uppercase"><option value="">[SELECT DOCUMENT TYPE]</option>{documentTypes.map(type => <option key={type}>{type}</option>)}</select><Badge tone={doc.status === 'Labeled' ? 'green' : 'amber'}>{doc.status}</Badge></div></div>)}</div></div> : <EmptyState icon={<FilePlus2 size={22} />} title="No documents found." description="Add a scanned or uploaded document before labeling." action={<Button variant="outline" data-testid="button-back-upload" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back to capture</Button>} />}<div className="mt-6 flex justify-between border-t border-border pt-5"><Button variant="quiet" data-testid="button-back-step" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</Button><Button disabled={!docs.length || docs.some(doc => !doc.type)} data-testid="button-to-review" onClick={() => setStep(3)}>Review batch <ArrowRight size={15} /></Button></div></div>}
    {step === 3 && <div className="grid gap-6 lg:grid-cols-[1fr_300px]"><div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start justify-between"><div><h2 className="serif text-xl font-semibold">Review before archiving</h2><p className="mt-1 text-sm text-muted-foreground">Verify the folder name and every document label.</p></div><Badge tone="green"><Check size={12} /> Ready</Badge></div><div className="mt-6 rounded-md border border-border p-4"><div className="flex justify-between text-xs text-muted-foreground"><span>Folder</span><span className="font-semibold text-foreground">{folderName}</span></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Student ID</span><span className="mono font-semibold text-foreground">{schoolId}</span></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Documents</span><span className="font-semibold text-foreground">{docs.length} files</span></div></div><div className="mt-5 divide-y divide-border">{docs.map((doc, i) => <div key={doc.id} className="flex items-center gap-3 py-3"><FileCheck2 size={17} className="text-emerald-600" /><span className="flex-1 truncate text-sm">{doc.fileName || `DOCUMENT ${i + 1}`}</span><span className="text-xs font-semibold uppercase text-muted-foreground">{doc.type}</span></div>)}</div><div className="mt-6 flex justify-between border-t border-border pt-5"><Button variant="quiet" data-testid="button-back-labels" onClick={() => setStep(2)}><ArrowLeft size={15} /> Edit labels</Button><Button variant="gold" data-testid="button-archive-batch" onClick={complete}><Archive size={16} /> Create folder & save</Button></div></div><div className="rounded-lg border border-border bg-primary p-6 text-primary-foreground"><ShieldCheck className="text-accent" size={22} /><h3 className="serif mt-4 text-lg font-semibold">Final verification</h3><p className="mt-2 text-xs leading-relaxed text-primary-foreground/70">The folder will be created using the generated uppercase name and the labeled files will be saved to the configured archive location.</p></div></div>}
     {step === 4 && <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={31} /></div><div className="mono mt-6 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">Archive successfully created</div><h2 className="serif mt-2 text-3xl font-semibold">Archive saved locally</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">{studentName || '[Student Name]'}</strong> · {docs.length} documents indexed and ready to retrieve.</p><div className="mt-7 flex justify-center gap-3"><Button variant="outline" data-testid="button-new-batch" onClick={() => { setStep(0); setDocs([]); setLastName(''); setFirstName(''); setMiddleName(''); setSchoolId(''); }}>Start another batch</Button><Link href="/folders" data-testid="link-completed-folders" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">View folders <ArrowRight size={15} /></Link></div></div>}
  </div>;
}

function FoldersPage({ folders }: { folders: StudentFolder[] }) {
  const [filter, setFilter] = useState('');
  const list = folders.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));
  return <div className="mx-auto max-w-[1160px] animate-enter"><SectionTitle eyebrow="Archive index" title="Student folders" description="Alphabetical index of student records stored on this device." action={<Button variant="outline" data-testid="button-folder-sort"><ChevronDown size={15} /> A–Z</Button>} /><div className="mb-5 flex gap-3"><div className="relative max-w-sm flex-1"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input value={filter} onChange={e => setFilter(e.target.value)} data-testid="input-filter-folders" placeholder="Filter folders…" className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-primary" /></div><Button variant="outline" data-testid="button-folder-filter"><ListFilter size={15} /> Status</Button></div><div className="overflow-hidden rounded-lg border border-border bg-card"><div className="hidden grid-cols-[1fr_150px_110px_170px_125px] gap-4 border-b border-border bg-secondary/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>Student</span><span>School ID</span><span>Documents</span><span>Last updated</span><span>Status</span></div>{list.length ? <div className="divide-y divide-border">{list.map(f => <div key={f.schoolId} data-testid={`row-folder-${f.schoolId}`} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_150px_110px_170px_125px] md:items-center md:gap-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary"><FolderClosed size={17} /></div><span className="font-semibold">{f.name}</span></div><span className="mono text-xs text-muted-foreground">{f.schoolId}</span><span className="text-sm">{f.documentCount} <span className="text-xs text-muted-foreground">files</span></span><span className="text-xs text-muted-foreground">{f.lastUpdated}</span><span><Badge tone={f.status === 'Complete' ? 'green' : f.status === 'Needs review' ? 'amber' : 'blue'}>{f.status}</Badge></span></div>)}</div> : <EmptyState icon={<FolderClosed size={22} />} title="No matching folders" description="Try a different student name." />}</div></div>;
}

function DocumentsPage({ documents }: { documents: ArchiveDocument[] }) {
  const [type, setType] = useState('All types');
  const filtered = type === 'All types' ? documents : documents.filter(d => d.type === type);
  const types = ['All types', ...Array.from(new Set(documents.map(d => d.type)))];
  return <div className="mx-auto max-w-[1160px] animate-enter"><SectionTitle eyebrow="Document register" title="Documents" description="A flat view across every student folder, useful for review queues." action={<Button variant="outline" data-testid="button-documents-export"><Copy size={15} /> Copy register</Button>} /><div className="mb-5 flex items-center justify-between gap-3"><div className="flex gap-1 overflow-x-auto rounded-md border border-border bg-card p-1">{types.map(t => <button key={t} onClick={() => setType(t)} data-testid={`button-type-${t.toLowerCase().replaceAll(' ', '-')}`} className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold ${type === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>{t}</button>)}</div><span className="mono hidden text-[10px] text-muted-foreground sm:block">{filtered.length} RECORDS</span></div><div className="overflow-hidden rounded-lg border border-border bg-card"><div className="hidden grid-cols-[1fr_1.2fr_150px_100px] gap-4 border-b border-border bg-secondary/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>File</span><span>Student</span><span>Type</span><span>Status</span></div>{filtered.map(d => <div key={d.id} data-testid={`row-document-${d.id}`} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_1.2fr_150px_100px] md:items-center md:gap-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">{d.kind === 'IMAGE' ? <FileImage size={17} /> : <FileText size={17} />}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{d.fileName}</div><div className="mono text-[10px] text-muted-foreground">{d.kind}</div></div></div><span className="text-sm">{d.studentName}</span><span className="text-xs text-muted-foreground">{d.type}</span><span><Badge tone={d.status === 'Archived' ? 'green' : 'amber'}>{d.status}</Badge></span></div>)}</div></div>;
}

function ActivityPage({ activity }: { activity: Activity[] }) {
  return <div className="mx-auto max-w-[920px] animate-enter"><SectionTitle eyebrow="Local audit trail" title="Activity" description="A quiet record of work completed on this device." action={<Button variant="outline" data-testid="button-refresh-activity"><RotateCcw size={15} /> Refresh</Button>} /><div className="rounded-lg border border-border bg-card p-6"><div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><History size={15} className="text-primary" /> Latest first · retained locally</div><div className="divide-y divide-border">{activity.map(a => <div key={a.id} data-testid={`activity-event-${a.id}`} className="flex gap-4 py-5"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${a.status === 'success' ? 'bg-emerald-50 text-emerald-700' : a.status === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-secondary text-primary'}`}>{a.status === 'success' ? <CheckCircle2 size={17} /> : <FileArchive size={17} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">{a.action}</span><span className="mono text-[10px] text-muted-foreground">{a.timestamp}</span></div><p className="mt-1 text-sm text-muted-foreground">{a.subject}</p></div></div>)}</div></div></div>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [location, setLocation] = useState('[Archive Location]');
  const [offline, setOffline] = useState(true);
  return <div className="mx-auto max-w-[900px] animate-enter"><SectionTitle eyebrow="System configuration" title="Settings" description="Configure the local archive and document labeling preferences." /><div className="space-y-5"><div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start gap-4"><div className="rounded-md bg-secondary p-2 text-primary"><Archive size={19} /></div><div className="flex-1"><h2 className="font-semibold">Archive location</h2><p className="mt-1 text-xs text-muted-foreground">The local folder where student archives are stored.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={location} onChange={e => setLocation(e.target.value)} data-testid="input-archive-location" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" /><Button variant="outline" data-testid="button-choose-location">Browse</Button></div></div></div></div><div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start gap-4"><div className="rounded-md bg-emerald-50 p-2 text-emerald-700"><CloudOff size={19} /></div><div className="flex-1"><h2 className="font-semibold">Offline operation</h2><p className="mt-1 text-xs text-muted-foreground">Documents remain on this device and are not uploaded to external services.</p><div className="mt-4 flex items-center justify-between rounded-md border border-border bg-secondary/40 p-3"><span className="text-sm font-semibold">{offline ? 'Enabled for this device' : 'Paused'}</span><button role="switch" aria-checked={offline} data-testid="switch-offline-mode" onClick={() => setOffline(!offline)} className={`relative h-6 w-11 rounded-full ${offline ? 'bg-emerald-600' : 'bg-muted-foreground/30'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${offline ? 'left-6' : 'left-1'}`} /></button></div></div></div></div><div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start gap-4"><div className="rounded-md bg-secondary p-2 text-primary"><SlidersHorizontal size={19} /></div><div><h2 className="font-semibold">Document type preferences</h2><p className="mt-1 text-xs text-muted-foreground">Types shown when labeling a new capture.</p><div className="mt-4 flex flex-wrap gap-2">{['Transcript of Records', 'Form 137', 'Birth Certificate', 'Honorable Dismissal', 'Certificate of Graduation'].map((t, i) => <span key={t} className={`rounded-md border px-3 py-2 text-xs font-semibold ${i < 3 ? 'border-primary/20 bg-secondary text-primary' : 'border-border text-muted-foreground'}`}>{t}</span>)}</div></div></div></div><div className="flex items-center justify-end gap-3">{saved && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check size={14} /> Saved locally</span>}<Button data-testid="button-save-settings" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}>Save settings</Button></div></div></div>;
}

function Router() {
  const [folders] = useState(initialFolders);
  const [documents, setDocuments] = useState(initialDocuments);
  const [activity, setActivity] = useState(initialActivity);
  const addActivity = (action: string, subject: string, status = 'success') => { const item = { id: `local-${Date.now()}`, timestamp: 'Just now', action, subject, status }; setActivity(prev => [item, ...prev]); if (action === 'Archived batch') setDocuments(prev => [...prev]); };
  return <ErrorBoundary resetKey={location.pathname}><Shell><Switch><Route path="/" component={() => <Dashboard folders={folders} activity={activity} />} /><Route path="/search" component={() => <SearchPage folders={folders} documents={documents} />} /><Route path="/scan" component={() => <ScanPage onActivity={addActivity} />} /><Route path="/folders" component={() => <FoldersPage folders={folders} />} /><Route path="/documents" component={() => <DocumentsPage documents={documents} />} /><Route path="/activity" component={() => <ActivityPage activity={activity} />} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;