# Telegram Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Send a Telegram notification after every booking attempt (success, failure, no slots, skipped, payment failure, cancellation), configurable via the existing settings UI.

**Architecture:** A new `src/services/telegram.js` module calls the Telegram Bot API directly via `fetch`. It is invoked fire-and-forget from the existing logging functions in `src/services/logging.js`. Token and chat ID are stored in the `settings` SQLite table, configured via the frontend settings modal, with a test endpoint to verify connectivity.

**Tech Stack:** Node.js built-in `fetch`, Telegram Bot API, existing SQLite settings table, React frontend.

**Design doc:** `docs/plans/2026-02-13-telegram-notifications-design.md`

---

### Task 1: Create the Telegram service

**Files:**
- Create: `src/services/telegram.js`

**Step 1: Create the telegram service module**

```js
const db = require('../db/database');
const { BOOKING_STATUS, DAY_NAMES } = require('../constants');

const STATUS_LABELS = {
  [BOOKING_STATUS.SUCCESS]: 'Reservation confirmee',
  [BOOKING_STATUS.FAILED]: 'Reservation echouee',
  [BOOKING_STATUS.NO_SLOTS]: 'Aucun creneau disponible',
  [BOOKING_STATUS.SKIPPED]: 'Reservation ignoree',
  [BOOKING_STATUS.PAYMENT_FAILED]: 'Paiement echoue',
  [BOOKING_STATUS.CANCELLED]: 'Reservation annulee',
};

function getConfig() {
  const token = db.getSetting('telegram_bot_token');
  const chatId = db.getSetting('telegram_chat_id');
  if (!token || !chatId) return null;
  return { token, chatId };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dayName} ${dd}/${mm}/${yyyy}`;
}

function formatTime(time) {
  if (!time) return null;
  return time.replace(':', 'h');
}

function buildMessage({ targetDate, targetTime, bookedTime, playground, status, errorMessage, duration }) {
  const label = STATUS_LABELS[status] || status;
  const lines = [`<b>${label}</b>`, ''];

  if (playground) lines.push(`Terrain : ${playground}`);
  if (targetDate) lines.push(`Date : ${formatDate(targetDate)}`);

  if (bookedTime && bookedTime !== targetTime) {
    lines.push(`Heure : ${formatTime(bookedTime)} (cible : ${formatTime(targetTime)})`);
  } else if (bookedTime) {
    lines.push(`Heure : ${formatTime(bookedTime)}`);
  } else if (targetTime) {
    lines.push(`Heure cible : ${formatTime(targetTime)}`);
  }

  if (duration) lines.push(`Duree : ${duration} min`);
  if (errorMessage) lines.push(`Erreur : ${errorMessage}`);

  return lines.join('\n');
}

async function sendTelegram(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.description || `Telegram API ${res.status}`);
  }
}

function notify(logEntry) {
  const config = getConfig();
  if (!config) return;

  const text = buildMessage(logEntry);
  sendTelegram(config.token, config.chatId, text).catch((err) => {
    console.error('[Telegram] Notification failed:', err.message);
  });
}

async function sendTestMessage() {
  const config = getConfig();
  if (!config) throw new Error('Telegram non configure (token ou chat ID manquant)');
  await sendTelegram(config.token, config.chatId, '<b>Test</b>\n\nLa connexion Telegram fonctionne.');
}

