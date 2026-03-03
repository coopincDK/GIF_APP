import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFacts } from '../../api/content'

// Fallback facts hvis API fejler
const FALLBACK_FACTS = [
  { title: '10-12 km per kamp! 🏃', body_text: 'En professionel fodboldspiller løber i gennemsnit 10-12 km per kamp. Det svarer til at løbe fra Grenå centrum til Gjerrild og tilbage!' },
  { title: 'EM-guld 1992 🏆', body_text: 'Danmark vandt EM i 1992 i Sverige — og vi var ikke engang kvalificeret! Vi kom ind som erstatning for Jugoslavien 10 dage før turneringen. Og så vandt vi det hele!' },
  { title: 'Hjernens rolle 🧠', body_text: 'Når du modtager en bold, træffer din hjerne over 100 beslutninger på under ét sekund: fart, retning, kraft, hvilken fod... Fodbold er faktisk et hjernesport!' },
  { title: 'Kattegat Cup 2026 ⭐', body_text: 'Kattegat Cup er Grenå IFs store jubilæumsstævne i 2026! Hundredvis af spillere fra hele regionen samles for at fejre 40 år med fodbold, fællesskab og sjov.' },
  { title: 'Fodbold og venskab 🤝', body_text: 'Studier viser at børn der spiller holdsport som fodbold har 40% bedre sociale færdigheder. Fodbold gør dig bedre til at samarbejde!' },
]

const TRAINER_PHRASES = [
  'Træner Bjarke siger:',
  'Vidste du at...',
  'Dagens fodbold-fact:',
  'Trænerens tip:',
  'Fun fact fra banen:',
]

function getDailyIndex(length) {
  const day = Math.floor(Date.now() / 86400000)
  return day % length
}

export default function DailyFact() {
  const [facts, setFacts] = useState(FALLBACK_FACTS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    getFacts()
      .then(({ data }) => {
        if (data?.length) {
          setFacts(data)
          setCurrentIdx(getDailyIndex(data.length))
        } else {
          setCurrentIdx(getDailyIndex(FALLBACK_FACTS.length))
        }
      })
      .catch(() => {
        setCurrentIdx(getDailyIndex(FALLBACK_FACTS.length))
      })
  }, [])

  const fact = facts[currentIdx] || facts[0]
  const trainerPhrase = TRAINER_PHRASES[getDailyIndex(TRAINER_PHRASES.length)]

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
        <h2 className="text-lg font-black text-gray-800">💡 Dagens Fact</h2>
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
          className="bg-gradient-to-br from-primary/5 to-green-50 border-2 border-primary/20 rounded-3xl p-4 shadow-sm"
        >
          {/* Træner-avatar + label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg flex-shrink-0">
              👨‍🏫
            </div>
            <span className="text-xs font-black text-primary uppercase tracking-wide">
              {trainerPhrase}
            </span>
          </div>

          {/* Fact titel */}
          <h3 className="font-black text-gray-800 text-base mb-1.5">
            {fact.title}
          </h3>

          {/* Fact tekst */}
          <p className="text-gray-600 font-semibold text-sm leading-relaxed">
            {fact.body_text}
          </p>

          {/* Næste fact knap */}
          <button
            onClick={nextFact}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-primary/10 text-primary font-black text-sm active:scale-95 transition-transform"
          >
            🎲 Vis en anden fact
          </button>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
