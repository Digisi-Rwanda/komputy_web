import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bell, BookOpen, Building2, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock, Copy, Download, ExternalLink, Eye, FileSpreadsheet, FileText, Filter, Gauge, HeartPulse, Home, Inbox, Info, KeyRound,
  Layers, LayoutGrid, Lock, LogOut, Mail, Menu, MoreHorizontal, Package, PanelLeftClose, Pencil, Play, Plus, Receipt, RefreshCw, Scale,
  ScrollText, Search, Send, Server, Settings, ShieldCheck, SlidersHorizontal, Trash2, Upload, User, Users, Workflow, X, XCircle,
  type LucideProps,
} from "lucide-react";

// Name -> icon so config/data can reference icons by string. Lucide (ISC licence) is our icon set.
export const ICONS = {
  home: Home, ecl: BarChart3, leases: Building2, tax: Scale, activity: Activity, admin: Settings, settings: Settings, help: CircleHelp,
  bell: Bell, search: Search, plus: Plus, check: Check, "check-circle": CheckCircle2, x: X, "x-circle": XCircle, alert: AlertTriangle,
  info: Info, lock: Lock, menu: Menu, more: MoreHorizontal, collapse: PanelLeftClose, "chevron-down": ChevronDown, "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft, "arrow-right": ArrowRight, download: Download, upload: Upload, file: FileText, sheet: FileSpreadsheet,
  calendar: Calendar, clock: Clock, users: Users, user: User, workspaces: LayoutGrid, requests: Inbox, inbox: Inbox, services: Package,
  engines: Server, health: HeartPulse, audit: ScrollText, security: ShieldCheck, key: KeyRound, layers: Layers, workflow: Workflow,
  docs: BookOpen, gauge: Gauge, journal: Receipt, logout: LogOut, mail: Mail, send: Send, filter: Filter, sliders: SlidersHorizontal,
  copy: Copy, edit: Pencil, trash: Trash2, refresh: RefreshCw, play: Play, eye: Eye, external: ExternalLink,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const C = ICONS[name];
  return <C aria-hidden strokeWidth={1.75} size={16} {...props} />;
}
