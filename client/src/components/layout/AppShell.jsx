import { motion } from 'framer-motion'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { Toaster } from 'react-hot-toast'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function AppShell({ children, title }) {
  return (
    <div className="relative min-h-dvh bg-background">
      <TopBar title={title} />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="page-wrapper"
      >
        {children}
      </motion.main>
      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            borderRadius: '16px',
            maxWidth: '360px',
          },
          duration: 3000,
        }}
      />
    </div>
  )
}
