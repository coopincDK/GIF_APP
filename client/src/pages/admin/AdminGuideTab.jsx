import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SECTIONS = [
  {
    id: 'quick',
    emoji: '⚡',
    title: 'Hurtig start',
    color: 'from-green-500 to-emerald-600',
    items: [
      {
        q: '🎡 Tøjvask-hjulet — trin for trin',
        a: `1. Gå til 🎡 Hjul i bundmenuen\n2. Vælg de spillere der VAR til stede (chip-visning)\n3. Tryk "Spin hjulet!"\n4. Tryk "Lås vinderen" for at gemme\n\n💡 Hvis én forældre allerede har meldt sig frivillig, springes hjulet over og de får opgaven automatisk.`
      },
      {
        q: '🙋 Bekræft frivillige (frugt/kage/kørsel/fotos)',
        a: `Forældre melder sig selv på forsiden.\n\nSom admin:\n1. Gå til forsiden → "Hvem hjælper til?"\n2. Se hvem der har meldt sig\n3. Bekræft dem efter kampen\n\n✅ Bekræftede frivillige får automatisk et badge og tæller med i historikken.`
      },
      {
        q: '🏅 Tildel Ugens Helte',
        a: `Efter hver kamp/træning:\n1. Gå til Admin → Badges\n2. Vælg spiller + badge\n3. Tryk "Tildel badge"\n\nKategorier:\n⚔️ Fighter · 📈 Udvikling · 🤝 Ven · 🎨 Skønhed · 😄 Humor · 💪 Holdånd`
      },
      {
        q: '🔗 Tilmeld nye forældre/spillere',
        a: `1. Admin → Brugere → "Generer invite-link"\n2. Linket kopieres automatisk\n3. Send det på Facebook-gruppen eller i besked\n4. Forældre registrerer sig med navn + kodeord\n\n🔒 Kun folk med linket kan oprette konto.`
      },
    ]
  },
  {
    id: 'features',
    emoji: '📱',
    title: 'Funktioner',
    color: 'from-blue-500 to-indigo-600',
    items: [
      {
        q: '📅 Kampprogram — hvordan aktiveres det?',
        a: `Kræver DBU API-nøgle:\n\n1. Gå til dbu.dk → KlubAdmin → Klubben\n2. Vælg "KlubOffice Data" fanen\n3. Bestil API-nøgle (inkluderet i Klub-CMS)\n4. Find hold-ID for U10/U11 under Hold\n5. Tilføj på Render:\n   DBU_API_KEY = din-nøgle\n   DBU_TEAM_ID = holdets-id\n\n⏰ Data synkes automatisk hver 12. time.\nAdmin kan trykke 🔄 Sync for at hente straks.`
      },
      {
        q: '🏆 Superliga-widget',
        a: `Viser Superliga-resultater, kommende kampe og stilling.\n\nAPI-nøgle er allerede sat! ✅\n(football-data.org — gratis)\n\nData opdateres automatisk hver 6. time.\nVises på forsiden under "Vidste du det her?"`
      },
      {
        q: '📝 Kladde — hvad bruges den til?',
        a: `Kun admin kan se kladden.\n\nBrug den til:\n• Kampnoter ("Oliver spillede fantastisk i dag")\n• Aftaler ("Husk bold til fredag")\n• Interne beskeder til medtrænere\n• Idéer til næste sæson\n\nNoter vises med forfatter + tidsstempel.`
      },
      {
        q: '📊 Historik + Point-leaderboard',
        a: `Viser komplet historik kun for admin.\n\nPoint-system:\n• 1 point per Ugens Helt-titel\n• 1 point per tøjvask\n• 1 point per bekræftet frivillig-opgave\n\nBrug det til årsafslutning og præmier! 🏆`
      },
      {
        q: '🏆 Kattegat Cup-mode',
        a: `Cup-mode skifter hele appens tema til mørkeblåt med guld.\n\nTilstande:\n🔴 Slukket — aldrig aktiv\n🟡 Automatisk — aktiveres 4 uger før 23. juli 2026\n🟢 Tændt — altid aktiv\n\nSkift under Admin → Indstillinger.`
      },
    ]
  },
  {
    id: 'tips',
    emoji: '💡',
    title: 'Tips & tricks',
    color: 'from-yellow-500 to-orange-500',
    items: [
      {
        q: '🔄 Badges virker ikke / er tomme',
        a: `Åbn appen i browseren som admin.\nTryk F12 → Console → indsæt:\n\nfetch('https://gif-app-hs2g.onrender.com/api/admin/reseed', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }\n}).then(r => r.json()).then(console.log)\n\nTryk Enter — badges genindlæses! ✅`
      },
      {
        q: '😴 Appen er langsom første gang',
        a: `Render.com (backend) går i dvale efter 15 min inaktivitet på gratis-planen.\n\nFørste request tager 30-60 sekunder at "vågne".\n\n💡 Tip: Åbn appen om morgenen inden træning, så er den klar til spillerne.`
      },
      {
        q: '📸 Profilbilleder virker ikke',
        a: `Spillere kan uploade profilbillede under 👤 Profil.\n\nBilledet gemmes på serveren. Hvis det ikke vises:\n• Prøv at genindlæse siden\n• Tjek at billedet er under 5MB\n• Brug JPG eller PNG format`
      },
      {
        q: '🎡 Hjulet viser forkerte spillere',
        a: `Hjulet viser kun spillere du har valgt som "til stede".\n\nHvis en spiller mangler:\n• Tjek at de er registreret i appen\n• Gå til Admin → Brugere og verificér\n• Genindlæs siden og prøv igen`
      },
      {
        q: '🔁 Bytte-system — hvordan virker det?',
        a: `En spiller kan tilbyde sin tøjvask til bytte:\n1. Spiller trykker "Bytte" på sin opgave\n2. Opgaven vises som åben for alle\n3. En anden spiller trykker "Tag den!"\n\nAdmin kan se alle åbne bytter i historikken.`
      },
    ]
  },
  {
    id: 'setup',
    emoji: '🛠️',
    title: 'Teknisk opsætning',
    color: 'from-gray-600 to-gray-800',
    items: [
      {
        q: '🌐 App-links',
        a: `Frontend (Vercel):\nhttps://gif-app-navy-ten.vercel.app\n\nBackend (Render):\nhttps://gif-app-hs2g.onrender.com\n\nAdmin login:\nadmin@grenaaif.dk\nGrenaaIF2026!`
      },
      {
        q: '🔑 Miljøvariabler på Render',
        a: `Gå til: dashboard.render.com\n→ gif-app-hs2g → Environment\n\nSatte variabler:\n✅ JWT_SECRET (login-sikkerhed)\n✅ FOOTBALL_DATA_API_KEY (Superliga)\n\nMangler:\n⏳ DBU_API_KEY (kampprogram)\n⏳ DBU_TEAM_ID (hold-ID)`
      },
      {
        q: '📦 Kode og deployment',
        a: `Kode: GitHub → coopincdk/GIF_APP\n\nDeployment:\n• Push til GitHub → Vercel deployer frontend automatisk\n• Push til GitHub → Render deployer backend automatisk\n\nTypisk deploy-tid: 2-3 minutter`
      },
    ]
  },
]

