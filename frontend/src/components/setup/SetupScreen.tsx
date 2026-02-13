import { useState } from 'react'
import { api } from '../../api/client'
import Button from '../ui/Button'

interface SetupScreenProps {
  onSuccess: () => void
}

export default function SetupScreen({ onSuccess }: SetupScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await api.put('/credentials', { email, password })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-900 flex items-end justify-center p-4 relative overflow-hidden sm:items-center sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_300px_at_80%_20%,rgba(56,189,248,0.12),transparent_70%),radial-gradient(ellipse_400px_200px_at_20%_80%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-slate-800 rounded-2xl rounded-b-none p-6 max-w-md w-full shadow-2xl animate-[modalIn_0.4s_ease-out] sm:rounded-b-2xl sm:p-9"
      >
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-100 mb-2">Foot Du Lundi</h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Connectez-vous avec vos identifiants DoInSport pour commencer.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe DoInSport"
            autoComplete="current-password"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 px-3.5 py-2.5 rounded-lg text-sm mb-3">{error}</div>
        )}

        <Button variant="primary" type="submit" loading={loading} className="w-full mt-2 min-h-11 text-base">
          Connexion
        </Button>
      </form>
    </div>
  )
}
