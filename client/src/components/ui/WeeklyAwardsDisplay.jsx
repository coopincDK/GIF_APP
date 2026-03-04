import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLatestAwards } from '../../api/awards'

// Sticker-billeder per kategori (matcher AWARD_CATEGORIES i AdminPage)
const CAT_META = {
  mvp:        { label: 'Ugens MVP',         emoji: '🏆', img: '/assets/stickers/27_medalje.png' },
  fighter:    { label: 'Ugens Fighter',     emoji: '⚔️', img: '/assets/stickers/15_ild_fart.png' },
  udvikling:  { label: 'Ugens Udvikling',   emoji: '📈', img: '/assets/stickers/12_stjaerne_oejne.png' },
  holdaand:   { label: 'Ugens Holdspiller', emoji: '🤝', img: '/assets/stickers/18_hold_kram.png' },
  humor:      { label: 'Ugens Humor',       emoji: '😄', img: '/assets/stickers/11_thumbs_up.png' },
  energi:     { label: 'Ugens Energi',      emoji: '💪', img: '/assets/stickers/10_vandflasker.png' },
  fokus:      { label: 'Ugens Fokus',       emoji: '🎯', img: '/assets/stickers/14_taenker.png' },
  aflevering: { label: 'Ugens Aflevering',  emoji: '🎯', img: '/assets/stickers/28_hjoernespark.png' },
  assist:     { label: 'Ugens Assist',      emoji: '🤜', img: '/assets/stickers/04_high_five.png' },
  skud:       { label: 'Ugens Skud',        emoji: '🔥', img: '/assets/stickers/01_spiller_spark.png' },
  dribbling:  { label: 'Ugens Dribbling',   emoji: '🌀', img: '/assets/stickers/05_fodbold.png' },
  forsvar:    { label: 'Ugens Forsvar',     emoji: '🛡️', img: '/assets/stickers/09_fodboldmaal.png' },
  keeper:     { label: 'Ugens Redning',     emoji: '🧤', img: '/assets/stickers/02_keeper_redning.png' },
  sprint:     { label: 'Ugens Sprint',      emoji: '🏃', img: '/assets/stickers/13_sved_traening.png' },
  ros:        { label: 'Ugens Ros',         emoji: '⭐', img: '/assets/stickers/24_nummer_et.png' },
  kommentar:  { label: 'Ugens Kommentar',   emoji: '💬', img: '/assets/stickers/30_klap_haender.png' },
  soveste:    { label: 'Ugens Soveste',     emoji: '😴', img: '/assets/stickers/14_taenker.png' },
  fremmøde:   { label: 'Ugens Fremmøde',    emoji: '📅', img: '/assets/stickers/20_kegler.png' },
  attitude:   { label: 'Ugens Attitude',    emoji: '😎', img: '/assets/stickers/11_thumbs_up.png' },
  leder:      { label: 'Ugens Leder',       emoji: '👑', img: '/assets/stickers/07_guldpokal.png' },
  opmuntrer:  { label: 'Ugens Opmuntrer',   emoji: '📣', img: '/assets/stickers/30_klap_haender.png' },
  kreativ:    { label: 'Ugens Kreative',    emoji: '🎨', img: '/assets/stickers/12_stjaerne_oejne.png' },
  jubel:      { label: 'Ugens Jubel',       emoji: '🎉', img: '/assets/stickers/03_maal_jubel.png' },
  bold:       { label: 'Ugens Boldmester',  emoji: '⚽', img: '/assets/stickers/05_fodbold.png' },
  heading:    { label: 'Ugens Heading',     emoji: '🧠', img: '/assets/stickers/06_fodboldstovle.png' },
  faldgruppe: { label: 'Ugens Faldgruppe',  emoji: '🤦', img: '/assets/stickers/08_floejte.png' },
  madpakke:   { label: 'Ugens Madpakke',    emoji: '🥪', img: '/assets/stickers/17_frugtskaal.png' },
  trøje:      { label: 'Ugens Trøje',       emoji: '👕', img: '/assets/stickers/16_vaskemaskine.png' },
  // Gamle kategorier (bagudkompatibilitet)
  ven:        { label: 'Ugens Ven',         emoji: '🤝', img: '/assets/stickers/18_hold_kram.png' },
  spiller:    { label: 'Ugens Spiller',     emoji: '⚽', img: '/assets/stickers/05_fodbold.png' },
}

