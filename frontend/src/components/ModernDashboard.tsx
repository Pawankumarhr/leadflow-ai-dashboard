import { AnimatePresence, motion } from 'framer-motion';
import {
	Activity,
	ArrowUpDown,
	BadgeCheck,
	BarChart3,
	Download,
	ChevronDown,
	ChevronRight,
	Clock3,
	Edit3,
	Eye,
	LayoutDashboard,
	LineChart as LineChartIcon,
	LogOut,
	MoreHorizontal,
	Plus,
	Search,
	Settings,
	Shield,
	Sparkles,
	Sun,
	Moon,
	Trash2,
	Users,
	X,
} from 'lucide-react';
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { request } from '../api/client';

import { mockLeads } from '../data/mockLeads';
import type {
	Lead,
	LeadActivity,
	LeadForm,
	LeadNote,
	LeadSource,
	LeadStatus,
	User,
} from '../types';

type Theme = 'light' | 'dark';
type DashboardView = 'dashboard' | 'leads' | 'analytics';
type SortKey = 'createdAt' | 'name' | 'company' | 'status' | 'source';
type SortDirection = 'asc' | 'desc';
type PanelMode = 'add' | 'edit' | null;
type PanelTab = 'details' | 'notes' | 'activity';

type ModernDashboardProps = {
	theme: Theme;
	user: User | null;
	initialView: DashboardView;
	onToggleTheme: () => void;
	onLogout: () => void;
};

const navItems: Array<{ key: DashboardView; label: string; icon: typeof LayoutDashboard }> = [
	{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ key: 'leads', label: 'Leads', icon: Users },
	{ key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const sourceLabels: Record<LeadSource, string> = {
	website: 'Website',
	referral: 'Referral',
	social: 'Social',
	cold_call: 'Cold Call',
	event: 'Event',
	linkedin: 'LinkedIn',
	instagram: 'Instagram',
	cold_email: 'Cold Email',
};

const statusLabels: Record<LeadStatus, string> = {
	new: 'New',
	contacted: 'Contacted',
	qualified: 'Qualified',
	converted: 'Converted',
	lost: 'Lost',
	pending: 'Pending',
};

const statusAccent: Record<LeadStatus, string> = {
	new: 'from-sky-500 to-blue-500',
	contacted: 'from-amber-500 to-orange-500',
	qualified: 'from-lime-500 to-emerald-500',
	converted: 'from-emerald-500 to-cyan-500',
	lost: 'from-rose-500 to-red-500',
	pending: 'from-violet-500 to-fuchsia-500',
};

const statusRing: Record<LeadStatus, string> = {
	new: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
	contacted: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
	qualified: 'border-lime-500/20 bg-lime-500/10 text-lime-300',
	converted: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
	lost: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
	pending: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
};

const sourceColors = ['#22d3ee', '#2563eb', '#14b8a6', '#60a5fa', '#818cf8', '#a855f7', '#f472b6', '#f59e0b'];
const sourceColorClasses = ['bg-[#22d3ee]', 'bg-[#2563eb]', 'bg-[#14b8a6]', 'bg-[#60a5fa]', 'bg-[#818cf8]', 'bg-[#a855f7]', 'bg-[#f472b6]', 'bg-[#f59e0b]'];
const statusColors = ['#06b6d4', '#f59e0b', '#84cc16', '#10b981', '#ef4444', '#7c3aed'];

const emptyLeadForm: LeadForm = {
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	company: '',
	source: 'website',
	status: 'new',
	notes: '',
};

const pageSize = 10;

function useDebouncedValue<T>(value: T, delay = 220) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
		return () => window.clearTimeout(timeout);
	}, [value, delay]);

	return debouncedValue;
}

function useCountUp(target: number, duration = 700) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		let frameId = 0;
		const start = performance.now();

		const step = (time: number) => {
			const progress = Math.min((time - start) / duration, 1);
			setValue(Math.round(target * progress));
			if (progress < 1) {
				frameId = window.requestAnimationFrame(step);
			}
		};

		frameId = window.requestAnimationFrame(step);

		return () => window.cancelAnimationFrame(frameId);
	}, [duration, target]);

	return value;
}

function initials(firstName: string, lastName: string) {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateTime(value: string) {
	return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function CountCard({ label, value, delta, tone }: { label: string; value: number; delta: string; tone: string }) {
	const animatedValue = useCountUp(value);

	return (
		<motion.article
			whileHover={{ y: -4, scale: 1.01 }}
			transition={{ type: 'spring', stiffness: 280, damping: 22 }}
			className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">{label}</p>
					  <p className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--text)]">{animatedValue}</p>
					<p className={`mt-2 text-sm font-medium ${tone}`}>{delta}</p>
				</div>
				<div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-3 text-[color:var(--primary-accent)] shadow-inner shadow-white/10">
					<BadgeCheck size={18} />
				</div>
			</div>
		</motion.article>
	);
}

function DrawerField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className="grid gap-2">
			<span className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</span>
			{children}
		</label>
	);
}