module.exports = { notify, sendTestMessage };
```

**Step 2: Commit**

```bash
git add src/services/telegram.js
git commit -m "feat: add Telegram notification service"
```

---

### Task 2: Integrate notifications into the logging service

**Files:**
- Modify: `src/services/logging.js`

**Step 1: Add notify import and calls to each logging function**

At line 9, after the existing requires, add:

```js
const { notify } = require('./telegram');
```

Then in each function, add a `notify()` call after the `return logBookingResult(...)` line. The pattern is to capture the result, call notify, then return. Here are the changes for each function:

**`logSuccess`** (line 82-95): Replace the function body:

```js
function logSuccess({ ruleId, targetDate, targetTime, bookedTime, playground, bookingId, price, duration }) {
  const priceStr = price ? ` (${price / 100}€/pers)` : '';
  console.log(`[Booking] Success: ${playground} at ${bookedTime} on ${targetDate}${priceStr}`);

  const result = logBookingResult({
    ruleId, targetDate, targetTime, bookedTime, playground,
    status: BOOKING_STATUS.SUCCESS, bookingId,
  });

  notify({ targetDate, targetTime, bookedTime, playground, status: BOOKING_STATUS.SUCCESS, duration });
  return result;
}
```

**`logFailure`** (line 118-132): Replace the function body:

```js
function logFailure({ ruleId, targetDate, targetTime, bookedTime, playground, bookingId, error, duration }) {
  const errorMessage = error?.message || String(error);
  console.error(`[Booking] Failed: ${errorMessage}`);

  const result = logBookingResult({
    ruleId, targetDate, targetTime, bookedTime, playground,
    status: BOOKING_STATUS.FAILED, bookingId, errorMessage,
  });

  notify({ targetDate, targetTime, bookedTime, playground, status: BOOKING_STATUS.FAILED, errorMessage, duration });
  return result;
}
```

**`logPaymentFailure`** (line 161-175): Replace the function body:

```js
function logPaymentFailure({ ruleId, targetDate, targetTime, bookedTime, playground, bookingId, error, duration }) {
  const errorMessage = error?.message || String(error);
  console.error(`[Payment] Failed: ${errorMessage}`);

  const result = logBookingResult({
    ruleId, targetDate, targetTime, bookedTime, playground,
    status: BOOKING_STATUS.PAYMENT_FAILED, bookingId, errorMessage,
  });

  notify({ targetDate, targetTime, bookedTime, playground, status: BOOKING_STATUS.PAYMENT_FAILED, errorMessage, duration });
  return result;
}
```

**`logNoSlots`** (line 186-196): Replace the function body:

```js
function logNoSlots({ ruleId, targetDate, targetTime }) {
  console.log(`[Booking] No slots available for ${targetDate} at ${targetTime}`);

  const result = logBookingResult({
    ruleId, targetDate, targetTime,
    status: BOOKING_STATUS.NO_SLOTS, errorMessage: 'Aucun créneau disponible',
  });

  notify({ targetDate, targetTime, status: BOOKING_STATUS.NO_SLOTS });
  return result;
}
```

**`logSkipped`** (line 208-218): Replace the function body:

```js
function logSkipped({ ruleId, targetDate, targetTime, reason }) {
  console.log(`[Booking] Skipped: ${reason}`);

  const result = logBookingResult({
    ruleId, targetDate, targetTime,
    status: BOOKING_STATUS.SKIPPED, errorMessage: reason,
  });

  notify({ targetDate, targetTime, status: BOOKING_STATUS.SKIPPED, errorMessage: reason });
  return result;
}
```

**`logCancellation`** (line 230-241): Replace the function body:

```js
function logCancellation({ targetDate, targetTime, playground, bookingId }) {
  console.log(`[Booking] Cancelled: ${bookingId} on ${targetDate}`);

  const result = logBookingResult({
    ruleId: null, targetDate, targetTime: targetTime || '-',
    playground, status: BOOKING_STATUS.CANCELLED, bookingId,
  });

  notify({ targetDate, targetTime, playground, status: BOOKING_STATUS.CANCELLED });
  return result;
}
```

**Step 2: Commit**

```bash
git add src/services/logging.js
git commit -m "feat: send Telegram notification on every booking log"
```

---

### Task 3: Add Telegram settings endpoints

**Files:**
- Modify: `src/routes/api.js:109-127`

**Step 1: Add the telegram import**

At line 14, after the logging import, add:

```js
const { sendTestMessage } = require('../services/telegram');
```

**Step 2: Update the GET /settings handler**

Replace the `GET /settings` handler (lines 111-115) with:

```js
router.get('/settings', (req, res) => {
  const token = db.getSetting('telegram_bot_token', '');
  const maskedToken = token ? '****' + token.slice(-4) : '';
  res.json({
    booking_advance_days: parseInt(db.getSetting('booking_advance_days', '45')),
    telegram_bot_token: maskedToken,
    telegram_chat_id: db.getSetting('telegram_chat_id', ''),
  });
});
```

**Step 3: Update the PUT /settings handler**

Replace the `PUT /settings` handler (lines 117-127) with:

```js
router.put('/settings', (req, res) => {
  const { booking_advance_days, telegram_bot_token, telegram_chat_id } = req.body;

  if (booking_advance_days !== undefined) {
    const error = validateBookingAdvanceDays(booking_advance_days);
    if (error) return validationError(res, error);
    db.setSetting('booking_advance_days', parseInt(booking_advance_days));
  }

  if (telegram_bot_token !== undefined) {
    db.setSetting('telegram_bot_token', telegram_bot_token);
  }

  if (telegram_chat_id !== undefined) {
    db.setSetting('telegram_chat_id', telegram_chat_id);
  }

  res.json({ success: true });
});
```

**Step 4: Add the POST /telegram/test endpoint**

Add after the PUT /settings handler, before the `// --- Planning / Preview ---` comment:

