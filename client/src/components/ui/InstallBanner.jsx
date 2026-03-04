import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Detektér om appen kører som installeret PWA
function isRunningAsApp() {
  return (
    window.navigator.standalone === true ||                          // iOS Safari
    window.matchMedia('(display-mode: standalone)').matches ||       // Android / Chrome
    window.matchMedia('(display-mode: fullscreen)').matches
  )
}

// Detektér iOS
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// Detektér Safari (ikke Chrome på iOS)
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

// Detektér Android
function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

const DISMISSED_KEY = 'gif_install_dismissed'
const DISMISSED_DAYS = 7 // Vis igen efter 7 dage

export default function InstallBanner() {
  const [show, setShow]       = useState(false)
  const [step, setStep]       = useState('banner') // 'banner' | 'guide'
  const [platform, setPlatform] = useState('ios')  // 'ios' | 'android' | 'other'

  useEffect(() => {
    // Kør ikke hvis allerede installeret
    if (isRunningAsApp()) return

    // Tjek om brugeren har afvist for nylig
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < DISMISSED_DAYS) return
    }

    // Sæt platform
    if (isIOS()) setPlatform('ios')
    else if (isAndroid()) setPlatform('android')
    else setPlatform('other')

    // Vis banner efter 2 sekunder
    const t = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    setShow(false)
  }

  const handleShowGuide = () => setStep('guide')
  const handleBack = () => setStep('banner')

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop ved guide */}
          {step === 'guide' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={handleDismiss}
            />
          )}

          {/* Banner / Guide panel */}
          <motion.div
            key={step}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
          >
            {step === 'banner' ? (
              /* ── Mini banner ── */
              <div className="bg-white border-t-4 border-primary rounded-t-3xl shadow-2xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <img src="/assets/logo.jpg" alt="GIF" className="w-12 h-12 rounded-2xl shadow-sm flex-shrink-0 object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm leading-tight">Tilføj til hjemmeskærm</p>
                    <p className="text-gray-500 text-xs font-semibold mt-0.5">Få den som en rigtig app — gratis! 📱</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShowGuide}
                      className="bg-primary text-white font-black text-xs px-3 py-2 rounded-xl"
                    >
                      Vis mig
                    </motion.button>
                    <button
                      onClick={handleDismiss}
                      className="text-gray-400 font-black text-xs px-2 py-2 rounded-xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Fuld guide ── */
              <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary to-green-700 px-5 pt-6 pb-8 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={handleBack} className="text-white/70 font-black text-sm">← Tilbage</button>
                    <button onClick={handleDismiss} className="text-white/70 font-black text-sm">✕ Luk</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/assets/logo.jpg" alt="GIF" className="w-16 h-16 rounded-3xl shadow-lg object-cover" />
                    <div>
                      <h2 className="font-black text-2xl">GIF Hold-Helte</h2>
                      <p className="text-white/80 text-sm font-semibold">Grenå IF U10/U11</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3">
                    <p className="font-black text-sm">📱 Tilføj som app på din telefon</p>
                    <p className="text-white/80 text-xs font-semibold mt-0.5">
                      Virker som en rigtig app — ingen App Store nødvendig!
                    </p>
                  </div>
                </div>

                <div className="px-5 py-5 space-y-5 pb-10">

                  {platform === 'ios' && (
                    <>
                      {/* iOS guide */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🍎</span>
                          <h3 className="font-black text-gray-800">iPhone / iPad (Safari)</h3>
                        </div>

                        {!isSafari() && (
                          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4">
                            <p className="font-black text-orange-700 text-sm">⚠️ Du bruger ikke Safari</p>
                            <p className="text-orange-600 text-xs font-semibold mt-1">
                              På iPhone skal du bruge <strong>Safari</strong> for at tilføje til hjemmeskærm.
                              Åbn gif-app-navy-ten.vercel.app i Safari og prøv igen.
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          {[
                            {
                              step: '1',
                              icon: '🌐',
                              title: 'Åbn i Safari',
                              desc: 'Gå til gif-app-navy-ten.vercel.app i Safari-browseren (ikke Chrome eller Firefox)',
                            },
                            {
                              step: '2',
                              icon: '⬆️',
                              title: 'Tryk på Del-knappen',
                              desc: 'Tryk på firkanten med pilen op nederst i Safari (midt i bundmenuen)',
                            },
                            {
                              step: '3',
                              icon: '➕',
                              title: 'Vælg "Føj til hjemmeskærm"',
                              desc: 'Scroll ned i menuen og tryk på "Føj til hjemmeskærm" med ➕-ikonet',
                            },
                            {
                              step: '4',
                              icon: '✅',
                              title: 'Tryk "Tilføj"',
                              desc: 'Giv den et navn (f.eks. "Hold-Helte") og tryk "Tilføj" øverst til højre',
                            },
                          ].map((s) => (
                            <div key={s.step} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                                {s.step}
                              </div>
                              <div>
                                <p className="font-black text-gray-800 text-sm">{s.icon} {s.title}</p>
                                <p className="text-gray-500 text-xs font-semibold mt-0.5 leading-relaxed">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Visuel hjælp */}
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                          <p className="font-black text-blue-700 text-sm mb-2">💡 Find Del-knappen her:</p>
                          <div className="bg-gray-800 rounded-xl p-3 flex items-center justify-center gap-6">
                            <span className="text-gray-500 text-xs">◀</span>
                            <span className="text-gray-500 text-xs">▶</span>
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                                <span className="text-white text-xs">↑</span>
                              </div>
                              <span className="text-white text-[9px] mt-1 font-bold">DEL</span>
                            </div>
                            <span className="text-gray-500 text-xs">⊞</span>
                            <span className="text-gray-500 text-xs">⋯</span>
                          </div>
                          <p className="text-blue-600 text-xs font-semibold mt-2 text-center">
                            Safari bundmenu — Del-knappen er i midten
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {platform === 'android' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🤖</span>
                        <h3 className="font-black text-gray-800">Android (Chrome)</h3>
                      </div>
                      <div className="space-y-3">
                        {[
                          { step: '1', icon: '🌐', title: 'Åbn i Chrome', desc: 'Sørg for at du bruger Chrome-browseren' },
                          { step: '2', icon: '⋮', title: 'Tryk på menuen', desc: 'Tryk på de tre prikker øverst til højre i Chrome' },
                          { step: '3', icon: '➕', title: 'Vælg "Føj til startskærm"', desc: 'Find og tryk på "Føj til startskærm" i menuen' },
                          { step: '4', icon: '✅', title: 'Tryk "Tilføj"', desc: 'Bekræft ved at trykke "Tilføj" i dialogen' },
                        ].map((s) => (
                          <div key={s.step} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                              {s.step}
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-sm">{s.icon} {s.title}</p>
                              <p className="text-gray-500 text-xs font-semibold mt-0.5">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {platform === 'other' && (
                    <div className="bg-gray-50 rounded-2xl p-4 text-center">
                      <p className="text-3xl mb-2">📱</p>
                      <p className="font-black text-gray-700">Brug din telefon</p>
                      <p className="text-gray-500 text-sm font-semibold mt-1">
                        Åbn appen på din iPhone eller Android-telefon for at installere den.
                      </p>
                      <p className="text-primary font-black text-sm mt-2">gif-app-navy-ten.vercel.app</p>
                    </div>
                  )}

                  {/* Fordele */}
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                    <p className="font-black text-green-700 text-sm mb-2">🚀 Fordele ved app-versionen</p>
                    <div className="space-y-1.5">
                      {[
                        '⚡ Hurtigere end browser',
                        '📲 Ikon på hjemmeskærmen',
                        '🔔 Klar til notifikationer',
                        '📴 Virker offline (grundfunktioner)',
                        '🎨 Fuld skærm uden browserbjælke',
                      ].map((b, i) => (
                        <p key={i} className="text-green-600 text-xs font-semibold">{b}</p>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDismiss}
                    className="w-full bg-gray-100 text-gray-600 font-black py-3 rounded-2xl text-sm"
                  >
                    Måske senere
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
