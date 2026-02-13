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