```js
router.post('/telegram/test', async (req, res) => {
  try {
    await sendTestMessage();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

**Step 5: Commit**

```bash
git add src/routes/api.js
git commit -m "feat: add Telegram settings and test endpoints"
```

---

### Task 4: Add Telegram section to the frontend settings modal

**Files:**
- Modify: `frontend/src/App.tsx:49-52, 224-248, 459-500`

**Step 1: Add state variables for Telegram fields**

After line 52 (`settingsSaving` state), add:

```tsx
const [settingsTelegramToken, setSettingsTelegramToken] = useState('')
const [settingsTelegramChatId, setSettingsTelegramChatId] = useState('')
const [telegramTesting, setTelegramTesting] = useState(false)
```

**Step 2: Load Telegram settings when opening the settings modal**

Replace `handleOpenSettings` (lines 225-229) with:

```tsx
const handleOpenSettings = useCallback(async () => {
  setSettingsEmail(credentialsEmail)
  setSettingsPassword('')
  setSettingsOpen(true)
  try {
    const settings = await api.get<{
      telegram_bot_token: string
      telegram_chat_id: string
    }>('/settings')
    setSettingsTelegramToken(settings.telegram_bot_token ? '' : '')
    setSettingsTelegramChatId(settings.telegram_chat_id || '')
  } catch {
    // ignore — fields stay empty
  }
}, [credentialsEmail])
```

Note: The token comes back masked (`****xxxx`). We leave the token field empty on open — the user only fills it if they want to change it.

**Step 3: Update handleSaveSettings to save Telegram config**

Replace `handleSaveSettings` (lines 231-248). The new version saves credentials only if password is provided, and always saves Telegram settings:

```tsx
const handleSaveSettings = useCallback(async () => {
  setSettingsSaving(true)
  try {
    // Save credentials if password provided
    if (settingsPassword) {
      if (!settingsEmail) {
        toast('error', 'Erreur', 'Email requis avec le mot de passe.')
        setSettingsSaving(false)
        return
      }
      await api.put('/credentials', { email: settingsEmail, password: settingsPassword })
      setCredentialsEmail(settingsEmail)
    }

    // Save Telegram settings
    const telegramPayload: Record<string, string> = {}
    if (settingsTelegramToken) telegramPayload.telegram_bot_token = settingsTelegramToken
    if (settingsTelegramChatId) telegramPayload.telegram_chat_id = settingsTelegramChatId
    if (Object.keys(telegramPayload).length > 0) {
      await api.put('/settings', telegramPayload)
    }

    toast('success', 'Parametres enregistres')
    setSettingsOpen(false)
    await dashboard.refresh()
  } catch (err) {
    toast('error', 'Erreur', err instanceof Error ? err.message : 'Erreur inconnue')
  } finally {
    setSettingsSaving(false)
  }
}, [settingsEmail, settingsPassword, settingsTelegramToken, settingsTelegramChatId, dashboard, toast])
```

**Step 4: Add Telegram test handler**

Add after the `handleSaveSettings` callback:

```tsx
const handleTelegramTest = useCallback(async () => {
  setTelegramTesting(true)
  try {
    await api.post('/telegram/test', {})
    toast('success', 'Message test envoye')
  } catch (err) {
    toast('error', 'Erreur Telegram', err instanceof Error ? err.message : 'Erreur inconnue')
  } finally {
    setTelegramTesting(false)
  }
}, [toast])
```

**Step 5: Add Telegram fields to the settings modal UI**

In the settings modal (around line 487, after the password `</div>` and before the button row `<div className="flex flex-col-reverse ...`), add:

```tsx
<div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Telegram</h3>

  <div className="mb-4">
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Token du bot</label>
    <input
      type="password"
      value={settingsTelegramToken}
      onChange={(e) => setSettingsTelegramToken(e.target.value)}
      placeholder="Laisser vide pour ne pas modifier"
      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
    />
  </div>

  <div className="mb-4">
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Chat ID</label>
    <input
      type="text"
      value={settingsTelegramChatId}
      onChange={(e) => setSettingsTelegramChatId(e.target.value)}
      placeholder="Ex: 123456789"
      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
    />
  </div>

  <Button variant="secondary" size="sm" onClick={handleTelegramTest} loading={telegramTesting}>
    Tester
  </Button>
</div>
```

**Step 6: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add Telegram configuration to settings modal"
```

---

### Task 5: Manual test and final commit

**Step 1: Build the frontend and start the dev server**

```bash
npm run dev
```

**Step 2: Verify the settings modal**

1. Open the app in a browser
2. Click "Parametres" in the header
3. Verify the Telegram section appears with Token and Chat ID fields
4. Enter a test bot token and chat ID
5. Click "Tester" and verify a test message arrives on Telegram
6. Click "Enregistrer" and re-open settings to confirm the chat ID persists (token field stays empty because it's masked)

**Step 3: Verify notifications**

1. Trigger a manual booking or a "Book now" action
2. Verify a Telegram notification arrives with correct status, terrain, date, time

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
