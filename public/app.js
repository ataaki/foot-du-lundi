const API = '/api';
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

let editingRuleId = null;
let dashboardConfig = null;

// ===== TOAST NOTIFICATIONS =====

function toast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  const icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || ''}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast(this)">\u00D7</button>
    <div class="toast-progress" style="animation-duration:${duration}ms"></div>
  `;
  container.appendChild(el);

  const timer = setTimeout(() => dismissToast(el.querySelector('.toast-close')), duration);
  el._timer = timer;
}

function dismissToast(btnOrEl) {
  const toastEl = btnOrEl.closest ? btnOrEl.closest('.toast') : btnOrEl;
  if (!toastEl || toastEl.classList.contains('toast-out')) return;
  clearTimeout(toastEl._timer);
  toastEl.classList.add('toast-out');
  toastEl.addEventListener('animationend', () => toastEl.remove());
}

// ===== CONFIRM MODAL =====

function confirmModal(title, message, confirmLabel = 'Confirmer', confirmClass = 'btn-primary') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-message">${message}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-action="cancel">Annuler</button>
          <button class="btn ${confirmClass}" data-action="confirm">${confirmLabel}</button>
        </div>
      </div>
    `;

    function close(result) {
      overlay.classList.add('modal-out');
      overlay.addEventListener('animationend', () => overlay.remove());
      resolve(result);
    }

    overlay.querySelector('[data-action="cancel"]').onclick = () => close(false);
    overlay.querySelector('[data-action="confirm"]').onclick = () => close(true);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    document.body.appendChild(overlay);
  });
}

// ===== BUTTON LOADING STATE =====

function btnLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<span class="spinner"></span> ${btn.textContent.trim()}`;
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    if (btn._origHTML !== undefined) btn.innerHTML = btn._origHTML;
  }
}

// ===== API HELPERS =====

async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function apiPut(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function apiDelete(path) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE' });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(res.ok ? text.substring(0, 200) : `HTTP ${res.status}: ${text.substring(0, 200)}`);
  }
}

// ===== DASHBOARD =====

async function loadDashboard() {
  try {
    const data = await apiGet('/dashboard');
    dashboardConfig = data.config;
    window._dashboardData = data;
    renderStats(data);
    renderRules(data.rules);
    renderLogs(data.recent_logs);
    loadBookings();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

async function loadBookings() {
  const btn = document.getElementById('btn-refresh-bookings');
  btnLoading(btn, true);
  try {
    const bookings = await apiGet('/bookings');
    renderBookings(bookings);
    document.getElementById('stat-upcoming').textContent = bookings.length;
  } catch (err) {
    console.error('Failed to load bookings:', err);
    document.getElementById('bookings-list').innerHTML =
      '<p class="empty-state">Erreur de chargement des reservations.</p>';
  } finally {
    btnLoading(btn, false);
  }
}

function renderStats(data) {
  const activeRules = data.rules.filter(r => r.enabled).length;
  document.getElementById('stat-rules').textContent = activeRules;
}

// ===== RULES =====

function renderRules(rules) {
  const container = document.getElementById('rules-list');

  if (!rules || rules.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucune regle configuree. Cliquez sur "+ Nouvelle regle" pour commencer.</p>';
    return;
  }

  container.innerHTML = rules.map(rule => {
    const pgOrder = rule.playground_order;
    const pgLabel = pgOrder && pgOrder.length > 0
      ? pgOrder.join(', ')
      : 'Aucune preference';

    const j45 = rule.j45;
    let j45Label = '';
    if (j45.days_until_attempt === 0) {
      j45Label = `Reservation auto aujourd'hui a 00:00 pour le ${formatDate(j45.target_date)}`;
    } else if (j45.days_until_attempt === 1) {
      j45Label = `Reservation auto demain a 00:00 pour le ${formatDate(j45.target_date)}`;
    } else {
      j45Label = `Reservation auto le ${formatDate(j45.attempt_date)} a 00:00 pour le ${formatDate(j45.target_date)} (dans ${j45.days_until_attempt}j)`;
    }

    return `
      <div class="rule-card ${rule.enabled ? '' : 'disabled'}">
        <div class="rule-day">${DAY_NAMES[rule.day_of_week]}</div>
        <div class="rule-info">
          <div class="rule-time">${rule.target_time}</div>
          <div class="rule-details">Football 5v5 - ${rule.duration_label} - Tarif variable selon horaire</div>
          <div class="rule-pg">Terrains : ${pgLabel}</div>
          <div class="rule-next">${j45Label}</div>
        </div>
        <div class="rule-actions">
          <button class="btn btn-success btn-sm" id="btn-book-${rule.id}" onclick="bookNow(${rule.id}, '${j45.target_date}', this)" title="Reserver maintenant">&#9889; Reserver</button>
          <button class="btn-icon" onclick="editRule(${rule.id})" title="Modifier">&#9998;</button>
          <label class="toggle" title="${rule.enabled ? 'Desactiver' : 'Activer'}">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} onchange="toggleRule(${rule.id}, this.checked)">
            <span class="toggle-slider"></span>
          </label>
          <button class="btn-icon" onclick="deleteRuleConfirm(${rule.id})" title="Supprimer">&#128465;</button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== PLAYGROUND PREFERENCES UI =====

function initPlaygroundPrefs(selected) {
  const container = document.getElementById('playground-prefs');
  const names = dashboardConfig ? dashboardConfig.playground_names : ['Foot 1','Foot 2','Foot 3','Foot 4','Foot 5','Foot 6','Foot 7'];

  let ordered;
  if (selected && selected.length > 0) {
    const rest = names.filter(n => !selected.includes(n));
    ordered = [...selected, ...rest];
  } else {
    ordered = [...names];
  }

  container.innerHTML = ordered.map((name) => {
    const checked = !selected || selected.length === 0 || selected.includes(name);
    return `
      <div class="pg-item" draggable="true" data-name="${name}">
        <span class="pg-handle">&#8942;&#8942;</span>
        <label class="pg-label">
          <input type="checkbox" ${checked ? 'checked' : ''} value="${name}">
          ${name}
        </label>
      </div>
    `;
  }).join('');

  let dragItem = null;
  container.querySelectorAll('.pg-item').forEach(item => {
    item.addEventListener('dragstart', () => { dragItem = item; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => { dragItem = null; item.classList.remove('dragging'); });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dragItem && dragItem !== item) {
        const rect = item.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          container.insertBefore(dragItem, item);
        } else {
          container.insertBefore(dragItem, item.nextSibling);
        }
      }
    });
  });
}

function getPlaygroundOrder() {
  const items = document.querySelectorAll('#playground-prefs .pg-item');
  const order = [];
  items.forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    if (cb.checked) {
      order.push(cb.value);
    }
  });
  return order.length > 0 ? order : null;
}

// ===== RULE FORM =====

function showAddRule() {
  editingRuleId = null;
  document.getElementById('form-title').textContent = 'Ajouter une regle';
  document.getElementById('input-day').value = '1';
  document.getElementById('input-time').value = '19:00';
  document.getElementById('input-duration').value = '60';
  document.getElementById('rule-form').style.display = 'block';
  initPlaygroundPrefs(null);
}

function editRule(id) {
  const data = window._dashboardData;
  if (!data) return;
  const rule = data.rules.find(r => r.id === id);
  if (!rule) return;

  editingRuleId = id;
  document.getElementById('form-title').textContent = 'Modifier la regle';
  document.getElementById('input-day').value = String(rule.day_of_week);
  document.getElementById('input-time').value = rule.target_time;
  document.getElementById('input-duration').value = String(rule.duration);
  document.getElementById('rule-form').style.display = 'block';
  initPlaygroundPrefs(rule.playground_order);
}

function hideAddRule() {
  document.getElementById('rule-form').style.display = 'none';
  editingRuleId = null;
}

async function saveRule() {
  const day_of_week = parseInt(document.getElementById('input-day').value);
  const target_time = document.getElementById('input-time').value;
  const duration = parseInt(document.getElementById('input-duration').value);
  const playground_order = getPlaygroundOrder();

  if (!target_time) {
    toast('warning', 'Champ manquant', 'Veuillez renseigner une heure.');
    return;
  }

  const btn = document.getElementById('btn-save-rule');
  btnLoading(btn, true);
  try {
    if (editingRuleId) {
      await apiPut(`/rules/${editingRuleId}`, { day_of_week, target_time, duration, playground_order });
      toast('success', 'Regle modifiee', `${DAY_NAMES_FULL[day_of_week]} a ${target_time}`);
    } else {
      await apiPost('/rules', { day_of_week, target_time, duration, playground_order });
      toast('success', 'Regle creee', `${DAY_NAMES_FULL[day_of_week]} a ${target_time}`);
    }
    hideAddRule();
    loadDashboard();
  } catch (err) {
    toast('error', 'Erreur', err.message);
  } finally {
    btnLoading(btn, false);
  }
}

async function toggleRule(id, enabled) {
  try {
    await apiPut(`/rules/${id}`, { enabled });
    toast('info', enabled ? 'Regle activee' : 'Regle desactivee');
    loadDashboard();
  } catch (err) {
    toast('error', 'Erreur', err.message);
    loadDashboard();
  }
}

async function deleteRuleConfirm(id) {
  const ok = await confirmModal('Supprimer la regle ?', 'Cette action est irreversible. La regle sera definitivement supprimee.', 'Supprimer', 'btn-danger');
  if (!ok) return;
  try {
    await apiDelete(`/rules/${id}`);
    toast('success', 'Regle supprimee');
    loadDashboard();
  } catch (err) {
    toast('error', 'Erreur', err.message);
  }
}

async function bookNow(ruleId, targetDate, btnEl) {
  const ok = await confirmModal('Reservation immediate', `Lancer une reservation pour le ${formatDate(targetDate)} ?`, 'Reserver', 'btn-success');
  if (!ok) return;

  btnLoading(btnEl, true);
  try {
    const result = await apiPost('/book-now', { rule_id: ruleId, date: targetDate });
    if (result.status === 'success') {
      toast('success', 'Reservation reussie', `${result.playground} a ${result.booked_time} le ${formatDate(result.target_date)}`);
    } else if (result.status === 'skipped') {
      toast('warning', 'Doublon', `Une reservation existe deja le ${formatDate(result.target_date)}.`);
    } else if (result.status === 'no_slots') {
      toast('warning', 'Indisponible', `Aucun creneau disponible le ${formatDate(result.target_date)}.`);
    } else {
      toast('error', 'Echec', result.error_message || result.error || 'Erreur inconnue');
    }
    loadDashboard();
  } catch (err) {
    toast('error', 'Erreur', err.message);
    loadDashboard();
  } finally {
    btnLoading(btnEl, false);
  }
}

// ===== MANUAL BOOKING =====

async function searchSlots() {
  const date = document.getElementById('manual-date').value;
  const from = document.getElementById('manual-time-from').value;
  const to = document.getElementById('manual-time-to').value;
  const duration = document.getElementById('manual-duration').value;
  const container = document.getElementById('manual-slots');
  const btn = document.getElementById('btn-search-slots');

  if (!date) {
    toast('warning', 'Champ manquant', 'Veuillez choisir une date.');
    return;
  }

  btnLoading(btn, true);
  container.innerHTML = '<div class="section-loading"><div class="section-spinner"></div> Recherche en cours...</div>';

  try {
    let url = `/slots?date=${date}`;
    if (duration) url += `&duration=${duration}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    const slots = await apiGet(url);

    if (!Array.isArray(slots) || slots.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucun creneau disponible pour cette date.</p>';
      return;
    }

    const showDuration = !duration;
    container.innerHTML = `
      <table class="logs-table" style="margin-top: 14px">
        <thead>
          <tr>
            <th>Heure</th>
            <th>Terrain</th>
            ${showDuration ? '<th>Duree</th>' : ''}
            <th>Prix/pers</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${slots.map(s => {
            const dur = s.duration / 60;
            return `
            <tr>
              <td><strong>${s.startAt}</strong></td>
              <td>${s.playground.name}</td>
              ${showDuration ? `<td>${dur} min</td>` : ''}
              <td>${(s.price / 100).toFixed(2)} EUR</td>
              <td><button class="btn btn-success btn-sm slot-book-btn" onclick="bookSlot('${date}', '${s.startAt}', ${dur}, '${s.playground.name}', this)">Reserver</button></td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Erreur: ${err.message}</p>`;
  } finally {
    btnLoading(btn, false);
  }
}

async function bookSlot(date, startTime, duration, playgroundName, btnEl) {
  const ok = await confirmModal(
    'Confirmer la reservation',
    `${playgroundName} le ${formatDate(date)} a ${startTime} (${duration}min)`,
    'Reserver', 'btn-success'
  );
  if (!ok) return;

  btnLoading(btnEl, true);
  try {
    const result = await apiPost('/book-manual', { date, startTime, duration, playgroundName });
    if (result.status === 'success') {
      toast('success', 'Reservation reussie', `${result.playground} a ${result.booked_time} le ${formatDate(result.target_date)} - ${(result.price / 100).toFixed(2)} EUR/pers`);
      loadBookings();
      searchSlots();
    } else {
      toast('error', 'Echec', result.error || 'Erreur inconnue');
    }
  } catch (err) {
    toast('error', 'Erreur', err.message);
  } finally {
    btnLoading(btnEl, false);
  }
}

// ===== BOOKINGS (LIVE) =====

function renderBookings(bookings) {
  const container = document.getElementById('bookings-list');

  if (!bookings || bookings.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucune reservation a venir.</p>';
    return;
  }

  container.innerHTML = `
    <table class="logs-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Horaire</th>
          <th>Terrain</th>
          <th>Prix</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${bookings.map(b => {
          const dateStr = formatDate(b.date);
          const startTime = b.startAt ? new Date(b.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';
          const endTime = b.endAt ? new Date(b.endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';
          const priceStr = b.pricePerParticipant ? (b.pricePerParticipant / 100).toFixed(2) + ' EUR' : '-';
          const statusBadge = b.confirmed
            ? '<span class="badge badge-success">Confirmee</span>'
            : '<span class="badge badge-pending">Non confirmee</span>';
          const bookingId = b.id.replace(/'/g, "\\'");
          return `
            <tr>
              <td><strong>${dateStr}</strong></td>
              <td>${startTime} - ${endTime}</td>
              <td>${b.playground || '-'}</td>
              <td>${priceStr}/pers</td>
              <td>${statusBadge}</td>
              <td><button class="btn btn-danger btn-sm" onclick="cancelBooking('${bookingId}', '${dateStr}', this)">Annuler</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

async function cancelBooking(bookingId, dateStr, btnEl) {
  const ok = await confirmModal(
    'Annuler la reservation ?',
    `Reservation du ${dateStr}. Le remboursement sera automatique si le paiement a ete effectue.`,
    'Annuler la reservation', 'btn-danger'
  );
  if (!ok) return;

  btnLoading(btnEl, true);
  try {
    const result = await apiDelete(`/bookings/${bookingId}`);
    if (result.success) {
      toast('success', 'Reservation annulee', 'Le remboursement sera effectue automatiquement.');
    } else {
      toast('error', 'Erreur', result.error || 'Erreur inconnue');
    }
    loadBookings();
  } catch (err) {
    toast('error', 'Erreur', err.message);
  } finally {
    btnLoading(btnEl, false);
  }
}

// ===== LOGS =====

function renderLogs(logs) {
  const container = document.getElementById('logs-list');

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun historique.</p>';
    return;
  }

  const statusLabels = {
    success: 'Reussi',
    failed: 'Echoue',
    payment_failed: 'Paiement echoue',
    no_slots: 'Indispo',
    pending: 'En cours',
    skipped: 'Doublon',
  };

  container.innerHTML = `
    <table class="logs-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Date cible</th>
          <th>Heure visee</th>
          <th>Heure reservee</th>
          <th>Terrain</th>
          <th>Statut</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(log => {
          const isAuto = log.rule_id !== null && log.rule_id !== undefined;
          const typeBadge = isAuto
            ? '<span class="badge badge-auto">Auto</span>'
            : '<span class="badge badge-manual">Manuel</span>';
          return `
          <tr>
            <td>${typeBadge}</td>
            <td>${formatDate(log.target_date)}</td>
            <td>${log.target_time}</td>
            <td>${log.booked_time || '-'}</td>
            <td>${log.playground || '-'}</td>
            <td><span class="badge badge-${log.status}">${statusLabels[log.status] || log.status}</span></td>
            <td>${formatDateTime(log.created_at)}</td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;
}

// ===== HELPERS =====

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(dtStr) {
  if (!dtStr) return '-';
  const d = new Date(dtStr + 'Z');
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ===== INIT =====

async function init() {
  try {
    const data = await apiGet('/dashboard');
    dashboardConfig = data.config;
    window._dashboardData = data;
    renderStats(data);
    renderRules(data.rules);
    renderLogs(data.recent_logs);
    loadBookings();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('manual-date').value = tomorrow.toISOString().split('T')[0];
  init();
});

// Auto-refresh every 60 seconds
setInterval(async () => {
  try {
    const data = await apiGet('/dashboard');
    dashboardConfig = data.config;
    window._dashboardData = data;
    renderStats(data);
    renderRules(data.rules);
    renderLogs(data.recent_logs);
    loadBookings();
  } catch (err) {
    console.error('Auto-refresh failed:', err);
  }
}, 60000);
