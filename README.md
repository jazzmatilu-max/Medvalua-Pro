# MedValua

Aplicacion pericial basada en el Decreto 1507/2014.

## Despliegue en Vercel

Configura estas variables para Production, Preview y Development:

```env
VITE_SUPABASE_URL=https://wcqywnwkimetbovdjgpo.supabase.co
VITE_SUPABASE_ANON_KEY=<clave anon del proyecto>
VITE_SUPABASE_PUBLISHABLE_KEY=<clave publishable del proyecto>
```

El proyecto usa `vercel.json` para que las rutas de la SPA, incluida `/auth`, funcionen al recargar.