function GuideSection({ section }) {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div className="space-y-2">
      {section.items.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="font-black text-gray-800 text-sm leading-tight pr-2">{item.q}</span>
            <span className={`text-gray-400 font-black text-lg flex-shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <AnimatePresence>
            {openIdx === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-gray-50">
                  <p className="text-gray-600 text-sm font-semibold leading-relaxed whitespace-pre-wrap mt-3">
                    {item.a}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

export default function AdminGuideTab() {
  const [activeSection, setActiveSection] = useState('quick')
  const section = SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`bg-gradient-to-br ${section.color} rounded-3xl p-5 text-white`}>
        <div className="text-3xl mb-1">{section.emoji}</div>
        <h3 className="font-black text-xl">Admin Guide</h3>
        <p className="text-white/80 text-sm font-semibold mt-0.5">
          GIF Hold-Helte · Grenå IF U10/U11
        </p>
      </div>

      {/* Sektion-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-black text-xs transition-all ${
              activeSection === s.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-500 border-2 border-gray-200'
            }`}>
            {s.emoji} {s.title}
          </button>
        ))}
      </div>

      {/* Indhold */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <GuideSection section={section} />
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
        <p className="text-gray-400 text-xs font-semibold">
          📱 GIF Hold-Helte v2.0 · Marts 2026
        </p>
        <p className="text-gray-300 text-[10px] font-semibold mt-0.5">
          Spørgsmål? Kontakt udvikleren 🛠️
        </p>
      </div>
    </div>
  )
}
