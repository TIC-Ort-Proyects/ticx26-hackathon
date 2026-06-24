# TutorIAs — Tu tutor de IA personal

Plataforma educativa impulsada por IA que enseña **cualquier tema usando los intereses de cada estudiante** (videojuegos, series, deportes, hobbies) y **detecta cuándo el alumno pierde la motivación** para adaptar la explicación. Squeaky, la mascota tutora, acompaña todo el camino.

> _"Explicame las derivadas" → la IA las explica como la inclinación de una montaña en Minecraft o la velocidad de un jugador de fútbol._

## Stack

- **Next.js 16** (App Router) — backend con **Server Actions**
- **Google Gemini API** (`@google/genai`) para el tutor IA
- Autenticación propia: email + contraseña (hash `scrypt`) con **sesiones en DB** (cookie httpOnly)
- **Drizzle ORM** + **PostgreSQL** (hosteado en [Neon](https://neon.tech))
- React 19, i18n propio (Español / Inglés), UI responsive (mobile → desktop)

## Funcionalidades

- Onboarding (cuenta, datos del alumno, intereses) e inicio de sesión real
- Pantalla de inicio con temas, racha semanal y tour guiado
- **Chat con la IA** por tema, con 6 modos: simplificado, historia, desafío, visual, paso a paso, jugando
- Subir material de estudio (.txt o pegado) para que Squeaky explique y tome examen
- **Jugar**: quiz diario, tarjetas (flashcards) y juegos para conocer al alumno
- Personalizar a Squeaky con monedas (colores, gorros, accesorios, fondos)
- Historial de lecciones con progreso (archivar / borrar)
- Ajustes: perfil, foto, intereses, preferencias, **idioma (ES/EN)** y cambio de contraseña
- Todo el progreso se **guarda en la base** automáticamente cuando hay sesión

> La app **funciona sin configurar nada** (modo invitado: el estado vive en el navegador y Squeaky usa respuestas de respaldo). Configurá la DB y la IA para tener cuentas reales, persistencia y respuestas generadas.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completá los valores (ver abajo)
npm run db:push        # crea las tablas (solo si configuraste DATABASE_URL)
npm run dev            # http://localhost:3000
```

### ¿De dónde saco las API keys?

| Variable         | Dónde conseguirla                                                                 |
| ---------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`   | [neon.tech](https://neon.tech) → creá un proyecto → copiá la *connection string* (host con `-pooler`, `sslmode=require`). |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → *Create API key*. |

Ambas tienen plan gratuito suficiente para desarrollo. Sin `DATABASE_URL` no hay login/persistencia (modo invitado). Sin `GEMINI_API_KEY` el chat usa respuestas de respaldo.

## Scripts de base de datos

| Script                | Descripción                               |
| --------------------- | ----------------------------------------- |
| `npm run db:push`     | Sincroniza el schema con la base (rápido) |
| `npm run db:generate` | Genera migraciones SQL (en `drizzle/`)    |
| `npm run db:migrate`  | Aplica migraciones                        |
| `npm run db:studio`   | Abre Drizzle Studio                       |

## Estructura

```
src/
  app/
    actions/
      auth.ts          # signup / login / logout (Server Actions)
      data.ts          # loadState / saveAll / sendChat (IA) (Server Actions)
    page.tsx           # carga la sesión + estado y renderiza la app
    layout.tsx, globals.css
  components/tutorias/
    App.tsx            # la app completa (todas las pantallas + lógica)
    ui.tsx             # primitivos del design system (Button, Card, ...)
    data.ts            # datos estructurales (temas, modos, catálogo, quiz)
    i18n.tsx           # diccionarios ES/EN + provider
  db/
    schema.ts          # users, sessions, profiles, topics, lessons, messages
    index.ts           # cliente Drizzle (Neon)
  lib/
    auth.ts            # hashing scrypt + sesiones + cookies
    appdata.ts         # tipos compartidos + defaults
public/squeaky/        # sprites de la mascota
drizzle/               # migraciones SQL generadas
```

## Deploy en Vercel

1. Importá el repo en [vercel.com/new](https://vercel.com/new) (auto-detecta Next.js).
2. Cargá las variables de entorno (`DATABASE_URL`, `GEMINI_API_KEY`, opcional `GEMINI_MODEL`).
3. Deploy. Las Server Actions corren como funciones serverless automáticamente.
