"use client";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Avatar, AvatarStack } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { CopyButton } from "@/components/atoms/CopyButton";
import { Divider } from "@/components/atoms/Divider";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Kbd } from "@/components/atoms/Kbd";
import { LiveDot } from "@/components/atoms/LiveDot";
import { LoadingDots, Spinner } from "@/components/atoms/Spinner";
import { Logo } from "@/components/atoms/Logo";
import { MetaChip } from "@/components/atoms/Chip";
import { MonoId } from "@/components/atoms/MonoId";
import { Money, Delta, Percent, PD } from "@/components/atoms/Numbers";
import { NumberInput } from "@/components/atoms/NumberInput";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { RunStatusPill, ServiceStatePill, StagePill, StatusPill } from "@/components/atoms/StatusPill";
import { Select } from "@/components/atoms/Select";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Slider } from "@/components/atoms/Slider";
import { Switch } from "@/components/atoms/Switch";
import { Textarea } from "@/components/atoms/Textarea";
import { Accordion } from "@/components/molecules/Accordion";
import { AnnouncementPill } from "@/components/molecules/AnnouncementPill";
import { Banner } from "@/components/molecules/Banner";
import { Breadcrumb } from "@/components/molecules/Breadcrumb";
import { CardSelector } from "@/components/molecules/CardSelector";
import { Combobox } from "@/components/molecules/Combobox";
import { DatePicker, DateRangePicker } from "@/components/molecules/DatePicker";
import { DropdownMenu, Popover, Tooltip } from "@/components/molecules/Overlays";
import { Field, FormSection } from "@/components/molecules/Field";
import { FileDropzone, type DropzoneState } from "@/components/molecules/FileDropzone";
import { FilterChip } from "@/components/molecules/FilterChip";
import { HeroMetric, KeyValue, StatCard } from "@/components/molecules/StatCard";
import { MultiEmailInput } from "@/components/molecules/MultiEmailInput";
import { Pagination } from "@/components/molecules/Pagination";
import { ProgressBar, ProgressCircle } from "@/components/molecules/Progress";
import { SearchPill } from "@/components/molecules/SearchPill";
import { SegmentedTabs, ToggleGroup } from "@/components/molecules/Tabs";
import { Stepper } from "@/components/molecules/Stepper";
import { Timestamp } from "@/components/molecules/Timestamp";
import { TruncatedList } from "@/components/molecules/TruncatedList";
import { AuditTimeline } from "@/components/organisms/AuditTimeline";
import { ConfirmDialog, Modal, Sheet } from "@/components/organisms/Modal";
import { DataTable, TwoLine, type ColumnDef } from "@/components/organisms/DataTable";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { NotificationsList } from "@/components/organisms/NotificationsList";
import { PageHeader, Section } from "@/components/organisms/PageHeader";
import { States } from "@/components/organisms/StateView";
import { ThemeToggle } from "@/components/organisms/ThemeToggle";
import { ValidationReport } from "@/components/organisms/ValidationReport";
import { toast } from "@/components/organisms/Toaster";
import { PdMatrix } from "@/components/organisms/PdMatrix";
import { Sparkline } from "@/components/atoms/Sparkline";
import { StackedBars } from "@/components/organisms/StackedBars";
import { StageDonut } from "@/components/organisms/StageDonut";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { Waterfall } from "@/components/organisms/Waterfall";
import { AnimatedSize } from "@/components/atoms/AnimatedSize";
import { FadeIn } from "@/components/atoms/FadeIn";
import { NumberTicker } from "@/components/atoms/NumberTicker";
import { WordReveal } from "@/components/atoms/WordReveal";
import { audit, eclTrend, members, movement, notifications, pdMatrix, runs } from "@/data/mock/data";
import { compact, date } from "@/lib/format";
import type { Run } from "@/types/domain";

// Living component gallery (Phase 0): every component and state, both themes (toggle top-right), all breakpoints.
function Block({ title, board, children }: { title: string; board: string; children: React.ReactNode }) {
  return (
    <section id={title.toLowerCase().replace(/\W+/g, "-")} className="flex scroll-mt-20 flex-col gap-5 border-t border-line pt-10">
      <div className="flex items-baseline gap-3"><h2 className="text-h3">{title}</h2><span className="label-mono">{board}</span></div>
      {children}
    </section>
  );
}
const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

