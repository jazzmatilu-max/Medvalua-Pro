import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Shield, Ticket, Plus, Copy, Trash2, Loader2, AlertCircle,
  CheckCircle2, Clock, Search, Users, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  used: boolean;
  notes: string | null;
  redeemed_at: string | null;
  redeemed_email: string | null;
  redeemed_by: string | null;
  duration_days: number;
  expires_at: string | null;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  nombre: string | null;
  email: string | null;
  created_at: string;
}

const DURATION_PRESETS = [
  { v: 7,   label: "7 días" },
  { v: 15,  label: "15 días" },
  { v: 30,  label: "30 días" },
  { v: 60,  label: "60 días" },
  { v: 90,  label: "90 días" },
  { v: 180, label: "6 meses" },
  { v: 365, label: "1 año" },
];

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `MV-${s}`;
}

type Status = "activo" | "usado" | "expirado";
function statusOf(c: Coupon): Status {
  if (!c.used) return "activo";
  if (c.expires_at && new Date(c.expires_at) < new Date()) return "expirado";
  return "usado";
}

export default function AdminSection() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { nombre: string | null; email: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(genCode());
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState<number>(30);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminMap, setAdminMap] = useState<Record<string, boolean>>({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { setLoading(false); toast.error(error.message); return; }
    const list = (data ?? []) as Coupon[];
    setRows(list);

    // Cargar perfiles de quienes redimieron
    const ids = Array.from(new Set(list.map((c) => c.redeemed_by).filter(Boolean) as string[]));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, nombre, email")
        .in("user_id", ids);
      const map: Record<string, { nombre: string | null; email: string | null }> = {};
      (profs ?? []).forEach((p: any) => {
        map[p.user_id] = { nombre: p.nombre, email: p.email };
      });
      setProfiles(map);
    } else {
      setProfiles({});
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const [{ data: profs, error: profError }, { data: roles, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("user_id, nombre, email, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profError || roleError) {
      toast.error(profError?.message || roleError?.message || "No se pudieron cargar los usuarios");
      setLoadingUsers(false);
      return;
    }
    const admins: Record<string, boolean> = {};
    (roles ?? []).forEach((r: any) => {
      if (r.role === "admin") admins[r.user_id] = true;
    });
    setUsers((profs ?? []) as UserProfile[]);
    setAdminMap(admins);
    setLoadingUsers(false);
  };

  useEffect(() => { fetchAll(); fetchUsers(); }, []);

  // Notificación: cupones que expiran en ≤3 días
  useEffect(() => {
    const expiringSoon = rows.filter((c) => {
      if (!c.used || !c.expires_at) return false;
      const left = (new Date(c.expires_at).getTime() - Date.now()) / 86400000;
      return left > 0 && left <= 3;
    });
    if (expiringSoon.length > 0) {
      toast.warning(`${expiringSoon.length} cupón(es) por expirar en ≤3 días`, {
        id: "admin-expiring",
        description: expiringSoon.map((c) => c.code).join(", "),
      });
    }
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const s = statusOf(c);
      if (filter !== "todos" && s !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const prof = c.redeemed_by ? profiles[c.redeemed_by] : null;
        return (
          c.code.toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q) ||
          (c.redeemed_email ?? "").toLowerCase().includes(q) ||
          (prof?.nombre ?? "").toLowerCase().includes(q) ||
          (prof?.email ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filter, search, profiles]);

  const stats = useMemo(() => ({
    total: rows.length,
    activos: rows.filter((c) => statusOf(c) === "activo").length,
    usados: rows.filter((c) => statusOf(c) === "usado").length,
    expirados: rows.filter((c) => statusOf(c) === "expirado").length,
  }), [rows]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.nombre ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const create = async () => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (cleanCode.length < 4) { toast.error("Código muy corto"); return; }
    if (!days || days < 1) { toast.error("Días inválidos"); return; }
    setCreating(true);
    const { error } = await supabase.from("coupons").insert({
      code: cleanCode,
      created_by: user.id,
      notes: notes || null,
      duration_days: days,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    // Copia automática al portapapeles
    try { await navigator.clipboard.writeText(cleanCode); } catch {}
    toast.success(`✅ Cupón ${cleanCode} creado y copiado`, {
      description: `Válido por ${days} días. Compártelo con el usuario.`,
      duration: 6000,
    });
    setCode(genCode());
    setNotes("");
    fetchAll();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cupón eliminado");
    fetchAll();
  };

  const copy = (c: string) => {
    navigator.clipboard.writeText(c);
    toast.success("Copiado");
  };

  const promote = async (uid: string) => {
    if (uid === user?.id) return;
    setPromotingId(uid);
    const { data, error } = await (supabase as any).rpc("promote_user_to_admin", { _user_id: uid });
    setPromotingId(null);
    if (error) { toast.error(error.message); return; }
    const result = data?.[0];
    if (!result?.success) { toast.error(result?.message || "No se pudo habilitar como admin"); return; }
    toast.success("Usuario habilitado como administrador");
    fetchUsers();
  };

  const daysLeft = (c: Coupon) => {
    if (!c.expires_at) return null;
    const ms = new Date(c.expires_at).getTime() - Date.now();
    return Math.ceil(ms / 86400000);
  };

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Panel Administrador</h1>
          <p className="text-sm text-muted-foreground">
            Cupones de acceso temporal · MedValua
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Ticket} />
        <StatCard label="Activos" value={stats.activos} icon={CheckCircle2} tone="success" />
        <StatCard label="En uso" value={stats.usados} icon={Clock} tone="primary" />
        <StatCard label="Expirados" value={stats.expirados} icon={AlertCircle} tone="destructive" />
      </div>

      {/* Crear */}
      <Card className="shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Generar nuevo cupón</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1.5fr_auto] items-end">
          <div className="space-y-2">
            <Label>Código</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={() => setCode(genCode())}>
                ↻
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duración</Label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_PRESETS.map((p) => (
                  <SelectItem key={p.v} value={String(p.v)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Dr. Martínez — Convenio EPS"
              maxLength={200}
            />
          </div>
          <Button onClick={create} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Crear
          </Button>
        </div>
      </Card>

      <Card className="shadow-card p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Usuarios y administradores</h2>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          {loadingUsers ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No hay usuarios que coincidan.</div>
          ) : (
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const isUserAdmin = !!adminMap[u.user_id];
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="leading-tight">
                          <div className="font-medium text-foreground">{u.nombre || "Sin nombre"}</div>
                          <div className="text-xs text-muted-foreground">{u.email || "Sin email"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isUserAdmin ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Usuario normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("es-CO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => promote(u.user_id)}
                          disabled={isUserAdmin || promotingId === u.user_id || u.user_id === user?.id}
                        >
                          {promotingId === u.user_id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-1" />
                          )}
                          Hacer admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, email o notas..."
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="usado">En uso</SelectItem>
            <SelectItem value="expirado">Expirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No hay cupones que coincidan.
          </div>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Usado por</TableHead>
                <TableHead>Redimido</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const st = statusOf(c);
                const left = daysLeft(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell>
                      {st === "activo" && (
                        <Badge className="bg-success/10 text-success border-success/20">Activo</Badge>
                      )}
                      {st === "usado" && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          En uso{left !== null && ` · ${left}d`}
                        </Badge>
                      )}
                      {st === "expirado" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          Expirado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{c.duration_days} días</TableCell>
                    <TableCell className="text-xs">
                      {(() => {
                        const prof = c.redeemed_by ? profiles[c.redeemed_by] : null;
                        const nombre = prof?.nombre || null;
                        const email = c.redeemed_email || prof?.email || null;
                        if (!nombre && !email) return <span className="text-muted-foreground">—</span>;
                        return (
                          <div className="leading-tight">
                            {nombre && <div className="font-medium text-foreground">{nombre}</div>}
                            {email && <div className="text-muted-foreground">{email}</div>}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.redeemed_at
                        ? new Date(c.redeemed_at).toLocaleDateString("es-CO")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString("es-CO")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {c.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => copy(c.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(c.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone = "muted",
}: {
  label: string;
  value: number;
  icon: typeof Ticket;
  tone?: "muted" | "success" | "primary" | "destructive";
}) {
  const toneClass = {
    muted: "text-muted-foreground bg-muted",
    success: "text-success bg-success/10",
    primary: "text-primary bg-primary/10",
    destructive: "text-destructive bg-destructive/10",
  }[tone];
  return (
    <Card className="p-4 flex items-center gap-3 shadow-card">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  );
}
