import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Trash2, Plus, Edit3, Save, X } from 'lucide-react'
import api from '../../api/axios'

export default function AdminNotesTab() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState({ title: '', body: '' })
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [creating, setCreating] = useState(false)

  const fetchNotes = () => {
    api.get('/notes')
      .then(({ data }) => setNotes(data || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotes() }, [])

  const handleCreate = async () => {
    if (!newNote.title.trim()) { toast.error('Skriv en titel'); return }
    try {
      const { data } = await api.post('/notes', newNote)
      setNotes(n => [data, ...n])
      setNewNote({ title: '', body: '' })
      setCreating(false)
      toast.success('Note gemt! 📝')
    } catch { toast.error('Kunne ikke gemme') }
  }

  const handleUpdate = async (id) => {
    try {
      const { data } = await api.put(`/notes/${id}`, editData)
      setNotes(n => n.map(x => x.note_id === id ? data : x))
      setEditingId(null)
      toast.success('Opdateret ✅')
    } catch { toast.error('Fejl') }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`)
      setNotes(n => n.filter(x => x.note_id !== id))
      toast.success('Slettet')
    } catch { toast.error('Fejl') }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4">
      {/* Opret ny note */}
      <AnimatePresence>
        {creating ? (
          <motion.div key="form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border-2 border-primary/30">
            <h4 className="font-black text-gray-700">📝 Ny note</h4>
            <input
              placeholder="Titel (fx 'Kamp 7/3 noter')"
              value={newNote.title}
              onChange={e => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm focus:border-primary outline-none"
            />
            <textarea
              placeholder="Skriv dine noter her... kun admin kan se dette 🔒"
              value={newNote.body}
              onChange={e => setNewNote({ ...newNote, body: e.target.value })}
              rows={5}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm resize-none focus:border-primary outline-none"
            />
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
                className="flex-1 bg-primary text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-2">
                <Save size={15} /> Gem note
              </motion.button>
              <button onClick={() => setCreating(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-black">
                <X size={15} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button key="btn" whileTap={{ scale: 0.97 }} onClick={() => setCreating(true)}
            className="w-full bg-primary text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md">
            <Plus size={16} /> Ny note / kladde
          </motion.button>
        )}
      </AnimatePresence>

      {/* Note liste */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 font-semibold">Henter noter...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
          <div className="text-4xl mb-2">📋</div>
          <p className="font-black text-gray-600">Ingen noter endnu</p>
          <p className="text-gray-400 text-sm font-semibold mt-1">Opret din første kladde ovenfor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note, i) => (
            <motion.div key={note.note_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-primary/40">
              {editingId === note.note_id ? (
                <div className="space-y-2">
                  <input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })}
                    className="w-full border-2 border-primary/30 rounded-xl px-3 py-2 font-black text-sm outline-none" />
                  <textarea value={editData.body} onChange={e => setEditData({ ...editData, body: e.target.value })}
                    rows={4} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm resize-none outline-none" />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(note.note_id)}
                      className="flex-1 bg-primary text-white font-black py-2 rounded-xl text-sm flex items-center justify-center gap-1">
                      <Save size={13} /> Gem
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-black text-sm">
                      Annuller
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-black text-gray-800 text-sm leading-tight">{note.title}</h4>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingId(note.note_id); setEditData({ title: note.title, body: note.body }) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => handleDelete(note.note_id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {note.body && (
                    <p className="text-gray-600 text-sm font-semibold leading-relaxed whitespace-pre-wrap">{note.body}</p>
                  )}
                  <p className="text-gray-300 text-[10px] font-bold mt-2">
                    🔒 {note.author_name} · {formatDate(note.updated_at)}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