function StatusPill({ status }: { status: LeadStatus }) {
	return (
		<span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusRing[status]}`}>
			{statusLabels[status]}
		</span>
	);
}

function LeadAvatar({ lead }: { lead: Lead }) {
	return (
		<div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(37,99,235,0.18))] text-sm font-semibold text-[color:var(--text)] ring-1 ring-inset ring-[color:var(--border)]">
			{initials(lead.firstName, lead.lastName)}
		</div>
	);
}

function ModernDashboard({ theme, user, initialView, onToggleTheme, onLogout }: ModernDashboardProps) {
	const navigate = useNavigate();
	const [activeView, setActiveView] = useState<DashboardView>(initialView);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebouncedValue(search, 250);
	const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
	const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all');
	const [sortKey, setSortKey] = useState<SortKey>('createdAt');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [isTransitioning, setIsTransitioning] = useState(true);
	const [leads, setLeads] = useState<Lead[]>(mockLeads);
	const [panelMode, setPanelMode] = useState<PanelMode>(null);
	const [panelTab, setPanelTab] = useState<PanelTab>('details');
	const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
	const [draftLead, setDraftLead] = useState<LeadForm>(emptyLeadForm);
	const [noteDraft, setNoteDraft] = useState('');
	const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const roleLabel = user?.role === 'admin'
		? 'Admin'
		: user?.role === 'manager'
			? 'Manager'
			: user?.role === 'viewer'
				? 'Viewer'
				: 'Sales staff';
	const [toast, setToast] = useState<string | null>(null);
	const topRef = useRef<HTMLDivElement | null>(null);

	const activeLead = useMemo(
		() => leads.find((lead) => lead._id === selectedLeadId) ?? null,
		[leads, selectedLeadId]
	);

	const flatActivities = useMemo(
		() => leads.flatMap((lead) => (lead.activities || []).map((activity) => ({ ...activity, leadName: `${lead.firstName} ${lead.lastName}` }))),
		[leads]
	);

	const [remoteStats, setRemoteStats] = useState<null | {
		totals: Record<string, number>;
		byStatus: Array<{ status: string; count: number; label?: string; color?: string }>;
		bySource: Array<{ source: string; count: number; label?: string; color?: string }>;
	}>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const payload = await request<{ totals: Record<string, number>; byStatus: Array<{ status: string; count: number; label?: string; color?: string }>; bySource: Array<{ source: string; count: number; label?: string; color?: string }> }>('/api/analytics');
				if (!mounted) return;
				setRemoteStats({ totals: payload.totals, byStatus: payload.byStatus, bySource: payload.bySource });
			} catch {
				// ignore - fallback to client-side mock
			}
		})();
		return () => { mounted = false; };
	}, []);

	const chartStatusData = useMemo(() => {
		if (remoteStats && Array.isArray(remoteStats.byStatus) && remoteStats.byStatus.length) {
			const order: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost', 'pending'];
			return order.map((s, index) => {
				const found = remoteStats.byStatus.find((r) => r.status === s);
				return {
					name: found?.label || statusLabels[s],
					value: found?.count || 0,
					color: found?.color || statusColors[index % statusColors.length],
				};
			});
		}
		return ['new', 'contacted', 'qualified', 'converted', 'lost', 'pending'].map((status, index) => ({
			name: statusLabels[status as LeadStatus],
			value: leads.filter((lead) => lead.status === status).length,
			color: statusColors[index % statusColors.length],
		}));
	}, [leads, remoteStats]);

	const chartSourceData = useMemo(() => {
		const sources: LeadSource[] = ['website', 'referral', 'social', 'cold_call', 'event', 'linkedin', 'instagram', 'cold_email'];

		if (remoteStats && Array.isArray(remoteStats.bySource) && remoteStats.bySource.length) {
			return sources.map((source, index) => {
				const found = remoteStats.bySource.find((r) => r.source === source);
				return {
					name: found?.label || sourceLabels[source],
					value: (found?.count) || 0,
					color: found?.color || sourceColors[index % sourceColors.length],
				};
			});
		}

		return sources.map((source, index) => ({
			name: sourceLabels[source],
			value: leads.filter((lead) => lead.source === source).length,
			color: sourceColors[index % sourceColors.length],
		}));
	}, [leads, remoteStats]);

	const chartTrendData = useMemo(() => {
		const buckets = [
			{ name: 'Week 1', value: 8 },
			{ name: 'Week 2', value: 12 },
			{ name: 'Week 3', value: 9 },
			{ name: 'Week 4', value: 16 },
			{ name: 'Week 5', value: 13 },
			{ name: 'Week 6', value: 19 },
		];
		return buckets;
	}, []);

	const metrics = useMemo(() => {
		const total = leads.length;
		const qualified = leads.filter((lead) => lead.status === 'qualified').length;
		const converted = leads.filter((lead) => lead.status === 'converted').length;
		const lost = leads.filter((lead) => lead.status === 'lost').length;
		return { total, qualified, converted, lost };
	}, [leads]);

	const filteredLeads = useMemo(() => {
		const query = debouncedSearch.trim().toLowerCase();

		const visible = leads.filter((lead) => {
			const haystack = `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.company || ''}`.toLowerCase();
			const matchesSearch = !query || haystack.includes(query);
			const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
			const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
			return matchesSearch && matchesStatus && matchesSource;
		});

		visible.sort((left, right) => {
			const compareValue = (lead: Lead) => {
				if (sortKey === 'name') return `${lead.firstName} ${lead.lastName}`.toLowerCase();
				if (sortKey === 'company') return (lead.company || '').toLowerCase();
				if (sortKey === 'status') return lead.status;
				if (sortKey === 'source') return lead.source;
				return lead.activities?.[0]?.createdAt || lead.notesLog?.[0]?.createdAt || '';
			};

			const leftValue = compareValue(left);
			const rightValue = compareValue(right);

			if (typeof leftValue === 'string' && typeof rightValue === 'string') {
				return sortDirection === 'asc'
					? leftValue.localeCompare(rightValue)
					: rightValue.localeCompare(leftValue);
			}

			return 0;
		});

		return visible;
	}, [debouncedSearch, leads, sourceFilter, sortDirection, sortKey, statusFilter]);

	const totalPages = Math.max(Math.ceil(filteredLeads.length / pageSize), 1);
	const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const visibleLead = panelMode ? activeLead : null;

	const showToast = (message: string) => {
		setToast(message);
		window.setTimeout(() => setToast(null), 2400);
	};

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	useEffect(() => {
		setActiveView(initialView);
	}, [initialView]);

	useEffect(() => {
		setIsTransitioning(true);
		const timeout = window.setTimeout(() => setIsTransitioning(false), 420);
		return () => window.clearTimeout(timeout);
	}, [debouncedSearch, currentPage, sortDirection, sortKey, sourceFilter, statusFilter]);

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setSettingsOpen(false);
				setOpenActionMenuId(null);
				if (panelMode) {
					closePanel();
				}
				if (showLogoutModal) {
					setShowLogoutModal(false);
				}
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [panelMode, showLogoutModal]);

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	useEffect(() => {
		const onOutsideClick = () => setOpenActionMenuId(null);
		window.addEventListener('click', onOutsideClick);
		return () => window.removeEventListener('click', onOutsideClick);
	}, []);

	const navigateTo = (view: DashboardView) => {
		setActiveView(view);
		setSettingsOpen(false);
		setOpenActionMenuId(null);
		navigate(view === 'dashboard' ? '/dashboard' : `/${view}`);
		topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const openLeadPanel = (lead: Lead, mode: PanelMode) => {
		setPanelMode(mode);
		setPanelTab('details');
		setSelectedLeadId(lead._id);
		setDraftLead({
			firstName: lead.firstName,
			lastName: lead.lastName,
			email: lead.email,
			phone: lead.phone || '',
			company: lead.company || '',
			source: lead.source,
			status: lead.status,
			notes: lead.notes || '',
		});
		setNoteDraft('');
	};

	const openAddPanel = () => {
		setPanelMode('add');
		setPanelTab('details');
		setSelectedLeadId(null);
		setDraftLead(emptyLeadForm);
		setNoteDraft('');
		setOpenActionMenuId(null);
	};

	const closePanel = () => {
		setPanelMode(null);
		setSelectedLeadId(null);
		setNoteDraft('');
	};

	const updateDraftLead = <K extends keyof LeadForm>(key: K, value: LeadForm[K]) => {
		setDraftLead((previous) => ({ ...previous, [key]: value }));
	};

	const updateLeadRecord = (leadId: string, updates: Partial<Lead>) => {
		setLeads((previous) => previous.map((lead) => (lead._id === leadId ? { ...lead, ...updates } : lead)));
	};

	const saveLead = () => {
		const payload: Lead = {
			_id: selectedLeadId || `lead-${Date.now()}`,
			firstName: draftLead.firstName.trim(),
			lastName: draftLead.lastName.trim(),
			email: draftLead.email.trim(),
			phone: draftLead.phone.trim(),
			company: draftLead.company.trim(),
			source: draftLead.source,
			status: draftLead.status,
			notes: draftLead.notes.trim(),
			notesLog: visibleLead?.notesLog || [],
			activities: visibleLead?.activities || [],
		};

		if (!payload.firstName || !payload.lastName || !payload.email) {
			showToast('First name, last name, and email are required.');
			return;
		}

		if (panelMode === 'add') {
			setLeads((previous) => [
				{
					...payload,
					notesLog: [
						{
							_id: `note-${Date.now()}`,
							text: payload.notes || 'Lead created.',
							createdAt: new Date().toISOString(),
						},
					],
					activities: [
						{
							type: 'created',
							message: 'Lead created from the CRM panel.',
							createdAt: new Date().toISOString(),
						},
					],
				},
				...previous,
			]);
			setCurrentPage(1);
			showToast('Lead created successfully.');
			closePanel();
			return;
		}

		if (selectedLeadId) {
			updateLeadRecord(selectedLeadId, payload);
			showToast('Lead updated.');
			closePanel();
		}
	};

	const deleteLead = (leadId: string) => {
		setLeads((previous) => previous.filter((lead) => lead._id !== leadId));
		showToast('Lead deleted.');
		if (selectedLeadId === leadId) {
			closePanel();
		}
	};

	const addNote = () => {
		if (!visibleLead || !noteDraft.trim()) return;

		const note: LeadNote = {
			_id: `note-${Date.now()}`,
			text: noteDraft.trim(),
			createdAt: new Date().toISOString(),
		};

		updateLeadRecord(visibleLead._id, {
			notesLog: [...(visibleLead.notesLog || []), note],
			activities: [
				...(visibleLead.activities || []),
				{
					type: 'updated',
					message: `Note added for ${visibleLead.firstName} ${visibleLead.lastName}.`,
					createdAt: new Date().toISOString(),
				},
			],
		});
		setNoteDraft('');
		setPanelTab('notes');
		showToast('Note added.');
	};

	const deleteNote = (noteId: string) => {
		if (!visibleLead) return;
		updateLeadRecord(visibleLead._id, {
			notesLog: (visibleLead.notesLog || []).filter((note) => note._id !== noteId),
			activities: [
				...(visibleLead.activities || []),
				{
					type: 'updated',
					message: 'A note was deleted.',
					createdAt: new Date().toISOString(),
				},
			],
		});
		showToast('Note deleted.');
	};

	const exportCsv = () => {
		const rows = [
			['Name', 'Email', 'Company', 'Status', 'Source'],
			...filteredLeads.map((lead) => [
				`${lead.firstName} ${lead.lastName}`,
				lead.email,
				lead.company || '',
				statusLabels[lead.status],
				sourceLabels[lead.source],
			]),
		];
		const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'leadflow-leads.csv';
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
		showToast('CSV exported.');
	};

	const confirmLogout = () => {
		onLogout();
		setShowLogoutModal(false);
		navigate('/login');
	};

	const activeLeadActivities = useMemo(() => {
		if (!visibleLead?.activities) return [];
		return visibleLead.activities.slice().reverse();
	}, [visibleLead]);

	const recentActivities = useMemo(
		() => flatActivities.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5),
		[flatActivities]
	);

	const kpiCards = [
		{ label: 'Total leads', value: metrics.total, delta: '+12 this week', tone: 'text-sky-500 dark:text-cyan-300' },
		{ label: 'Qualified', value: metrics.qualified, delta: '+5 this week', tone: 'text-emerald-500 dark:text-lime-300' },
		{ label: 'Converted', value: metrics.converted, delta: '+3 this week', tone: 'text-cyan-500 dark:text-sky-300' },
		{ label: 'Lost', value: metrics.lost, delta: '+2 this week', tone: 'text-rose-500 dark:text-rose-300' },
	];

	const renderMain = () => {
		const intro = activeView === 'leads' ? 'All Leads' : activeView === 'analytics' ? 'Analytics' : 'Dashboard';
		const subTitle = activeView === 'leads' ? 'Manage, filter, and update every lead' : activeView === 'analytics' ? 'Pipeline health and conversion intelligence' : 'Premium CRM command center';

		return (
			<>
				<section ref={topRef} className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">{intro}</p>
							<h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)]">Lead Pipeline</h1>
							<p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">{subTitle}</p>
						</div>

						<div className="flex flex-col gap-3 md:flex-row md:items-center">
							<div className="relative min-w-[280px] flex-1">
								<Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
								<input
									value={search}
									onChange={(event) => {
										setSearch(event.target.value);
										setCurrentPage(1);
									}}
									placeholder="Search name, email, company..."
									className="w-full rounded-2xl border border-[color:var(--border)] bg-white/80 py-3.5 pl-10 pr-4 text-sm text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5"
								/>
							</div>

							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => { if (theme === 'dark') onToggleTheme(); }}
									aria-label="Set light theme"
									className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ring-1 ring-[color:var(--border)] ${theme === 'light' ? 'bg-[color:var(--primary-accent)] text-white shadow-[0_18px_40px_rgba(34,211,238,0.18)]' : 'bg-[color:var(--secondary-surface)] text-[color:var(--text)]'}`}
								>
									<span className={`grid h-7 w-7 place-items-center rounded-lg ${theme === 'light' ? 'bg-white text-[color:var(--primary-accent)]' : 'bg-[color:var(--secondary-surface)] text-[color:var(--muted)]'}`}><Sun size={16} /></span>
								</button>

								<button
									type="button"
									onClick={() => { if (theme === 'light') onToggleTheme(); }}
									aria-label="Set dark theme"
									className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ring-1 ring-[color:var(--border)] ${theme === 'dark' ? 'bg-[color:var(--primary-accent)] text-white shadow-[0_18px_40px_rgba(34,211,238,0.18)]' : 'bg-[color:var(--secondary-surface)] text-[color:var(--text)]'}`}
								>
									<span className={`grid h-7 w-7 place-items-center rounded-lg ${theme === 'dark' ? 'bg-white text-[color:var(--primary-accent)]' : 'bg-[color:var(--secondary-surface)] text-[color:var(--muted)]'}`}><Moon size={16} /></span>
								</button>

								<button
									type="button"
									onClick={exportCsv}
									className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(34,211,238,0.12)] dark:bg-white/5"
								>
									<Download size={16} />
									Export CSV
								</button>
								<button
									type="button"
									onClick={openAddPanel}
									className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--primary-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(34,211,238,0.25)]"
								>
									<Plus size={16} />
									Add Lead
								</button>
							</div>
						</div>
					</div>
				</section>

				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{kpiCards.map((card) => (
						<CountCard key={card.label} label={card.label} value={card.value} delta={card.delta} tone={card.tone} />
					))}
				</section>

				<section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
					<motion.div
						whileHover={{ y: -2 }}
						className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
					>
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">Pipeline funnel</p>
								<h2 className="mt-1 text-xl font-semibold text-[color:var(--text)]">Animated progress bars</h2>
							</div>
							<div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--secondary-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
								<Sparkles size={14} />
								Live view
							</div>
						</div>

						<div className="mt-6 grid gap-4">
							{(['new', 'contacted', 'qualified', 'converted', 'lost'] as LeadStatus[]).map((status) => {
								const count = leads.filter((lead) => lead.status === status).length;
								const maxValue = Math.max(...(['new', 'contacted', 'qualified', 'converted', 'lost'] as LeadStatus[]).map((entry) => leads.filter((lead) => lead.status === entry).length), 1);
								return (
									<div key={status} className="grid gap-2">
										<div className="flex items-center justify-between text-sm">
											<span className="font-medium text-[color:var(--text)]">{statusLabels[status]}</span>
											<span className="text-[color:var(--muted)]">{count}</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
											<motion.div
												key={`${status}-${count}`}
												initial={{ scaleX: 0 }}
												animate={{ scaleX: count / maxValue }}
												transition={{ duration: 0.8, ease: 'easeOut' }}
												className={`h-full origin-left rounded-full bg-gradient-to-r ${statusAccent[status]}`}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</motion.div>

					<motion.div
						whileHover={{ y: -2 }}
						className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
					>
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">Recent activity</p>
								<h2 className="mt-1 text-xl font-semibold text-[color:var(--text)]">Latest updates</h2>
							</div>
							<Clock3 size={18} className="text-[color:var(--muted)]" />
						</div>

						<div className="mt-6 grid gap-3">
							{recentActivities.map((activity) => (
								<div key={`${activity.createdAt}-${activity.leadName}`} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[color:var(--primary-accent)] shadow-sm dark:bg-slate-950">
											<Activity size={16} />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-[color:var(--text)]">{activity.leadName}</p>
											<p className="mt-1 text-sm text-[color:var(--muted)]">{activity.message}</p>
											<p className="mt-2 text-xs text-[color:var(--muted)]">{formatDateTime(activity.createdAt)}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</motion.div>
				</section>

				<section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
					<motion.div
						whileHover={{ y: -2 }}
						className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
					>
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">Analytics</p>
								<h2 className="mt-1 text-xl font-semibold text-[color:var(--text)]">Leads charts</h2>
							</div>
							  <LineChartIcon size={18} className="text-[color:var(--muted)]" />
						</div>

							<div className="mt-6 grid gap-5 grid-cols-1">
							<div className="min-h-[420px] rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-6">
								<p className="mb-3 text-sm font-semibold text-[color:var(--text)]">Status distribution</p>
								<ResponsiveContainer width="100%" height={280}>
									<BarChart data={chartStatusData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
										<XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 13 }} stroke="rgba(148,163,184,0.18)" padding={{ left: 8, right: 12 }} />
										<YAxis tick={{ fill: 'currentColor', fontSize: 13 }} stroke="rgba(148,163,184,0.18)" />
										<Tooltip />
										<Bar dataKey="value" radius={[14, 14, 8, 8]}>
											{chartStatusData.map((entry) => (
												<Cell key={entry.name} fill={entry.color || '#60a5fa'} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>

							<div className="min-h-[420px] rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-6">
								<p className="mb-3 text-sm font-semibold text-[color:var(--text)]">Source mix</p>
								<ResponsiveContainer width="100%" height={240}>
									<PieChart>
										<Pie data={chartSourceData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={104} paddingAngle={6}>
											{chartSourceData.map((entry) => (
												<Cell key={entry.name} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>

								<div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-xs text-[color:var(--muted)] sm:grid-cols-2">
									{chartSourceData.map((entry, index) => (
										<div key={entry.name} className="flex min-w-0 items-center gap-2">
											<span className={`inline-block h-3 w-3 rounded-full ${sourceColorClasses[index % sourceColorClasses.length]}`} />
											<span className="truncate">{entry.name}</span>
										</div>
									))}
								</div>
							</div>

							<div className="min-h-[360px] rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-6">
								<p className="mb-3 text-sm font-semibold text-[color:var(--text)]">Weekly lead trend</p>
								<ResponsiveContainer width="100%" height={250}>
									<LineChart data={chartTrendData} margin={{ left: -8, right: 18, top: 8, bottom: 4 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
										<XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 13 }} stroke="rgba(148,163,184,0.18)" padding={{ left: 8, right: 20 }} />
										<YAxis tick={{ fill: 'currentColor', fontSize: 13 }} stroke="rgba(148,163,184,0.18)" />
										<Tooltip />
										<Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={4} dot={{ r: 6 }} />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>
					</motion.div>

					<motion.div
						whileHover={{ y: -2 }}
						className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
					>
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">Filter chips</p>
								<h2 className="mt-1 text-xl font-semibold text-[color:var(--text)]">Quick filters</h2>
							</div>
							<button
								type="button"
								onClick={() => {
									setStatusFilter('all');
									setSourceFilter('all');
									setSortKey('createdAt');
									setSortDirection('desc');
									setCurrentPage(1);
									setSearch('');
									showToast('Filters cleared.');
								}}
								className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 dark:bg-white/5"
							>
								Reset
							</button>
						</div>

						<div className="mt-5 flex flex-wrap gap-2">
							{(['all', 'new', 'contacted', 'qualified', 'converted', 'lost', 'pending'] as Array<'all' | LeadStatus>).map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => {
										setStatusFilter(status);
										setCurrentPage(1);
									}}
									className={`rounded-full px-4 py-2 text-sm font-medium transition ${statusFilter === status ? 'bg-[color:var(--primary-accent)] text-white shadow-[0_18px_35px_rgba(34,211,238,0.18)]' : 'bg-[color:var(--secondary-surface)] text-[color:var(--muted)] hover:-translate-y-0.5'}`}
								>
									{status === 'all' ? 'All' : statusLabels[status]}
								</button>
							))}
						</div>

						<div className="mt-5 flex flex-wrap items-center gap-3">
							<select
								value={sourceFilter}
								onChange={(event) => {
									setSourceFilter(event.target.value as typeof sourceFilter);
									setCurrentPage(1);
								}}
								title="Filter by source"
								aria-label="Filter by source"
								className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-[color:var(--text)] outline-none dark:bg-white/5"
							>
								<option value="all">All sources</option>
								{Object.entries(sourceLabels).map(([value, label]) => (
									<option key={value} value={value}>{label}</option>
								))}
							</select>

							<select
								value={sortKey}
								onChange={(event) => setSortKey(event.target.value as SortKey)}
								title="Sort leads by"
								aria-label="Sort leads by"
								className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-[color:var(--text)] outline-none dark:bg-white/5"
							>
								<option value="createdAt">Sort by date</option>
								<option value="name">Sort by name</option>
								<option value="company">Sort by company</option>
								<option value="status">Sort by status</option>
								<option value="source">Sort by source</option>
							</select>

							<button
								type="button"
								onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
								className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:-translate-y-0.5 dark:bg-white/5"
							>
								<ArrowUpDown size={16} />
								{sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}
							</button>
						</div>

						<div className="mt-6 overflow-hidden rounded-[28px] border border-[color:var(--border)]">
							<div className="hidden grid-cols-[2fr_1.2fr_0.9fr_1fr_0.7fr] gap-3 border-b border-[color:var(--border)] bg-[color:var(--secondary-surface)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)] lg:grid">
								<button className="text-left" type="button" onClick={() => { setSortKey('name'); setSortDirection((current) => current === 'asc' ? 'desc' : 'asc'); }}>
									Name
								</button>
								<button className="text-left" type="button" onClick={() => { setSortKey('company'); setSortDirection((current) => current === 'asc' ? 'desc' : 'asc'); }}>
									Company
								</button>
								<button className="text-left" type="button" onClick={() => { setSortKey('status'); setSortDirection((current) => current === 'asc' ? 'desc' : 'asc'); }}>
									Status
								</button>
								<button className="text-left" type="button" onClick={() => { setSortKey('source'); setSortDirection((current) => current === 'asc' ? 'desc' : 'asc'); }}>
									Source
								</button>
								<span className="text-right">Actions</span>
							</div>

							<div className="divide-y divide-[color:var(--border)] bg-[color:var(--card)]">
								{isTransitioning ? (
									Array.from({ length: 4 }).map((_, index) => (
										<div key={index} className="grid gap-4 px-5 py-4 lg:grid-cols-[2fr_1.2fr_0.9fr_1fr_0.7fr] lg:items-center">
											<div className="h-11 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
											<div className="h-11 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
											<div className="h-11 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
											<div className="h-11 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
											<div className="h-11 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
										</div>
									))
								) : paginatedLeads.length > 0 ? (
									paginatedLeads.map((lead) => (
										<div key={lead._id} className="grid gap-4 px-5 py-4 transition hover:bg-[color:var(--secondary-surface)] lg:grid-cols-[2fr_1.2fr_0.9fr_1fr_0.7fr] lg:items-center">
											<div className="flex items-center gap-3">
												<LeadAvatar lead={lead} />
												<div>
													<p className="text-sm font-semibold text-[color:var(--text)]">{lead.firstName} {lead.lastName}</p>
													<p className="text-sm text-[color:var(--muted)]">{lead.email}</p>
												</div>
											</div>

											<div>
												<p className="text-sm font-semibold text-[color:var(--text)]">{lead.company || '—'}</p>
												<p className="text-xs text-[color:var(--muted)]">{formatDate(lead.activities?.[0]?.createdAt || new Date().toISOString())}</p>
											</div>

											<div>
												<StatusPill status={lead.status} />
											</div>

											<div className="inline-flex w-fit items-center rounded-full bg-[color:var(--secondary-surface)] px-3 py-2 text-xs font-medium text-[color:var(--muted)]">
												{sourceLabels[lead.source]}
											</div>

											<div className="relative flex items-center justify-start gap-2 lg:justify-end">
												<button
													type="button"
													onClick={(event) => {
														event.stopPropagation();
														setOpenActionMenuId((current) => (current === lead._id ? null : lead._id));
													}}
													className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--border)] bg-white/80 text-[color:var(--muted)] transition hover:-translate-y-0.5 dark:bg-white/5"
													aria-label="Open lead actions"
												>
													<MoreHorizontal size={16} />
												</button>

												<AnimatePresence>
													{openActionMenuId === lead._id && (
														<motion.div
															initial={{ opacity: 0, y: -8, scale: 0.96 }}
															animate={{ opacity: 1, y: 0, scale: 1 }}
															exit={{ opacity: 0, y: -8, scale: 0.96 }}
															className="absolute right-0 top-12 z-20 w-44 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
														>
															<button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[color:var(--text)] transition hover:bg-[color:var(--secondary-surface)]" type="button" onClick={() => { openLeadPanel(lead, 'edit'); setOpenActionMenuId(null); }}>
																<Edit3 size={14} /> Edit
															</button>
															<button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[color:var(--text)] transition hover:bg-[color:var(--secondary-surface)]" type="button" onClick={() => { navigator.clipboard.writeText(lead.email).catch(() => null); showToast('Email copied.'); setOpenActionMenuId(null); }}>
																<Eye size={14} /> Copy email
															</button>
															<button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 transition hover:bg-rose-500/10" type="button" onClick={() => { deleteLead(lead._id); setOpenActionMenuId(null); }}>
																<Trash2 size={14} /> Delete
															</button>
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										</div>
									))
								) : (
									<div className="px-5 py-16 text-center text-sm text-[color:var(--muted)]">
										No leads match your search or filters.
									</div>
								)}
							</div>
						</div>

						<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-[color:var(--muted)]">
								Showing <span className="font-semibold text-[color:var(--text)]">{paginatedLeads.length}</span> of <span className="font-semibold text-[color:var(--text)]">{filteredLeads.length}</span> leads
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((current) => Math.max(current - 1, 1))}
									disabled={currentPage === 1}
									className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5"
								>
									Previous
								</button>
								<span className="rounded-2xl bg-[color:var(--secondary-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)]">
									Page {currentPage} of {totalPages}
								</span>
								<button
									type="button"
									onClick={() => setCurrentPage((current) => Math.min(current + 1, totalPages))}
									disabled={currentPage >= totalPages}
									className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5"
								>
									Next
								</button>
							</div>
						</div>
					</motion.div>
				</section>

				{activeView !== 'dashboard' && activeView !== 'analytics' ? null : null}

				{(panelMode || showLogoutModal || settingsOpen || toast) && null}
			</>
		);
	};

  

	return (
		<div className="h-screen overflow-hidden bg-[color:var(--bg-gradient)] text-[color:var(--text)] transition-colors duration-300">
			<div className="mx-auto grid h-full max-w-[1700px] gap-5 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-5">
				<aside className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
					<div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] pb-5">
						<div className="flex items-center gap-3">
							<div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--primary-accent),var(--secondary-accent))] text-white shadow-[0_18px_40px_rgba(34,211,238,0.22)]">
								<Sparkles size={18} />
							</div>
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">Leadflow AI</p>
								<p className="text-sm font-medium text-[color:var(--text)]">Smart Leads Dashboard</p>
							</div>
						</div>
					</div>

					<nav className="mt-5 grid gap-2">
						{navItems.map((item) => {
							const Icon = item.icon;
							const active = activeView === item.key;
							return (
								<button
									key={item.key}
									type="button"
									onClick={() => navigateTo(item.key)}
									className={`group flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${active ? 'border-[color:var(--primary-accent)] bg-[linear-gradient(135deg,rgba(34,211,238,0.15),rgba(37,99,235,0.10))] shadow-[0_0_0_1px_var(--hover-glow),0_18px_55px_rgba(34,211,238,0.12)]' : 'border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--secondary-surface)]'}`}
								>
									<span className="flex items-center gap-3">
										<span className={`grid h-10 w-10 place-items-center rounded-2xl transition ${active ? 'bg-[color:var(--primary-accent)] text-white shadow-[0_18px_40px_rgba(34,211,238,0.22)]' : 'bg-[color:var(--secondary-surface)] text-[color:var(--text)]'}`}>
											<Icon size={16} />
										</span>
										<span className="text-sm font-semibold">{item.label}</span>
									</span>
									<ChevronRight size={16} className={`transition ${active ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-40 group-hover:translate-x-0 group-hover:opacity-100'}`} />
								</button>
							);
						})}

						<div className="relative mt-2">
							<button
								type="button"
								onClick={() => setSettingsOpen((current) => !current)}
								className="flex w-full items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-[color:var(--border)] hover:bg-[color:var(--secondary-surface)]"
							>
								<span className="flex items-center gap-3">
									<span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--secondary-surface)] text-[color:var(--text)]">
										<Settings size={16} />
									</span>
									<span className="text-sm font-semibold">Settings</span>
								</span>
								<ChevronDown size={16} className={`transition ${settingsOpen ? 'rotate-180' : ''}`} />
							</button>

							<AnimatePresence>
								{settingsOpen && (
									<motion.div
										initial={{ opacity: 0, y: -8, scale: 0.98 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: -8, scale: 0.98 }}
										className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
									>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</nav>

					<div className="mt-6 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-4">
						<div className="flex items-center gap-3">
							<div className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--primary-accent)] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(34,211,238,0.18)]">
								{initials(user?.firstName || 'Arjun', user?.lastName || 'Kumar')}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-[color:var(--text)]">{user?.firstName || 'Arjun'} {user?.lastName || 'Kumar'}</p>
								<p className="text-xs text-[color:var(--muted)]">{roleLabel}</p>
							</div>
							<button type="button" onClick={() => setShowLogoutModal(true)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-xs font-medium text-[color:var(--text)] transition hover:bg-[color:var(--secondary-surface)]">
								<LogOut size={14} /> Logout
							</button>
						</div>
					</div>
				</aside>

				<main className="flex min-h-0 flex-col gap-5">
					<div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-1">
						{renderMain()}
					</div>
				</main>
			</div>

			<AnimatePresence>
				{panelMode && visibleLead !== undefined && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm"
							onClick={closePanel}
						/>

						<motion.aside
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', stiffness: 260, damping: 26 }}
							className="fixed inset-y-0 right-0 z-50 w-full max-w-[620px] overflow-y-auto border-l border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.2)] backdrop-blur-2xl sm:p-6"
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">{panelMode === 'add' ? 'Add Lead' : 'Edit Lead'}</p>
									<h3 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text)]">
										{panelMode === 'add' ? 'Create a new lead' : `${visibleLead?.firstName || ''} ${visibleLead?.lastName || ''}`}
									</h3>
									<p className="mt-2 text-sm text-[color:var(--muted)]">
										{panelMode === 'add'
											? 'Capture a prospect and start tracking every touchpoint.'
											: 'Review details, notes, and activity without leaving the page.'}
									</p>
								</div>
								<button type="button" onClick={closePanel} aria-label="Close panel" title="Close panel" className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border)] bg-white/80 text-[color:var(--text)] transition hover:-translate-y-0.5 dark:bg-white/5">
									<X size={18} />
								</button>
							</div>

							<div className="mt-6 flex items-center gap-2 rounded-2xl bg-[color:var(--secondary-surface)] p-1">
								{(['details', 'notes', 'activity'] as PanelTab[]).map((tab) => (
									<button
										key={tab}
										type="button"
										onClick={() => setPanelTab(tab)}
										className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${panelTab === tab ? 'bg-white text-[color:var(--text)] shadow-sm dark:bg-slate-950 dark:text-white' : 'text-[color:var(--muted)]'}`}
									>
										{tab === 'details' ? 'Details' : tab === 'notes' ? 'Notes' : 'Activity'}
									</button>
								))}
							</div>

							<div className="mt-6 grid gap-5">
								{panelTab === 'details' && (
									<div className="grid gap-4">
										<div className="grid gap-4 sm:grid-cols-2">
											<DrawerField label="First name">
												<input value={draftLead.firstName} onChange={(event) => updateDraftLead('firstName', event.target.value)} placeholder="First name" title="First name" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
											</DrawerField>
											<DrawerField label="Last name">
												<input value={draftLead.lastName} onChange={(event) => updateDraftLead('lastName', event.target.value)} placeholder="Last name" title="Last name" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
											</DrawerField>
										</div>

										<DrawerField label="Email">
											<input value={draftLead.email} onChange={(event) => updateDraftLead('email', event.target.value)} placeholder="email@company.com" title="Email" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
										</DrawerField>

										<div className="grid gap-4 sm:grid-cols-2">
											<DrawerField label="Phone">
												<input value={draftLead.phone} onChange={(event) => updateDraftLead('phone', event.target.value)} placeholder="+1 555 123 4567" title="Phone" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
											</DrawerField>
											<DrawerField label="Company">
												<input value={draftLead.company} onChange={(event) => updateDraftLead('company', event.target.value)} placeholder="Company name" title="Company" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
											</DrawerField>
										</div>

										<div className="grid gap-4 sm:grid-cols-2">
											<DrawerField label="Source">
												<select value={draftLead.source} onChange={(event) => updateDraftLead('source', event.target.value as LeadSource)} title="Source" aria-label="Source" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] dark:bg-white/5">
													{Object.entries(sourceLabels).map(([value, label]) => (
														<option key={value} value={value}>{label}</option>
													))}
												</select>
											</DrawerField>
											<DrawerField label="Status">
												<select value={draftLead.status} onChange={(event) => updateDraftLead('status', event.target.value as LeadStatus)} title="Status" aria-label="Status" className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] dark:bg-white/5">
													{(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
														<option key={status} value={status}>{statusLabels[status]}</option>
													))}
												</select>
											</DrawerField>
										</div>

										<DrawerField label="Notes">
											<textarea value={draftLead.notes} onChange={(event) => updateDraftLead('notes', event.target.value)} rows={4} placeholder="Lead context, objections, next steps..." className="rounded-3xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
										</DrawerField>

										<button type="button" onClick={saveLead} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--primary-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(34,211,238,0.24)]">
											<Shield size={16} /> {panelMode === 'add' ? 'Create lead' : 'Save changes'}
										</button>
									</div>
								)}

								{panelTab === 'notes' && visibleLead && (
									<div className="grid gap-4">
										<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
											<textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={4} placeholder="Add a note or follow-up task..." className="rounded-3xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary-accent)] focus:shadow-[0_0_0_4px_var(--hover-glow)] dark:bg-white/5" />
											<button type="button" onClick={addNote} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--secondary-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(37,99,235,0.22)]">
												<Plus size={16} /> Add note
											</button>
										</div>

										<div className="grid gap-3">
											{(visibleLead.notesLog || []).slice().reverse().map((note) => (
												<article key={note._id} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-4">
													<div className="flex items-start justify-between gap-3">
														<p className="text-sm text-[color:var(--text)]">{note.text}</p>
														<button type="button" onClick={() => deleteNote(note._id)} className="text-[color:var(--muted)] transition hover:text-rose-500" aria-label="Delete note">
															<Trash2 size={16} />
														</button>
													</div>
													<p className="mt-3 text-xs text-[color:var(--muted)]">{formatDateTime(note.createdAt)}</p>
												</article>
											))}
										</div>
									</div>
								)}

								{panelTab === 'activity' && visibleLead && (
									<div className="grid gap-3">
										{activeLeadActivities.map((activity: LeadActivity, index) => (
											<article key={`${activity.createdAt}-${index}`} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-4">
												<div className="flex items-start gap-3">
													<div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[color:var(--primary-accent)] dark:bg-slate-950">
														{activity.type === 'status_changed' ? <Activity size={16} /> : <Clock3 size={16} />}
													</div>
													<div>
														<p className="text-sm font-semibold text-[color:var(--text)]">{activity.message}</p>
														<p className="mt-1 text-xs text-[color:var(--muted)]">{formatDateTime(activity.createdAt)}</p>
													</div>
												</div>
											</article>
										))}
									</div>
								)}
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

				<AnimatePresence>
					{showLogoutModal && (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
							<motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }} className="w-full max-w-md rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
								<h3 className="text-2xl font-semibold text-[color:var(--text)]">Logout confirmation</h3>
								<p className="mt-2 text-sm text-[color:var(--muted)]">Are you sure you want to log out? Your session and local state will be cleared.</p>
								<div className="mt-6 flex items-center justify-end gap-3">
									<button type="button" onClick={() => setShowLogoutModal(false)} className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--text)] dark:bg-white/5">Cancel</button>
									<button type="button" onClick={confirmLogout} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(244,63,94,0.18)]">Logout</button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{toast && (
						<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 right-5 z-[70] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm font-medium text-[color:var(--text)] shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl">
							{toast}
						</motion.div>
					)}
				</AnimatePresence>
		</div>
	);
}

export default ModernDashboard;
