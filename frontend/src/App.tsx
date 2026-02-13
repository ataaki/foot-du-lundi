import { useState, useEffect, useCallback } from 'react'
import { api } from './api/client'
import { useDashboard } from './hooks/use-dashboard'
import { useBookings } from './hooks/use-bookings'
import { useRules } from './hooks/use-rules'
import { useSlots } from './hooks/use-slots'
import { useToast } from './hooks/use-toast'
import type { Rule, Slot, DashboardConfig } from './types'
import Spinner from './components/ui/Spinner'
import ToastContainer from './components/ui/Toast'
import ConfirmDialog from './components/ui/ConfirmDialog'
import Button from './components/ui/Button'
import Header from './components/layout/Header'
import StatsBar from './components/layout/StatsBar'
import RuleCard from './components/rules/RuleCard'
import RuleForm from './components/rules/RuleForm'
import BookingsList from './components/bookings/BookingsList'
import SlotSearch from './components/manual/SlotSearch'
import SlotResults from './components/manual/SlotResults'
import LogsTable from './components/logs/LogsTable'
import SetupScreen from './components/setup/SetupScreen'

type CredentialsStatus = { configured: boolean; email?: string }

export default function App() {
  // --- Credentials check ---
  const [credentialsChecked, setCredentialsChecked] = useState(false)
  const [credentialsConfigured, setCredentialsConfigured] = useState(false)
  const [credentialsEmail, setCredentialsEmail] = useState('')

  // --- Hooks ---
  const { toast } = useToast()
  const dashboard = useDashboard()
  const bookings = useBookings()
  const rules = useRules()
  const slotsHook = useSlots()

  // --- UI state ---
  const [ruleFormOpen, setRuleFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<Rule | null>(null)
  const [deleteRuleLoading, setDeleteRuleLoading] = useState(false)
  const [bookNowRuleId, setBookNowRuleId] = useState<number | null>(null)
  const [cancelBookingTarget, setCancelBookingTarget] = useState<{
    id: string; date: string; time: string; playground: string
  } | null>(null)
  const [cancelBookingLoading, setCancelBookingLoading] = useState(false)
  const [advanceDaysDialogOpen, setAdvanceDaysDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsEmail, setSettingsEmail] = useState('')
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [slotSearchDate, setSlotSearchDate] = useState('')

  // --- Check credentials on mount ---
  useEffect(() => {
    async function check() {
      try {
        const result = await api.get<CredentialsStatus>('/credentials/status')
        setCredentialsConfigured(result.configured)
        if (result.email) setCredentialsEmail(result.email)
      } catch {
        setCredentialsConfigured(false)
      } finally {
        setCredentialsChecked(true)
      }
    }
    check()
  }, [])

  // --- Auto-load bookings when dashboard loads ---
  useEffect(() => {
    if (dashboard.data) {
      bookings.load('upcoming', 1)
    }
    // Only run when dashboard.data first becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard.data !== null])

  // --- Rule handlers ---
  const handleOpenNewRule = useCallback(() => {
    setEditingRule(null)
    setRuleFormOpen(true)
  }, [])

  const handleEditRule = useCallback((id: number) => {
    const rule = dashboard.data?.rules.find((r) => r.id === id)
    if (rule) {
      setEditingRule(rule)
      setRuleFormOpen(true)
    }
  }, [dashboard.data])

  const handleSaveRule = useCallback(async (data: {
    day_of_week: number; target_time: string; duration: number; playground_order: string[] | null
  }) => {
    try {
      if (editingRule) {
        await rules.updateRule(editingRule.id, data)
        toast('success', 'Regle modifiee')
      } else {
        await rules.createRule(data)
        toast('success', 'Regle creee')
      }
      await dashboard.refresh()
    } catch (err) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
      throw err
    }
  }, [editingRule, rules, dashboard, toast])

  const handleToggleRule = useCallback(async (id: number, enabled: boolean) => {
    try {
      await rules.toggleRule(id, enabled)
      toast('success', enabled ? 'Regle activee' : 'Regle desactivee')
      await dashboard.refresh()
    } catch (err) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [rules, dashboard, toast])

  const handleDeleteRuleConfirm = useCallback(async () => {
    if (!deleteRuleTarget) return
    setDeleteRuleLoading(true)
    try {
      await rules.deleteRule(deleteRuleTarget.id)
      toast('success', 'Regle supprimee')
      setDeleteRuleTarget(null)
      await dashboard.refresh()
    } catch (err) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setDeleteRuleLoading(false)
    }
  }, [deleteRuleTarget, rules, dashboard, toast])

  const handleBookNow = useCallback(async (ruleId: number, date: string) => {
    setBookNowRuleId(ruleId)
    try {
      const result = await rules.bookNow(ruleId, date)
      if (result.status === 'success') {
        toast('success', 'Reservation reussie', `${result.booked_time || ''} - ${result.playground || ''}`)
        await dashboard.refresh()
        await bookings.load('upcoming', 1)
      } else {
        toast('warning', 'Reservation non aboutie', result.error_message || result.error || result.status)
      }
    } catch (err) {
      toast('error', 'Erreur de reservation', err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setBookNowRuleId(null)
    }
  }, [rules, dashboard, bookings, toast])

  // --- Cancel booking ---
  const handleCancelBookingRequest = useCallback((id: string, date: string, time: string, playground: string) => {
    setCancelBookingTarget({ id, date, time, playground })
  }, [])

  const handleCancelBookingConfirm = useCallback(async () => {
    if (!cancelBookingTarget) return
    setCancelBookingLoading(true)
    try {
      const params = new URLSearchParams({
        date: cancelBookingTarget.date,
        time: cancelBookingTarget.time,
        playground: cancelBookingTarget.playground,
      })
      const result = await api.delete<{ success: boolean; error?: string }>(
        `/bookings/${cancelBookingTarget.id}?${params}`
      )
      if (result.success) {
        toast('success', 'Reservation annulee')
        setCancelBookingTarget(null)
        await bookings.load('upcoming', 1)
        await dashboard.refresh()
      } else {
        toast('error', 'Erreur', result.error || 'Annulation echouee')
      }
    } catch (err) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setCancelBookingLoading(false)
    }
  }, [cancelBookingTarget, bookings, dashboard, toast])

  // --- Slot search & book ---
  const handleSlotSearch = useCallback((params: { date: string; from: string; to: string; duration?: number }) => {
    setSlotSearchDate(params.date)
    slotsHook.search(params)
  }, [slotsHook])

  const handleBookSlot = useCallback(async (slot: Slot) => {
    try {
      const result = await slotsHook.bookSlot({
        date: slotSearchDate,
        startTime: slot.startAt,
        duration: slot.duration,
        playgroundName: slot.playground.name,
      })
      if (result.status === 'success') {
        toast('success', 'Reservation reussie', `${slot.startAt} - ${slot.playground.name}`)
        await bookings.load('upcoming', 1)
        await dashboard.refresh()
      } else {
        toast('warning', 'Reservation non aboutie', result.error_message || result.error || result.status)
      }
    } catch (err) {
      toast('error', 'Erreur de reservation', err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [slotsHook, slotSearchDate, bookings, dashboard, toast])

  // --- Logs ---
  const handleDeleteLogs = useCallback(async (ids: number[]) => {
    try {
      await api.delete('/logs', { ids })
      toast('success', `${ids.length} log${ids.length > 1 ? 's' : ''} supprime${ids.length > 1 ? 's' : ''}`)
      await dashboard.refresh()
    } catch (err) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [dashboard, toast])

  // --- Settings ---
  const handleOpenSettings = useCallback(() => {
    setSettingsEmail(credentialsEmail)
    setSettingsPassword('')
    setSettingsOpen(true)
  }, [credentialsEmail])

  const handleSaveSettings = useCallback(async () => {
    if (!settingsEmail || !settingsPassword) {
      toast('error', 'Erreur', 'Veuillez remplir tous les champs.')
      return
    }
    setSettingsSaving(true)
    try {
      await api.put('/credentials', { email: settingsEmail, password: settingsPassword })
      toast('success', 'Identifiants mis a jour')
      setCredentialsEmail(settingsEmail)
      setSettingsOpen(false)
      await dashboard.refresh()
    } catch (err) {
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSettingsSaving(false)
    }
  }, [settingsEmail, settingsPassword, dashboard, toast])

  // --- Advance days ---
  const handleAdvanceDaysConfirm = useCallback(() => {
    setAdvanceDaysDialogOpen(false)
  }, [])

  // --- Loading state ---
  if (!credentialsChecked) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  // --- Setup screen ---
  if (!credentialsConfigured) {
    return (
      <>
        <SetupScreen onSuccess={() => {
          setCredentialsConfigured(true)
          dashboard.refresh()
        }} />
        <ToastContainer />
      </>
    )
  }

  // --- Dashboard loading ---
  if (dashboard.loading && !dashboard.data) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-slate-50">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Chargement du tableau de bord...</p>
        </div>
        <ToastContainer />
      </div>
    )
  }

  // --- Dashboard error ---
  if (dashboard.error && !dashboard.data) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Erreur</p>
          <p className="text-slate-500 text-sm mt-1">{dashboard.error}</p>
          <Button variant="primary" onClick={dashboard.refresh} className="mt-4">
            Reessayer
          </Button>
        </div>
        <ToastContainer />
      </div>
    )
  }

  const dashData = dashboard.data
  if (!dashData) return null

  const config: DashboardConfig = dashData.config
  const activeRulesCount = dashData.rules.filter((r) => r.enabled).length

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="max-w-5xl mx-auto px-3 pb-6 sm:px-5 sm:pb-10">
        <Header onOpenSettings={handleOpenSettings} />

        <StatsBar
          activeRules={activeRulesCount}
          upcomingBookings={bookings.upcomingTotal}
          advanceDays={config.advance_days}
          onEditAdvanceDays={() => setAdvanceDaysDialogOpen(true)}
        />

        {/* Info note */}
        <p className="text-xs text-slate-400 leading-relaxed mb-4 sm:mb-6">
          Les reservations sont tentees automatiquement a 00:00, J-{config.advance_days} avant la date cible. Les terrains sont testes dans l'ordre de preference. Apres reservation, un lien de paiement 3DS est envoye pour confirmation.
        </p>

        {/* Rules section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Regles de reservation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configurez vos reservations automatiques</p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenNewRule}>
              + Nouvelle regle
            </Button>
          </div>
          {dashData.rules.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-slate-600">Aucune regle configuree</p>
              <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouvelle regle" pour commencer.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {dashData.rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditRule}
                  onDelete={(id) => {
                    const r = dashData.rules.find((x) => x.id === id)
                    if (r) setDeleteRuleTarget(r)
                  }}
                  onToggle={handleToggleRule}
                  onBookNow={handleBookNow}
                  bookingLoading={bookNowRuleId === rule.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Manual booking section */}
        <section className="mb-6 sm:mb-8">
          <div className="mb-3.5">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Reservation manuelle</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recherchez et reservez un creneau specifique</p>
          </div>
          <SlotSearch loading={slotsHook.loading} onSearch={handleSlotSearch} />
          <SlotResults
            slots={slotsHook.slots}
            showDuration={true}
            onBook={handleBookSlot}
          />
        </section>

        {/* Bookings section */}
        <section className="mb-6 sm:mb-8">
          <div className="mb-3.5">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Reservations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Vos reservations a venir et passees</p>
          </div>
          <BookingsList
            data={bookings.data}
            loading={bookings.loading}
            status={bookings.status}
            page={bookings.page}
            onLoad={bookings.load}
            onCancel={handleCancelBookingRequest}
            onRefresh={() => bookings.load(bookings.status, bookings.page)}
          />
        </section>

        {/* Logs section */}
        <section className="mb-6 sm:mb-8">
          <div className="mb-3.5">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Historique</h2>
            <p className="text-xs text-slate-400 mt-0.5">Journal des tentatives de reservation</p>
          </div>
          <LogsTable logs={dashData.recent_logs} onDelete={handleDeleteLogs} />
        </section>
      </div>

      {/* Rule form dialog */}
      <RuleForm
        open={ruleFormOpen}
        onClose={() => setRuleFormOpen(false)}
        onSave={handleSaveRule}
        rule={editingRule}
        config={config}
      />

      {/* Delete rule confirm dialog */}
      <ConfirmDialog
        open={deleteRuleTarget !== null}
        onClose={() => setDeleteRuleTarget(null)}
        onConfirm={handleDeleteRuleConfirm}
        title="Supprimer la regle"
        message={deleteRuleTarget
          ? `Voulez-vous vraiment supprimer la regle du ${deleteRuleTarget.day_name} a ${deleteRuleTarget.target_time} ?`
          : ''}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        loading={deleteRuleLoading}
      />

      {/* Cancel booking confirm dialog */}
      <ConfirmDialog
        open={cancelBookingTarget !== null}
        onClose={() => setCancelBookingTarget(null)}
        onConfirm={handleCancelBookingConfirm}
        title="Annuler la reservation"
        message={cancelBookingTarget
          ? `Voulez-vous vraiment annuler la reservation du ${cancelBookingTarget.date} a ${cancelBookingTarget.time} (${cancelBookingTarget.playground}) ?`
          : ''}
        confirmLabel="Annuler la reservation"
        confirmVariant="danger"
        loading={cancelBookingLoading}
      />

      {/* Advance days info dialog */}
      <ConfirmDialog
        open={advanceDaysDialogOpen}
        onClose={() => setAdvanceDaysDialogOpen(false)}
        onConfirm={handleAdvanceDaysConfirm}
        title="Ouverture des creneaux"
        message={`Les creneaux sont ouverts a la reservation J-${config.advance_days} avant la date cible. Cette valeur est configuree cote serveur.`}
        confirmLabel="Compris"
        confirmVariant="primary"
      />

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[10000]">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center sm:p-5">
            <div className="relative w-full max-w-md bg-white rounded-2xl rounded-b-none sm:rounded-b-2xl p-7 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Parametres</h2>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  placeholder="Mot de passe DoInSport"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col-reverse gap-2.5 mt-6 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" onClick={handleSaveSettings} loading={settingsSaving}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}
