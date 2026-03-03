import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFacts, getJokes } from '../../api/content'

// Fallback facts hvis API fejler
const FALLBACK_FACTS = [
  { title: '10-12 km per kamp! 🏃', body_text: 'En professionel fodboldspiller løber i gennemsnit 10-12 km per kamp. Det svarer til at løbe fra Grenå centrum til Gjerrild og tilbage!' },
  { title: 'EM-guld 1992 🏆', body_text: 'Danmark vandt EM i 1992 i Sverige — og vi var ikke engang kvalificeret! Vi kom ind som erstatning for Jugoslavien 10 dage før turneringen. Og så vandt vi det hele!' },
  { title: 'Hjernens rolle 🧠', body_text: 'Når du modtager en bold, træffer din hjerne over 100 beslutninger på under ét sekund: fart, retning, kraft, hvilken fod... Fodbold er faktisk et hjernesport!' },
  { title: 'Kattegat Cup 2026 ⭐', body_text: 'Kattegat Cup er Grenå IFs store jubilæumsstævne i 2026! Hundredvis af spillere fra hele regionen samles for at fejre 40 år med fodbold, fællesskab og sjov.' },
  { title: 'Fodbold og venskab 🤝', body_text: 'Studier viser at børn der spiller holdsport som fodbold har 40% bedre sociale færdigheder. Fodbold gør dig bedre til at samarbejde!' },
]

const TRAINERS = [
  { img: '/assets/coaches/bsj/bsj_01_coaching.png',    label: 'Bjarke siger:' },
  { img: '/assets/coaches/ag/ag_01_coaching.png',       label: 'Adam siger:' },
  { img: '/assets/coaches/bsj/bsj_04_teamtalk.png',    label: 'Bjarke fortæller:' },
  { img: '/assets/coaches/ag/ag_03_tactics.png',        label: 'Adam ved det:' },
  { img: '/assets/coaches/bsj/bsj_02_celebrating.png', label: 'Vidste du at...' },
  { img: '/assets/coaches/ag/ag_02_celebrating.png',   label: 'Fun fact!' },
  { img: '/assets/stickers/19_traener.png',             label: 'Trænerens tip:' },
]

const JOKE_TRAINERS = [
  { img: '/assets/coaches/bsj/bsj_02_celebrating.png', label: 'Bjarke griner:' },
  { img: '/assets/coaches/ag/ag_02_celebrating.png',   label: 'Adam griner:' },
  { img: '/assets/stickers/19_traener.png',             label: 'Hør den her! 😂' },
]

function getDailyIndex(length) {
  const day = Math.floor(Date.now() / 86400000)
  return day % length
}

export default function DailyFact() {
  const [facts, setFacts] = useState(FALLBACK_FACTS)
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    // Hent både facts og jokes og bland dem
    Promise.allSettled([getFacts(), getJokes()])
      .then(([factsRes, jokesRes]) => {
        const f = factsRes.status === 'fulfilled' ? (factsRes.value.data || []) : []
        const j = jokesRes.status === 'fulfilled' ? (jokesRes.value.data || []) : []
        const combined = [...f, ...j]
        if (combined.length > 0) {
          setFacts(combined)
          setCurrentIdx(getDailyIndex(combined.length))
        } else {
          setCurrentIdx(getDailyIndex(FALLBACK_FACTS.length))
        }
      })
  }, [])

  const fact    = facts[currentIdx] || facts[0]
  const isJoke  = fact?.type === 'joke'
  const trainer = isJoke
    ? JOKE_TRAINERS[getDailyIndex(JOKE_TRAINERS.length)]
    : TRAINERS[getDailyIndex(TRAINERS.length)]

  const nextFact = () => {
    setFlipped(true)
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % facts.length)
      setFlipped(false)
    }, 200)
  }

  return (
    <section className="px-4 mt-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black text-gray-800">{isJoke ? '😂 Dagens vittighed!' : '💡 Vidste du det her?'}</h2>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {currentIdx + 1}/{facts.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`rounded-3xl p-4 shadow-sm border-2 ${isJoke ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gradient-to-br from-primary/5 to-green-50 border-primary/20'}`}
        >
          {/* Træner-avatar + label */}
          <div className="flex items-center gap-2 mb-3">
            <img
              src={trainer.img}
              alt="Træner"
              className="w-10 h-10 rounded-full object-cover object-top border-2 border-primary/30 flex-shrink-0 bg-white shadow-sm"
            />
            <span className="text-xs font-black text-primary uppercase tracking-wide">
              {trainer.label}
            </span>
          </div>

          {/* Fact titel */}
          <h3 className="font-black text-gray-800 text-base mb-1.5">
            {fact.title}
          </h3>

          {/* Tekst — jokes vises med whitespace-pre-wrap for linjeskift */}
          <p className={`text-gray-600 font-semibold text-sm leading-relaxed ${isJoke ? 'whitespace-pre-wrap' : ''}`}>
            {fact.body_text}
          </p>

          {/* Næste fact knap */}
          <button
            onClick={nextFact}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-primary/10 text-primary font-black text-sm active:scale-95 transition-transform"
          >
            {isJoke ? '😂 Hør en til!' : '🎲 Giv mig en til!'}
          </button>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
