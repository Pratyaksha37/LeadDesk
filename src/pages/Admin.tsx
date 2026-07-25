import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import {
  Search,
  LogOut,
  MoreHorizontal,
  Circle,
  Clock,
  CheckCircle,
  Inbox,
  Filter,
  Users,
} from "lucide-react";
import {
  useListLeads,
  useGetLeadStats,
  useUpdateLead,
  useDeleteLead,
  getListLeadsQueryKey,
  getGetLeadStatsQueryKey,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ── Tiny avatar component ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-indigo-100 text-indigo-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function LeadAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}
    >
      {initials}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  loading: boolean;
  accentClass: string;  // tailwind color for left border + icon
  iconBg: string;
}

function StatCard({ icon: Icon, label, value, loading, accentClass, iconBg }: StatCardProps) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm overflow-hidden flex`}>
      {/* Colored left accent bar */}
      <div className={`w-1 flex-shrink-0 ${accentClass}`} />
      <div className="flex-1 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-4 h-4 ${accentClass.replace("bg-", "text-")}`} />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {loading ? <Skeleton className="h-9 w-12" /> : (value ?? 0)}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "new":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium">
          <Circle className="w-2.5 h-2.5 mr-1.5 fill-blue-500" /> New
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium">
          <Clock className="w-2.5 h-2.5 mr-1.5" /> Contacted
        </Badge>
      );
    case "closed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium">
          <CheckCircle className="w-2.5 h-2.5 mr-1.5" /> Closed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Admin() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useGetLeadStats();
  const { data: leads = [], isLoading: leadsLoading } = useListLeads({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });

  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const handleStatusChange = (id: number, newStatus: "new" | "contacted" | "closed") => {
    updateLead.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.setQueryData(
            getListLeadsQueryKey({
              search: debouncedSearch || undefined,
              status: statusFilter === "all" ? undefined : (statusFilter as any),
            }),
            (old: any) => {
              if (!Array.isArray(old)) return old;
              return old.map((l) => (l.id === id ? { ...l, status: newStatus } : l));
            }
          );
          queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteLead.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
          setDeleteId(null);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-foreground group">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-sm shadow-primary/30">
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </div>
              <span className="font-bold tracking-tight group-hover:text-primary transition-colors">
                LeadDesk
              </span>
            </Link>
            <div className="hidden sm:flex items-center border-l border-border pl-6">
              <span className="text-sm font-semibold text-foreground">Inquiries</span>
              {!leadsLoading && leads.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5">
                  {leads.length}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { signOut(); window.location.href = "/"; }}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Leads"
              value={stats?.total}
              loading={statsLoading}
              accentClass="bg-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              icon={Circle}
              label="New"
              value={stats?.byStatus.new}
              loading={statsLoading}
              accentClass="bg-blue-500"
              iconBg="bg-blue-50"
            />
            <StatCard
              icon={Clock}
              label="Contacted"
              value={stats?.byStatus.contacted}
              loading={statsLoading}
              accentClass="bg-amber-500"
              iconBg="bg-amber-50"
            />
            <StatCard
              icon={CheckCircle}
              label="Closed"
              value={stats?.byStatus.closed}
              loading={statsLoading}
              accentClass="bg-emerald-500"
              iconBg="bg-emerald-50"
            />
          </div>

          {/* Lead Table */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, or message…"
                  className="pl-9 h-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[148px] h-9 bg-background">
                    <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/10">
                    <TableHead className="w-[220px] font-semibold">Client</TableHead>
                    <TableHead className="w-[140px] font-semibold">Budget</TableHead>
                    <TableHead className="font-semibold">Message</TableHead>
                    <TableHead className="w-[110px] font-semibold">Date</TableHead>
                    <TableHead className="w-[130px] font-semibold">Status</TableHead>
                    <TableHead className="w-[52px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-36" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full max-w-md" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell />
                      </TableRow>
                    ))
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Inbox className="w-5 h-5 opacity-40" />
                          </div>
                          <p className="font-medium text-sm">No leads found</p>
                          <p className="text-xs opacity-60">
                            {searchTerm || statusFilter !== "all"
                              ? "Try adjusting your search or filter"
                              : "Leads will appear here once submitted"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id} className="group transition-colors hover:bg-muted/30">
                        {/* Client */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <LeadAvatar name={lead.name} />
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground text-sm truncate">
                                {lead.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {lead.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Budget */}
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                            {lead.budgetRange}
                          </span>
                        </TableCell>

                        {/* Message */}
                        <TableCell>
                          <p
                            className="text-sm text-foreground/80 line-clamp-2 max-w-lg"
                            title={lead.message}
                          >
                            {lead.message}
                          </p>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(lead.createdAt), "MMM d, yyyy")}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={lead.status} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[168px]">
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                Change Status
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuRadioGroup
                                value={lead.status}
                                onValueChange={(val) =>
                                  handleStatusChange(lead.id, val as any)
                                }
                              >
                                <DropdownMenuRadioItem value="new">
                                  <Circle className="w-3 h-3 mr-2 text-blue-500 fill-blue-500" />
                                  New
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="contacted">
                                  <Clock className="w-3 h-3 mr-2 text-amber-500" />
                                  Contacted
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="closed">
                                  <CheckCircle className="w-3 h-3 mr-2 text-emerald-500" />
                                  Closed
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => setDeleteId(lead.id)}
                              >
                                Delete Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Table footer */}
            {!leadsLoading && leads.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {leads.length} {leads.length === 1 ? "lead" : "leads"}
                  {(searchTerm || statusFilter !== "all") && " matching your filter"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The lead's data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