const runCols: ColumnDef<Run, unknown>[] = [
  { id: "run", header: "Run", meta: { label: "Run" }, accessorFn: (r) => r.name, cell: ({ row }) => <TwoLine lead={<Icon name="ecl" />} title={row.original.name} meta={`${row.original.id} · ${date(row.original.reportingDate)}`} /> },
  { id: "status", header: "Status", meta: { label: "Status" }, accessorFn: (r) => r.status, cell: ({ row }) => <RunStatusPill status={row.original.status} /> },
  { id: "engine", header: "Engine", meta: { label: "Engine" }, accessorFn: (r) => r.engine, cell: ({ row }) => <MonoId>{row.original.engine}</MonoId> },
  { id: "ecl", header: "Total ECL · USD", meta: { align: "right", label: "Total ECL" }, accessorFn: (r) => r.totalEcl, cell: ({ row }) => (row.original.totalEcl ? <Money value={row.original.totalEcl} /> : "No data") },
];

export default function UiGallery() {
  const [sw, setSw] = useState(true);
  const [combo, setCombo] = useState<string[]>(["u-jean"]);
  const [multi, setMulti] = useState<string[]>(["ecl"]);
  const [tab, setTab] = useState("annual");
  const [day, setDay] = useState<Date | undefined>(new Date("2026-09-30T00:00:00Z"));
  const [range, setRange] = useState<DateRange>();
  const [emails, setEmails] = useState(["p.nkurunziza@kivubank.rw", "f.mutoni@gmail.com"]);
  const [drop, setDrop] = useState<DropzoneState>({ kind: "idle" });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({ status: ["signed-off"] });
  const [card, setCard] = useState("dual");
  const [more, setMore] = useState(false);

  const fakeUpload = (f: File) => {
    let p = 0;
    const t = setInterval(() => { p += 20; setDrop(p >= 100 ? { kind: "done", file: f } : { kind: "uploading", file: f, progress: p }); if (p >= 100) clearInterval(t); }, 300);
  };

  return (
    <main id="main" className="mx-auto flex w-full max-w-site flex-col gap-10 px-4 py-10 lg:px-6">
      <header className="bg-canvas sticky top-0 z-[var(--z-sticky)] -mx-4 flex items-center gap-4 border-b border-line px-4 py-3 lg:-mx-6 lg:px-6">
        <Logo />
        <span className="label-mono hidden sm:inline">Phase 0 · component gallery</span>
        <a href="/dev/tokens" className="ml-auto text-small text-link hover:underline">Tokens →</a>
        <ThemeToggle />
      </header>

      <Block title="Buttons" board="DS2">
        <Row>
          <Button>Primary</Button>
          <Button variant="secondary" icon={<Icon name="download" />}>Download bundle</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Close workspace</Button>
          <Button variant="danger-outline">Remove</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button><Button>Medium</Button><Button size="lg">Large</Button>
          <Button loading>Computing</Button>
          <Button disabled>Disabled</Button>
          <Button disabledReason="You can't approve your own run">Approve & sign off</Button>
          <Button variant="secondary" shortcut="⌘S">Save draft</Button>
          <Button right={<Icon name="arrow-right" />}>Continue</Button>
          <IconButton label="More actions" variant="secondary"><Icon name="more" /></IconButton>
          <IconButton label="Edit" variant="outline" size="sm"><Icon name="edit" /></IconButton>
        </Row>
      </Block>

      <Block title="Pills, badges, identity" board="DS5 · DS7">
        <Row>
          {(["signed-off", "needs-review", "returned", "computing", "failed", "draft"] as const).map((s) => <RunStatusPill key={s} status={s} />)}
        </Row>
        <Row>
          <StagePill stage={1} /><StagePill stage={2} /><StagePill stage={3} />
          {(["active", "trial", "trial-expired", "suspended", "locked", "coming-soon"] as const).map((s) => <ServiceStatePill key={s} state={s} />)}
          <StatusPill tone="info" icon={<Spinner className="size-3 border-current border-t-transparent" />}>Validating</StatusPill>
        </Row>
        <Row>
          <Badge>Soon</Badge><Badge tone="warning">Trial</Badge><Badge tone="info" mono>New</Badge><Badge tone="inverse">12</Badge><Badge mono>Staff</Badge>
          <MetaChip>v1.3.0</MetaChip><MetaChip icon={<Icon name="calendar" />}>30 Sep 2026</MetaChip>
          <MonoId copy>RUN 0142</MonoId><MonoId copy>9f2c…a71</MonoId><CopyButton value="LSE-0087" />
          <Avatar initials="AM" /><Avatar initials="K" square className="bg-accent text-white" /><AvatarStack people={members} />
          <LiveDot /><LiveDot tone="warning" pulse /><Kbd>⌘K</Kbd><Spinner /><LoadingDots />
        </Row>
      </Block>

      <Block title="Numbers" board="DS5">
        <Row>
          <Money value={12846210.55} currency="USD" /><Money value={-1240} signed /><Percent value={0.0231} /><PD value={0.02131} />
          <Delta value={0.042} suffix=" vs Aug" /><Delta value={-0.012} /><Delta value={0.031} goodWhenUp /><Delta value={0} />
        </Row>
      </Block>

      <Block title="Forms" board="DS3">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Run name" id="f-name" required help="Shown on reports and the audit log."><Input placeholder="Q3 2026 provisioning" /></Field>
          <Field label="Collateral haircut" id="f-hair" error="Did you mean 50 %?"><NumberInput kind="percent" defaultValue={0.005} /></Field>
          <Field label="Loan amount · USD" id="f-amt"><NumberInput kind="money" defaultValue={25412.1} /></Field>
          <Field label="Currency" id="f-cur"><Select defaultValue="USD"><option>USD</option><option>RWF</option><option>KES</option></Select></Field>
          <Field label="Reporting date" id="f-date" help="Month ends only."><DatePicker value={day} onChange={setDay} monthEndOnly /></Field>
          <Field label="Audit period" id="f-range"><DateRangePicker value={range} onChange={setRange} today={new Date("2026-11-12")} /></Field>
          <Field label="Reviewer" id="f-rev"><Combobox value={combo} onChange={setCombo} options={members.map((m) => ({ value: m.id, label: m.name, meta: m.ecl }))} /></Field>
          <Field label="Services" id="f-svc" optional><Combobox multiple value={multi} onChange={setMulti} options={[{ value: "ecl", label: "Expected Credit Loss" }, { value: "leases", label: "Lease Accounting" }]} /></Field>
          <Field label="Search" id="f-search"><Input leading={<Icon name="search" />} placeholder="Find loan" trailing={<Kbd>/</Kbd>} /></Field>
          <Field label="Invite by email" id="f-inv" help="Only @kivubank.rw addresses are allowed." className="md:col-span-2"><MultiEmailInput value={emails} onChange={setEmails} allowedDomains={["kivubank.rw"]} /></Field>
          <Field label="Note for reviewer" id="f-note"><Textarea maxLength={500} placeholder="Provision up 4.2 %, driven by SME Stage 2 migration." /></Field>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Checkbox label="I have reviewed the exceptions" defaultChecked />
            <Checkbox label="Keep data view only" description="Recommended when suspending." />
            <Checkbox label="Disabled option" disabled />
          </div>
          <RadioGroup name="support" defaultValue="ask" options={[{ value: "ask", label: "Ask an administrator every time", description: "Recommended" }, { value: "auto", label: "Allow automatically for up to 1 hour" }, { value: "never", label: "Never allow" }]} />
          <div className="flex flex-col gap-4">
            <Switch checked={sw} onCheckedChange={setSw} label="Require MFA for all members" description="2 members will be asked at next sign in." />
            <Switch label="Disabled switch" disabled />
            <Slider label="Materiality" defaultValue={[0.5]} min={0} max={2} step={0.1} />
          </div>
        </div>
        <div className="rounded-panel border border-line px-6">
          <FormSection title="Identity" description="Your workspace details and branding.">
            <Field label="Workspace name" id="fs-name"><Input defaultValue="Kivu Commercial Bank" /></Field>
            <Field label="Legal name" id="fs-legal"><Input defaultValue="Kivu Commercial Bank PLC" /></Field>
          </FormSection>
        </div>
        <CardSelector label="Package" value={card} onChange={setCard} options={[{ value: "single", title: "Single service", description: "1 service of your choice" }, { value: "dual", title: "Dual", description: "2 services · priority support", badge: <Badge tone="info">Popular</Badge> }, { value: "suite", title: "Suite", description: "All services · talk to us", disabled: true }]} />
      </Block>

      <Block title="Upload & validation" board="DS4">
        <FileDropzone title="Drop the PD workbook here" hint=".xlsx only · up to 50 MB · several months in one or more sheets · macros are rejected" tip="Tip: include at least 6 months for a stable matrix." state={drop} onFile={fakeUpload} onRemove={() => setDrop({ kind: "idle" })} />
        <ValidationReport
          onDownload={(c) => toast(`Downloading rows for ${c}`)}
          rules={[
            { code: "EC-12", title: "Duplicate Loan IDs within a month", status: "error", detail: "Each Loan ID must appear once per reporting month", rows: 7, sample: <KeyValue columns={4} items={[["Loan ID", "LN-004418"], ["Month", "2026-08"], ["Sheet", "Aug"], ["Row", "1,204"]]} /> },
            { code: "PD-02", title: "Staging values are 1, 2 or 3", status: "error", detail: 'Found values: 4, "S2"', rows: 18 },
            { code: "EA-11", title: "Reporting date matches the run (30 Sep 2026)", status: "warning", rows: 12 },
            { code: "EA-14", title: "First payment after reporting date", status: "warning", rows: 6 },
            ...["Required fields", "Duplicate Loan IDs", "Stage values valid", "EIR between 0 and 1"].map((t, i) => ({ code: `EA 0${i + 1}`, title: t, status: "passed" as const })),
          ]}
        />
      </Block>

      <Block title="Data display" board="DS5">
        <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "#" }, { label: "Runs", href: "#" }, { label: "RUN-0142" }]} title="Q3 2026 provisioning" status={<RunStatusPill status="signed-off" />} meta={<><MetaChip>v1.3.0</MetaChip><MetaChip>30 Sep 2026</MetaChip></>} actions={<><Button variant="secondary" icon={<Icon name="download" />}>Download bundle</Button><Button>Compare with…</Button><IconButton label="More" variant="secondary"><Icon name="more" /></IconButton></>} tabs={<SegmentedTabs active="#summary" items={["Summary", "Results", "Exceptions", "Reconciliation", "Inputs", "Methodology", "Outputs", "Audit"].map((l) => ({ label: l, href: `#${l.toLowerCase()}`, count: l === "Exceptions" ? 64 : undefined }))} />} />
        <HeroMetric label="Total ECL · 30 Sep 2026" currency="USD" value={<NumberTicker value={12846210.55} />} delta={<Delta value={0.042} suffix=" vs Aug (RUN 0137)" />} sub="Coverage 2.31 % of USD 556.1M exposure" />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard dot="bg-stage-1" label="Stage 1" value={<Money value={2104880.12} />} meta="71.4 % of exposure"><Sparkline values={[1.98, 2.01, 2.05, 2.07, 2.09, 2.1]} className="h-8 w-full" /></StatCard>
          <StatCard label="Runs this month" value="7 / 20" action={<Badge tone="positive">Active</Badge>}><ProgressBar value={7} max={20} label="Runs used" /></StatCard>
          <StatCard label="Trial leases" value="8 / 10" meta="Trial ends 16 Nov 2026"><ProgressBar value={8} max={10} label="Leases used" /></StatCard>
        </div>
        <KeyValue columns={4} items={[["Engine", "v1.3.0"], ["Reviewer", "Jean Habimana"], ["Loans", "48,312"], ["Exposure", "556.1M"]]} />
        <Row><FilterChip label="Segment" /><FilterChip label="Segment" value="Retail" onClear={() => {}} /><TruncatedList items={["ECL", "Leases · Trial", "Tax", "Planning"]} renderItem={(s) => <Badge>{s}</Badge>} /><Timestamp iso="2026-11-12T08:14:00Z" /><ProgressCircle value={64} label="Compute progress"><span className="text-small text-fg">64%</span></ProgressCircle></Row>
        <FilterBar value={filters} onChange={setFilters} filters={[{ key: "status", label: "Status", options: [{ value: "signed-off", label: "Signed off", count: 2 }, { value: "needs-review", label: "Needs review", count: 1 }, { value: "failed", label: "Failed", count: 1 }] }, { key: "engine", label: "Engine", options: [{ value: "v1.3.0", label: "v1.3.0" }] }]} />
        <DataTable caption="Runs" data={runs} columns={runCols} getRowId={(r) => r.id} selectable columnPicker fade selectionActions={(rows, clear) => <><Button size="sm" variant="secondary">Compare</Button><Button size="sm" variant="secondary" onClick={() => { toast.success(`Exported ${rows.length} runs`); clear(); }}>Export</Button></>} />
        <DataTable caption="Loading runs" data={runs} columns={runCols} getRowId={(r) => r.id} loading />
        <Pagination page={page} pageSize={10} total={31204} onPage={setPage} />
      </Block>

      <Block title="Navigation" board="DS7">
        <Breadcrumb items={[{ label: "Expected Credit Loss", href: "#" }, { label: "Runs", href: "#" }, { label: "RUN-0142" }]} />
        <SegmentedTabs variant="underline" active="#profile" items={["Profile", "Security", "Notifications", "Appearance", "My workspaces"].map((l) => ({ label: l, href: `#${l.toLowerCase()}` }))} />
        <Row><ToggleGroup label="Schedule view" value={tab} onChange={setTab} options={[{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }]} /><SearchPill className="max-w-sm" /><AnnouncementPill href="#">v1.3.0: Reconciliation checks</AnnouncementPill></Row>
        <Stepper current={3} note="Validating…" steps={[{ label: "Setup" }, { label: "PD data", warn: true }, { label: "LGD data" }, { label: "EAD data" }, { label: "Review" }, { label: "Compute" }, { label: "Sign-off" }]} />
        <div className="max-w-xl"><Stepper orientation="vertical" current={1} steps={[{ label: "Start close", meta: "Aline Mugisha", status: <StatusPill tone="positive">Done</StatusPill> }, { label: "Resolve issues", status: <StatusPill tone="warning">2 issues</StatusPill> }, { label: "Generate journals", meta: "142 leases · est. 1,284 lines" }, { label: "Lock period", meta: "Administrator only" }]} /></div>
      </Block>

      <Block title="Charts" board="DS6">
        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <div className="rounded-card border border-line p-5"><StackedBars title="ECL by stage, last six months" data={eclTrend} x={(d) => d.month} format={compact} series={[{ key: "s1", label: "Stage 1", color: "var(--stage-1)", value: (d) => d.s1 }, { key: "s2", label: "Stage 2", color: "var(--stage-2)", value: (d) => d.s2 }, { key: "s3", label: "Stage 3", color: "var(--stage-3)", value: (d) => d.s3 }]} /></div>
          <div className="rounded-card border border-line p-5"><TimeSeries title="Total ECL trend" area data={eclTrend} x={(d) => d.month} format={compact} series={[{ key: "t", label: "Total ECL", color: "var(--chart-1)", value: (d) => d.s1 + d.s2 + d.s3 }]} /></div>
          <div className="rounded-card border border-line p-5"><Waterfall title="ECL movement Aug to Sep" steps={movement} /></div>
          <div className="flex flex-wrap items-center gap-6 rounded-card border border-line p-5">
            <StageDonut shares={[0.714, 0.21, 0.076]} center={<><span className="text-h4 text-fg">12.8M</span><span className="text-micro text-fg-muted">Total ECL</span></>} />
            <div className="min-w-0 flex-1"><PdMatrix {...pdMatrix} /></div>
          </div>
        </div>
      </Block>

      <Block title="Overlays & feedback" board="DS8">
        <div className="flex flex-col gap-2">
          <Banner tone="warning" action={<Button variant="link" size="sm">Request access →</Button>}>Lease Accounting trial · 2 of 10 leases left · 4 days</Banner>
          <Banner tone="info" title="Impersonation active">Support (J. Kamau) until 14:30. All actions are logged.</Banner>
          <Banner tone="negative">This workspace is suspended. You can still export.</Banner>
          <Banner tone="positive">7 of 7 reconciliation checks passed.</Banner>
        </div>
        <Row>
          <Button variant="secondary" onClick={() => toast.success("RUN 0142 signed off")}>Success toast</Button>
          <Button variant="secondary" onClick={() => toast.warning("2 warnings to review")}>Warning toast</Button>
          <Button variant="secondary" onClick={() => toast.error("Compute failed at EAD & ECL", { action: { label: "View", onClick: () => {} } })}>Error toast</Button>
          <Button variant="secondary" onClick={() => toast.promise(new Promise((r) => setTimeout(r, 1500)), { loading: "Exporting…", success: "Export ready", error: "Export failed" })}>Promise toast</Button>
          <Modal trigger={<Button variant="secondary">Modal</Button>} title="Submit RUN 0142?" description="The run will be locked." footer={<><Button variant="secondary">Cancel</Button><Button>Submit</Button></>}><p className="text-small text-fg-muted">Jean Habimana will be notified.</p></Modal>
          <ConfirmDialog trigger={<Button variant="danger-outline">Close workspace</Button>} title="Close workspace?" description="All runs, leases and files are deleted 30 days after closing." confirmText="Kivu Commercial Bank" confirmLabel="Close workspace" onConfirm={() => toast("Workspace closing on 11 Dec 2026")} />
          <Sheet trigger={<Button variant="secondary">Sheet</Button>} title="Exception details" footer={<Button variant="secondary">Close</Button>}><KeyValue columns={1} items={[["Category", "Input validation"], ["Loan", "LN-118802"], ["Rule", "EA-11"], ["Impact", "0.00"]]} /></Sheet>
          <Popover trigger={<Button variant="secondary">Popover</Button>}><p className="max-w-56 p-2 text-small">Glass popover with a hairline and inner ring.</p></Popover>
          <DropdownMenu trigger={<IconButton label="Row actions" variant="secondary"><Icon name="more" /></IconButton>} items={[{ label: "Change roles", icon: <Icon name="users" /> }, { label: "Require MFA", icon: <Icon name="security" />, shortcut: "⌘M" }, { label: "Remove from workspace", icon: <Icon name="trash" />, danger: true, separatorBefore: true }]} />
          <Tooltip content="Results" shortcut="G R"><IconButton label="Results"><Icon name="ecl" /></IconButton></Tooltip>
        </Row>
        <Accordion defaultValue={["pd"]} items={[{ value: "pd", title: "PD: Markov transition matrix", content: <code className="font-mono text-micro">marginal PD = (S3(n) − S3(n − 1)) / (1 − S3(n − 1))</code> }, { value: "lgd", title: "LGD: Collateral discounting", content: "Discounted = Allocated × (1 − haircut) × (1 + EIR)^−years" }]} />
      </Block>

      <Block title="States" board="DS9">
        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          <States.LoadingTable /><States.LoadingDashboard /><States.NoRuns /><States.NoLeases />
          <States.Filtered /><States.PageError /><States.NoPermission /><States.LockedService />
          <States.QuotaReached /><States.ReadOnly /><States.NotFound /><States.Maintenance />
        </div>
      </Block>

      <Block title="Motion" board="DS10">
        <WordReveal as="h2" text="IFRS reporting, from upload to sign off." className="text-h2" />
        <FadeIn><p className="text-small text-fg-muted">This line fades and rises in when scrolled into view.</p></FadeIn>
        <div className="max-w-md rounded-card border border-line p-4">
          <Button size="sm" variant="secondary" onClick={() => setMore((v) => !v)}>{more ? "Show less" : "Show more"}</Button>
          <AnimatedSize><div className="pt-3 text-small text-fg-muted">{more ? "Reading workbook · Detecting header rows · Checking 434,808 rows · Building transition matrices · Computing term structure" : "Reading workbook…"}</div></AnimatedSize>
        </div>
      </Block>

      <Block title="Timeline & notifications" board="DS8">
        <div className="grid gap-8 lg:grid-cols-2"><AuditTimeline events={audit} /><NotificationsList items={notifications} /></div>
      </Block>

      <Section title="Skeletons"><div className="flex gap-3"><Skeleton className="h-10 w-40" /><Skeleton className="h-10 flex-1" /></div></Section>
      <Divider />
    </main>
  );
}