function getCatMeta(key) {
  return CAT_META[key] || { label: key, emoji: '🏅', img: '/assets/stickers/27_medalje.png' }
}

export default function WeeklyAwardsDisplay() {
  const [awards, setAwards]   = useState([])
  const [week, setWeek]       = useState(null)
  const [year, setYear]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [idx, setIdx]         = useState(0)
  const touchStart             = useRef(null)
  const [dir, setDir]          = useState(1) // 1=frem, -1=tilbage

  useEffect(() => {
    getLatestAwards()
      .then(({ data }) => {
        setAwards(data.awards || [])
        setWeek(data.week)
        setYear(data.year)
        // Start på et tilfældigt award
        if (data.awards?.length > 0) {
          setIdx(Math.floor(Math.random() * data.awards.length))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || awards.length === 0) {
    if (!loading && awards.length === 0) {
      return (
        <section className="px-4 mt-5">
          <h2 className="text-lg font-black text-gray-800 mb-2">🏅 Ugens Helte</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-gray-500 font-semibold text-sm">Ugens helte kåres efter næste kamp!</p>
            <p className="text-gray-400 text-xs mt-1">Trænerne vælger dem 🎯</p>
          </div>
        </section>
      )
    }
    return null
  }

  const award = awards[idx]
  const meta  = getCatMeta(award.category)
  const isCurrentWeek = week === getISOWeek(new Date()) && year === new Date().getFullYear()

  function next() {
    setDir(1)
    setIdx(i => (i + 1) % awards.length)
  }
  function prev() {
    setDir(-1)
    setIdx(i => (i - 1 + awards.length) % awards.length)
  }

  // Touch swipe
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStart.current = null
  }

  return (
    <section className="px-4 mt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black text-gray-800">🏅 Ugens Helte</h2>
        <div className="flex items-center gap-1.5">
          {!isCurrentWeek && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Uge {week}
            </span>
          )}
          {awards.length > 1 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {idx + 1}/{awards.length}
            </span>
          )}
        </div>
      </div>

      {/* Swipe-kort */}
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={award.award_id || idx}
            custom={dir}
            variants={{
              enter:  d => ({ x: d * 80, opacity: 0 }),
              center:   { x: 0, opacity: 1 },
              exit:   d => ({ x: d * -80, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-gradient-to-br from-primary/5 to-yellow-50 rounded-3xl border-2 border-primary/20 p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              {/* Sticker */}
              <div className="flex-shrink-0 relative">
                <img
                  src={meta.img}
                  alt=""
                  className="w-16 h-16 object-contain drop-shadow-md"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-0.5">
                  {meta.label}
                </p>
                <div className="flex items-center gap-2">
                  {award.profile_picture_url ? (
                    <img
                      src={award.profile_picture_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-black text-primary text-sm">{award.user_name?.[0]}</span>
                    </div>
                  )}
                  <p className="font-black text-gray-900 text-lg truncate">{award.user_name}</p>
                </div>
                {award.note && (
                  <p className="text-gray-500 text-xs italic mt-1 truncate">"{award.note}"</p>
                )}
              </div>
            </div>

            {/* Dot-indikatorer */}
            {awards.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {awards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i) }}
                    className={`rounded-full transition-all duration-200 ${
                      i === idx ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pile (kun hvis > 1) */}
        {awards.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full shadow flex items-center justify-center font-black text-gray-500 text-sm">
              ‹
            </button>
            <button onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full shadow flex items-center justify-center font-black text-gray-500 text-sm">
              ›
            </button>
          </>
        )}
      </div>
    </section>
  )
}

function getISOWeek(date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const w1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7)
}
