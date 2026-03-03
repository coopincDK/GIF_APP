# 🏆 GIF Hold-Helte — Grenå IF U10/U11

Den vildeste fodbold-app til Grenå IF! Gamificeret holdapp med badges, opgave-hjul og Kattegat Cup-mode.

---

## 🚀 Hurtig start

### 1. Start begge servere (nemmeste måde)
Dobbeltklik på **`start-alle.bat`** i rodmappen.

Det åbner to vinduer:
- 🟢 **Backend** på `http://localhost:3001`
- 🟢 **Frontend** på `http://localhost:5173`

### 2. Åbn appen
Gå til **http://localhost:5173** i din browser (helst på mobil eller med DevTools mobil-visning).

### 3. Log ind som admin
```
Email:    admin@grenaaif.dk
Password: GrenaaIF2026!
```

---

## 📱 Features

| Feature | Beskrivelse |
|---------|-------------|
| 🎡 **Opgave-Hjulet** | Animeret roulette der vælger 3 forældre til opgaver (tøjvask, frugt, kage) |
| 🔄 **Swap-system** | Forældre kan tilbyde at bytte opgave — andre kan overtage |
| ⚡ **Min Skattekiste** | Personlig badge-væg med animeret unlock + konfetti |
| 🏆 **Holdets Super-Banner** | Alle holdets badges samlet med fly-in animation |
| 📚 **Trænerens Hjørne** | Regler + sjove fodbold-facts med Adam & Blarke |
| ⛺ **Kattegat Cup** | Frivilligvagt-tilmelding med Cup-Stjerne badge |
| 🔗 **Invite-links** | Admin genererer links — ingen åben registrering |
| ⚙️ **Cup-Mode Toggle** | Tænd/sluk Cup-Mode manuelt fra admin-panelet |

---

## ⚙️ Cup-Mode

Cup-Mode aktiveres automatisk **25. juni 2026** (4 uger før Kattegat Cup 23. juli 2026).

**Manuel styring** (Admin → ⚙️ Indstillinger):
| Indstilling | Effekt |
|-------------|--------|
| 🔴 Slukket | Cup-Mode aldrig aktiv |
| 🟡 Auto | Aktiveres automatisk 25. juni 2026 |
| 🟢 Tændt | Cup-Mode aktiv **nu** |

Når Cup-Mode er aktiv skifter appen til **kongeblå + guld** tema med nedtælling.

---

## 🔐 Brugeradministration

### Tilføj ny bruger
1. Log ind som admin
2. Gå til **Admin → ⚙️ Indstillinger**
3. Klik **"Generer nyt invite-link"**
4. Send linket til forælderen (gyldigt i 7 dage)
5. Forælderen åbner linket og opretter sin profil

### Slet bruger
Admin → 👥 Brugere → 🗑️ Slet

---

## 🏅 Badges

| Badge | Optjenes ved |
|-------|-------------|
| 🧺 Hold-Helt | Fuldføre tøjvask-opgave |
| 🍎 Frugt-Helt | Medbringe frugt |
| 🎂 Kage-Helt | Medbringe kage |
| ⛺ Cup-Stjerne | Tilmelde sig en Kattegat Cup-vagt |
| 🥇 Jubilæums-Helt 2026 | Tildeles manuelt af admin |
| 🙌 High Five | Tildeles manuelt |
| 💪 Trænings-Helt | Tildeles manuelt |
| 🔥 Ild-Spiller | Tildeles manuelt |

---

## 🗂️ Projektstruktur

```
GIF_APP/
├── server/                 ← Node.js + Express + SQLite backend
│   ├── index.js            ← Entry point
│   ├── db/
│   │   ├── database.js     ← @libsql/client SQLite
│   │   ├── schema.sql      ← Database tabeller
│   │   └── seed.js         ← Startdata
│   ├── middleware/
│   │   ├── auth.js         ← JWT verify
│   │   └── adminOnly.js    ← Admin rolle check
│   ├── routes/
│   │   ├── auth.js         ← Login, register, /me
│   │   ├── users.js        ← Brugere + avatar upload
│   │   ├── invite.js       ← Invite-links
│   │   ├── tasks.js        ← Opgaver + spin + swap
│   │   ├── badges.js       ← Badges + tildeling
│   │   ├── content.js      ← Trænerens Hjørne indhold
│   │   ├── cup.js          ← Cup-Mode + vagter
│   │   └── admin.js        ← Settings + stats
│   └── .env                ← JWT_SECRET, PORT, CLIENT_URL
│
├── client/                 ← React + Vite + Tailwind frontend
│   ├── public/assets/
│   │   ├── stickers/       ← 30 GIF stickers
│   │   ├── coaches/ag/     ← Adam (15 billeder)
│   │   ├── coaches/bsj/    ← Blarke (15 billeder)
│   │   └── overlays/       ← Overlay billeder
│   └── src/
│       ├── pages/          ← 10 sider
│       ├── components/     ← UI + layout + wheel
│       ├── context/        ← Auth + CupMode
│       ├── hooks/          ← useAuth, useCupMode
│       └── api/            ← Axios + alle endpoints
│
├── start-alle.bat          ← ⭐ Start begge servere
├── start-backend.bat       ← Start kun backend
└── start-frontend.bat      ← Start kun frontend
```

---

## 🛠️ Manuel start (alternativ)

```bash
# Terminal 1 — Backend
cd server
npm install
node index.js

# Terminal 2 — Frontend
cd client
npm install
npm run dev
```

---

## 🌐 Deploy til GitHub

```bash
git init
git add .
git commit -m "Initial commit: GIF Hold-Helte app"
git remote add origin https://github.com/DIT-BRUGERNAVN/gif-hold-helte.git
git push -u origin main
```

**Backend deploy** (gratis): [Railway.app](https://railway.app) eller [Render.com]
**Frontend deploy** (gratis): [Vercel.com](https://vercel.com)

Husk at sætte `CLIENT_URL` i backend .env til din Vercel-URL når du deployer.

---

## 👨‍💼 Trænere

| Kode | Navn | Billeder |
|------|------|---------|
| `ag` | Adam | `coaches/ag/ag_01_coaching.png` ... `ag_15_rain.png` |
| `bsj` | Blarke | `coaches/bsj/bsj_01_coaching.png` ... `bsj_15_rain.png` |

---

*Bygget med ❤️ til Grenå IF U10/U11 — Fællesskab og oplevelser!* ⚽
