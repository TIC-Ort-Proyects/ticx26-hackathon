"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "es";

/* Each language is a deep object with the same shape. Content that pairs with
   structural data in data.ts (quiz correctness, deck interest/mode mapping,
   emojis, prices) is aligned by index/key. */
const DICT = {
  en: {
    langName: "English",
    nav: { home: "Home", play: "Play", squeaky: "Squeaky", history: "History", settings: "Settings" },
    common: {
      back: "Back", cancel: "Cancel", save: "Save", done: "Done", next: "Next", skip: "Skip",
      logout: "Log out", edit: "Edit", continue: "Continue", login: "Log in",
      createAccount: "Create account", startLearning: "Start learning",
    },
    auth: {
      loginFailed: "Wrong email or password.",
      emailExists: "That email already has an account. Log in instead.",
    },
    welcome: {
      tagline: "Your personal AI tutor that teaches anything — through the things you already love.",
      create: "Create account", have: "I already have an account",
      features: [
        { emoji: "🎓", title: "A tutor for every topic", body: "Chat, ask and finally get it." },
        { emoji: "❤️", title: "Taught through what you love", body: "Lessons built from your interests." },
        { emoji: "🎮", title: "Play and keep your streak", body: "Quick games make it stick." },
      ],
    },
    login: {
      title: "Welcome back", sub: "Squeaky missed you. Pick up right where you left off.",
      email: "Email", emailPh: "you@email.com", password: "Password", passwordPh: "Your password",
      newHere: "New here?", createOne: "Create an account",
    },
    onboarding: {
      step: "Step {n} of 3",
      authTitle: "Create your account", authSub: "Your progress and lessons stay saved across devices.",
      passwordPh: "At least 4 characters",
      already: "Already have an account?",
      aboutTitle: "Nice to meet you", aboutSub: "Squeaky tailors every lesson to who you are.",
      name: "Your name", namePh: "e.g. Mara", age: "Age", agePh: "e.g. 24",
      bubble: "Hi, I'm Squeaky! Tell me what you love — I'll teach everything through it.",
      interestsTitle: "What are you into?", interestsSub: "Pick as many as you like. The more I know, the better I teach.",
      addOwnPh: "Add your own (e.g. Skateboarding)", selected: "{n} selected",
    },
    home: {
      heroName: "Hi, I'm Squeaky!", heroBody: "Tap me for a quick tour of how TutorIAs works.",
      startTour: "Start the tour", thisWeek: "This week", streakLabel: "{n} DAY STREAK 🔥",
      prompt: "What do you want to learn today? Each topic is its own tutor that teaches through what you love.",
      addTopic: "Add a topic", addTopicSub: "Study anything that's not here yet",
      greetMorning: "Good morning", greetAfternoon: "Good afternoon", greetEvening: "Good evening",
      there: "there",
    },
    play: {
      title: "Play", sub: "Quick brain games to keep your streak alive — Squeaky's picks for today.",
      dailyChallenge: "DAILY CHALLENGE", quizName: "Squeaky Quiz", quizSub: "5 quick questions · earns your streak",
      cardsName: "Flashcard Flip", cardsSub: "Flip & recall, your way",
      totName: "This or That", totSub: "Quick taps, Squeaky learns you",
      surveyName: "All about you", surveySub: "Fun questions so Squeaky tailors the app to you",
      streakN: "{n}-day streak",
      streakAwake: "Wide awake — nice work today!", streakAsleep: "Your streak's asleep — study or play to wake it up!",
      question: "Question {i} / {n}", pts: "{n} pts", seeResult: "See result", nextQuestion: "Next question",
      nice: "Nice one! ", notQuite: "Not quite — ",
      resBrilliant: "Brilliant!", resNice: "Nice work!", resGood: "Good effort!",
      resMsgHigh: "You're on fire. ", resMsgMid: "Solid run. ", resMsgLow: "Every round makes you sharper. ",
      resTail: "Your streak is now {n} days. Want to go again?", playAgain: "Play again",
      term: "Term", answer: "Answer", tapFlip: "Tap to flip", startOver: "Start over", nextCard: "Next card",
      gotToKnow: "Squeaky got to know you!", gkBody: "Here's what I picked up — I've tuned your topics and lessons to match.",
      gkMode: "I'll lean on {mode} mode by default.", again: "Again",
    },
    chat: {
      here: "Squeaky is here to help", placeholder: "Ask Squeaky anything…",
      explain: "✨ Explain it", quizMe: "🧠 Quiz me",
      explainPreset: "Can you explain my uploaded material to me, step by step?",
      quizPreset: "Quiz me on the material I uploaded — one question at a time.",
      fallback: "Good question! Let's picture it through {interest}. Want me to break it into smaller steps, or try a quick example?",
      intro: "Hey {name}! Ready for {topic}? I'll explain everything through {interests}.{tail} Where do you want to start — or just ask me anything.",
      introTail: " We'll do this in {mode} mode.",
      ack: "Got it — I've read your material “{name}”. I can explain it in your chosen mode or quiz you on it. What would you like?",
    },
    squeaky: {
      buddy: "Your buddy", coinsTip: "Earn coins every day you study or keep your streak — spend them here to dress up Squeaky.",
      wearing: "Wearing", tapWear: "Tap to wear", free: "Free",
      cats: { color: "Colors", hat: "Hats", acc: "Extras", scene: "Scenes" },
    },
    history: {
      title: "Your lessons", sub: "Resume, archive or clear what you've studied.",
      active: "Active", archived: "Archived",
      emptyActive: "Open a topic and your lessons will show up here.",
      emptyArchived: "Nothing archived yet — tidy lessons land here.",
      openLesson: "Open lesson", archive: "Archive", unarchive: "Unarchive", deleteLesson: "Delete lesson",
    },
    settings: {
      title: "Settings", age: "Age", interests: "Your interests", addOwnPh: "Add your own…",
      preferences: "Preferences",
      nudge: "Daily nudge from Squeaky", nudgeDesc: "A gentle reminder to keep your streak.",
      sounds: "Sound effects", soundsDesc: "Chimes when you get things right.",
      checkins: "Motivation check-ins", checkinsDesc: "Squeaky steps in when you seem stuck.",
      language: "Language",
    },
    profile: {
      editTitle: "Edit profile", name: "Name", namePh: "Your name", age: "Age", agePh: "Your age",
      email: "Email", emailPh: "you@email.com", removePhoto: "Remove photo", changePw: "Change password",
      saveChanges: "Save changes",
      pwTitle: "Change password", pwCurrent: "Current password", pwCurrentPh: "Current password",
      pwNew: "New password", pwNewPh: "At least 4 characters", pwConfirm: "Confirm new password", pwConfirmPh: "Repeat new password",
      updatePw: "Update password",
      pwWrong: "Your current password is incorrect.", pwShort: "New password must be at least 4 characters.",
      pwMismatch: "The new passwords don't match.",
    },
    modal: {
      modeTitle: "How do you want to learn {topic}?", modeSub: "Same topic, taught your way. Switch anytime.",
      addTitle: "Add a topic", addSub: "Squeaky can tutor anything. What do you want to study?",
      addPh: "e.g. Astrophysics, Guitar, Chess…", pickIcon: "Pick an icon", createStudy: "Create & study",
      attachTitle: "Add study material", attachSub: "Paste a summary, notes or a definition — Squeaky will explain and quiz you from it.",
      attachPh: "Paste your notes here…", uploadTxt: "Upload a .txt file", loaded: "Loaded: {name}", giveSqueaky: "Give it to Squeaky",
      renameTitle: "Rename topic", renamePh: "Topic name",
    },
    modes: {
      simplified: { title: "Simplified", desc: "Plain words, zero jargon" },
      story: { title: "Story", desc: "Learn it as a narrative" },
      challenge: { title: "Challenge", desc: "Test yourself" },
      visual: { title: "Visual", desc: "Pictures & diagrams" },
      step: { title: "Step-by-step", desc: "One small step at a time" },
      game: { title: "Playing", desc: "Points, levels & fun" },
    },
    topics: {
      math: { title: "Mathematics", blurb: "Algebra & calculus through your world." },
      physics: { title: "Physics", blurb: "Forces and motion you can picture." },
      chemistry: { title: "Chemistry", blurb: "Reactions explained your way." },
      biology: { title: "Biology", blurb: "Life, cells and systems made clear." },
      worldhistory: { title: "World history", blurb: "Stories from the past that stick." },
      geography: { title: "Geography", blurb: "The planet, mapped to you." },
      programming: { title: "Programming", blurb: "Code, step by step at your pace." },
      english: { title: "English writing", blurb: "Write with clarity and confidence." },
      economics: { title: "Economics", blurb: "Money and markets, demystified." },
      musictheory: { title: "Music theory", blurb: "Scales and harmony that click." },
      art: { title: "Art & design", blurb: "Composition, color and craft." },
      philosophy: { title: "Philosophy", blurb: "Big questions, plain language." },
    },
    customBlurb: "Your custom tutor, ready when you are.",
    interests: {
      Minecraft: "Minecraft", Football: "Football", Anime: "Anime", Music: "Music", Gaming: "Gaming",
      Cooking: "Cooking", Movies: "Movies", Science: "Science", Travel: "Travel", Cars: "Cars",
      Art: "Art", Coding: "Coding", Basketball: "Basketball", Space: "Space", Animals: "Animals",
      Photography: "Photography", Reading: "Reading", Dance: "Dance", Fashion: "Fashion", Nature: "Nature",
    },
    catalog: {
      c_classic: "Classic", c_rosy: "Rosy", c_mint: "Minty", c_sky: "Sky", c_berry: "Berry", c_ghost: "Ghost",
      h_grad: "Grad cap", h_cap: "Cap", h_top: "Top hat", h_crown: "Crown", h_flower: "Flower",
      f_shades: "Shades", f_glasses: "Glasses", n_bow: "Bow tie", n_scarf: "Scarf", n_medal: "Medal",
      b_cream: "Cream", b_sunset: "Sunset", b_ocean: "Ocean", b_forest: "Forest", b_galaxy: "Galaxy",
    },
    tour: [
      { title: "Welcome to TutorIAs!", body: "I'm Squeaky, your tutor. Every topic here is its own AI mentor that teaches through the things you love." },
      { title: "Add anything", body: "Can't find your topic? Tap “Add a topic” and I'll tutor literally anything — guitar, chess, astrophysics, you name it." },
      { title: "Learn your way", body: "When you open a topic you choose HOW to learn: by playing, as a story, step-by-step, and more. Switch the mode anytime." },
      { title: "Play to learn", body: "The Play tab has daily quizzes and flashcard games — a fun 2-minute way to keep your streak alive." },
      { title: "Keep your streak", body: "Study a little every day and your streak grows. I'll cheer you on the whole way. Ready? Let's go!" },
    ],
    quiz: [
      { q: "In football, how many players from each team are on the pitch?", opts: ["9", "11", "13", "7"], note: "Eleven a side — the classic starting XI." },
      { q: "What is 15% of 200?", opts: ["15", "20", "30", "45"], note: "10% is 20, half of that is 10, so 30." },
      { q: "Which planet is known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Mercury"], note: "Mars — rusty iron dust gives it that colour." },
      { q: "In a 4/4 time signature, how many beats are in a bar?", opts: ["2", "3", "4", "6"], note: "Four quarter-note beats per bar." },
      { q: "What does CPU stand for?", opts: ["Central Process Unit", "Central Processing Unit", "Core Power Unit", "Computer Personal Unit"], note: "Central Processing Unit — the computer's brain." },
      { q: "Which gas do plants absorb to grow?", opts: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], note: "CO₂ in, oxygen out — photosynthesis." },
      { q: "A right angle measures how many degrees?", opts: ["45", "60", "90", "180"], note: "Exactly 90 degrees — a perfect corner." },
      { q: "Who wrote Romeo and Juliet?", opts: ["Dickens", "Shakespeare", "Austen", "Tolkien"], note: "William Shakespeare, around 1595." },
    ],
    cards: [
      { front: "Derivative of x²", back: "2x" }, { front: "Capital of Japan", back: "Tokyo" },
      { front: "H₂O is…", back: "Water" }, { front: "7 × 8", back: "56" },
      { front: "Speed = ?", back: "Distance ÷ Time" }, { front: "Past tense of “go”", back: "went" },
    ],
    tot: { title: "This or That", intro: "Tap the one that's more you.", labels: [["Movies", "Series"], ["Team sports", "Solo sports"], ["Video games", "Board games"], ["Music", "Podcasts"], ["Space", "Ocean"], ["Cooking", "Travel"]] },
    survey: {
      title: "All about you", intro: "A few quick taps so I can teach you better.",
      questions: ["Pick a dream skill", "How do you like to learn?", "Your ideal weekend?", "A topic you secretly want to ace?"],
      labels: [["Make music", "Build games", "Explore space", "Speak a language"], ["By playing", "As a story", "Step by step", "Keep it simple"], ["Outdoors", "Gaming", "Cooking", "Reading"], ["Science", "Art", "Coding", "History"]],
    },
  },

  es: {
    langName: "Español",
    nav: { home: "Inicio", play: "Jugar", squeaky: "Squeaky", history: "Historial", settings: "Ajustes" },
    common: {
      back: "Atrás", cancel: "Cancelar", save: "Guardar", done: "Listo", next: "Siguiente", skip: "Saltar",
      logout: "Cerrar sesión", edit: "Editar", continue: "Continuar", login: "Iniciar sesión",
      createAccount: "Crear cuenta", startLearning: "Empezar a aprender",
    },
    auth: {
      loginFailed: "Correo o contraseña incorrectos.",
      emailExists: "Ese correo ya tiene una cuenta. Iniciá sesión.",
    },
    welcome: {
      tagline: "Tu tutor de IA personal que enseña cualquier cosa — a través de lo que ya te encanta.",
      create: "Crear cuenta", have: "Ya tengo una cuenta",
      features: [
        { emoji: "🎓", title: "Un tutor para cada tema", body: "Charlá, preguntá y por fin entendelo." },
        { emoji: "❤️", title: "Enseñado con lo que te gusta", body: "Lecciones hechas con tus intereses." },
        { emoji: "🎮", title: "Jugá y mantené tu racha", body: "Juegos rápidos que lo fijan." },
      ],
    },
    login: {
      title: "Qué bueno verte", sub: "Squeaky te extrañó. Seguí justo donde lo dejaste.",
      email: "Correo", emailPh: "vos@correo.com", password: "Contraseña", passwordPh: "Tu contraseña",
      newHere: "¿Sos nuevo?", createOne: "Creá una cuenta",
    },
    onboarding: {
      step: "Paso {n} de 3",
      authTitle: "Creá tu cuenta", authSub: "Tu progreso y lecciones quedan guardados en todos tus dispositivos.",
      passwordPh: "Al menos 4 caracteres",
      already: "¿Ya tenés cuenta?",
      aboutTitle: "Encantado de conocerte", aboutSub: "Squeaky adapta cada lección a quién sos.",
      name: "Tu nombre", namePh: "ej. Mara", age: "Edad", agePh: "ej. 24",
      bubble: "¡Hola, soy Squeaky! Contame qué te gusta — voy a enseñarte todo a través de eso.",
      interestsTitle: "¿Qué te gusta?", interestsSub: "Elegí los que quieras. Cuanto más sé, mejor enseño.",
      addOwnPh: "Agregá el tuyo (ej. Skate)", selected: "{n} seleccionados",
    },
    home: {
      heroName: "¡Hola, soy Squeaky!", heroBody: "Tocame para un tour rápido de cómo funciona TutorIAs.",
      startTour: "Empezar el tour", thisWeek: "Esta semana", streakLabel: "RACHA DE {n} DÍAS 🔥",
      prompt: "¿Qué querés aprender hoy? Cada tema es su propio tutor que enseña con lo que te encanta.",
      addTopic: "Agregar tema", addTopicSub: "Estudiá algo que todavía no esté acá",
      greetMorning: "Buenos días", greetAfternoon: "Buenas tardes", greetEvening: "Buenas noches",
      there: "che",
    },
    play: {
      title: "Jugar", sub: "Juegos rápidos para mantener viva tu racha — las elecciones de Squeaky para hoy.",
      dailyChallenge: "DESAFÍO DIARIO", quizName: "Quiz de Squeaky", quizSub: "5 preguntas rápidas · suma a tu racha",
      cardsName: "Tarjetas Flash", cardsSub: "Dalas vuelta y recordá, a tu manera",
      totName: "Esto o Aquello", totSub: "Toques rápidos, Squeaky te conoce",
      surveyName: "Todo sobre vos", surveySub: "Preguntas divertidas para que Squeaky adapte la app a vos",
      streakN: "racha de {n} días",
      streakAwake: "¡Bien despierta — buen trabajo hoy!", streakAsleep: "Tu racha está dormida — estudiá o jugá para despertarla.",
      question: "Pregunta {i} / {n}", pts: "{n} pts", seeResult: "Ver resultado", nextQuestion: "Siguiente pregunta",
      nice: "¡Muy bien! ", notQuite: "Casi — ",
      resBrilliant: "¡Brillante!", resNice: "¡Buen trabajo!", resGood: "¡Buen intento!",
      resMsgHigh: "Estás imparable. ", resMsgMid: "Buena ronda. ", resMsgLow: "Cada ronda te hace más filoso. ",
      resTail: "Tu racha ahora es de {n} días. ¿Otra vez?", playAgain: "Jugar de nuevo",
      term: "Término", answer: "Respuesta", tapFlip: "Tocá para dar vuelta", startOver: "Empezar de nuevo", nextCard: "Siguiente tarjeta",
      gotToKnow: "¡Squeaky te conoció!", gkBody: "Esto es lo que aprendí — ajusté tus temas y lecciones para que coincidan.",
      gkMode: "Voy a usar el modo {mode} por defecto.", again: "Otra vez",
    },
    chat: {
      here: "Squeaky está acá para ayudarte", placeholder: "Preguntale lo que quieras a Squeaky…",
      explain: "✨ Explicámelo", quizMe: "🧠 Tomame examen",
      explainPreset: "¿Podés explicarme el material que subí, paso a paso?",
      quizPreset: "Tomame un examen sobre el material que subí — una pregunta a la vez.",
      fallback: "¡Buena pregunta! Imaginémoslo con {interest}. ¿Querés que lo divida en pasos más chicos, o un ejemplo rápido?",
      intro: "¡Hola {name}! ¿Listo para {topic}? Te voy a explicar todo a través de {interests}.{tail} ¿Por dónde querés empezar — o preguntame lo que quieras.",
      introTail: " Lo haremos en modo {mode}.",
      ack: "Listo — leí tu material “{name}”. Puedo explicártelo en el modo que elijas o tomarte examen. ¿Qué preferís?",
    },
    squeaky: {
      buddy: "Tu compañero", coinsTip: "Ganá monedas cada día que estudias o mantenés tu racha — gastalas acá para vestir a Squeaky.",
      wearing: "Puesto", tapWear: "Tocá para usar", free: "Gratis",
      cats: { color: "Colores", hat: "Gorros", acc: "Extras", scene: "Fondos" },
    },
    history: {
      title: "Tus lecciones", sub: "Retomá, archivá o borrá lo que estudiaste.",
      active: "Activas", archived: "Archivadas",
      emptyActive: "Abrí un tema y tus lecciones van a aparecer acá.",
      emptyArchived: "Nada archivado todavía — las lecciones ordenadas caen acá.",
      openLesson: "Abrir lección", archive: "Archivar", unarchive: "Desarchivar", deleteLesson: "Borrar lección",
    },
    settings: {
      title: "Ajustes", age: "Edad", interests: "Tus intereses", addOwnPh: "Agregá el tuyo…",
      preferences: "Preferencias",
      nudge: "Recordatorio diario de Squeaky", nudgeDesc: "Un empujoncito suave para tu racha.",
      sounds: "Efectos de sonido", soundsDesc: "Sonidos cuando acertás.",
      checkins: "Chequeos de motivación", checkinsDesc: "Squeaky aparece cuando te ve trabado.",
      language: "Idioma",
    },
    profile: {
      editTitle: "Editar perfil", name: "Nombre", namePh: "Tu nombre", age: "Edad", agePh: "Tu edad",
      email: "Correo", emailPh: "vos@correo.com", removePhoto: "Quitar foto", changePw: "Cambiar contraseña",
      saveChanges: "Guardar cambios",
      pwTitle: "Cambiar contraseña", pwCurrent: "Contraseña actual", pwCurrentPh: "Contraseña actual",
      pwNew: "Nueva contraseña", pwNewPh: "Al menos 4 caracteres", pwConfirm: "Confirmar nueva contraseña", pwConfirmPh: "Repetí la nueva contraseña",
      updatePw: "Actualizar contraseña",
      pwWrong: "Tu contraseña actual es incorrecta.", pwShort: "La nueva contraseña debe tener al menos 4 caracteres.",
      pwMismatch: "Las contraseñas nuevas no coinciden.",
    },
    modal: {
      modeTitle: "¿Cómo querés aprender {topic}?", modeSub: "Mismo tema, enseñado a tu manera. Cambialo cuando quieras.",
      addTitle: "Agregar tema", addSub: "Squeaky puede enseñar cualquier cosa. ¿Qué querés estudiar?",
      addPh: "ej. Astrofísica, Guitarra, Ajedrez…", pickIcon: "Elegí un ícono", createStudy: "Crear y estudiar",
      attachTitle: "Agregar material de estudio", attachSub: "Pegá un resumen, apuntes o una definición — Squeaky te lo explica y te toma examen.",
      attachPh: "Pegá tus apuntes acá…", uploadTxt: "Subir un archivo .txt", loaded: "Cargado: {name}", giveSqueaky: "Dárselo a Squeaky",
      renameTitle: "Renombrar tema", renamePh: "Nombre del tema",
    },
    modes: {
      simplified: { title: "Simplificado", desc: "Palabras simples, cero jerga" },
      story: { title: "Historia", desc: "Aprendelo como un relato" },
      challenge: { title: "Desafío", desc: "Ponete a prueba" },
      visual: { title: "Visual", desc: "Imágenes y diagramas" },
      step: { title: "Paso a paso", desc: "Un pasito a la vez" },
      game: { title: "Jugando", desc: "Puntos, niveles y diversión" },
    },
    topics: {
      math: { title: "Matemática", blurb: "Álgebra y cálculo a través de tu mundo." },
      physics: { title: "Física", blurb: "Fuerzas y movimiento que podés imaginar." },
      chemistry: { title: "Química", blurb: "Reacciones explicadas a tu manera." },
      biology: { title: "Biología", blurb: "La vida, las células y los sistemas, claros." },
      worldhistory: { title: "Historia mundial", blurb: "Historias del pasado que se quedan." },
      geography: { title: "Geografía", blurb: "El planeta, mapeado para vos." },
      programming: { title: "Programación", blurb: "Código, paso a paso a tu ritmo." },
      english: { title: "Escritura en inglés", blurb: "Escribí con claridad y confianza." },
      economics: { title: "Economía", blurb: "El dinero y los mercados, sin misterio." },
      musictheory: { title: "Teoría musical", blurb: "Escalas y armonía que tienen sentido." },
      art: { title: "Arte y diseño", blurb: "Composición, color y oficio." },
      philosophy: { title: "Filosofía", blurb: "Grandes preguntas, en palabras simples." },
    },
    customBlurb: "Tu tutor a medida, listo cuando vos quieras.",
    interests: {
      Minecraft: "Minecraft", Football: "Fútbol", Anime: "Anime", Music: "Música", Gaming: "Videojuegos",
      Cooking: "Cocina", Movies: "Películas", Science: "Ciencia", Travel: "Viajes", Cars: "Autos",
      Art: "Arte", Coding: "Programar", Basketball: "Básquet", Space: "Espacio", Animals: "Animales",
      Photography: "Fotografía", Reading: "Lectura", Dance: "Baile", Fashion: "Moda", Nature: "Naturaleza",
    },
    catalog: {
      c_classic: "Clásico", c_rosy: "Rosado", c_mint: "Menta", c_sky: "Cielo", c_berry: "Mora", c_ghost: "Fantasma",
      h_grad: "Birrete", h_cap: "Gorra", h_top: "Galera", h_crown: "Corona", h_flower: "Flor",
      f_shades: "Lentes de sol", f_glasses: "Anteojos", n_bow: "Moñito", n_scarf: "Bufanda", n_medal: "Medalla",
      b_cream: "Crema", b_sunset: "Atardecer", b_ocean: "Océano", b_forest: "Bosque", b_galaxy: "Galaxia",
    },
    tour: [
      { title: "¡Bienvenido a TutorIAs!", body: "Soy Squeaky, tu tutor. Cada tema acá es su propio mentor de IA que enseña con lo que te gusta." },
      { title: "Agregá lo que sea", body: "¿No encontrás tu tema? Tocá “Agregar tema” y te enseño literalmente cualquier cosa — guitarra, ajedrez, astrofísica, lo que sea." },
      { title: "Aprendé a tu manera", body: "Cuando abrís un tema elegís CÓMO aprender: jugando, como historia, paso a paso y más. Cambiá el modo cuando quieras." },
      { title: "Jugá para aprender", body: "La pestaña Jugar tiene quizzes diarios y juegos de tarjetas — 2 minutos divertidos para mantener tu racha." },
      { title: "Mantené tu racha", body: "Estudiá un poco cada día y tu racha crece. Te voy a alentar todo el camino. ¿Listo? ¡Vamos!" },
    ],
    quiz: [
      { q: "En el fútbol, ¿cuántos jugadores de cada equipo hay en la cancha?", opts: ["9", "11", "13", "7"], note: "Once por lado — el clásico equipo titular." },
      { q: "¿Cuánto es el 15% de 200?", opts: ["15", "20", "30", "45"], note: "El 10% es 20, la mitad es 10, así que 30." },
      { q: "¿Qué planeta es conocido como el Planeta Rojo?", opts: ["Venus", "Marte", "Júpiter", "Mercurio"], note: "Marte — el polvo de hierro oxidado le da ese color." },
      { q: "En un compás de 4/4, ¿cuántos tiempos hay por compás?", opts: ["2", "3", "4", "6"], note: "Cuatro tiempos de negra por compás." },
      { q: "¿Qué significa CPU?", opts: ["Unidad de Proceso Central", "Unidad Central de Procesamiento", "Unidad de Potencia Central", "Unidad Personal de Computadora"], note: "Unidad Central de Procesamiento — el cerebro de la compu." },
      { q: "¿Qué gas absorben las plantas para crecer?", opts: ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Helio"], note: "Entra CO₂, sale oxígeno — fotosíntesis." },
      { q: "¿Cuántos grados mide un ángulo recto?", opts: ["45", "60", "90", "180"], note: "Exactamente 90 grados — una esquina perfecta." },
      { q: "¿Quién escribió Romeo y Julieta?", opts: ["Dickens", "Shakespeare", "Austen", "Tolkien"], note: "William Shakespeare, alrededor de 1595." },
    ],
    cards: [
      { front: "Derivada de x²", back: "2x" }, { front: "Capital de Japón", back: "Tokio" },
      { front: "H₂O es…", back: "Agua" }, { front: "7 × 8", back: "56" },
      { front: "Velocidad = ?", back: "Distancia ÷ Tiempo" }, { front: "Pasado de “ir”", back: "fui" },
    ],
    tot: { title: "Esto o Aquello", intro: "Tocá el que sea más vos.", labels: [["Películas", "Series"], ["Deportes en equipo", "Deportes individuales"], ["Videojuegos", "Juegos de mesa"], ["Música", "Podcasts"], ["Espacio", "Océano"], ["Cocina", "Viajes"]] },
    survey: {
      title: "Todo sobre vos", intro: "Unos toques rápidos para enseñarte mejor.",
      questions: ["Elegí una habilidad soñada", "¿Cómo te gusta aprender?", "¿Tu finde ideal?", "¿Un tema que querés dominar en secreto?"],
      labels: [["Hacer música", "Crear juegos", "Explorar el espacio", "Hablar un idioma"], ["Jugando", "Como historia", "Paso a paso", "Algo simple"], ["Al aire libre", "Videojuegos", "Cocinar", "Leer"], ["Ciencia", "Arte", "Programar", "Historia"]],
    },
  },
} as const;

type Dict = typeof DICT.en;

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj);
}

export interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  raw: <T = unknown>(path: string) => T;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("tutorias_lang"); } catch {}
    if (saved === "en" || saved === "es") { setLangState(saved); return; }
    const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
    setLangState(nav.startsWith("es") ? "es" : "en");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("tutorias_lang", l); } catch {}
  };

  const t = (path: string, vars?: Record<string, string | number>): string => {
    let val = get(DICT[lang], path);
    if (val === undefined) val = get(DICT.en, path);
    let str = typeof val === "string" ? val : path;
    if (vars) for (const k of Object.keys(vars)) str = str.split(`{${k}}`).join(String(vars[k]));
    return str;
  };

  const raw = <T,>(path: string): T => {
    let val = get(DICT[lang], path);
    if (val === undefined) val = get(DICT.en, path);
    return val as T;
  };

  return <I18nContext.Provider value={{ lang, setLang, t, raw }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export type { Dict };
