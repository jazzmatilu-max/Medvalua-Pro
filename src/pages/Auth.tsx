import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
const signupSchema = loginSchema.extend({
  nombre: z.string().min(2, "Nombre requerido").max(100),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login
  const [lEmail, setLEmail] = useState("");
  const [lPass, setLPass] = useState("");

  // Signup
  const [sNombre, setSNombre] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: lEmail, password: lPass });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: lEmail,
      password: lPass,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bienvenido");
    navigate("/", { replace: true });
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({
      email: sEmail,
      password: sPass,
      nombre: sNombre,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPass,
      options: {
        data: { nombre: sNombre },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Cuenta creada", {
      description: "Solicita un cupón al administrador para activar tu acceso.",
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Stethoscope className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">MedValua</h1>
            <p className="text-sm text-muted-foreground">
              Sistema pericial · Decreto 1507/2014
            </p>
          </div>
        </div>

        <Card className="p-6 shadow-elegant">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={lEmail}
                    onChange={(e) => setLEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <PasswordInput
                    value={lPass}
                    onChange={setLPass}
                    show={show}
                    onToggle={() => setShow(!show)}
                    autoComplete="current-password"
                  />
                </div>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline block"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={onSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input
                    value={sNombre}
                    onChange={(e) => setSNombre(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <PasswordInput
                    value={sPass}
                    onChange={setSPass}
                    show={show}
                    onToggle={() => setShow(!show)}
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2">
                  Tras crear tu cuenta, solicita un cupón al administrador para activar el acceso completo.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
        aria-label={show ? "Ocultar" : "Mostrar"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
