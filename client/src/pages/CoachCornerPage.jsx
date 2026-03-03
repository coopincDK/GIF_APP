import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRules, getFacts } from '../api/content'

const FALLBACK_REGLER = [
  { content_id: '1', title: 'Mødepligt', body_text: 'Alle spillere møder op 15 minutter før kampstart. Vis respekt for holdkammeraterne ved at være til tiden.' },
  { content_id: '2', title: 'Fair Play', body_text: 'Vi spiller fair og respekterer modstandere, dommere og tilskuere. Grimme tacklinger accepteres ikke.' },
  { content_id: '3', title: 'Holdånd', body_text: 'Vi hepper på hinanden, også når det er svært. Alle på holdet er lige vigtige – fra keeper til angriber.' },
  { content_id: '4', title: 'Presfri Zone', body_text: 'Ved målspark i U10 (5v5) må modstanderne ikke presse inden for den presfri zone. Keeperen kan spille bolden roligt ud.' },
  { content_id: '5', title: 'Tilbagelægning', body_text: 'Hvis en spiller spiller bolden tilbage til sin keeper med foden, MÅ keeperen IKKE tage bolden med hænderne!' },
]

const FALLBACK_FACTS = [
  { content_id: 'f1', title: 'Vidste du?', body_text: 'En fodboldspiller løber i gennemsnit 10-12 km per kamp. Det svarer til at løbe fra Grenå centrum til Gjerrild!' },
  { content_id: 'f2', title: 'Grenå IF fylder 40!', body_text: 'I 2026 fejrer Grenå IF sit 40-års jubilæum med det store Kattegat Cup stævne. En kæmpe fejring for hele klubben!' },
  { content_id: 'f3', title: 'Boldspillets magi', body_text: 'Fodbold spilles i over 200 lande og er verdens mest populære sport med over 250 millioner aktive spillere!' },
  { content_id: 'f4', title: 'Den hurtigste aflevering', body_text: 'Den hurtigste aflevering i fodboldhistorien blev målt til over 210 km/t! Det er hurtigere end et tog!' },
]

const TABS = [
  { id: 'regler', label: '⚽ Regel-Galaksen', emoji: '📋' },
  { id: 'facts',  label: '⭐ Viden-Stjernerne', emoji: '🧠' },
]

export default function CoachCornerPage() {
  const [tab, setTab] = useState('regler')
  const [regler, setRegler] = useState(FALLBACK_REGLER)
  const [facts, setFacts] = useState(FALLBACK_FACTS)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getRules().then(({ data }) => { if (data?.length) setRegler(data) }).catch(() => {})
    getFacts().then(({ data }) => { if (data?.length) setFacts(data) }).catch(() => {})
  }, [])

  const items = tab === 'regler' ? regler : facts

  return (
    <div className="pb-28">
      {/* Hero banner */}
      <div className="animated-gradient px-4 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-8xl flex items-center justify-center select-none">
          ⚽⚽⚽
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center"
        >
          <div className="text-4xl mb-1">🎓</div>
          <h1 className="text-2xl font-black text-white">Trænerens Hjørne</h1>
          <p className="text-white/80 text-sm font-semibold mt-1">Lær mere — bliv en bedre spiller!</p>
        </motion.div>

        {/* Træner-besked */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative z-10 mt-4 bg-white/15 backdrop-blur rounded-2xl p-3 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0 bg-white/20 flex items-center justify-center text-2xl">
            👨‍🏫
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-snug">
              "Kend reglerne — det giver dig fordelen! 🧠"
            </p>
            <p className="text-white/70 text-xs mt-0.5 font-semibold">— Træner Bjarke</p>
          </div>
        </motion.div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-1 flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setExpanded(null) }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                tab === t.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indhold */}
      <div className="px-4 mt-4 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === 'regler' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.content_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === item.content_id ? null : item.content_id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      tab === 'regler' ? 'bg-primary/10' : 'bg-yellow-50'
                    }`}>
                      {tab === 'regler' ? ['⚽','🤝','💪','🛡️','🧤'][i % 5] : ['💡','🏆','🌍','⚡'][i % 4]}
                    </div>
                    <span className="font-black text-gray-800 text-sm">{item.title}</span>
                  </div>
                  <motion.span
                    animate={{ rotate: expanded === item.content_id ? 180 : 0 }}
                    className="text-gray-400 text-lg flex-shrink-0 ml-2"
                  >
                    ▾
                  </motion.span>
                </button>

                <AnimatePresence>
                  {expanded === item.content_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-4 pb-4 pt-0 text-sm font-semibold text-gray-600 leading-relaxed border-t ${
                        tab === 'regler' ? 'border-primary/10' : 'border-yellow-100'
                      }`}>
                        <p className="pt-3">{item.body_text}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Motivations-kort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary to-green-500 rounded-2xl p-4 text-center shadow-lg"
        >
          <div className="text-3xl mb-2">🌟</div>
          <p className="text-white font-black text-base">Du er en Hold-Helt!</p>
          <p className="text-white/80 text-xs font-semibold mt-1">
            Kend reglerne, respekter spillet, vær en god holdkammerat
          </p>
        </motion.div>
      </div>
    </div>
  )
}
