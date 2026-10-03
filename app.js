const STORAGE_KEY = "lidire-mvp-data";
const LIDIRE_VERSION = "2.1";

const defaultState = {
  user: {
    name: "",
    email: "conta@lidire.com",
    age: "",
    phone: "",
    address: "",
    photo: "",
    sex: "",
    weight: "",
    hydrationActivity: "moderate",
    hydrationGoalType: "health"
  },

  data: {
    compromissos: [],
    tarefas: [],
    compras: [],
    estudos: [],
    studyPlans: [],
    treinos: [],
    hidratacao: [],
    alimentacao: [],
    financas: [],
    alimentos: [],
    objetivos: [],
    familia: [],
    dietas: [],
    receitas: [],
    lembretes: [],
    audios: [],
    cicloMenstrual: {
      periodos: [],
      sintomas: []
    },
    notificacoesFamilia: [],
    anotacoes: [],
    conversasIA: []
  },

  settings: {
    hydrationGoal: 2000,
    hydrationStart: "08:00",
    hydrationEnd: "21:00",
    hydrationIntervalMinutes: 120,
    calorieGoal: 2000,
    financeLimits: {},
    financeMonthResets: {},
    cycleLength: 28,
    periodLength: 5,
    cycleAiContext: false,
    language: "pt-BR",
    theme: "dark",
    subscriptionPlan: "free",
    weather: { tempC: null, fetchedAt: 0, available: false, location: "", forecast: [] },
    route: { last: null },
    pomodoroMinutes: 25,
    pomodoroStats: { sessions: 0, seconds: 0 },
    pomodoroSoundEnabled: true,
    pomodoroSnoozeSeconds: 10,
    aiConversationStorage: true,
    hydrationProfile: { sex: "", age: "", weight: "", activity: "moderate", goal: "health" },
    notifications: {
      enabled: true,
      mode: "beep",
      title: "LiDire — Lembrete",
      message: "Hora do seu lembrete.",
      voiceDataUrl: "",
      sound: true,
      pushEnabled: false,
      pushConfigured: false
    }
  }
};

let state = loadState();
let currentPage = "inicio";
let currentShoppingList = null;
let modal = null;
let authUser = null;
let authMode = "login";
const SESSION_TOKEN_KEY = "lidire_session_token";
function getStoredSessionToken() {
  try { return localStorage.getItem(SESSION_TOKEN_KEY) || ""; } catch (_) { return ""; }
}
function setStoredSessionToken(token) {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    else localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch (_) {}
}
let authBusy = false;
let authChecked = false;
function normalizeV43State(){ state.data.dietas=Array.isArray(state.data.dietas)?state.data.dietas:[]; state.data.lembretes=Array.isArray(state.data.lembretes)?state.data.lembretes:[]; state.data.audios=Array.isArray(state.data.audios)?state.data.audios:[]; state.settings.language="pt-BR"; state.settings.theme=["light","dark"].includes(state.settings.theme)?state.settings.theme:"dark"; (state.data.familia||[]).forEach(x=>{x.permissions={agenda:true,tarefas:true,compras:true,estudos:false,treinos:false,hidratacao:false,alimentacao:false,financas:false,objetivos:true,cicloMenstrual:false,lembretes:true,...(x.permissions||{})};}); (state.data.treinos||[]).forEach(t=>{if(typeof t.completed!=="boolean")t.completed=false;if(!t.date)t.date=todayISO();if(!t.time)t.time="";}); }
normalizeV43State();

function normalizeV45State(){
  state.settings.language="pt-BR";
  state.settings.theme=["light","dark"].includes(state.settings.theme)?state.settings.theme:"dark";
  if(!Array.isArray(state.data.familia)) state.data.familia=[];
  state.data.familia.forEach(person=>{
    person.permissions={agenda:true,tarefas:true,compras:true,estudos:false,treinos:false,
      hidratacao:false,alimentacao:false,financas:false,objetivos:true,cicloMenstrual:false,
      lembretes:true,...(person.permissions||{})};
  });
  state.settings.familySharing={
    syncCalendars:false, sharedFinances:false, liveLocation:false, totalVisibility:false,
    groupNotifications:false, focusMode:false, connected_calendar:false, connected_outlook:false,
    connected_notion:false, connected_googleWorkspace:false, connected_slack:false,
    ...(state.settings.familySharing||{})
  };
}
normalizeV45State();
// Remove only known demonstration content from previous MVP builds; user-created data is preserved.
state.data.lugares = Array.isArray(state.data.lugares) ? state.data.lugares : [];
state.data.compromissos = (state.data.compromissos||[]).filter(x=>!/^Jantar (de Domingo|em família|de Aniversário)/i.test(String(x.title||"")));
state.settings.subscriptionPlan = "free";
state.settings.weather = { tempC:null, fetchedAt:0, available:false, ...(state.settings.weather||{}) };
state.settings.pomodoroMinutes = Number(state.settings.pomodoroMinutes) || 25;
state.settings.hydrationProfile = { sex:"", age:"", weight:"", activity:"moderate", goal:"health", ...(state.settings.hydrationProfile||{}) };
if (state.user.sex && !state.settings.hydrationProfile.sex) state.settings.hydrationProfile.sex = state.user.sex;
if (state.user.weight && !state.settings.hydrationProfile.weight) state.settings.hydrationProfile.weight = state.user.weight;
if (state.user.age && !state.settings.hydrationProfile.age) state.settings.hydrationProfile.age = state.user.age;
state.settings.notifications = {
  enabled: true,
  mode: "beep",
  title: "LiDire — Lembrete",
  message: "Hora do seu lembrete.",
  voiceDataUrl: "",
  sound: true,
  pushEnabled: false,
  pushConfigured: false,
  ...(state.settings.notifications || {})
};
if (!["beep","text","voice"].includes(state.settings.notifications.mode)) state.settings.notifications.mode = "beep";
state.settings.appVersion = LIDIRE_VERSION;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved) {
      return clone(defaultState);
    }

    return {
      ...clone(defaultState),
      ...saved,

      user: {
        ...defaultState.user,
        ...(saved.user || {})
      },

      data: {
        ...defaultState.data,
        ...(saved.data || {})
      },

      settings: {
        ...defaultState.settings,
        ...(saved.settings || {})
      }
    };
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


function authLoadingScreen() {
  return `
    <div class="auth-loading">
      <div class="auth-loading-inner">
        <div class="auth-spinner"></div>
        <strong>Carregando a LiDire…</strong>
      </div>
    </div>
  `;
}

function authScreen() {
  const login = authMode === "login";
  return `
    <div class="auth-screen">
      <div class="auth-glow"></div>
      <section class="auth-card" aria-label="${login ? "Entrar" : "Criar conta"}">
        <div class="auth-brand">
          <img src="/logo-lidire-oficial.png" alt="LiDire">
          <strong>LiDire</strong>
        </div>

        <div class="eyebrow">${login ? "SEJA BEM-VINDO(A)" : "COMECE SUA JORNADA"}</div>
        <h1 class="auth-title">${login ? "Entre na sua conta." : "Crie sua conta."}</h1>
        <p class="auth-subtitle">
          ${login
            ? "Acesse sua rotina, seus planos e tudo o que você organiza com a LiDire."
            : "Tenha sua rotina organizada em um só lugar, com seus dados associados à sua própria conta."}
        </p>

        <div id="auth-message"></div>

        <form id="auth-form" class="auth-form" novalidate>
          ${!login ? `
            <label class="auth-field">
              <span>Nome</span>
              <input name="name" type="text" autocomplete="name" placeholder="Como você quer ser chamado(a)?" required minlength="2">
            </label>
          ` : ""}

          <label class="auth-field">
            <span>E-mail</span>
            <input name="email" type="email" autocomplete="email" placeholder="seu@email.com" required>
          </label>

          <label class="auth-field">
            <span>Senha</span>
            <div class="auth-password">
              <input id="auth-password" name="password" type="password" autocomplete="${login ? "current-password" : "new-password"}" placeholder="Mínimo de 8 caracteres" required minlength="8">
              <button type="button" class="auth-toggle-password" id="auth-toggle-password" data-action="auth-toggle-password" aria-label="Mostrar senha">◉</button>
            </div>
            ${!login ? `<small class="auth-password-hint">A senha deve ter no mínimo 8 caracteres.</small>` : ""}
          </label>

          ${!login ? `
            <label class="auth-field">
              <span>Confirmar senha</span>
              <div class="auth-password">
                <input id="auth-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Digite a senha novamente" required minlength="8">
                <button type="button" class="auth-toggle-password" id="auth-toggle-password-confirm" data-action="auth-toggle-password-confirm" aria-label="Mostrar confirmação de senha">◉</button>
              </div>
            </label>

            <label class="auth-check">
              <input name="legalAccepted" type="checkbox" required>
              <span>Li e aceito os <a href="#" class="auth-legal" data-action="auth-legal">Termos de Uso</a> e a <a href="#" class="auth-legal" data-action="auth-legal">Política de Privacidade</a>.</span>
            </label>
          ` : ""}

          <button class="primary-button auth-submit" type="submit" ${authBusy ? "disabled" : ""}>
            ${authBusy ? "Aguarde…" : (login ? "Entrar na LiDire" : "Criar minha conta")}
          </button>
        </form>

        ${login ? `<button type="button" class="auth-forgot" data-action="forgot-password">Esqueci minha senha</button>` : ""}

        <p class="auth-switch">
          ${login ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
          <button type="button" data-action="auth-switch">${login ? "Criar conta" : "Entrar"}</button>
        </p>
      </section>
    </div>
  `;
}

function setAuthMessage(message, type = "error") {
  const box = document.getElementById("auth-message");
  if (!box) return;
  box.className = type === "success" ? "auth-success" : "auth-error";
  box.textContent = message;
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 15000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchOptions = { ...options };
  delete fetchOptions.timeoutMs;
  if (!fetchOptions.signal) fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(path, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(getStoredSessionToken() ? { "Authorization": `Bearer ${getStoredSessionToken()}` } : {}),
        ...(fetchOptions.headers || {})
      },
      ...fetchOptions
    });

    let data = {};
    try { data = await response.json(); } catch (_) {}

    if (!response.ok) {
      const error = new Error(data.message || data.error || "Não foi possível concluir a solicitação.");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("O servidor demorou para responder. Verifique a conexão e tente novamente.");
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }
    if (error instanceof TypeError) {
      const networkError = new Error("Não foi possível conectar à LiDire. Verifique sua internet e tente novamente.");
      networkError.code = "NETWORK";
      throw networkError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function syncUserToState(user) {
  if (!user) return;
  state.user = {
    ...state.user,
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    age: user.age ?? "",
    phone: user.phone || "",
    address: user.address || "",
    photo: user.profile_photo || state.user.photo || ""
  };
  saveState();
}

async function loadFamilyMembers() {
  try {
    const data = await apiRequest("/api/family", { method: "GET", timeoutMs: 15000 });
    const members = Array.isArray(data.members) ? data.members : [];
    state.data.familia = members.map(m => ({
      id: uid("family"),
      serverId: m.id,
      name: m.name || "",
      relation: m.relation || "Membro",
      email: m.email || "",
      address: m.address || "",
      photo: m.photo || "",
      permissions: m.permissions || {},
      inviteStatus: m.status || "pending",
      userId: m.user_id || ""
    }));
    saveState();
    return true;
  } catch (error) {
    console.warn("Família não carregada do D1:", error);
    return false;
  }
}

async function loadCurrentUser() {
  try {
    const data = await apiRequest("/api/me", { method: "GET" });
    if (data.user) {
      authUser = data.user;
      syncUserToState(data.user);
      return true;
    }
  } catch (error) {
    console.warn("Sessão não carregada:", error);
  }
  authUser = null;
  return false;
}

function renderAuth() {
  const root = document.getElementById("app");
  if (root) { root.innerHTML = authScreen(); applyTheme(); applyLanguage(); }
}

function handleAuthSwitch() {
  authMode = authMode === "login" ? "register" : "login";
  renderAuth();
}

function togglePasswordInput(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

function openPasswordRecovery() {
  openModal("Recuperar senha", `
    <p class="muted">Informe o e-mail da sua conta. A LiDire iniciará o fluxo seguro de recuperação.</p>
    ${field("E-mail", "email", "email", "", "required")}
    <div class="content-card" style="margin-top:10px;padding:12px;font-size:12px;">Por segurança, não exibiremos se o e-mail existe. O envio do link de redefinição por e-mail será ativado quando o provedor de e-mail transacional estiver configurado no Worker.</div>
  `, { submit: "Solicitar recuperação" });
  modal.querySelector("#lidire-form").onsubmit = async e => {
    e.preventDefault();
    const email = String(new FormData(e.target).get("email") || "").trim().toLowerCase();
    if (!email) return;
    try {
      await apiRequest("/api/password-reset/request", { method: "POST", body: JSON.stringify({ email }) });
      closeModal();
      setAuthMessage("Se existir uma conta com esse e-mail, as instruções de recuperação serão enviadas.", "success");
    } catch (error) {
      toast(error.message || "Não foi possível iniciar a recuperação.", "error");
    }
  };
}

async function submitAuth(form) {
  if (authBusy) return;
  const formData = new FormData(form);
  const login = authMode === "login";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("passwordConfirm") || "");

  if (!email || !email.includes("@")) {
    setAuthMessage("Informe um e-mail válido.");
    return;
  }
  if (password.length < 8) {
    setAuthMessage("A senha precisa ter pelo menos 8 caracteres.");
    return;
  }
  if (!login) {
    if (name.length < 2) {
      setAuthMessage("Informe seu nome.");
      return;
    }
    if (password !== confirmation) {
      setAuthMessage("As senhas não coincidem.");
      return;
    }
    if (!formData.get("legalAccepted")) {
      setAuthMessage("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }
  }

  authBusy = true;
  renderAuth();
  setAuthMessage(login ? "Entrando…" : "Criando sua conta…", "success");

  try {
    const data = await apiRequest(login ? "/api/login" : "/api/register", {
      method: "POST",
      body: JSON.stringify(login
        ? { email, password }
        : { name, email, password, legalAccepted: true })
    });

    // O cookie continua sendo a sessão principal. Como fallback para navegadores móveis que descartem o cookie, guardamos o token de sessão e o enviamos no cabeçalho Authorization.
    if (data.session_token) setStoredSessionToken(data.session_token);

    // A resposta 200 não é suficiente: confirme que o navegador realmente
    // estabeleceu a sessão antes de liberar a tela principal. Isso evita o
    // falso positivo “Login realizado” quando um cookie é bloqueado ou uma
    // resposta antiga está em cache.
    const verified = await apiRequest("/api/me", { method: "GET", timeoutMs: 10000 });
    if (!verified.user) {
      throw Object.assign(new Error("A sessão não foi estabelecida pelo navegador. Atualize a página e tente novamente."), { code: "SESSION_NOT_ESTABLISHED" });
    }
    authUser = verified.user;
    syncUserToState(verified.user);
    authChecked = true;
    currentPage = "inicio";
    currentShoppingList = null;
    render();
    startFamilyNotificationPolling();
    toast(login ? "Login realizado com sucesso." : "Conta criada com sucesso.");
  } catch (error) {
    authBusy = false;
    renderAuth();
    const message = error?.status === 401
      ? "E-mail ou senha inválidos. Confira os dados e tente novamente."
      : (error?.code === "SESSION_NOT_ESTABLISHED"
        ? "O login foi aceito, mas a sessão não foi mantida pelo navegador. Atualize a página e tente novamente. Se continuar, abra a LiDire pelo endereço HTTPS oficial."
        : (error?.message || "Não foi possível concluir o acesso. Tente novamente."));
    setAuthMessage(message);
  } finally {
    authBusy = false;
  }
}

async function logoutLiDire() {
  if (familyNotificationPoller) { clearInterval(familyNotificationPoller); familyNotificationPoller = null; }
  try {
    await apiRequest("/api/logout", { method: "POST", body: "{}" });
  } catch (_) {}
  authUser = null;
  authChecked = true;
  localStorage.removeItem(STORAGE_KEY);
  state = clone(defaultState);
  currentPage = "inicio";
  renderAuth();
  toast("Você saiu da LiDire.");
}

let familyNotificationPoller=null;
async function loadFamilyNotifications(showNew=true){
  if(!authUser) return;
  try{
    const data=await apiRequest("/api/notifications?limit=20",{method:"GET",timeoutMs:10000});
    const previous=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
    const prevIds=new Set(previous.map(x=>x.id));
    state.data.notificacoesFamilia=Array.isArray(data.notifications)?data.notifications:[];
    saveState();
    if(showNew){
      const fresh=state.data.notificacoesFamilia.filter(x=>!prevIds.has(x.id));
      fresh.slice(0,3).forEach(n=>{toast(`${n.title}: ${n.message}`); if("Notification" in window && Notification.permission==="granted") new Notification(n.title,{body:n.message});});
    }
    if(currentPage==="familia") render();
  }catch(error){console.warn("Notificações de família:",error);}
}
function startFamilyNotificationPolling(){
  if(familyNotificationPoller) clearInterval(familyNotificationPoller);
  if(!authUser) return;
  loadFamilyNotifications(false);
  familyNotificationPoller=setInterval(()=>loadFamilyNotifications(true),30000);
}

async function initAuth() {
  const root = document.getElementById("app");
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const inviteToken = params.get("convite");
  if (inviteToken) {
    authChecked = true;
    renderInviteLanding(inviteToken);
    return;
  }

  root.innerHTML = authLoadingScreen();
  const logged = await loadCurrentUser();
  authChecked = true;
  if (logged) {
    await loadFamilyMembers();
    try { const nd=await apiRequest("/api/notes",{method:"GET"}); state.data.anotacoes=Array.isArray(nd.notes)?nd.notes.map(n=>({id:n.id,title:n.title,text:n.text})):state.data.anotacoes; saveState(); } catch(_) {}
    render();
    startFamilyNotificationPolling();
  } else {
    renderAuth();
  }
}

function normalizeStudiesData() {
  if (!Array.isArray(state.data.estudos)) state.data.estudos = [];
  if (!Array.isArray(state.data.studyPlans)) state.data.studyPlans = [];

  state.data.estudos.forEach(item => {
    if (!Array.isArray(item.history)) item.history = [];
    if (!item.subject) item.subject = item.title || "Matéria";
    if (item.notes == null) item.notes = "";
    if (item.link == null) item.link = "";
  });
}

normalizeStudiesData();

function normalizeCycleData() {
  if (!state.data.cicloMenstrual || typeof state.data.cicloMenstrual !== "object") {
    state.data.cicloMenstrual = { periodos: [], sintomas: [] };
  }
  if (!Array.isArray(state.data.cicloMenstrual.periodos)) state.data.cicloMenstrual.periodos = [];
  if (!Array.isArray(state.data.cicloMenstrual.sintomas)) state.data.cicloMenstrual.sintomas = [];
  state.settings.cycleLength = Math.max(21, Math.min(45, Number(state.settings.cycleLength) || 28));
  state.settings.periodLength = Math.max(1, Math.min(10, Number(state.settings.periodLength) || 5));
  state.settings.cycleAiContext = !!state.settings.cycleAiContext;
  if (!state.settings.notifications || typeof state.settings.notifications !== "object") state.settings.notifications = clone(defaultState.settings.notifications);
  state.settings.notifications = { ...clone(defaultState.settings.notifications), ...state.settings.notifications };
  state.settings.notifications.enabled = !!state.settings.notifications.enabled;
  state.settings.notifications.mode = ["beep", "text", "voice"].includes(state.settings.notifications.mode) ? state.settings.notifications.mode : "text";
  state.settings.notifications.sound = state.settings.notifications.sound !== false;
}

normalizeCycleData();

function normalizeFoodData() {
  if (!Array.isArray(state.data.alimentos)) state.data.alimentos = [];
  state.data.alimentos.forEach(food => {
    if (!food.unit) food.unit = "g";
    if (food.calories == null) food.calories = 0;
  });
  if (!state.settings.financeMonthResets || typeof state.settings.financeMonthResets !== "object") state.settings.financeMonthResets = {};
}
normalizeFoodData();

if (Array.isArray(state.data.financas)) state.data.financas.forEach(x => { if (!x.currency) x.currency = "BRL"; });
if (Array.isArray(state.data.objetivos)) state.data.objetivos.forEach(x => { if (!x.moneyCurrency) x.moneyCurrency = "BRL"; if (!Array.isArray(x.metas)) x.metas = []; });

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value, currency = "BRL") {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "BRL"
  });
}

function dateBR(value) {
  if (!value) return "";

  const [y, m, d] = String(value).split("-");

  return y && m && d ? `${d}/${m}/${y}` : value;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function toast(message, type = "success") {
  document.querySelectorAll(".lidire-toast").forEach((el) => el.remove());

  const el = document.createElement("div");

  el.className = `lidire-toast ${type}`;

  el.innerHTML = `
    <span>${type === "success" ? "✓" : "!"}</span>
    ${esc(message)}
  `;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2600);
}

function icon(name) {
  const icons = {
    home: "⌂",
    calendar: "▣",
    check: "✓",
    cart: "🛒",
    book: "▤",
    dumbbell: "♢",
    drop: "◉",
    wallet: "R$",
    target: "◎",
    family: "♧",
    food: "🍽",
    spark: "✦",
    user: "◯",
    plus: "+",
    arrow: "→",
    trash: "⌫",
    edit: "✎",
    clock: "◷",
    search: "⌕",
    back: "‹",
    link: "🔗",
    note: "📝",
    fire: "🔥"
  };

  return icons[name] || "•";
}

/* =========================================================
   ESTILO EXTRA INSERIDO PELO PRÓPRIO JS
   ========================================================= */

function injectLiDireStyles() {
  if (document.getElementById("lidire-extra-styles")) return;

  const style = document.createElement("style");
  style.id = "lidire-extra-styles";

  style.textContent = `
    .task-priority {
      width: 7px;
      min-width: 7px;
      height: 46px;
      border-radius: 8px;
      margin-right: 10px;
    }

    .priority-baixa {
      background: #22c55e;
    }

    .priority-normal {
      background: #3b82f6;
    }

    .priority-média {
      background: #facc15;
    }

    .priority-alta {
      background: #ef4444;
    }

    .task-content {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .finance-chart {
      padding: 20px;
      margin-bottom: 20px;
    }

    .chart-row {
      margin-bottom: 15px;
    }

    .chart-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .chart-bar {
      height: 12px;
      border-radius: 20px;
      background: rgba(255,255,255,.08);
      overflow: hidden;
    }

    .chart-bar span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg,#8b5cf6,#ec4899);
    }

    .limit-warning {
      font-size: 12px;
      margin-top: 5px;
    }

    .limit-ok {
      color: #22c55e;
    }

    .limit-danger {
      color: #ef4444;
    }

    .notes-box {
      min-height: 150px;
    }

    .exercise-animation {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 130px;
      font-size: 70px;
      animation: lidireExercise 1.4s ease-in-out infinite;
    }

    @keyframes lidireExercise {
      0%,100% {
        transform: translateY(0) rotate(0deg);
      }

      50% {
        transform: translateY(-12px) rotate(4deg);
      }
    }

    .exercise-card {
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      padding: 15px;
      margin-bottom: 12px;
    }

    .exercise-grid {
      display: grid;
      grid-template-columns: repeat(2,1fr);
      gap: 10px;
      margin-top: 10px;
    }

    .diet-food-row {
      display: grid;
      grid-template-columns: 1fr 90px 40px;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .calorie-summary {
      padding: 18px;
      border-radius: 18px;
      margin-bottom: 18px;
      background: rgba(139,92,246,.12);
    }

    .calorie-summary strong {
      font-size: 30px;
    }

    .calorie-progress {
      height: 10px;
      border-radius: 20px;
      overflow: hidden;
      background: rgba(255,255,255,.1);
      margin-top: 12px;
    }

    .calorie-progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg,#22c55e,#facc15,#ef4444);
    }

    .goal-subtasks {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,.08);
    }

    .goal-subtask {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 8px 0;
    }

    .period-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 10px;
      background: rgba(139,92,246,.15);
    }

    .photo-preview {
      display: flex;
      justify-content: center;
      margin-bottom: 15px;
    }

    .profile-photo-preview {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(139,92,246,.5);
    }

    .profile-photo-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 36px;
      background: rgba(139,92,246,.18);
    }

    .link-button {
      color: #8b5cf6;
      text-decoration: none;
    }

    .shopping-diet-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 15px 0;
    }

    .muted {
      opacity: .7;
    }

    .danger-button {
      border: 0; border-radius: 12px; padding: 11px 15px; cursor: pointer;
      background: #d6455d; color: #fff; font-weight: 700;
    }
    .confirm-delete-box { text-align:center; padding: 8px 0 4px; }
    .confirm-delete-icon { font-size: 38px; margin-bottom: 8px; }
    .confirm-delete-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:16px; }
    .cycle-summary-card { display:flex; justify-content:space-between; gap:18px; align-items:center; padding:24px; border-radius:20px; background:linear-gradient(135deg,rgba(139,92,246,.18),rgba(236,72,153,.12)); border:1px solid rgba(255,255,255,.08); margin-bottom:18px; }
    .cycle-orbit { width:82px; height:82px; border-radius:50%; display:grid; place-items:center; font-size:46px; background:rgba(255,255,255,.06); }
    .cycle-cross-links { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .cycle-cross-links span { padding:9px 12px; border-radius:999px; background:rgba(255,255,255,.05); }
  
    /* AUTENTICAÇÃO — proteção visual para o primeiro carregamento */
    .auth-loading,
    .auth-screen {
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      box-sizing: border-box;
      background: #070C22;
      color: #fff;
      font-family: Inter, Arial, sans-serif;
    }

    .auth-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .auth-loading-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      color: rgba(255,255,255,.86);
    }

    .auth-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(255,255,255,.18);
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: lidire-spin .8s linear infinite;
    }

    @keyframes lidire-spin {
      to { transform: rotate(360deg); }
    }

    .auth-screen {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      overflow: auto;
    }

    .auth-glow {
      position: fixed;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: rgba(139,92,246,.16);
      filter: blur(70px);
      pointer-events: none;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: min(100%, 440px);
      box-sizing: border-box;
      padding: 28px;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 24px;
      background: rgba(15,23,52,.94);
      box-shadow: 0 24px 70px rgba(0,0,0,.35);
    }

    .auth-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      font-size: 22px;
    }

    .auth-brand img {
      width: 42px;
      height: 42px;
      object-fit: contain;
    }

    .auth-title {
      margin: 8px 0;
      color: #fff;
    }

    .auth-subtitle {
      color: rgba(255,255,255,.68);
      line-height: 1.5;
      margin-bottom: 22px;
    }

    .auth-form {
      display: grid;
      gap: 15px;
    }

    .auth-field {
      display: grid;
      gap: 7px;
    }

    .auth-field > span {
      font-size: 13px;
      color: rgba(255,255,255,.78);
    }

    .auth-field input {
      width: 100%;
      box-sizing: border-box;
      min-height: 46px;
      padding: 12px 14px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 12px;
      background: rgba(255,255,255,.06);
      color: #fff;
      outline: none;
    }

    .auth-field input:focus {
      border-color: rgba(139,92,246,.8);
    }

    .auth-password {
      position: relative;
    }

    .auth-password input {
      padding-right: 48px;
    }

    .auth-toggle-password {
      position: absolute;
      right: 7px;
      top: 50%;
      transform: translateY(-50%);
      border: 0;
      background: transparent;
      color: rgba(255,255,255,.7);
      cursor: pointer;
      padding: 8px;
    }

    .auth-check {
      display: flex;
      gap: 9px;
      align-items: flex-start;
      color: rgba(255,255,255,.72);
      font-size: 12px;
      line-height: 1.4;
    }

    .auth-check a {
      color: #c4b5fd;
    }

    .auth-error,
    .auth-success {
      padding: 11px 12px;
      border-radius: 10px;
      margin-bottom: 14px;
      font-size: 13px;
    }

    .auth-error {
      background: rgba(239,68,68,.12);
      color: #fecaca;
    }

    .auth-success {
      background: rgba(34,197,94,.12);
      color: #bbf7d0;
    }

    .auth-submit {
      width: 100%;
      min-height: 46px;
    }

    .auth-switch {
      margin: 20px 0 0;
      text-align: center;
      color: rgba(255,255,255,.65);
      font-size: 13px;
    }

    .auth-switch button {
      border: 0;
      background: transparent;
      color: #c4b5fd;
      font-weight: 700;
      cursor: pointer;
    }
`;

  style.textContent += `
    .shopping-list-card { position:relative; display:flex; align-items:center; gap:8px; }
    .shopping-list-select { padding:10px 4px; }
    .shopping-list-main { flex:1; }
    .shopping-list-actions { display:flex; gap:4px; }
    .shopping-list-actions button { border:0; background:transparent; cursor:pointer; }
`;
  document.head.appendChild(style);
}

injectLiDireStyles();

/* =========================================================
   MÓDULOS
   ========================================================= */

const modules = [
  ["agenda", "Agenda", "Compromissos e horários", "calendar", "agenda"],
  ["tarefas", "Tarefas", "Tudo o que precisa ser feito", "check", "tarefas"],
  ["compras", "Compras", "Listas para não esquecer", "cart", "compras"],
  ["estudos", "Estudos", "Organize seu aprendizado", "book", "estudos"],
  ["treinos", "Treinos", "Movimente-se e acompanhe", "dumbbell", "treinos"],
  ["hidratacao", "Hidratação", "Cuide da sua rotina", "drop", "hidratacao"],
  ["alimentacao", "Alimentação", "Refeições, dieta e calorias", "food", "alimentacao"],
  ["financas", "Finanças", "Entradas, gastos e limites", "wallet", "financas"],
  ["objetivos", "Objetivos", "Transforme planos em passos", "target", "objetivos"],
  ["familia", "Família", "Compartilhe sua rotina", "family", "familia"],
  ["cicloMenstrual", "Ciclo Menstrual", "Acompanhe seu ciclo e seus sinais", "cycle", "cicloMenstrual"],
  ["climaRotas", "Clima e Rotas", "Temperatura, previsão e deslocamentos", "compass", "climaRotas"],
  ["suporte", "Suporte", "Ajuda, bugs e contato", "spark", "suporte"]
];

/* =========================================================
   SHELL
   ========================================================= */

function appShell(content) {
  const nav = [
    ["inicio", "⌂", "Início"],
    ["agenda", "▣", "Agenda"],
    ["assistente", "✦", "Assistente"],
    ["explorar", "✦", "Explorar"],
    ["perfil", "◯", "Perfil"]
  ];

  return `
    <div class="app-bg">

      <header class="topbar">

        <button class="brand" data-page="inicio">
          <img src="/logo-lidire-oficial.png" alt="LiDire">
          <span>LiDire</span>
        </button>

        <div class="topbar-actions">
          <button class="icon-button" data-action="go-back" title="Voltar" aria-label="Voltar">${icon("back")}</button>

          <button class="avatar" data-page="perfil">
            ${
              state.user.photo
                ? `<img src="${esc(state.user.photo)}" alt="Perfil">`
                : esc((state.user.name || "A").charAt(0).toUpperCase())
            }
          </button>


        </div>

      </header>

      <main class="main-content">
        ${content}
      </main>

      <nav class="bottom-nav">
        ${nav.map(([id, ico, label]) => `
          <button
            class="nav-item ${currentPage === id ? "active" : ""}"
            data-page="${id}"
          >
            <span>${ico}</span>
            <small>${label}</small>
          </button>
        `).join("")}
      </nav>

    </div>
  `;
}

function pageHeader(eyebrow, title, subtitle = "", action = "") {
  return `
    <div class="page-header">

      <div>
        <div class="eyebrow">${esc(eyebrow)}</div>
        <h1>${esc(title)}</h1>

        ${
          subtitle
            ? `<p>${esc(subtitle)}</p>`
            : ""
        }
      </div>

      ${action}

    </div>
  `;
}

function statCard(value, label, tone = "") {
  return `
    <div class="stat-card ${tone}">
      <strong>${esc(value)}</strong>
      <span>${esc(label)}</span>
    </div>
  `;
}

function emptyState(title, text, actionLabel, action) {
  return `
    <div class="empty-state">
      <div class="empty-orb">✦</div>

      <h3>${esc(title)}</h3>

      <p>${esc(text)}</p>

      <button
        class="primary-button"
        data-action="${esc(action)}"
      >
        ${icon("plus")} ${esc(actionLabel)}
      </button>
    </div>
  `;
}

/* =========================================================
   5.1 — clima, hidratação personalizada, pomodoro e receitas IA
   ========================================================= */
function getWeatherLabel(){
  const w=state.settings.weather||{};
  if(w.source === "open-meteo" && w.available && Number.isFinite(Number(w.tempC))) return `${Math.round(Number(w.tempC))}°C`;
  return "Temperatura indisponível";
}
let weatherLoading=false;
async function loadRealWeather(){
  if(weatherLoading) return;
  // A 6.8 nunca exibe uma temperatura antiga/fictícia: somente um valor
  // obtido nesta sessão a partir da localização atual do dispositivo.
  state.settings.weather={tempC:null,fetchedAt:0,available:false,source:"none"};
  const el=document.getElementById("lidire-weather");
  if(el) el.textContent="🌡️ Obtendo temperatura local…";
  if(!navigator.geolocation){
    if(el) el.textContent="🌡️ Temperatura indisponível";
    return;
  }
  weatherLoading=true;
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const lat=pos.coords.latitude, lon=pos.coords.longitude;
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m&timezone=auto`,{cache:"no-store"});
      if(!r.ok) throw new Error(`Weather HTTP ${r.status}`);
      const d=await r.json();
      const temp=d?.current?.temperature_2m;
      if(!Number.isFinite(Number(temp))) throw new Error("Temperatura não retornada");
      state.settings.weather={tempC:Number(temp),fetchedAt:Date.now(),available:true,source:"open-meteo",latitude:lat,longitude:lon};
      saveState();
      const current=document.getElementById("lidire-weather");
      if(current) current.textContent=`🌡️ ${Math.round(Number(temp))}°C`;
    }catch(e){
      console.warn("Weather unavailable",e);
      state.settings.weather={tempC:null,fetchedAt:Date.now(),available:false,source:"none"};
      saveState();
      const current=document.getElementById("lidire-weather");
      if(current) current.textContent="🌡️ Temperatura indisponível";
    } finally{weatherLoading=false;}
  },()=>{
    state.settings.weather={tempC:null,fetchedAt:Date.now(),available:false,source:"none"};
    saveState();
    const current=document.getElementById("lidire-weather");
    if(current) current.textContent="🌡️ Temperatura indisponível";
    weatherLoading=false;
  },{enableHighAccuracy:true,maximumAge:0,timeout:10000});
}
function calculateHydrationRecommendation(){
  const p=state.settings.hydrationProfile||{}; const sex=String(p.sex||"").toLowerCase(); const age=Number(p.age||state.user.age||0); const weight=Number(p.weight||state.user.weight||0); const activity=p.activity||"moderate"; const goal=p.goal||"health";
  let base = sex==="male" ? 2500 : sex==="female" ? 2000 : 2200;
  if(age>=65) base += 0;
  let ml = weight>0 ? Math.max(base, weight*30) : base;
  if(activity==="active") ml += 400; else if(activity==="very-active") ml += 700; else if(activity==="hot") ml += 500;
  if(goal==="performance") ml += 300; if(goal==="weight-loss") ml += 200;
  ml=Math.round(ml/50)*50;
  const note = false ? `LiDire estimate using adult reference values plus a transparent weight/activity adjustment${weight?` (${weight} kg)`:""}. Research reference values describe total water from beverages and food, and needs can rise with heat and physical activity.` : `Estimativa da LiDire usando valores de referência para adultos e um ajuste transparente por peso/atividade${weight?` (${weight} kg)`:""}. As referências científicas tratam de água total (bebidas + alimentos) e indicam que a necessidade aumenta com atividade física e calor.`;
  return {ml,note};
}
function openHydrationProfile(){
  const p=state.settings.hydrationProfile||{}; const l=false;
  openModal(l?"Hydration profile":"Perfil de hidratação", field(l?"Sex":"Sexo","sex","text",p.sex||"")+field(l?"Age":"Idade","age","number",p.age||state.user.age||"",'min="14" max="120"')+field(l?"Weight (kg)":"Peso (kg)","weight","number",p.weight||state.user.weight||"",'min="30" max="300" step="0.1"')+selectField(l?"Activity":"Atividade","activity",[{value:"moderate",label:l?"Moderate":"Moderada"},{value:"active",label:l?"Active":"Ativa"},{value:"very-active",label:l?"Very active":"Muito ativa"},{value:"hot",label:l?"Hot environment":"Ambiente quente"}],p.activity||"moderate")+selectField(l?"Goal":"Objetivo","goal",[{value:"health",label:l?"General health":"Saúde geral"},{value:"performance",label:l?"Performance":"Performance"},{value:"weight-loss",label:l?"Weight management":"Controle de peso"}],p.goal||"health"),{submit:l?"Save":"Salvar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.settings.hydrationProfile={sex:String(f.get("sex")||""),age:Number(f.get("age")||0),weight:Number(f.get("weight")||0),activity:String(f.get("activity")||"moderate"),goal:String(f.get("goal")||"health")};state.user.age=state.settings.hydrationProfile.age||state.user.age;state.user.weight=state.settings.hydrationProfile.weight||state.user.weight;state.user.sex=state.settings.hydrationProfile.sex||state.user.sex;state.settings.hydrationGoal=calculateHydrationRecommendation().ml;saveState();closeModal();render();};
}
let pomodoroState={remaining:(Number(state.settings.pomodoroMinutes)||25)*60,total:(Number(state.settings.pomodoroMinutes)||25)*60,running:false,interval:null};
function formatPomodoro(sec){const s=Math.max(0,Number(sec)||0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function syncPomodoroDisplay(){const el=document.getElementById("pomodoro-display");if(el)el.textContent=formatPomodoro(pomodoroState.remaining);const stats=document.getElementById("pomodoro-stats");if(stats)stats.innerHTML=`${state.settings.pomodoroStats?.sessions||0}<br><small>Sessões</small>`;}
function stopPomodoroInterval(){if(pomodoroState.interval){clearInterval(pomodoroState.interval);pomodoroState.interval=null;}}
function playPomodoroSound(){if(!state.settings.pomodoroSoundEnabled)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=740;g.gain.setValueAtTime(.001,c.currentTime);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+10);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+10);setTimeout(()=>c.close?.(),10500);}catch{}}
function pomodoroFinished(){state.settings.pomodoroStats=state.settings.pomodoroStats||{sessions:0,seconds:0};state.settings.pomodoroStats.sessions++;state.settings.pomodoroStats.seconds+=pomodoroState.total;saveState();playPomodoroSound();toast("Sessão de foco concluída. Som de 10 segundos iniciado.");openModal("Pomodoro concluído",`<p>Seu foco terminou.</p><p class="muted">Você pode pausar o som e adiar o próximo aviso por 10 segundos.</p>`,{submit:"Soneca 10s"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();closeModal();setTimeout(()=>{if(state.settings.pomodoroSoundEnabled)playPomodoroSound();},10000);};}
function togglePomodoro(){if(pomodoroState.running){pomodoroState.running=false;stopPomodoroInterval();render();return;}pomodoroState.running=true;pomodoroState.interval=setInterval(()=>{pomodoroState.remaining--;syncPomodoroDisplay();if(pomodoroState.remaining<=0){pomodoroState.remaining=0;pomodoroState.running=false;stopPomodoroInterval();pomodoroFinished();render();}},1000);render();}
function resetPomodoro(){pomodoroState.running=false;stopPomodoroInterval();pomodoroState.total=(Number(state.settings.pomodoroMinutes)||25)*60;pomodoroState.remaining=pomodoroState.total;syncPomodoroDisplay();render();}
function setPomodoroTime(){openModal("Definir tempo de foco",field("Minutos","minutes","number",state.settings.pomodoroMinutes||25,'min="1" max="180" required')+`<label class="form-field"><span><input type="checkbox" name="sound" ${state.settings.pomodoroSoundEnabled!==false?'checked':''}> Som do Pomodoro ativado</span></label>`,{submit:"Salvar"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const m=Math.max(1,Math.min(180,Number(f.get("minutes"))||25));state.settings.pomodoroMinutes=m;state.settings.pomodoroSoundEnabled=f.get("sound")==="on";saveState();resetPomodoro();closeModal();render();};}
async function openRecipeGenerator(){
  const l=false; const foods=(state.data.alimentos||[]).map(x=>x.name||x.title).filter(Boolean); const diets=(state.data.dietas||[]).map(x=>x.name).filter(Boolean);
  const body=selectField(l?"Recipe type":"Tipo de receita","recipeType",[{value:"fitness",label:"Fitness"},{value:"savory",label:l?"Savory":"Salgada"},{value:"sweet",label:l?"Sweet":"Doce"},{value:"dessert",label:l?"Dessert":"Sobremesa"},{value:"main",label:l?"Main course":"Prato principal"},{value:"snack",label:l?"Snack":"Petisco"}],"fitness")+selectField(l?"Diet":"Dieta","diet",[{value:"",label:l?"No specific diet":"Sem dieta específica"},...diets.map(x=>({value:x,label:x}))],"")+textareaField(l?"Available foods":"Alimentos cadastrados","foods",foods.join(", "),'placeholder="Ex.: frango, ovos, banana..."');
  openModal(l?"Generate recipe with LiDire AI":"Gerar receita com a IA LiDire",body,{submit:l?"Generate":"Gerar receita"});
  modal.querySelector("#lidire-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const type=f.get("recipeType"),diet=f.get("diet"),available=f.get("foods")||"";closeModal();navigateTo("assistente");const q=l?`Create a ${type} recipe using these registered foods: ${available}. Respect this diet if selected: ${diet||"none"}. Include ingredients, quantities, preparation, portions and approximate calories.`:`Crie uma receita do tipo ${type} usando estes alimentos cadastrados: ${available}. Respeite esta dieta, se houver: ${diet||"nenhuma"}. Inclua ingredientes, quantidades, preparo, porções e calorias aproximadas.`;await answerAssistant(q,false);};
}

/* =========================================================
   INÍCIO
   ========================================================= */

function renderHomeReminders(){const rows=(state.data.lembretes||[]).filter(x=>!x.done&&!x.paused).slice(0,5);return `<section class="v5-list-section"><div class="v5-section-row"><h2>🔔 Lembretes</h2><button class="text-button" data-page="lembretes">Ver todos →</button></div>${rows.length?rows.map(r=>`<div class="list-item"><div class="module-icon small">🔔</div><div class="item-main"><strong>${esc(r.title||"Lembrete")}</strong><span>${dateBR(r.date||todayISO())}${r.time?` · ${esc(r.time)}`:""}</span></div><div class="item-actions"><button data-action="edit-lembrete" data-id="${esc(r.id)}">✎</button><button data-action="delete-lembrete" data-id="${esc(r.id)}">🗑</button><button data-action="notify-reminder-family" data-id="${esc(r.id)}">👥</button></div></div>`).join(""):`<p class="muted">Nenhum lembrete pendente.</p>`}<button class="v5-add-item" data-action="new-reminder">＋ Incluir lembrete</button></section>`;}

function home() {
  const pending = state.data.tarefas.filter((x) => !x.done).length;
  const commitments = state.data.compromissos.filter((x) => x.date === todayISO()).length;
  const goals = state.data.objetivos.length;
  const water = state.data.hidratacao.filter(x=>x.date===todayISO()).reduce((s,x)=>s+Number(x.amount||0),0);
  const firstName = (state.user.name || (false ? "you" : "você")).split(" ")[0];
  const lang = false;
  const next = state.data.compromissos.filter(x=>x.date===todayISO()).sort((a,b)=>String(a.time||"").localeCompare(String(b.time||"")))[0];
  const family = (state.data.familia||[]).filter(x=>x.inviteStatus!=="declined").slice(0,3);
  const hydrationGoal = Number(state.settings.hydrationGoal||2000);
  const hydrationPct = Math.min(100, Math.round(water/hydrationGoal*100));
  return appShell(`
    <section class="v5-home-summary">
      <div class="v5-summary-top"><div><span class="eyebrow">${lang?"YOUR SUMMARY":"SEU RESUMO"}</span><h1>${lang?`Hello, ${esc(firstName)}.`:`Olá, ${esc(firstName)}.`}</h1><p>${lang?"Here is what matters in your routine today.":"Aqui está o que importa na sua rotina hoje."}</p></div><span class="v5-weather" id="lidire-weather">🌡️ ${getWeatherLabel()} <button type="button" class="ghost-button compact" data-action="assistant-voice" title="Falar com a IA">🎙️</button></span></div>
      <div class="v5-kpis"><div><small>${lang?"PRODUCTIVITY":"PRODUTIVIDADE"}</small><strong>${Math.min(100, Math.max(0, 100-pending*5))}%</strong></div><div><small>${lang?"TASKS":"TAREFAS"}</small><strong>${pending}/${state.data.tarefas.length}</strong></div><div><small>${lang?"FOCUS":"FOCO"}</small><strong>${Math.max(0, Math.round((goals+commitments)*20/60))}h ${Math.max(0,(goals+commitments)*20)%60}m</strong></div></div>
    </section>
    ${next?`<section class="v5-next-card"><span class="v5-label">${lang?"NEXT":"PRÓXIMO"}</span><h2>${esc(next.title||next.name||"Compromisso")}</h2><p>◷ ${esc(next.time||"—")} ${next.endTime?`- ${esc(next.endTime)}`:""}</p><button class="primary-button compact" data-page="agenda">▣ ${lang?"Open calendar":"Abrir agenda"}</button></section>`:""}
    <section class="v5-section-head"><span>✦</span><h2>${lang?"AI Suggestions":"Sugestões da IA"}</h2></section>
    <section class="v5-ai-suggestion"><div class="v5-ai-copy"><span class="eyebrow">${lang?"SMART SUGGESTION":"SUGESTÃO INTELIGENTE"}</span><h3>${pending? (lang?"You have pending tasks that can be reorganized.":"Você tem tarefas pendentes que podem ser reorganizadas.") : (lang?"Your routine is clear. Keep your momentum.":"Sua rotina está organizada. Mantenha o ritmo.")}</h3><p>${lang?"LiDire can help turn your priorities into a practical plan.":"A LiDire pode transformar suas prioridades em um plano prático."}</p><button class="text-button" data-page="assistente">${lang?"Ask LiDire →":"Pedir ajuda à LiDire →"}</button></div></section>
    <section class="v5-hydration-card"><div class="v5-round-icon">💧</div><div><strong>${lang?"Time to hydrate":"Hora de hidratar"}</strong><p>${lang?`You've had ${water} ml. Goal: ${hydrationGoal} ml.`:`Você bebeu ${water} ml. Meta: ${hydrationGoal} ml.`}</p><div class="v5-progress"><span style="width:${hydrationPct}%"></span></div></div><button class="ghost-button compact" data-page="hidratacao">${lang?"View":"Ver"}</button></section>
    <section class="v5-family-card"><div class="v5-section-row"><div><span class="eyebrow">👨‍👩‍👧 ${lang?"FAMILY SHARING":"COMPARTILHAMENTO FAMILIAR"}</span><h3>${lang?"Shared routine":"Rotina compartilhada"}</h3></div><span class="v5-status">${lang?"Active":"Ativo"}</span></div>${family.length?`<div class="v5-family-people">${family.map(x=>`<span title="${esc(x.name||"")}">${x.photo?`<img src="${esc(x.photo)}" alt="">`:esc((x.name||"?").charAt(0))}</span>`).join("")}</div>`:`<p class="muted">${lang?"Add someone to start sharing.":"Adicione alguém para começar a compartilhar."}</p>`}<button class="primary-button compact" data-page="familia">${lang?"Manage family":"Gerenciar família"}</button></section>
    ${renderFamilyNotificationInbox()}
    ${renderHomeReminders()}
  `);
}

/* =========================================================
   COMPRAS
   ========================================================= */

function compras() {
  const listas = state.data.compras || [];
  const lang = false;
  const primary = listas[0] || {name: lang?"Weekly Shopping":"Compras da Semana", items:[]};
  const items = primary.items || [];
  return appShell(`
    ${pageHeader("SHOPPING", lang?"Shopping List":"Lista de Compras", lang?"Keep your shared shopping organized in one place.":"Mantenha suas compras organizadas e compartilhadas em um só lugar.", `<button class="primary-button compact" data-action="add-compras">${icon("plus")} ${lang?"New list":"Nova lista"}</button>`)}
    ${listas.length ? `<div class="shopping-list-tabs">${listas.map(x=>`<button class="${x.id===primary.id?"active":""}" data-action="open-lista-compras" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>` : ""}
    <div class="v5-quick-pills"><button data-action="new-reminder">🔔 ${lang?"Reminder (17h)":"Lembrete (17h)"}</button><button data-action="notify-shopping-family">👥 Notificar membro da família</button></div>
    <section class="v5-list-section"><div class="v5-section-row"><h2>${esc(primary.name)}</h2><span class="v5-count">${items.filter(x=>!x.done).length} ${lang?"pending":"pendentes"}</span></div>${items.length?items.map(item=>`<button class="v5-shopping-item" data-action="toggle-item-compra" data-list-id="${primary.id}" data-id="${item.id}"><span class="v5-check ${item.done?"checked":""}">${item.done?"✓":""}</span><span><strong>${esc(item.name||item.title||"Item")}</strong><small>${esc(item.quantity||item.qty||"")}</small></span></button>`).join(""):emptyState(lang?"No items":"Nenhum item",lang?"Add your first shopping item.":"Adicione seu primeiro item.",lang?"Add item":"Adicionar item","open-lista-compras")}</section>
    <button class="v5-add-item" data-action="${primary.id?"add-item-compra":"add-compras"}" data-id="${primary.id||""}">＋ ${primary.id?(lang?"Add item":"Adicionar item"):(lang?"Create a list first":"Criar uma lista primeiro")}</button>
    <section class="v5-family-mini"><span>👥</span><div><strong>${lang?"Family updates":"Atualizações da família"}</strong><p>${lang?"New items added to the shared list appear here.":"Novos itens adicionados à lista compartilhada aparecem aqui."}</p></div><button class="text-button" data-page="familia">${lang?"View":"Ver"} →</button></section>
  `);
}
function listaCompras(id) {
  const lista =
    state.data.compras.find(
      x => x.id === id
    );

  if (!lista) {
    currentPage = "compras";
    currentShoppingList = null;
    render();
    return "";
  }

  const items = lista.items || [];

  const done =
    items.filter(x => x.done).length;

  return appShell(`

    <div class="shopping-back">

      <button
        class="text-button"
        data-action="back-compras"
      >
        ${icon("back")} Voltar para listas de compras
      </button>

    </div>

    ${pageHeader(
      "LISTA DE COMPRAS",
      lista.name,
      `${items.length} ${
        items.length === 1 ? "item" : "itens"
      } · ${done} concluído${done === 1 ? "" : "s"}`,
      `
        <button
          class="primary-button compact"
          data-action="add-item-compra"
          data-id="${lista.id}"
        >
          ${icon("plus")} Adicionar item
        </button>
      `
    )}

    <div class="shopping-diet-actions">

      <button
        class="ghost-button"
        data-action="lista-dieta-para-compras"
        data-id="${lista.id}"
      >
        🍽 Importar alimentos da dieta
      </button>

    </div>

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          ${done}/${items.length} concluídos
        </div>

      </div>

      ${
        items.length
          ? `
            <div class="item-list">

              ${items.map(item => `

                <div
                  class="list-item ${
                    item.done ? "completed" : ""
                  }"
                >

                  <button
                    class="check-button ${
                      item.done ? "checked" : ""
                    }"
                    data-action="toggle-item-compra"
                    data-list-id="${lista.id}"
                    data-id="${item.id}"
                  >
                    ${item.done ? "✓" : ""}
                  </button>

                  <div class="item-main">

                    <strong>
                      ${esc(item.name)}
                    </strong>

                    <span>

                      ${
                        item.quantity
                          ? esc(item.quantity)
                          : ""
                      }

                      ${
                        item.category
                          ? ` · ${esc(item.category)}`
                          : ""
                      }

                    </span>

                  </div>

                  <div class="item-actions">

                    <button
                      data-action="delete-item-compra"
                      data-list-id="${lista.id}"
                      data-id="${item.id}"
                    >
                      ${icon("trash")}
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : `
            <div class="empty-state">

              <div class="empty-orb">
                🛒
              </div>

              <h3>Lista vazia</h3>

              <p>
                Adicione o primeiro item desta lista.
              </p>

              <button
                class="primary-button"
                data-action="add-item-compra"
                data-id="${lista.id}"
              >
                ${icon("plus")} Adicionar item
              </button>

            </div>
          `
      }

    </div>

  `);
}

/* =========================================================
   ESTUDOS
   ========================================================= */

function estudos() {
  normalizeStudiesData(); const items=state.data.estudos||[]; const plans=state.data.studyPlans||[]; const lang=false;
  const weekMinutes=plans.filter(x=>x.period==="semanal").reduce((s,x)=>s+Number(x.duration||0),0); const done=plans.filter(x=>x.period==="semanal"&&x.done).reduce((s,x)=>s+Number(x.duration||0),0); const pct=weekMinutes?Math.min(100,Math.round(done/weekMinutes*100)):0; const subjects=[...new Set(items.map(x=>String(x.subject||"Subject").trim()).filter(Boolean))];
  const subjectCards=subjects.slice(0,6).map(subject=>{const ss=items.filter(x=>String(x.subject||"").trim()===subject);const total=ss.reduce((s,x)=>s+Number(x.duration||0),0);const completed=ss.reduce((s,x)=>s+Number(x.effectiveDuration||((x.done?x.duration:0))||0),0);const p=total?Math.min(100,Math.round(completed/total*100)):Math.round(ss.filter(x=>x.done).length/Math.max(1,ss.length)*100);return `<div class="v5-study-subject"><div><strong>${esc(subject)}</strong><span>${p}%</span></div><div class="v5-progress"><span style="width:${p}%"></span></div></div>`}).join('');
  const todayItems=items.filter(x=>!x.date||x.date===todayISO()).slice(0,5);
  return appShell(`
    ${pageHeader("DASHBOARD", lang?"Studies":"Estudos", lang?"Plan, focus and track your progress.":"Planeje, foque e acompanhe seu progresso.", `<button class="primary-button compact" data-action="add-study-plan">${icon("plus")} ${lang?"Plan":"Planejar"}</button>`)}
    <section class="v5-study-progress"><div class="v5-section-row"><div><h2>${lang?"Weekly Progress":"Progresso Semanal"}<p>${lang?`You completed ${pct}% of your weekly goal.`:`Você completou ${pct}% da sua meta semanal.`}</p></div><span class="v5-chart-icon">↗</span></div><div class="v5-bars">${[18,12,28,42,34,14,5].map((h,i)=>`<span class="${i===3?"active":""}" style="height:${h}%"></span>`).join('')}</div><small>S&nbsp;&nbsp; T&nbsp;&nbsp; Q&nbsp;&nbsp; Q&nbsp;&nbsp; S&nbsp;&nbsp; S&nbsp;&nbsp; D</small></section>
    <section class="v5-focus-card"><div class="v5-focus-ring"><strong>${Math.round(done/60)}h ${done%60}m</strong><small>${lang?"TOTAL FOCUS THIS WEEK":"FOCO TOTAL NA SEMANA"}</small></div><button class="text-button" data-action="add-study-plan">${lang?"View details":"Ver detalhes"}</button></section>
    <div class="v5-section-row"><h2>${lang?"Study Plan":"Plano de Estudos"}<button class="text-button" data-action="add-study-plan">＋</button></h2></div>
    <section class="v5-subject-list">${subjectCards||`<p class="muted">${lang?"Add a study subject to start tracking.":"Adicione um assunto para começar a acompanhar."}</p>`}</section>
    <h2 class="v5-inline-title">${lang?"Today's Tasks":"Tarefas de Hoje"}</h2>
    <section class="v5-today-tasks">${todayItems.length?todayItems.map(x=>`<div class="v5-study-task"><button class="check-button ${x.done?"checked":""}" data-action="toggle-estudo" data-id="${x.id}">${x.done?"✓":""}</button><div><strong>${esc(x.topic||x.subject||"Study")}</strong><small>${esc(x.subject||"")}${x.time?` · ${esc(x.time)}`:""}${x.duration?` · ${esc(x.duration)} min`:""}</small></div><button data-action="edit-estudo" data-id="${x.id}">⋮</button></div>`).join(''):emptyState(lang?"No study tasks":"Nenhuma tarefa de estudo",lang?"Add a study session.":"Adicione uma sessão de estudo.",lang?"Add study":"Adicionar estudo","add-estudos")}</section>
    <section class="v5-pomodoro"><small>${lang?"DEEP FOCUS":"FOCO PROFUNDO"}</small><strong id="pomodoro-display">${formatPomodoro(pomodoroState.remaining)}</strong><span>${lang?"POMODORO":"POMODORO"}</span><div><button class="primary-button compact" data-action="start-study-focus">▷ ${pomodoroState.running?(lang?"Pause":"Pausar"):(lang?"Start":"Iniciar")}</button><button class="ghost-button compact" data-action="reset-study-focus">↻</button><button class="ghost-button compact" data-action="set-study-focus">⚙ ${lang?"Set time":"Definir tempo"}</button></div><div class="v5-pomo-stats"><span>4<br><small>${lang?"Sessions":"Sessões"}</small></span><span id="pomodoro-stats">${state.settings.pomodoroStats?.sessions||0}<br><small>Sessões</small></span></div></section>
  `);
}

/* =========================================================
   TREINOS
   ========================================================= */

function workoutPerformanceChart(items) {
  if (!items.length) return `<p class="muted">Registre treinos para visualizar o rendimento.</p>`;
  const groups = {};
  items.forEach(t => {
    const type = (t.type || "Treino").trim() || "Treino";
    const distance = Number(t.distance || 0);
    const reps = (t.exercises || []).reduce((sum,e)=>sum + Number(e.repsDone || 0),0);
    const value = distance > 0 ? distance : reps;
    const unit = distance > 0 ? "km" : "reps";
    if (!groups[type]) groups[type] = {value:0,unit};
    groups[type].value += value;
  });
  const rows = Object.entries(groups);
  const max = Math.max(1, ...rows.map(([,v])=>v.value));
  return `<div class="performance-chart">${rows.map(([type,v])=>`<div class="chart-row"><div class="chart-label"><span>${esc(type)}</span><strong>${v.value.toLocaleString("pt-BR")} ${v.unit}</strong></div><div class="chart-bar"><span style="width:${Math.round(v.value/max*100)}%"></span></div></div>`).join("")}</div>`;
}

function treinos() {
  const items = state.data.treinos || [];
  const planned = items.filter(t => !t.completed);
  const done = items.filter(t => t.completed);
  return appShell(`${pageHeader("BEM-ESTAR", "Treinos", "Planeje, execute e acompanhe sua evolução.", `<button class="primary-button compact" data-action="add-treinos">${icon("plus")} Novo treino</button>`)}
    <div class="content-card"><div class="workout-tabs"><span>📅 Planejados: <strong>${planned.length}</strong></span><span>✅ Executados: <strong>${done.length}</strong></span><span>🏋️ Total: <strong>${items.length}</strong></span></div>${workoutPerformanceChart(items)}</div>
    <div class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">Treinos planejados</div><small>Um treino só entra no histórico quando você marcar como concluído.</small></div></div>${planned.length?`<div class="item-list">${planned.map(t=>workoutCard(t,false)).join("")}</div>`:`<p class="muted">Nenhum treino planejado.</p>`}</div>
    <div class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">Histórico de treinos executados</div><small>Registros que você marcou como concluídos.</small></div></div>${done.length?`<div class="item-list">${done.map(t=>workoutCard(t,true)).join("")}</div>`:`<p class="muted">Nenhum treino concluído ainda.</p>`}</div>`);
}
function workoutCard(treino, done){
  const exercises = Array.isArray(treino.exercises) ? treino.exercises : [];
  const exerciseHtml = exercises.length ? exercises.map(ex => `
    <div class="list-item">
      <div class="module-icon small">${icon("dumbbell")}</div>
      <div class="item-main"><strong>${esc(ex.name)}</strong><span>Carga: meta ${esc(ex.loadGoal||"—")} / realizada ${esc(ex.loadDone||"—")} · Repetições: meta ${esc(ex.repsGoal||"—")} / realizadas ${esc(ex.repsDone||"—")}</span></div>
      <div class="item-actions">
        <button data-action="animate-exercicio" data-id="${ex.id}">▶</button>
        <button data-action="edit-exercicio" data-id="${ex.id}" data-treino-id="${treino.id}">${icon("edit")}</button>
        <button data-action="delete-exercicio" data-id="${ex.id}" data-treino-id="${treino.id}">${icon("trash")}</button>
      </div>
    </div>`).join("") : `<p class="muted">Nenhum exercício cadastrado.</p>`;
  return `<div class="exercise-card">
    <div class="goal-top"><div><strong>${esc(treino.name)}</strong><span>${esc(treino.type||"Treino")} · ${dateBR(treino.date||todayISO())}${treino.time ? ` · ${esc(treino.time)}` : ""}${treino.duration ? ` · ${esc(treino.duration)} min` : ""}${treino.distance ? ` · ${esc(treino.distance)} km` : ""}${treino.pace ? ` · Pace ${esc(treino.pace)}` : ""}</span></div>
      <div class="item-actions"><button data-action="edit-treino" data-id="${treino.id}" title="Editar">${icon("edit")}</button><button data-action="delete-treino" data-id="${treino.id}" title="Excluir">${icon("trash")}</button></div>
    </div>
    <div class="workout-actions"><button class="${done?"ghost-button":"primary-button"} compact" data-action="toggle-treino" data-id="${treino.id}">${done?"↩ Desmarcar concluído":"✓ Marcar como concluído"}</button><button class="ghost-button compact" data-action="create-reminder" data-source="treino" data-id="${treino.id}">⏰ Lembrete</button><button class="ghost-button compact" data-action="add-exercicio" data-id="${treino.id}">+ Exercício</button></div>
    ${exerciseHtml}${treino.observations ? `<p class="muted">${esc(treino.observations)}</p>` : ""}
  </div>`;
}

/* =========================================================
   HIDRATAÇÃO
   ========================================================= */

function formatHydrationInterval(minutes) {
  const value = Number(minutes) || 30;
  if (value < 60) return `${value} min`;

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (!mins) return `${hours}h`;
  return `${hours}h${String(mins).padStart(2, "0")}`;
}

function hidratacao() {
  const lang = false;
  const hydrationRecommendation = calculateHydrationRecommendation();
  const total = state.data.hidratacao
    .filter(x => x.date === todayISO())
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const goal =
    Number(state.settings.hydrationGoal) || 2000;

  const intervalMinutes =
    Number(state.settings.hydrationIntervalMinutes) ||
    (Number(state.settings.hydrationInterval) || 2) * 60;

  const startTime = state.settings.hydrationStart || "08:00";
  const endTime = state.settings.hydrationEnd || "21:00";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let periodMinutes =
    (endHour * 60 + endMinute) -
    (startHour * 60 + startMinute);

  if (periodMinutes <= 0) periodMinutes += 24 * 60;

  const consumptionCount = Math.max(1, Math.ceil(periodMinutes / intervalMinutes));
  const periodAmount = Math.round(goal / consumptionCount);

  const pct = Math.min(
    100,
    Math.round((total / goal) * 100)
  );

  return appShell(`

    ${pageHeader(
      lang ? "WELL-BEING" : "BEM-ESTAR",
      lang ? "Hydration" : "Hidratação",
      lang ? "Track your daily goal and the suggested amount for each period." : "Acompanhe sua meta diária e a quantidade indicada por período.",
      `
        <button
          class="primary-button compact"
          data-action="add-hidratacao"
        >
          ${icon("plus")} ${lang?"Log water":"Registrar"}
        </button>
      `
    )}

    <div class="hydration-card">

      <div class="hydration-top">

        <div>

          <span class="eyebrow">
            ${lang?"TODAY":"HOJE"}
          </span>

          <h2>
            ${total} ml
          </h2>

          <p>
            ${lang?"of":"de"} ${goal} ml
          </p>

          <p class="muted">
            ${periodAmount} ml ${lang?"every":"a cada"} ${formatHydrationInterval(intervalMinutes)}
            <br><span class="muted">${startTime} ${lang?"to":"às"} ${endTime} · ${consumptionCount} ${lang?"planned drinks":"consumos previstos"}</span>
          </p>

        </div>

        <div class="water-drop">
          ◉
        </div>

      </div>

      <div class="progress">
        <span style="width:${pct}%"></span>
      </div>

      <div class="progress-labels">

        <span>0 ml</span>

        <strong>${pct}%</strong>

        <span>${goal} ml</span>

      </div>

      <div class="quick-water">

        ${[200, 300, 500].map(v => `
          <button
            data-action="quick-water"
            data-value="${v}"
          >
            +${v} ml
          </button>
        `).join("")}

        <button
          class="custom-water-button"
          data-action="add-hidratacao"
        >
          Digitar quantidade
        </button>

      </div>

      <button
        class="ghost-button"
        data-action="config-hidratacao"
      >
        ⚙ Definir meta e período
      </button>

    </div>

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          Registros de hoje
        </div>

        <button
          class="text-button"
          data-action="reset-hidratacao"
        >
          Limpar
        </button>

      </div>

      ${
        state.data.hidratacao.filter(
          x => x.date === todayISO()
        ).length
          ? `
            <div class="item-list">

              ${state.data.hidratacao
                .filter(x => x.date === todayISO())
                .map(x => `

                  <div class="list-item">

                    <div class="module-icon small">
                      ◉
                    </div>

                    <div class="item-main">

                      <strong>
                        ${x.amount} ml
                      </strong>

                      <span>
                        ${new Date(
                          x.createdAt
                        ).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit"
                          }
                        )}
                      </span>

                    </div>

                    <div class="item-actions">

                      <button
                        data-action="delete-hidratacao"
                        data-id="${x.id}"
                      >
                        ${icon("trash")}
                      </button>

                    </div>

                  </div>

                `).join("")}

            </div>
          `
          : `<p class="muted">
              Nenhum registro hoje.
            </p>`
      }

    </div>

    <section class="content-card hydration-recommendation-card">
      <div class="card-toolbar"><div><div class="toolbar-title">${lang?"LiDire hydration suggestion":"Sugestão de hidratação da LiDire"}</div><small>${lang?"Based on sex, age, weight, activity and goal.":"Baseada em sexo, idade, peso, atividade e objetivo."}</small></div><button class="ghost-button compact" data-action="config-hidratacao">⚙ ${lang?"Set profile":"Definir perfil"}</button></div>
      <strong>${hydrationRecommendation.ml} ml/dia</strong>
      <p class="muted">${esc(hydrationRecommendation.note)}</p>
      <small class="muted">${lang?"Estimate only; not a medical prescription.":"Estimativa para orientação; não é prescrição médica."}</small>
    </section>

  `);
}

/* =========================================================
   ALIMENTAÇÃO
   ========================================================= */

function alimentacao() {
  const today = todayISO();

  const meals = state.data.alimentacao
    .filter(x => x.date === today)
    .sort((a, b) =>
      (a.time || "").localeCompare(
        b.time || ""
      )
    );

  const consumed = meals.reduce(
    (sum, meal) =>
      sum +
      (meal.foods || []).reduce(
        (s, food) =>
          s + Number(food.calories || 0),
        0
      ),
    0
  );

  const goal =
    Number(state.settings.calorieGoal) || 2000;

  const remaining =
    Math.max(0, goal - consumed);

  const pct = Math.min(
    100,
    Math.round((consumed / goal) * 100)
  );

  return appShell(`

    ${pageHeader(
      "BEM-ESTAR",
      "Alimentação",
      "Organize refeições, alimentos da dieta e calorias.",
      `
        <button
          class="primary-button compact"
          data-action="add-alimentacao"
        >
          ${icon("plus")} Refeição
        </button>
        <button class="ghost-button compact" data-action="food-catalog">🍎 Cadastro de alimentos</button><button class="ghost-button compact" data-action="recipe-coming-soon">🍳 Receita com IA</button>
      `
    )}

    <div class="calorie-summary">

      <span class="eyebrow">
        CALORIAS DE HOJE
      </span>

      <strong>
        ${consumed} kcal
      </strong>

      <p>
        Meta: ${goal} kcal · Restam ${remaining} kcal
      </p>

      <div class="calorie-progress">
        <span style="width:${pct}%"></span>
      </div>

      <button
        class="ghost-button"
        data-action="config-calorias"
      >
        ⚙ Definir meta diária
      </button>

    </div>

    <div class="shopping-diet-actions">

      <button class="ghost-button" data-action="add-dieta">🍽 Nova dieta</button>
      <button class="ghost-button" data-action="diet-library">📚 Biblioteca de dietas</button>

      <button
        class="ghost-button"
        data-page="receitas"
      >
        🍳 Receitas
      </button>

      <button
        class="ghost-button"
        data-action="dieta-para-compras"
      >
        🛒 Criar compras da dieta
      </button>

    </div>

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          Refeições de hoje
        </div>

      </div>

      ${
        meals.length
          ? `
            <div class="item-list">

              ${meals.map(meal => `

                <div class="list-item">

                  <div class="module-icon small">
                    🍽
                  </div>

                  <div class="item-main">

                    <strong>
                      ${esc(meal.name)}
                    </strong>

                    <span>
                      ${esc(meal.time || "--:--")}
                      ·
                      ${
                        (meal.foods || []).reduce(
                          (s, f) =>
                            s +
                            Number(
                              f.calories || 0
                            ),
                          0
                        )
                      } kcal
                    </span>

                    <small>

                      ${(meal.foods || [])
                        .map(
                          f =>
                            `${esc(f.name)} (${Number(
                              f.calories || 0
                            )} kcal)`
                        )
                        .join(", ")}

                    </small>

                  </div>

                  <div class="item-actions">

                    <button
                      data-action="edit-refeicao"
                      data-id="${meal.id}"
                    >
                      ${icon("edit")}
                    </button>

                    <button
                      data-action="delete-refeicao"
                      data-id="${meal.id}"
                    >
                      ${icon("trash")}
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : emptyState(
              "Nenhuma refeição hoje",
              "Registre sua primeira refeição para acompanhar as calorias.",
              "Adicionar refeição",
              "add-alimentacao"
            )
      }

    </div>

  `);
                        }
/* =========================================================
   FINANÇAS
   ========================================================= */

function currentFinanceMonth() {
  return todayISO().slice(0, 7);
}

function activeFinanceRows() {
  const month = currentFinanceMonth();
  const resetAt = state.settings.financeMonthResets?.[month] || "";
  return (state.data.financas || []).filter(x => {
    const date = String(x.date || "");
    if (!date.startsWith(month)) return false;
    return !resetAt || String(x.createdAt || "") >= resetAt;
  });
}

function financeByCategory(rows = activeFinanceRows()) {
  const result = {};
  rows.filter(x => x.type === "expense").forEach(x => {
    const category = x.category?.trim() || "Geral";
    const currency = x.currency || "BRL";
    const key = `${currency}::${category}`;
    if (!result[key]) result[key] = { category, currency, value: 0 };
    result[key].value += Number(x.value || 0);
  });
  return result;
}

function financeChart() {
  const data = financeByCategory();
  const entries = Object.values(data);
  if (!entries.length) return `<p class="muted">Ainda não existem gastos por categoria neste mês.</p>`;
  const max = Math.max(...entries.map(x => x.value));
  return entries.sort((a,b)=>b.value-a.value).map(item => {
    const pct = max ? Math.round((item.value / max) * 100) : 0;
    const limit = item.currency === "BRL" ? Number(state.settings.financeLimits?.[item.category] || 0) : 0;
    const warning = limit > 0 ? `<div class="limit-warning ${item.value > limit ? "limit-danger" : "limit-ok"}">Teto: ${money(limit,"BRL")} · ${item.value > limit ? "Teto ultrapassado" : `Restam ${money(limit-item.value,"BRL")}`}</div>` : "";
    return `<div class="chart-row"><div class="chart-label"><span>${esc(item.category)} · ${item.currency === "USD" ? "US$" : "R$"}</span><strong>${money(item.value,item.currency)}</strong></div><div class="chart-bar"><span style="width:${pct}%"></span></div>${warning}</div>`;
  }).join("");
}

function financas() {
  const rows=activeFinanceRows(); const lang=false; const income=rows.filter(x=>x.type==="income"&&(x.currency||"BRL")==="BRL").reduce((s,x)=>s+Number(x.value||0),0); const expense=rows.filter(x=>x.type==="expense"&&(x.currency||"BRL")==="BRL").reduce((s,x)=>s+Number(x.value||0),0); const balance=income-expense;
  return appShell(`
    ${pageHeader(lang?"MONEY":"DINHEIRO", lang?"Finances":"Finanças", lang?"See your money, goals and spending in one place.":"Veja seu dinheiro, metas e gastos em um só lugar.", `<button class="primary-button compact" data-action="add-financas">${icon("plus")} ${lang?"Add transaction":"Adicionar transação"}</button>`)}
    <section class="v5-finance-summary"><small>${lang?"FINANCIAL SUMMARY":"RESUMO FINANCEIRO"}</small><strong>${money(balance,"BRL")}</strong><span>↗ ${lang?"This month":"este mês"}</span><div><button class="primary-button compact" data-action="add-financas">${lang?"Add transaction":"Adicionar transação"}</button><button class="ghost-button compact" data-action="finance-monthly-report">${lang?"Report":"Relatório"}</button><button class="ghost-button compact" data-action="finance-zero-month">${lang?"Reset month":"Zerar mês"}</button></div></section>
    <section class="v5-smart-banner finance"><span>✦</span><div><strong>${lang?"AI Tip":"Dica da IA"}</strong><p>${lang?"LiDire can analyze your spending and suggest adjustments based on your goals.":"A LiDire pode analisar seus gastos e sugerir ajustes com base nos seus objetivos."}</p></div><button class="text-button" data-page="assistente">${lang?"View full suggestion":"Ver sugestão completa"}</button></section>
    <section class="v5-finance-chart"><div class="v5-section-row"><h2>${lang?"Spending by Category":"Gastos por Categoria"}<button class="text-button" data-action="config-tetos">•••</button></h2></div>${financeChart()}</section>
    <section class="v5-goals-card"><div class="v5-section-row"><h2>${lang?"Financial Goals":"Objetivos Financeiros"}</h2><button class="text-button" data-action="add-objetivos">+ ${lang?"New":"Novo"}</button></div>${state.data.objetivos.slice(0,3).map(o=>`<div class="v5-fin-goal"><div><strong>${esc(o.title||o.name||"Goal")}</strong><small>${lang?"Target":"Meta"}: ${esc(o.target||o.valorMeta||"—")}</small></div><b>${Math.min(100,Number(o.progress||o.percent||0))}%</b><div class="v5-progress"><span style="width:${Math.min(100,Number(o.progress||o.percent||0))}%"></span></div></div>`).join('')||`<p class="muted">${lang?"Create a financial goal to start.":"Crie um objetivo financeiro para começar."}</p>`}</section>
    <section class="v5-transactions"><div class="v5-section-row"><h2>${lang?"Recent Transactions":"Transações Recentes"}</h2><button class="text-button" data-action="finance-history">☷</button></div>${rows.slice().reverse().slice(0,5).map(x=>`<div class="v5-transaction"><span>${x.type==="income"?"▣":"◼"}</span><div><strong>${esc(x.description||x.title||x.category||"Transaction")}</strong><small>${dateBR(x.date||todayISO())} · ${esc(x.category||"")}</small></div><b class="${x.type}">${x.type==="income"?"+":"-"} ${money(Number(x.value||0),x.currency||"BRL")}</b></div>`).join('')||`<p class="muted">${lang?"No transactions yet.":"Nenhuma transação ainda."}</p>`}</section>
  `);
}

/* =========================================================
   OBJETIVOS
   ========================================================= */

function objetivos() {
  const items =
    state.data.objetivos || [];

  return appShell(`

    ${pageHeader(
      "DIREÇÃO",
      "Objetivos",
      "Dê forma aos planos que você quer realizar.",
      `
        <button
          class="primary-button compact"
          data-action="add-objetivos"
        >
          ${icon("plus")} Objetivo
        </button>
      `
    )}

    <div class="content-card">

      ${
        items.length
          ? items.map(x => `

              <div class="goal-item">

                <div class="goal-top">

                  <div>

                    <strong>
                      ${esc(x.title)}
                    </strong>

                    <span>

                      ${
                        x.deadline
                          ? `Até ${dateBR(
                              x.deadline
                            )}`
                          : "Sem prazo"
                      }

                      ${
                        Number(x.moneyGoal || 0) > 0
                          ? ` · Meta financeira ${money(
                              x.moneyGoal,
                              x.moneyCurrency || "BRL"
                            )}`
                          : ""
                      }

                    </span>

                  </div>

                  <b>
                    ${Number(
                      x.progress || 0
                    )}%
                  </b>

                </div>

                <div class="progress">
                  <span
                    style="width:${Math.min(
                      100,
                      Number(x.progress || 0)
                    )}%"
                  ></span>
                </div>

                ${
                  x.observations
                    ? `
                      <p class="muted">
                        ${esc(
                          x.observations
                        )}
                      </p>
                    `
                    : ""
                }

                <div class="goal-subtasks">

                  ${
                    x.metas?.length
                      ? x.metas.map(meta => `

                          <div class="goal-subtask">

                            <button
                              class="check-button ${
                                meta.done
                                  ? "checked"
                                  : ""
                              }"
                              data-action="toggle-meta"
                              data-id="${meta.id}"
                              data-goal-id="${x.id}"
                            >
                              ${
                                meta.done
                                  ? "✓"
                                  : ""
                              }
                            </button>

                            <div class="item-main">

                              <strong>
                                ${esc(
                                  meta.title
                                )}
                              </strong>

                              <span>
                                ${esc(
                                  meta.period
                                )}
                              </span>

                            </div>

                          </div>

                        `).join("")
                      : `
                        <p class="muted">
                          Nenhuma meta interna cadastrada.
                        </p>
                      `
                  }

                </div>

                <div class="goal-actions">

                  <button
                    data-action="add-meta"
                    data-id="${x.id}"
                  >
                    + Meta
                  </button>

                  <button
                    data-action="progress-objetivo"
                    data-id="${x.id}"
                  >
                    Atualizar progresso
                  </button>

                  <button
                    data-action="edit-objetivo"
                    data-id="${x.id}"
                  >
                    Editar
                  </button>

                  <button
                    data-action="delete-objetivo"
                    data-id="${x.id}"
                  >
                    Excluir
                  </button>

                </div>

              </div>

            `).join("")
          : emptyState(
              "Nenhum objetivo",
              "Crie um objetivo e transforme-o em pequenas metas.",
              "Criar objetivo",
              "add-objetivos"
            )
      }

    </div>

  `);
}

/* =========================================================
   FAMÍLIA
   ========================================================= */

function familyPermissionSummary(x){const p=x.permissions||{};const labels={agenda:"Agenda",tarefas:"Tarefas",compras:"Compras",estudos:"Estudos",treinos:"Treinos",hidratacao:"Hidratação",alimentacao:"Alimentação",financas:"Finanças",objetivos:"Objetivos",cicloMenstrual:"Ciclo",lembretes:"Lembretes"};return Object.entries(labels).filter(([k])=>p[k]).map(([,v])=>v).join(" · ")||"Nenhum recurso compartilhado";}
function familySettings(){
  const people=state.data.familia||[];
  const fs=state.settings.familySharing||{};
  const toggle=(key,onLabel,offLabel)=>`<button class="family-toggle ${fs[key]?"on":""}" data-action="family-toggle-feature" data-key="${key}" aria-label="${fs[key]?onLabel:offLabel}"><span></span></button>`;
  return appShell(`${pageHeader("FAMÍLIA","Configurações de Família","Gerencie membros, recursos compartilhados e convites.",`<button class="ghost-button compact" data-page="familia">← ${false?"Back":"Voltar"}</button>`)}
    <div class="family-status-pill">✓ <span>${false?(["connected_calendar","connected_outlook","connected_notion"].some(k=>fs[k])?"Connected services available":"No calendars connected"):(["connected_calendar","connected_outlook","connected_notion"].some(k=>fs[k])?"Serviços conectados disponíveis":"Nenhuma agenda conectada")}</span></div>
    <section class="family-plan-card">
      <div class="family-plan-head"><div class="family-plan-icon">👨‍👩‍👧</div><div><strong>${false?"Family Plan":"Plano Família"}</strong><small>${people.length} ${false?"of 6 members used":"de 6 membros utilizados"}</small></div></div>
      <button class="primary-button family-add-member" data-action="add-familia">＋ ${false?"Add Member":"Adicionar membro"}</button>
      <div class="family-member-stack">${people.length?people.slice(0,6).map(x=>`<div class="family-person-row"><div class="family-person-avatar">${x.photo?`<img src="${esc(x.photo)}" alt="">`:esc((x.name||"?").charAt(0).toUpperCase())}</div><div><strong>${esc(x.name||"Membro")}</strong><small>${esc(String(x.relation||"Membro").toUpperCase())}</small></div><button class="family-more" data-action="edit-familia" data-id="${x.id}">⋮</button></div>`).join(""):`<div class="family-empty">${false?"No members yet.":"Nenhum membro adicionado ainda."}</div>`}</div>
    </section>
    <section class="family-section"><div class="family-section-title"><span>⌘</span><h2>${false?"Shared Features":"Recursos compartilhados"}</h2></div>
      <div class="family-feature-grid">
        <div class="family-feature-card"><div class="family-feature-icon calendar">▣</div><div><strong>${false?"Sync Calendars":"Sincronizar Agendas"}</strong><p>${false?"Share events and commitments automatically.":"Compartilhe eventos e compromissos automaticamente."}</p></div>${toggle("syncCalendars","Ativado","Desativado")}</div>
        <div class="family-feature-card"><div class="family-feature-icon money">▣</div><div><strong>${false?"Shared Finances":"Finanças Compartilhadas"}</strong><p>${false?"Unified view of household expenses and budgets.":"Visão unificada de gastos e orçamentos domésticos."}</p></div>${toggle("sharedFinances","Ativado","Desativado")}</div>
        <div class="family-feature-card"><div class="family-feature-icon location">⌾</div><div><strong>${false?"Real-time Location":"Localização em Tempo Real"}</strong><p>${false?"Optional location sharing for family safety.":"Compartilhamento opcional de localização para segurança familiar."}</p></div>${toggle("liveLocation","Ativado","Desativado")}</div>
      </div>
    </section>
    <section class="family-section"><div class="family-section-title"><span>✉</span><h2>${false?"Pending Invitations":"Convites Pendentes"}</h2></div>
      <div class="family-invite-list">${people.filter(x=>x.email).map(x=>`<div class="family-pending-row"><div class="family-pending-avatar">${esc((x.name||x.email||"?").charAt(0).toUpperCase())}</div><div><strong>${esc(x.email)}</strong><small>${x.inviteStatus==="pending"?(false?"Invitation pending":"Convite pendente"):(false?"Member":"Membro")}</small></div><button class="ghost-button compact" data-action="family-invite-link" data-id="${x.id}">${false?"Resend":"Reenviar"}</button></div>`).join("") || `<div class="family-empty">${false?"No pending invitations.":"Nenhum convite pendente."}</div>`}</div>
    </section>
    <section class="family-section family-install-section">
      <div class="family-section-title"><span>⌁</span><h2>${false?"Invite & install LiDire":"Convidar e instalar a LiDire"}</h2></div>
      <div class="family-install-card">
        <div><strong>${false?"Send an invitation with the installation link":"Envie um convite com link de instalação"}</strong><p>${false?"Share the LiDire installation page by link or QR code.":"Compartilhe a página de instalação da LiDire por link ou QR Code."}</p></div>
        <img src="/lidire-install-qr.png" alt="QR Code de instalação da LiDire" class="family-install-qr">
        <div class="family-install-actions"><button class="primary-button compact" data-action="create-promo-link">⌁ ${false?"Create installation invite":"Criar convite de instalação"}</button><button class="ghost-button compact" data-action="create-family-invite">👥 ${false?"Invite family member":"Convidar familiar"}</button></div>
      </div>
    </section>`);
}
function familyShareNotifications(){
  const people=(state.data.familia||[]).filter(x=>familyPermissionSummary(x)!=="Nenhum recurso compartilhado");
  if(!people.length){
    return `<section class="family-reference-card family-share-notifications">
      <div class="family-reference-card-head compact"><div><h3>🔔 Notificações de compartilhamento</h3><p>Nenhum compartilhamento ativo no momento.</p></div></div>
    </section>`;
  }
  return `<section class="family-reference-card family-share-notifications">
    <div class="family-reference-card-head compact"><div><h3>🔔 Notificações de compartilhamento</h3><p>Veja o que cada membro da família está compartilhando com você.</p></div></div>
    <div class="family-reference-divider"></div>
    <div class="family-share-notification-list">${people.slice(0,12).map(x=>{
      const summary=familyPermissionSummary(x);
      const initial=esc((x.name||"M").charAt(0).toUpperCase());
      return `<div class="family-share-notification"><div class="family-share-notification-icon">${initial}</div><div class="family-share-notification-main"><strong>${esc(x.name||"Membro da família")}</strong><span>Compartilhando: ${esc(summary)}</span></div><span class="family-share-notification-status">Ativo</span></div>`;
    }).join("")}</div>
  </section>`;
}

function renderFamilyNotificationInbox(){
  const notes=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
  const unread=notes.filter(n=>!n.read_at).length;
  const rows=notes.slice(0,10).map(n=>`<div class="family-share-notification"><div class="family-share-notification-icon">✦</div><div class="family-share-notification-main"><strong>${esc(n.title||"LiDire — Família")}</strong><span>${esc(n.message||"")}</span><small>${esc(n.created_at||"")}</small></div>${!n.read_at?`<button class="ghost-button compact" data-action="mark-family-notification-read" data-id="${esc(n.id)}">Marcar lida</button>`:`<span class="family-share-notification-status">Lida</span>`}</div>`).join("");
  return `<section class="family-reference-card"><div class="family-reference-card-head compact"><div><h3>🔔 Notificações da família</h3><p>Mensagens recebidas de outros membros da sua família LiDire.${unread?` <strong>${unread} não lida(s)</strong>`:""}</p></div></div><div class="family-reference-divider"></div><div class="family-share-notification-list">${rows||`<p class="muted">Nenhuma notificação recebida.</p>`}</div></section>`;
}

function familia(){
  const people=state.data.familia||[];
  const lang=false;
  const resourceItems=[
    ["📅",lang?"Calendar":"Agenda"],
    ["✓",lang?"Tasks":"Tarefas"],
    ["🛒",lang?"Shopping":"Compras"],
    ["📚",lang?"Studies":"Estudos"],
    ["🏋️",lang?"Workouts":"Treinos"],
    ["💧",lang?"Hydration":"Hidratação"],
    ["🍽️",lang?"Nutrition":"Alimentação"],
    ["💰",lang?"Finances":"Finanças"],
    ["🎯",lang?"Goals":"Objetivos"],
    ["🌸",lang?"Menstrual cycle":"Ciclo menstrual"],
    ["🔔",lang?"Reminders":"Lembretes"]
  ];
  const memberRows=people.length?people.slice(0,6).map(x=>{
    const summary=familyPermissionSummary(x);
    const avatar=x.photo?`<img src="${esc(x.photo)}" alt="">`:esc((x.name||"?").charAt(0).toUpperCase());
    return `<div class="family-reference-member">
      <div class="family-reference-avatar">${avatar}</div>
      <div class="family-reference-member-main">
        <strong>${esc(x.name||"Membro")}</strong>
        <span>${esc(x.relation||"Membro")} · ${esc(x.email||"")}${x.address?` · ${esc(x.address)}`:""}</span>
        <p>🔐 ${esc(summary)}</p>
      </div>
      <div class="family-reference-actions">
        <button type="button" class="family-reference-icon-btn" data-action="send-family-notification" data-id="${esc(x.id)}" aria-label="Enviar notificação">🔔</button><button type="button" class="family-reference-icon-btn" data-action="family-invite-link" data-id="${esc(x.id)}" aria-label="${lang?"Invitation link":"Link do convite"}">🔗</button>
        <button type="button" class="family-reference-icon-btn" data-action="edit-familia" data-id="${esc(x.id)}" aria-label="${lang?"Edit":"Editar"}">✎</button>
        <button type="button" class="family-reference-icon-btn danger" data-action="delete-familia" data-id="${esc(x.id)}" aria-label="${lang?"Delete":"Excluir"}">⌫</button>
      </div>
    </div>`;
  }).join(""):`<div class="family-reference-empty">${lang?"No family members yet.":"Nenhum membro da família adicionado ainda."}</div>`;
  return appShell(`${pageHeader("FAMÍLIA E COMPARTILHAMENTO",lang?"Family":"Família",lang?"Organize your routine together with the people who matter.":"Organize a rotina junto com quem importa.")}
    <button class="primary-button family-reference-add" data-action="add-familia">＋ ${lang?"Add":"Adicionar"}</button>

    <section class="family-reference-hero">
      <div class="family-reference-hero-icon">👨‍👩‍👧</div>
      <div class="family-reference-kicker">${lang?"SHARED ROUTINE":"ROTINA COMPARTILHADA"}</div>
      <h2>${lang?"Because life is not lived alone.":"Porque a vida não é vivida sozinha."}</h2>
      <p>${lang?"Add people and define individually what each person can access.":"Adicione pessoas e defina individualmente o que cada uma pode acessar."}</p>
    </section>

    <section class="family-reference-card family-reference-members-card">
      <div class="family-reference-card-head">
        <div><h3>${lang?"Family members":"Membros da família"}</h3><p>${lang?"Individual permissions and invitations.":"Permissões individuais e convites."}</p></div>
        <button type="button" class="family-reference-add-person" data-action="add-familia"><span>＋</span><strong>${lang?"Person":"Pessoa"}</strong></button>
      </div>
      <div class="family-reference-divider"></div>
      <div class="family-reference-members">${memberRows}</div>
    </section>

    <section class="family-reference-card">
      <div class="family-reference-card-head compact">
        <div><h3>${lang?"Invitations":"Convites"}</h3><p>${lang?"Invite a family member or share LiDire for installation.":"O link de divulgação é separado do compartilhamento familiar."}</p></div>
      </div>
      <div class="family-reference-divider"></div>
      <div class="family-reference-invite-grid">
        <button type="button" class="family-reference-action primary" data-action="create-family-invite">🔗 ${lang?"Generate family invitation":"Gerar convite familiar"}</button>
        <button type="button" class="family-reference-action" data-action="create-promo-link">📣 ${lang?"Generate installation link":"Gerar link de divulgação"}</button>
      </div>
      <div class="family-reference-qr-wrap">
        <div><strong>${lang?"Install LiDire":"Instale a LiDire"}</strong><p>${lang?"Scan the QR Code to open the installation page.":"Aponte a câmera para o QR Code e abra a página de instalação."}</p></div>
        <img src="/lidire-install-qr.png" alt="QR Code de instalação da LiDire" class="family-reference-qr">
      </div>
    </section>

    ${familyShareNotifications()}
    ${renderFamilyNotificationInbox()}

    <section class="family-reference-card family-reference-resources">
      <div class="family-reference-card-head compact">
        <div><h3>${lang?"Shareable resources":"Recursos compartilháveis"}</h3><p>${lang?"Permissions are defined in each person's registration.":"As permissões são definidas dentro do cadastro de cada pessoa."}</p></div>
      </div>
      <div class="family-reference-divider"></div>
      <div class="family-reference-resource-list">
        ${resourceItems.map(([ico,label])=>`<div class="family-reference-resource"><span class="family-reference-resource-icon">${ico}</span><div><strong>${label}</strong><small>${lang?"Individual permission":"Permissão individual"}</small></div></div>`).join("")}
      </div>
    </section>`);
}

/* =========================================================
   CLIMA, LOCALIZAÇÃO E ROTAS — LiDire 1.4
   ========================================================= */
let routeLoading = false;
let weatherLocationLoading = false;

function weatherCodeLabel(code){
  const map={0:"Céu limpo",1:"Predominantemente limpo",2:"Parcialmente nublado",3:"Nublado",45:"Neblina",48:"Neblina com geada",51:"Garoa leve",53:"Garoa moderada",55:"Garoa intensa",61:"Chuva leve",63:"Chuva moderada",65:"Chuva forte",71:"Neve leve",73:"Neve moderada",75:"Neve forte",80:"Pancadas leves",81:"Pancadas moderadas",82:"Pancadas fortes",95:"Trovoada",96:"Trovoada com granizo leve",99:"Trovoada com granizo forte"};
  return map[Number(code)]||"Condição não informada";
}

async function geocodeWeatherLocation(location){
  const q=String(location||"").trim();
  if(!q) throw new Error("Informe uma cidade ou local.");
  const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=pt&format=json`;
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok) throw new Error("Não foi possível localizar esse endereço.");
  const d=await r.json();
  const x=d?.results?.[0];
  if(!x) throw new Error("Não encontrei esse local.");
  return {latitude:Number(x.latitude),longitude:Number(x.longitude),name:x.name||q,country:x.country||"",admin1:x.admin1||""};
}

async function fetchWeatherForLocation(location){
  const place=await geocodeWeatherLocation(location);
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(place.latitude)}&longitude=${encodeURIComponent(place.longitude)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`;
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok) throw new Error("Não foi possível consultar a previsão do tempo.");
  const d=await r.json();
  const forecast=(d.daily?.time||[]).map((date,i)=>({date,code:d.daily.weather_code?.[i],max:d.daily.temperature_2m_max?.[i],min:d.daily.temperature_2m_min?.[i],rain:d.daily.precipitation_probability_max?.[i]}));
  const result={location:place.name+(place.admin1?`, ${place.admin1}`:""),latitude:place.latitude,longitude:place.longitude,current:d.current||{},forecast,fetchedAt:Date.now()};
  state.settings.weather={...state.settings.weather,tempC:Number(d.current?.temperature_2m),current:d.current||{},fetchedAt:Date.now(),available:true,source:"open-meteo",location:result.location,forecast};
  saveState();
  return result;
}

function getCurrentDeviceLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error("Este dispositivo/navegador não oferece geolocalização."));return;}
    navigator.geolocation.getCurrentPosition(
      pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy}),
      err=>reject(new Error(err.code===1?"Permita o acesso à localização para usar esta função.":"Não foi possível obter sua localização agora.")),
      {enableHighAccuracy:true,maximumAge:0,timeout:15000}
    );
  });
}

function formatDurationSeconds(value){
  const m=String(value||"").match(/([0-9]+(?:\\.[0-9]+)?)s/); const sec=m?Math.round(Number(m[1])):0;
  if(!sec) return "—";
  const h=Math.floor(sec/3600), min=Math.round((sec%3600)/60);
  return h?`${h}h ${min}min`:`${min} min`;
}

async function calculateRouteFromAddresses(origin,destination,travelMode="DRIVE",options={}){
  let originValue=origin;
  if(typeof originValue==="string" && ["current_location","current","gps","daqui","onde estou","minha localização"].includes(originValue.toLowerCase().trim())){
    originValue=await getCurrentDeviceLocation();
  }
  const normalizedOrigin=typeof originValue==="object" && Number.isFinite(Number(originValue.latitude)) ? {location:{latLng:{latitude:Number(originValue.latitude),longitude:Number(originValue.longitude)}}} : {address:String(originValue||"")};
  const normalizedDestination=typeof destination==="object" && Number.isFinite(Number(destination.latitude)) ? {location:{latLng:{latitude:Number(destination.latitude),longitude:Number(destination.longitude)}}} : {address:String(destination||"")};
  const payload={origin:normalizedOrigin,destination:normalizedDestination,travelMode};
  if(!payload.destination.address && !(payload.destination.latitude||payload.destination.location)) throw new Error("Informe o endereço de destino.");
  let data=await apiRequest("/api/routes",{method:"POST",timeoutMs:25000,body:JSON.stringify({...payload,departureTime:String(options.departureTime||"")})});
  let suggestedDepartureTime="";
  if(options.arrivalTime && ["DRIVE","TWO_WHEELER"].includes(String(travelMode).toUpperCase())){
    const firstSeconds=parseRouteDurationSeconds(data.duration);
    const tentative=subtractSecondsFromLocalDateTime(String(options.date||todayISO()),String(options.arrivalTime),firstSeconds);
    if(tentative){
      const refined=await apiRequest("/api/routes",{method:"POST",timeoutMs:25000,body:JSON.stringify({...payload,departureTime:tentative.toISOString()})});
      const refinedSeconds=parseRouteDurationSeconds(refined.duration);
      const finalDeparture=subtractSecondsFromLocalDateTime(String(options.date||todayISO()),String(options.arrivalTime),refinedSeconds);
      suggestedDepartureTime=finalDeparture?formatLocalTime(finalDeparture):formatLocalTime(tentative);
      data={...refined,suggestedDepartureTime,arrivalTime:String(options.arrivalTime),departureTime:finalDeparture?.toISOString()||tentative.toISOString()};
    }
  }
  state.settings.route={last:{...data,origin:payload.origin,destination:payload.destination,travelMode,fetchedAt:Date.now()}};
  saveState();
  return data;
}


function openPlaceForm(existing=null){
  openModal(existing?"Editar lugar":"Cadastrar lugar frequente",
    field("Nome do lugar","name","text",existing?.name||"","required")+
    field("Endereço","address","text",existing?.address||"","required")+
    field("Apelidos (opcional)","aliases","text",(existing?.aliases||[]).join(", "),'placeholder="Ex.: faculdade, campus"')+
    textareaField("Observações","notes",existing?.notes||""),{submit:existing?"Salvar":"Cadastrar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const item=existing||{id:uid("place")};item.name=String(f.get("name")||"").trim();item.address=String(f.get("address")||"").trim();item.aliases=String(f.get("aliases")||"").split(",").map(x=>x.trim()).filter(Boolean);item.notes=String(f.get("notes")||"").trim();if(!item.name||!item.address){toast("Informe nome e endereço.","error");return;}if(!existing)state.data.lugares.unshift(item);saveState();closeModal();render();toast(existing?"Lugar atualizado.":"Lugar cadastrado.");};
}
function frequentPlacesSection(){
  const places=state.data.lugares||[];
  return `<section class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">📍 Lugares frequentes</div><small>Cadastre locais como trabalho, faculdade, escola do filho ou consultório. A IA poderá usá-los em perguntas de rota.</small></div><button class="primary-button compact" type="button" data-action="add-lugar">+ Cadastrar lugar</button></div>${places.length?`<div class="item-list">${places.map(p=>`<div class="list-item"><div class="module-icon small">📍</div><div class="item-main"><strong>${esc(p.name)}</strong><span>${esc(p.address)}</span>${p.aliases?.length?`<small>${esc(p.aliases.join(" · "))}</small>`:""}</div><div class="item-actions"><button data-action="edit-lugar" data-id="${esc(p.id)}">${icon("edit")}</button><button data-action="delete-lugar" data-id="${esc(p.id)}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<p class="muted">Nenhum lugar cadastrado ainda.</p>`}</section>`;
}

function climaRotas(){
  const w=state.settings.weather||{}; const route=state.settings.route?.last; const forecast=w.forecast||[];
  return appShell(`${pageHeader("CLIMA E MOBILIDADE","Clima e Rotas","Consulte a previsão e calcule deslocamentos usando o local informado ou a localização do celular.")}
    <section class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">🌦️ Clima e previsão</div><small>Você pode informar uma cidade ou endereço. A consulta é feita na internet.</small></div></div>
      <form id="weather-form" class="form-grid"><label class="form-field"><span>Local</span><input name="location" placeholder="Ex.: Nova Iguaçu, RJ" value="${esc(w.location||"")}" required></label><button class="primary-button" type="submit">Consultar clima</button></form>
      ${w.available?`<div class="weather-result-card"><strong>${esc(w.location||"")}</strong><h2>🌡️ ${Math.round(Number(w.tempC||0))}°C</h2><p>${esc(weatherCodeLabel(w.current?.weather_code))}</p>${forecast.length?`<div class="weather-forecast-row">${forecast.slice(0,5).map(x=>`<div><strong>${dateBR(x.date)}</strong><span>${Math.round(Number(x.max||0))}° / ${Math.round(Number(x.min||0))}°</span><small>☔ ${Number(x.rain||0)}%</small></div>`).join("")}</div>`:""}</div>`:""}
    </section>
    <section class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">🧭 Calcular rota</div><small>Use o GPS para sair da sua localização atual ou informe um endereço de origem.</small></div><button class="ghost-button" type="button" data-action="route-use-gps">📍 Usar minha localização</button></div>
      <form id="route-form" class="form-grid"><label class="form-field"><span>Origem</span><input id="route-origin" name="origin" placeholder="Endereço de origem ou 'Minha localização'"></label><label class="form-field"><span>Destino</span><input name="destination" placeholder="Ex.: Casa da minha mãe, Nova Iguaçu" required></label>${selectField("Meio de transporte","travelMode",[{value:"DRIVE",label:"🚗 Carro"},{value:"WALK",label:"🚶 A pé"},{value:"BICYCLE",label:"🚲 Bicicleta"},{value:"TWO_WHEELER",label:"🏍️ Moto"},{value:"TRANSIT",label:"🚌 Transporte público"}],route?.travelMode||"DRIVE")}<button class="primary-button" type="submit">Calcular rota</button></form>
      ${route?`<div class="route-result-card"><strong>Resultado</strong><h3>⏱️ ${esc(formatDurationSeconds(route.duration))}</h3><p>📏 ${Math.round(Number(route.distanceMeters||0)/100)/10} km · ${esc(String(route.travelMode||"DRIVE"))}</p><small>O tempo estimado depende das condições de trânsito e do horário da consulta.</small></div>`:""}
    </section>
    ${frequentPlacesSection()}`);
}

function bindClimateRouteForms(){
  const wf=document.getElementById("weather-form");
  if(wf) wf.onsubmit=async e=>{e.preventDefault();const f=new FormData(wf);const location=String(f.get("location")||"").trim();if(!location)return;try{weatherLocationLoading=true;const r=await fetchWeatherForLocation(location);toast(`Clima consultado para ${r.location}.`);render();}catch(err){toast(err.message||"Não foi possível consultar o clima.","error");}finally{weatherLocationLoading=false;}};
  const rf=document.getElementById("route-form");
  if(rf) rf.onsubmit=async e=>{e.preventDefault();const f=new FormData(rf);try{routeLoading=true;const origin=String(f.get("origin")||"").trim()||"current_location";const destination=String(f.get("destination")||"").trim();const mode=String(f.get("travelMode")||"DRIVE");await calculateRouteFromAddresses(origin,destination,mode);toast("Rota calculada.");render();}catch(err){toast(err.message||"Não foi possível calcular a rota.","error");}finally{routeLoading=false;}};
}

/* =========================================================
   ASSISTENTE
   ========================================================= */

function assistente() {
  const pending=state.data.tarefas.filter(x=>!x.done); const today=state.data.compromissos.filter(x=>x.date===todayISO()); const water=state.data.hidratacao.filter(x=>x.date===todayISO()).reduce((s,x)=>s+Number(x.amount||0),0); const lang=false; const first=(state.user.name||"").split(" ")[0] || (lang?"there":"você");
  return appShell(`
    ${pageHeader("IA", lang?"LiDire Assistant":"Assistente LiDire", lang?"Your intelligent copilot for everything in your routine.":"Seu copiloto inteligente para tudo o que acontece na sua rotina.")}
    <section class="v5-assistant-hero"><button type="button" class="v5-ai-orb" data-action="assistant-focus" aria-label="Assistente LiDire">✦</button><h2>${lang?`Hello, ${esc(first)}`:`Olá, ${esc(first)}`}</h2><p>${lang?"How can I accelerate your day today?":"Como posso acelerar seu dia hoje?"}</p></section>
    <section class="v5-ai-analysis"><div class="v5-ai-icon">▣</div><div><strong>${lang?"I analyzed your priorities.":"Analisei suas prioridades."}</strong><p>${pending.length? (lang?`You have ${pending.length} pending task(s) and ${today.length} commitment(s) today.`:`Você tem ${pending.length} tarefa(s) pendente(s) e ${today.length} compromisso(s) hoje.`):(lang?"Your agenda is clear. I can help you plan the next step.":"Sua agenda está organizada. Posso ajudar a planejar o próximo passo.")}</p></div></section>
    ${pending[0]?`<section class="v5-ai-context-card"><span class="v5-priority">${lang?"HIGH PRIORITY":"ALTA PRIORIDADE"}</span><h3>✓ ${esc(pending[0].title||pending[0].name||"Tarefa")}</h3><p>${lang?"Pending task from your routine.":"Tarefa pendente da sua rotina."}</p><button class="primary-button compact" data-action="toggle-tarefa" data-id="${pending[0].id}">${lang?"Complete":"Concluir"}</button></section>`:""}
    <section class="v5-ai-context-grid"><div><span>💧</span><strong>${lang?"Hydration":"Hidratação"}</strong><small>${water} ml</small></div><div><span>👥</span><strong>${lang?"Family":"Família"}</strong><small>${state.data.familia.length} ${lang?"members":"membros"}</small></div><div><span>🎯</span><strong>${lang?"Goals":"Objetivos"}</strong><small>${state.data.objetivos.length}</small></div></section>
    <div class="v5-assistant-chat"><div id="assistant-response" class="assistant-response"><strong>✦ LiDire ${false?"AI":"IA"}</strong><p>${lang?"Ask me to organize, prioritize, summarize or connect your routines.":"Peça para eu organizar, priorizar, resumir ou conectar sua rotina."}</p></div></div>
    <div class="v5-assistant-suggestions"><button data-action="recipe-coming-soon">🍳 ${lang?"Create recipe":"Criar receita"}</button><button data-action="assistant-question" data-question="${lang?"What should I prioritize today?":"O que devo priorizar hoje?"}">${lang?"Priorities":"Prioridades"}</button><button data-action="assistant-question" data-question="${lang?"Organize my week":"Organize minha semana"}">${lang?"Organize my week":"Organize minha semana"}</button><button data-action="assistant-question" data-question="${lang?"What can I improve?":"O que posso melhorar?"}">${lang?"Improve":"Melhorar"}</button></div>
    <form id="assistant-question-form" class="v5-assistant-input"><button type="button" data-action="assistant-voice" id="assistant-voice-button">🎙</button><input id="assistant-question-input" type="text" placeholder="${lang?"Talk to LiDire…":"Fale com a LiDire…"}" autocomplete="off"><label class="ghost-button compact" title="Enviar foto ou arquivo">📎<input id="assistant-file-input" type="file" accept="image/*,.pdf,.txt,.doc,.docx,.csv" multiple hidden></label><button type="submit">➤</button></form>
    <label class="assistant-web-toggle"><input id="assistant-web-search" type="checkbox"> <span>🌐 Consultar a internet em tempo real</span><small>Usa a Pesquisa Google e mostra as fontes quando houver consulta.</small></label>
    <div id="assistant-voice-status" class="muted assistant-voice-status">${lang?"Tap the microphone to speak.":"Toque no microfone para falar."}</div>
  `);
}
let lastAssistantResponse = "";
let lastAssistantSources = [];
let lastAssistantLinks = [];
let voiceRecognition = null;

let assistantHistory = [];

function buildAIContext() {
  const limit = (arr, n) => Array.isArray(arr) ? arr.slice(0, n) : [];
  const today = todayISO();
  return {
    user: { name: state.user.name || "", age: state.user.age || "", sex: state.user.sex || "" , weight: state.user.weight || "" },
    hydrationProfile: state.settings.hydrationProfile,
    today,
    cycleAiContext: !!state.settings.cycleAiContext,
    agenda: limit(state.data.compromissos, 40),
    tarefas: limit(state.data.tarefas, 60),
    compras: limit(state.data.compras, 30),
    estudos: limit(state.data.estudos, 40),
    treinos: limit(state.data.treinos, 40),
    hidratacao: limit(state.data.hidratacao, 30),
    alimentacao: limit(state.data.alimentacao, 30),
    financas: limit(state.data.financas, 40),
    objetivos: limit(state.data.objetivos, 30),
    familia: limit(state.data.familia, 20),
    lembretes: limit(state.data.lembretes, 30),
    notificacoesFamilia: limit(state.data.notificacoesFamilia, 10),
    lugares: limit(state.data.lugares, 40),
    ciclo: state.settings.cycleAiContext ? state.data.cicloMenstrual : { periodos: [], sintomas: [] },
    alimentos: limit(state.data.alimentos, 80),
    dietas: limit(state.data.dietas, 30),
    receitas: limit(state.data.receitas, 30)
  };
}

/*
 * Normaliza respostas da IA para que Markdown cru nunca apareça na tela
 * nem seja pronunciado pelo leitor de voz. O Gemini pode retornar **negrito**,
 * *itálico*, headings e listas mesmo quando o aplicativo não usa um renderer
 * de Markdown. A LiDire trabalha com texto simples na conversa.
 */
function cleanAssistantText(value) {
  let text = String(value ?? "").replace(/\r\n?/g, "\n");
  // Remove blocos de código/```, sem apagar o conteúdo útil.
  text = text.replace(/```(?:[a-zA-Z0-9_-]+)?\s*/g, "").replace(/```/g, "");
  // Remove headings Markdown e separadores.
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, "");
  // Remove marcadores de ênfase que estavam sendo falados pela voz.
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/__(.*?)__/g, "$1");
  text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, "$1");
  text = text.replace(/(?<!\w)_(.*?)_(?!\w)/g, "$1");
  // Normaliza listas para uma leitura natural.
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  text = text.replace(/^\s*\d+[.)]\s+/gm, (m) => m.trim() + " ");
  // Evita excesso de linhas em respostas geradas.
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function showAssistantResponse(text, speak = false, sources = [], links = []) {
  const cleanText = cleanAssistantText(text);
  lastAssistantResponse = cleanText;
  lastAssistantSources = Array.isArray(sources) ? sources : [];
  lastAssistantLinks = Array.isArray(links) ? links : [];
  const box = document.getElementById("assistant-response");
  if (box) {
    const linkHtml = lastAssistantLinks.length
      ? `<div class="assistant-result-links">${lastAssistantLinks.map(x => `<button type="button" class="ghost-button compact" data-action="assistant-open-module" data-page="${esc(x.page)}">${esc(x.label)}</button>`).join("")}</div>`
      : "";
    const sourceHtml = lastAssistantSources.length
      ? `<div class="assistant-sources"><strong>🌐 Fontes consultadas</strong>${lastAssistantSources.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title || x.url)}</a>`).join("")}</div>`
      : "";
    box.innerHTML = `<strong>✦ LiDire ${false?"AI":"IA"}</strong><p>${esc(cleanText).replaceAll("\n", "<br>")}</p>${linkHtml}${sourceHtml}`;
  }
  if (speak && cleanText && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = false ? "en-US" : "pt-BR";
    utterance.rate = 1.08;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}


function normalizeFoodName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function calculateFoodCaloriesFromAction(action) {
  const total = Number(action.totalCalories || 0);
  const qty = Number(action.forQuantity || 0);
  const unit = String(action.quantityUnit || action.unit || "g").toLowerCase();
  if (Number(action.caloriesPer100) > 0) {
    return Math.round(Number(action.caloriesPer100));
  }
  if (!(total > 0 && qty > 0)) return 0;
  if (unit === "kg") return Math.round((total / (qty * 1000)) * 100);
  if (unit === "l") return Math.round((total / (qty * 1000)) * 100);
  if (unit === "g" || unit === "ml") return Math.round((total / qty) * 100);
  return Math.round(total / qty);
}


function normalizeAssistantTargetText(value) {
  return normalizeFoodName(String(value || ""));
}

function resolveAssistantItem(action) {
  const type=String(action?.type||"").toLowerCase();
  const targetId=String(action?.targetId||action?.id||"").trim();
  const title=normalizeAssistantTargetText(action?.title||action?.name||"");
  if (type.includes("task")) {
    let item=targetId ? state.data.tarefas.find(x=>x.id===targetId) : null;
    if(!item && title) item=state.data.tarefas.find(x=>normalizeAssistantTargetText(x.title||x.name)===title);
    return item ? {collection:"tarefas",item} : null;
  }
  if (type.includes("reminder")) {
    let item=targetId ? state.data.lembretes.find(x=>x.id===targetId) : null;
    if(!item && title) item=state.data.lembretes.find(x=>normalizeAssistantTargetText(x.title||x.name)===title);
    return item ? {collection:"lembretes",item} : null;
  }
  return null;
}

function resolveSavedDestination(value) {
  const raw=String(value||"").trim();
  if(!raw) return "";
  const key=normalizeAssistantTargetText(raw);
  const place=(state.data.lugares||[]).find(p=>normalizeAssistantTargetText(p.name)===key || (p.aliases||[]).some(a=>normalizeAssistantTargetText(a)===key));
  if(place?.address) return place.address;
  const family=(state.data.familia||[]).find(p=>normalizeAssistantTargetText(p.name)===key || normalizeAssistantTargetText(`casa da ${p.name||""}`)===key);
  if(family?.address) return family.address;
  return raw;
}

function parseRouteDurationSeconds(value){
  const m=String(value||"").match(/([0-9]+(?:\.[0-9]+)?)s/); return m?Math.round(Number(m[1])):0;
}
function localDateTimeToISO(date,time){
  const d=new Date(`${date||todayISO()}T${time||"17:00"}:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
function subtractSecondsFromLocalDateTime(date,time,seconds){
  const d=new Date(`${date||todayISO()}T${time||"17:00"}:00`);
  if(Number.isNaN(d.getTime())) return "";
  d.setSeconds(d.getSeconds()-Number(seconds||0));
  return d;
}
function formatLocalTime(d){return d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}

function openAssistantChangeConfirmation(actions,speak=false){
  const items=actions.map(a=>{
    const type=String(a.type||"");
    const resolved=resolveAssistantItem(a);
    const item=resolved?.item;
    if(type==="delete_task" || type==="delete_reminder") return `<div class="assistant-confirm-item"><strong>🗑 Excluir ${type.endsWith("task")?"tarefa":"lembrete"}</strong><span>${esc(item?.title||item?.name||a.title||a.name||"Item")}</span><small>Esta ação removerá o registro.</small></div>`;
    if(type==="complete_task" || type==="complete_reminder") return `<div class="assistant-confirm-item"><strong>✓ Marcar como concluído</strong><span>${esc(item?.title||item?.name||a.title||a.name||"Item")}</span><small>A LiDire atualizará o status deste registro.</small></div>`;
    if(type==="create_task") return `<div class="assistant-confirm-item"><strong>✓ Tarefa</strong><span>${esc(a.title||a.name||"Tarefa")}</span><small>${dateBR(a.date||todayISO())}${a.time?` · ${esc(a.time)}`:""} · prioridade ${esc(a.priority||"normal")}</small></div>`;
    return `<div class="assistant-confirm-item"><strong>🔔 Lembrete</strong><span>${esc(a.title||a.name||"Lembrete")}</span><small>${dateBR(a.date||todayISO())} às ${esc(a.time||"08:00")}${a.repeat&&a.repeat!=="once"?` · ${esc(a.repeat)}`:""}</small></div>`;
  }).join("");
  openModal("Confirmar ação da IA",`<p>A LiDire preparou a seguinte alteração:</p>${items}<p class="muted">Nada será alterado até você tocar em <strong>Confirmar</strong>.</p>`,{submit:"Confirmar"});
  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault(); const executed=[];
    for(const action of actions){
      const type=String(action.type||"");
      if(type==="create_task"){
        const title=String(action.title||action.name||"").trim(); if(!title) continue;
        state.data.tarefas.push({id:uid("t"),title,priority:String(action.priority||"normal").toLowerCase(),date:String(action.date||todayISO()),time:String(action.time||""),done:false});
        executed.push(`Tarefa “${title}” cadastrada.`);
      } else if(type==="create_reminder"){
        const title=String(action.title||action.name||"Lembrete").trim(); const date=String(action.date||todayISO()); const time=String(action.time||"08:00");
        state.settings.notifications.enabled=true; state.settings.notifications.sound=true;
        state.data.lembretes.unshift({id:uid("rem"),title,date,time,repeat:["once","daily","weekdays","weekly"].includes(String(action.repeat||"once"))?String(action.repeat||"once"):"once",endDate:"",mode:"beep",message:String(action.message||title),audioId:"",sourceType:"ai",sourceId:"",done:false,paused:false});
        executed.push(`Lembrete “${title}” cadastrado para ${dateBR(date)} às ${time}.`);
      } else if(["delete_task","delete_reminder","complete_task","complete_reminder"].includes(type)){
        const resolved=resolveAssistantItem(action);
        if(!resolved){ executed.push(`Não encontrei “${action.title||action.name||"esse item"}”.`); continue; }
        if(type.startsWith("delete_")){
          state.data[resolved.collection]=state.data[resolved.collection].filter(x=>x.id!==resolved.item.id);
          executed.push(`${resolved.collection==="tarefas"?"Tarefa":"Lembrete"} “${resolved.item.title||resolved.item.name}” excluído.`);
        } else {
          resolved.item.done=true;
          if(resolved.collection==="lembretes") resolved.item.paused=true;
          executed.push(`${resolved.collection==="tarefas"?"Tarefa":"Lembrete"} “${resolved.item.title||resolved.item.name}” marcado como concluído.`);
        }
      }
    }
    saveState(); closeModal(); render();
    const text=executed.join("\n"); assistantHistory.push({role:"model",text}); assistantHistory=assistantHistory.slice(-8); showAssistantResponse(text,speak);
    if("Notification" in window && Notification.permission!=="granted") requestNotificationPermission();
  };
}

function assistantModuleLinks(actions) {
  const map = new Map([
    ["create_appointment", ["Agenda", "compromissos"]],
    ["create_study", ["Ver em Estudos", "estudos"]],
    ["create_shopping_list", ["Ver em Compras", "compras"]],
    ["create_workout", ["Ver em Treinos", "treinos"]],
    ["log_hydration", ["Ver em Hidratação", "hidratacao"]],
    ["create_meal", ["Ver em Alimentação", "alimentacao"]],
    ["create_finance", ["Ver em Finanças", "financas"]],
    ["create_goal", ["Ver em Objetivos", "objetivos"]],
    ["upsert_food", ["Ver em Alimentação", "alimentacao"]],
    ["update_food", ["Ver em Alimentação", "alimentacao"]],
    ["create_recipe", ["Ver em Receitas", "receitas"]],
    ["add_family_member", ["Ver em Família", "familia"]],
    ["log_cycle_start", ["Ver ciclo menstrual", "cicloMenstrual"]],
    ["log_cycle_symptom", ["Ver ciclo menstrual", "cicloMenstrual"]],
    ["upsert_place", ["Ver lugares frequentes", "climaRotas"]]
  ]);
  const out = [];
  for (const action of Array.isArray(actions) ? actions : []) {
    const x = map.get(String(action?.type || "").toLowerCase());
    if (x && !out.some(y => y.page === x[1])) out.push({ label: x[0], page: x[1] });
  }
  return out;
}

async function executeAssistantActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return [];
  const done = [];
  let changed = false;

  for (const raw of actions.slice(0, 5)) {
    const action = raw && typeof raw === "object" ? raw : {};
    const type = String(action.type || "").toLowerCase().trim();

    if (["create_task","create_reminder","delete_task","delete_reminder","complete_task","complete_reminder"].includes(type)) {
      // A LiDire 1.4 nunca grava uma tarefa/lembrete vindo da IA sem
      // confirmação explícita. answerAssistant abre o modal de confirmação.
      continue;
    }

    if (type === "create_appointment") {
      const title = String(action.title || action.name || "").trim();
      if (!title) continue;
      const item = {
        id: uid("c"),
        title,
        date: String(action.date || todayISO()),
        time: String(action.time || ""),
        location: String(action.location || ""),
        address: String(action.address || "")
      };
      state.data.compromissos.unshift(item);
      done.push(`Compromisso “${title}” registrado na Agenda.`);
      changed = true;
      continue;
    }

    if (type === "create_study") {
      const subject = String(action.subject || action.name || action.title || "").trim();
      if (!subject) continue;
      const item = {
        id: uid("e"),
        subject,
        topic: String(action.topic || ""),
        date: String(action.date || todayISO()),
        time: String(action.time || ""),
        duration: Number(action.duration || 0) || 0,
        effectiveDuration: "",
        notes: String(action.notes || ""),
        link: String(action.link || ""),
        done: false
      };
      state.data.estudos.unshift(item);
      done.push(`Estudo “${subject}” registrado em Estudos.`);
      changed = true;
      continue;
    }

    if (type === "create_shopping_list") {
      const name = String(action.name || action.title || "Lista de compras").trim();
      const rawItems = Array.isArray(action.items) ? action.items : [];
      const items = rawItems.map(item => {
        if (typeof item === "string") return { id: uid("item"), name: item.trim(), quantity: "", category: "Geral", done: false };
        return {
          id: uid("item"),
          name: String(item?.name || "").trim(),
          quantity: String(item?.quantity || ""),
          category: String(item?.category || "Geral"),
          done: false
        };
      }).filter(item => item.name);
      const list = { id: uid("lista"), name, items };
      state.data.compras.unshift(list);
      done.push(`Lista “${name}” registrada em Compras${items.length ? ` com ${items.length} item(ns)` : ""}.`);
      changed = true;
      continue;
    }

    if (type === "create_workout") {
      const name = String(action.name || action.title || "").trim();
      if (!name) continue;
      state.data.treinos.unshift({
        id: uid("tr"),
        name,
        type: String(action.workoutType || ""),
        duration: String(action.duration || ""),
        distance: String(action.distance || ""),
        pace: String(action.pace || ""),
        observations: String(action.observations || action.notes || ""),
        date: String(action.date || todayISO()),
        time: String(action.time || ""),
        completed: false,
        completedAt: "",
        exercises: []
      });
      done.push(`Treino “${name}” registrado em Treinos.`);
      changed = true;
      continue;
    }

    if (type === "log_hydration") {
      const amount = Number(action.amount || 0);
      if (!(amount > 0)) continue;
      state.data.hidratacao.unshift({
        id: uid("h"),
        amount,
        date: String(action.date || todayISO()),
        createdAt: new Date().toISOString()
      });
      done.push(`${amount} ml de água registrados em Hidratação.`);
      changed = true;
      continue;
    }

    if (type === "create_meal") {
      const name = String(action.name || action.title || "Refeição").trim();
      const foods = Array.isArray(action.foods) ? action.foods.map(food => ({
        name: String(food?.name || "").trim(),
        quantity: String(food?.quantity || ""),
        unit: String(food?.unit || "g"),
        calories: Number(food?.calories || 0) || 0,
        calorieMode: "manual"
      })).filter(food => food.name) : [];
      state.data.alimentacao.unshift({
        id: uid("meal"),
        name,
        time: String(action.time || ""),
        date: String(action.date || todayISO()),
        foods
      });
      done.push(`Refeição “${name}” registrada em Alimentação.`);
      changed = true;
      continue;
    }

    if (type === "create_finance") {
      const title = String(action.title || action.name || "").trim();
      const value = Number(action.value || 0);
      if (!title || !Number.isFinite(value)) continue;
      state.data.financas.unshift({
        id: uid("f"),
        type: String(action.financeType || "despesa"),
        title,
        value,
        category: String(action.category || "Geral"),
        currency: String(action.currency || "BRL"),
        date: String(action.date || todayISO()),
        createdAt: new Date().toISOString()
      });
      done.push(`Lançamento “${title}” registrado em Finanças.`);
      changed = true;
      continue;
    }

    if (type === "create_goal") {
      const title = String(action.title || action.name || "").trim();
      if (!title) continue;
      const goal = {
        id: uid("o"),
        title,
        deadline: String(action.deadline || ""),
        progress: Number(action.progress || 0) || 0,
        moneyGoal: Number(action.moneyGoal || 0) || 0,
        moneyCurrency: String(action.moneyCurrency || "BRL"),
        financeCategory: String(action.financeCategory || ""),
        observations: String(action.observations || action.notes || ""),
        metas: []
      };
      updateGoalProgress(goal);
      state.data.objetivos.unshift(goal);
      done.push(`Objetivo “${title}” criado em Objetivos.`);
      changed = true;
      continue;
    }

    if (type === "upsert_food" || type === "update_food") {
      const name = String(action.name || action.title || "").trim();
      if (!name) continue;
      if (!Array.isArray(state.data.alimentos)) state.data.alimentos = [];
      const key = normalizeFoodName(name);
      let food = state.data.alimentos.find(item => normalizeFoodName(item.name) === key);
      const calories = calculateFoodCaloriesFromAction(action);
      const unit = String(action.quantityUnit || action.unit || food?.unit || "g").toLowerCase();
      if (!food) {
        food = { id: uid("food"), name, unit: ["g","kg","ml","L","unidade","porção"].includes(unit) ? unit : "g", calories: calories || 0 };
        state.data.alimentos.push(food);
        done.push(calories ? `Alimento “${name}” cadastrado com ${calories} kcal por 100 ${food.unit === "ml" ? "ml" : food.unit === "g" ? "g" : food.unit}.` : `Alimento “${name}” cadastrado.`);
      } else {
        food.name = name;
        if (["g","kg","ml","L","unidade","porção"].includes(unit)) food.unit = unit;
        if (calories > 0) food.calories = calories;
        done.push(calories ? `Calorias de “${name}” atualizadas para ${calories} kcal por 100 ${food.unit === "ml" ? "ml" : food.unit === "g" ? "g" : food.unit}.` : `Alimento “${name}” atualizado.`);
      }
      changed = true;
      continue;
    }

    if (type === "log_cycle_start") {
      if (!state.settings.cycleAiContext && !String(action.date||action.start||"").trim()) continue;
      const start=String(action.date||action.start||todayISO());
      const end=String(action.end||"");
      const record={id:uid("cycle"),start,end,flow:String(action.flow||"Moderado"),duration:start&&end?Math.max(1,daysBetween(start,end)+1):"",notes:String(action.notes||""),createdAt:new Date().toISOString(),source:"assistant"};
      if(!state.data.cicloMenstrual) state.data.cicloMenstrual={periodos:[],sintomas:[]};
      state.data.cicloMenstrual.periodos=[record,...(state.data.cicloMenstrual.periodos||[])];
      done.push(`Registro menstrual de ${dateBR(start)} salvo.`); changed=true; continue;
    }

    if (type === "log_cycle_symptom") {
      const info=cycleInfo();
      const record={id:uid("symptom"),date:String(action.date||todayISO()),phase:info.phase,mood:String(action.mood||"Neutro"),pain:String(action.pain||"Baixa"),cramps:String(action.cramps||"Baixa"),acne:String(action.acne||"Baixa"),physicalEnergy:String(action.physicalEnergy||"Moderada"),mentalEnergy:String(action.mentalEnergy||"Moderada"),notes:String(action.notes||""),createdAt:new Date().toISOString(),source:"assistant"};
      if(!state.data.cicloMenstrual) state.data.cicloMenstrual={periodos:[],sintomas:[]};
      state.data.cicloMenstrual.sintomas=[record,...(state.data.cicloMenstrual.sintomas||[])];
      done.push("Registro de humor, dor e sintomas salvo no ciclo."); changed=true; continue;
    }

    if (type === "add_family_member") {
      const name = String(action.name || action.title || "").trim();
      const email = String(action.email || "").trim();
      if (!name || !email) continue;
      const permissions = Array.isArray(action.permissions)
        ? Object.fromEntries(action.permissions.map(k => [k, true]))
        : (action.permissions && typeof action.permissions === "object" ? action.permissions : {});
      const person = {
        id: uid("family"),
        name,
        relation: String(action.relation || "Membro"),
        email,
        address: String(action.address || ""),
        permissions: {agenda:true,tarefas:true,compras:true,estudos:false,treinos:false,hidratacao:false,alimentacao:false,financas:false,objetivos:true,cicloMenstrual:false,lembretes:true,...permissions},
        inviteStatus: "local"
      };
      try {
        const check = await apiRequest(`/api/family/check-email?email=${encodeURIComponent(email)}`, { method: "GET" });
        if (check?.alreadyFamilyMember) {
          done.push(`O e-mail ${email} já está cadastrado na sua família como ${check.familyMember?.name || "membro"}. Nenhum duplicado foi criado.`);
          continue;
        }
        const saved = await apiRequest("/api/family/members", { method: "POST", body: JSON.stringify(person) });
        if (!saved?.member?.id) throw new Error("O servidor não confirmou o cadastro do familiar.");
        person.serverId = saved.member.id;
        person.inviteStatus = saved.member.status || (check?.accountExists ? "active" : "pending");
        state.data.familia.unshift(person);
        done.push(check?.accountExists
          ? `Membro ${name} cadastrado e vinculado à conta LiDire de ${email}.`
          : `Membro ${name} cadastrado. O e-mail ${email} ainda não possui uma conta LiDire.`);
        changed = true;
      } catch (e) {
        done.push(e?.message || `Não foi possível cadastrar ${name}.`);
      }
      continue;
    }

    if (type === "send_family_notification") {
      try{
        const data=await apiRequest("/api/family/notifications",{method:"POST",body:JSON.stringify({memberId:String(action.memberId||""),recipientEmail:String(action.recipientEmail||action.email||""),title:String(action.title||"LiDire — Família"),message:String(action.message||"")})});
        done.push(data?.notification?"Notificação enviada para o familiar.":"Notificação processada.");
      }catch(e){done.push(e?.message||"Não foi possível enviar a notificação.");}
      continue;
    }


    if (type === "upsert_place") {
      const name=String(action.name||action.title||"").trim(); const address=String(action.address||"").trim();
      if(!name||!address) continue;
      if(!Array.isArray(state.data.lugares)) state.data.lugares=[];
      const key=normalizeAssistantTargetText(name);
      let place=state.data.lugares.find(x=>normalizeAssistantTargetText(x.name)===key);
      if(!place){ place={id:uid("place"),name,address,aliases:Array.isArray(action.aliases)?action.aliases:[],notes:String(action.notes||"")}; state.data.lugares.unshift(place); done.push(`Lugar “${name}” cadastrado.`); }
      else { place.address=address; place.aliases=Array.isArray(action.aliases)?action.aliases:place.aliases||[]; place.notes=String(action.notes||place.notes||""); done.push(`Endereço de “${name}” atualizado.`); }
      changed=true; continue;
    }

    if (type === "weather_lookup") {
      try{const result=await fetchWeatherForLocation(String(action.location||""));const temp=Number(result.current?.temperature_2m);const label=weatherCodeLabel(result.current?.weather_code);done.push(`Em ${result.location}, agora faz ${Math.round(temp)}°C e está ${label.toLowerCase()}.`);}catch(e){done.push(e?.message||"Não foi possível consultar o clima.");}
      continue;
    }

    if (type === "route_lookup") {
      try{
        const origin=String(action.origin||"current_location");
        const destination=resolveSavedDestination(String(action.destination||""));
        const date=String(action.date||todayISO());
        const arrivalTime=String(action.arrivalTime||"");
        const result=await calculateRouteFromAddresses(origin,destination,String(action.travelMode||"DRIVE"),{date,arrivalTime});
        const base=`A rota está estimada em ${Math.round(Number(result.distanceMeters||0)/100)/10} km e ${formatDurationSeconds(result.duration)}.`;
        done.push(arrivalTime && result.suggestedDepartureTime ? `${base} Para chegar por volta das ${arrivalTime}, a saída estimada é ${result.suggestedDepartureTime}. A estimativa considera o trânsito disponível no momento da consulta.` : base);
      }catch(e){done.push(e?.message||"Não foi possível calcular a rota.");}
      continue;
    }

    if (type === "create_recipe") {
      const name = String(action.name || action.title || "Receita").trim();
      const ingredients = Array.isArray(action.ingredients) ? action.ingredients.map(x => String(x || "").trim()).filter(Boolean) : [];
      const instructions = String(action.instructions || "").trim();
      if (!name || !ingredients.length || !instructions) continue;
      if (!Array.isArray(state.data.receitas)) state.data.receitas = [];
      const existing = state.data.receitas.find(r => normalizeFoodName(r.name) === normalizeFoodName(name));
      const recipe = {
        id: existing?.id || uid("recipe"),
        name,
        ingredients,
        instructions,
        servings: Number(action.servings || 0) || 0,
        calories: Number(action.calories || 0) || 0,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (existing) Object.assign(existing, recipe); else state.data.receitas.unshift(recipe);
      done.push(`Receita “${name}” salva na biblioteca.`);
      changed = true;
    }
  }

  if (changed) {
    saveState();
    render();
  }
  return done;
}

function openAssistantActionConfirmation(actions, speak=false){
  const items=actions.map((a,i)=>{
    const type=String(a.type||"");
    if(type==="create_task") return `<div class="assistant-confirm-item"><strong>✓ Tarefa</strong><span>${esc(a.title||a.name||"Tarefa")}</span><small>${dateBR(a.date||todayISO())}${a.time?` · ${esc(a.time)}`:""} · prioridade ${esc(a.priority||"normal")}</small></div>`;
    return `<div class="assistant-confirm-item"><strong>🔔 Lembrete</strong><span>${esc(a.title||a.name||"Lembrete")}</span><small>${dateBR(a.date||todayISO())} às ${esc(a.time||"08:00")}${a.repeat&&a.repeat!=="once"?` · ${esc(a.repeat)}`:""}</small></div>`;
  }).join("");
  openModal("Confirmar cadastro",`<p>Você pediu para a LiDire preparar o seguinte cadastro:</p>${items}<p class="muted">Nada será salvo até você tocar em <strong>Confirmar</strong>.</p>`,{submit:"Confirmar"});
  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault();
    const executed=[];
    for(const action of actions){
      const type=String(action.type||"");
      if(type==="create_task"){
        const title=String(action.title||action.name||"").trim(); if(!title) continue;
        state.data.tarefas.push({id:uid("t"),title,priority:String(action.priority||"normal").toLowerCase(),date:String(action.date||todayISO()),time:String(action.time||""),done:false});
        executed.push(`Tarefa “${title}” cadastrada.`);
      } else if(type==="create_reminder"){
        const title=String(action.title||action.name||"Lembrete").trim(); const date=String(action.date||todayISO()); const time=String(action.time||"08:00");
        state.settings.notifications.enabled=true; state.settings.notifications.sound=true;
        state.data.lembretes.unshift({id:uid("rem"),title,date,time,repeat:["once","daily","weekdays","weekly"].includes(String(action.repeat||"once"))?String(action.repeat||"once"):"once",endDate:"",mode:"beep",message:String(action.message||title),audioId:"",sourceType:"ai",sourceId:"",done:false,paused:false});
        executed.push(`Lembrete “${title}” cadastrado para ${dateBR(date)} às ${time}.`);
      }
    }
    saveState(); closeModal(); render();
    const text=executed.join("\\n");
    assistantHistory.push({role:"model",text}); assistantHistory=assistantHistory.slice(-8);
    showAssistantResponse(text,speak);
    if("Notification" in window && Notification.permission!=="granted") requestNotificationPermission();
  };
}

async function answerAssistant(question, speak = false) {
  const q = String(question || "").trim();
  const fileInput=document.getElementById("assistant-file-input");
  const attachments=Array.isArray(window.__lidireAIUploads)?window.__lidireAIUploads:[];
  if (!q && !attachments.length) return;
  const box = document.getElementById("assistant-response");
  const input = document.getElementById("assistant-question-input");
  if (input) input.value = q;
  if (box) box.innerHTML = `<strong>✦ LiDire ${false?"AI":"IA"}</strong><p class="assistant-thinking">Pensando com base na sua rotina…</p>`;

  try {
    const data = await apiRequest("/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({
        question: q,
        language: false ? "en-US" : "pt-BR",
        useWeb: !!document.getElementById("assistant-web-search")?.checked,
        context: buildAIContext(),
        history: assistantHistory,
        attachments
      })
    });
    const response = String(data.text || "").trim();
    const allActions = Array.isArray(data.actions) ? data.actions : [];
    const webSources = Array.isArray(data.sources) ? data.sources : [];
    const confirmTypes=["create_task","create_reminder","delete_task","delete_reminder","complete_task","complete_reminder"];
    const confirmable = allActions.filter(a => confirmTypes.includes(String(a?.type||"").toLowerCase()));
    const immediate = allActions.filter(a => !confirmTypes.includes(String(a?.type||"").toLowerCase()));
    for(const a of confirmable){
      if(["delete_task","delete_reminder","complete_task","complete_reminder"].includes(String(a?.type||"").toLowerCase())){
        const resolved=resolveAssistantItem(a);
        if(resolved && !a.targetId) a.targetId=resolved.item.id;
      }
    }
    const executed = await executeAssistantActions(immediate);
    const resultLinks = assistantModuleLinks(immediate);
    let finalResponse = response;
    if (executed.length) {
      const executionSummary = executed.join("\n");
      if (!finalResponse) finalResponse = executionSummary;
      else if (!executed.every(item => finalResponse.includes(item))) finalResponse += `\n\n${executionSummary}`;
    }
    assistantHistory.push({ role: "user", text: q });
    if (confirmable.length) {
      finalResponse += (finalResponse?"\n\n":"") + "Preparei a tarefa/lembrete, mas preciso da sua confirmação antes de cadastrar.";
      showAssistantResponse(finalResponse, false, webSources, resultLinks);
      openAssistantActionConfirmation(confirmable, speak);
      return;
    }
    assistantHistory.push({ role: "model", text: finalResponse });
    assistantHistory = assistantHistory.slice(-8);
    showAssistantResponse(finalResponse, speak, webSources, resultLinks);
  } catch (error) {
    console.error("LiDire AI:", error);
    const message = error?.data?.message || "Não consegui conectar à IA agora. Verifique a configuração do Gemini no Worker.";
    showAssistantResponse(message, false);
  }
}

function startAssistantVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    toast("Seu navegador não oferece reconhecimento de voz. Tente usar o Chrome no celular.", "error");
    return;
  }
  if (voiceRecognition) {
    voiceRecognition.stop();
    voiceRecognition = null;
    return;
  }
  voiceRecognition = new Recognition();
  voiceRecognition.lang = "pt-BR";
  voiceRecognition.interimResults = false;
  voiceRecognition.continuous = false;
  const status = document.getElementById("assistant-voice-status");
  const button = document.getElementById("assistant-voice-button");
  if (status) status.textContent = "Ouvindo… fale agora.";
  if (button) button.textContent = "⏹️ Parar de ouvir";
  voiceRecognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    const input = document.getElementById("assistant-question-input");
    if (input) input.value = transcript;
    answerAssistant(transcript, true);
    if (status) status.textContent = `Você disse: “${transcript}”`;
  };
  voiceRecognition.onerror = () => {
    if (status) status.textContent = "Não consegui ouvir. Verifique a permissão do microfone e tente novamente.";
  };
  voiceRecognition.onend = () => {
    voiceRecognition = null;
    if (button) button.textContent = "🎙️ Falar com a LiDire";
  };
  voiceRecognition.start();
}

/* =========================================================
   EXPLORAR
   ========================================================= */

function explorar() {
  return appShell(`

    ${pageHeader(
      "LIDIRE",
      "Tudo em um só lugar",
      "Conheça os espaços que ajudam a transformar rotina em clareza."
    )}

    <div class="explore-grid">

      ${modules.map(moduleCard).join("")}

      <button
        class="module-card featured"
        data-page="assistente"
      >

        <span class="module-icon">
          ✦
        </span>

        <span class="module-content">

          <strong>
            Assistente LiDire
          </strong>

          <small>
            Seu copiloto para organizar a rotina.
          </small>

        </span>

        <span class="module-arrow">
          ${icon("arrow")}
        </span>

      </button>

    </div>

  `);
}

/* =========================================================
   CICLO MENSTRUAL
   ========================================================= */

function daysBetween(a, b) {
  if (!a || !b) return null;
  const start = new Date(a + "T12:00:00");
  const end = new Date(b + "T12:00:00");
  return Math.round((end - start) / 86400000);
}

function cycleInfo(date = todayISO()) {
  const periods = [...(state.data.cicloMenstrual?.periodos || [])].filter(x => x.start).sort((a,b) => String(b.start).localeCompare(String(a.start)));
  const last = periods[0];
  if (!last) return { hasData:false, day:null, phase:"Sem registro", next:null, start:null };
  const length = Math.max(21, Math.min(45, Number(state.settings.cycleLength) || 28));
  const diff = daysBetween(last.start, date);
  if (diff == null) return { hasData:false, day:null, phase:"Sem registro", next:null, start:last.start };
  const day = ((diff % length) + length) % length + 1;
  const ovulationDay = Math.max(10, length - 14);
  let phase = "Fase folicular";
  if (day <= Math.max(1, Number(state.settings.periodLength) || 5)) phase = "Menstrual";
  else if (day >= ovulationDay - 4 && day <= ovulationDay + 1) phase = "Ovulatória / fértil";
  else if (day > ovulationDay + 1) phase = "Fase lútea";
  const nextDate = new Date(last.start + "T12:00:00");
  nextDate.setDate(nextDate.getDate() + length);
  return { hasData:true, day, phase, next:nextDate.toISOString().slice(0,10), start:last.start, length };
}

function cycleTrendSummary() {
  const logs = state.data.cicloMenstrual?.sintomas || [];
  const current = cycleInfo();
  if (!current.hasData || !logs.length) return "Registre alguns dias para a LiDire começar a identificar seus próprios padrões.";
  const samePhase = logs.filter(x => x.phase === current.phase);
  if (!samePhase.length) return "Ainda não há registros suficientes nesta fase para identificar um padrão pessoal.";
  const avg = key => samePhase.reduce((sum,x)=>sum + ({Baixa:1,Moderada:2,Intensa:3}[x[key]] || 0),0) / samePhase.filter(x=>x[key]).length;
  const energy = avg("physicalEnergy");
  if (energy) {
    const label = energy < 1.5 ? "baixa" : energy < 2.5 ? "moderada" : "intensa";
    return `Nos seus registros anteriores nesta fase, a energia física apareceu predominantemente ${label}. Isso é um padrão dos seus registros, não uma regra geral.`;
  }
  return "Há registros nesta fase, mas ainda não existe um padrão claro de energia.";
}

function cicloMenstrual() {
  const info=cycleInfo(); const logs=(state.data.cicloMenstrual?.sintomas||[]).filter(x=>x.date===todayISO()); const recent=(state.data.cicloMenstrual?.periodos||[]).slice().sort((a,b)=>String(b.start).localeCompare(String(a.start))).slice(0,4); const lang=false;
  const phase=info.phase || (lang?"No record":"Sem registro"); const day=info.day||"—"; const next=info.next?dateBR(info.next):"—";
  return appShell(`
    ${pageHeader("WELL-BEING", lang?"Cycle":"Ciclo Menstrual", lang?"Track your cycle and how you feel.":"Acompanhe seu ciclo e registre como você se sente.", `<button class="primary-button compact" data-action="add-periodo-ciclo">${icon("plus")} ${lang?"Record cycle":"Registrar ciclo"}</button>`)}
    <section class="v5-cycle-hero"><h2>${lang?"Current Cycle":"Ciclo Atual"}</h2><div class="v5-cycle-ring"><small>${lang?"DAY":"DIA"} ${day}</small><strong>${esc(phase)}</strong><span>${info.hasData?(lang?"Personalized from your records":"Baseado nos seus registros"):(lang?"Add a period to begin":"Registre uma menstruação para começar")}</span></div><div class="v5-cycle-stats"><div><small>${lang?"Next period":"Próxima menstruação"}</small><b>${next}</b></div><div><small>${lang?"Cycle length":"Duração do ciclo"}</small><b>${info.length||state.settings.cycleLength||28} ${lang?"days":"dias"}</b></div></div></section>
    <section class="v5-cycle-insight"><div>✦</div><div><strong>LiDire ${lang?"AI":"IA"}</strong><p>${esc(info.hasData ? (lang?`Your current phase is ${phase.toLowerCase()}. Use your own history to understand patterns and plan your routine.`:`Sua fase atual é ${phase.toLowerCase()}. Use seu próprio histórico para entender padrões e planejar sua rotina.`) : (lang?"Add a few records and LiDire can help you identify your personal patterns.":"Adicione alguns registros e a LiDire poderá ajudar você a identificar seus próprios padrões."))}</p><div class="v5-insight-chips"><span>🏋️ ${lang?"Workout":"Treino"}</span><span>📚 ${lang?"Study focus":"Foco nos estudos"}</span></div></div></section>
    <section class="v5-feeling-card"><h3>${lang?"How are you feeling today?":"Como você se sente hoje?"}</h3><div class="v5-mood-row"><button type="button" data-action="add-sintoma-ciclo" data-mood="Bom">☺<small>${lang?"Good":"Bem"}</small></button><button type="button" data-action="add-sintoma-ciclo" data-mood="Dor">☹<small>${lang?"Pain":"Dor"}</small></button><button type="button" data-action="add-sintoma-ciclo" data-mood="Energia">ϟ<small>${lang?"Energy":"Energia"}</small></button><button type="button" data-action="add-sintoma-ciclo" data-mood="Fluxo">◌<small>${lang?"Flow":"Fluxo"}</small></button></div><div class="cycle-action-row"><button class="primary-button" data-action="add-sintoma-ciclo">${lang?"Record symptoms":"Registrar sintomas"}</button><button class="ghost-button" data-action="config-ciclo">⚙ ${lang?"Configure":"Configurar"}</button></div></section>
    <div class="v5-section-row"><h2>${lang?"History & predictions":"Histórico e previsões"}</h2><button class="text-button" data-action="cycle-view-history">${lang?"View all":"Ver todos"} →</button></div>
    ${recent.length?recent.map(x=>`<section class="v5-history-card"><span>◫</span><div><strong>${lang?"Past cycle":"Ciclo passado"}</strong><p>${dateBR(x.start)}${x.end?` → ${dateBR(x.end)}`:""} · ${esc(x.flow|| (lang?"Flow not informed":"Fluxo não informado"))}</p></div></section>`).join(""):`<section class="v5-history-card"><span>◫</span><div><strong>${lang?"No cycle history":"Sem histórico de ciclos"}</strong><p>${lang?"Your records will appear here.":"Seus registros aparecerão aqui."}</p></div></section>`}
    <section class="v5-history-card"><span>✦</span><div><strong>${lang?"Personal pattern":"Padrão pessoal"}</strong><p>${esc(cycleTrendSummary())}</p></div></section>
    <section class="v5-privacy-card"><strong>🔐 ${lang?"Privacy & AI":"Privacidade e IA"}</strong><p>${lang?"Cycle data is private by default and is only shared with AI when you allow it.":"Os dados do ciclo são privados por padrão e só são compartilhados com a IA quando você permite."}</p><label class="switch"><input type="checkbox" data-action="toggle-cycle-ai" ${state.settings.cycleAiContext?"checked":""}><span></span></label></section>
  `);
}
function configCicloMenstrual() {
  const last = state.data.cicloMenstrual?.periodos?.[0] || {}; const l=false;
  openModal(l?"Configure cycle":"Configurar ciclo",
    field(l?"Start of last period":"Início da última menstruação", "start", "date", last.start || "") +
    field(l?"End of last period":"Fim da última menstruação", "end", "date", last.end || "") +
    field(l?"Average cycle length (days)":"Duração média do ciclo (dias)", "cycleLength", "number", state.settings.cycleLength, 'min="21" max="45" required') +
    field(l?"Average period length (days)":"Duração média da menstruação (dias)", "periodLength", "number", state.settings.periodLength, 'min="1" max="10" required') +
    selectField(l?"Flow intensity":"Intensidade do fluxo", "flow", l?["Light","Moderate","Heavy"]:["Leve","Moderado","Intenso"], last.flow || (l?"Moderate":"Moderado")) +
    textareaField(l?"Notes":"Observações", "notes", last.notes || ""),
    { submit:l?"Save":"Salvar configuração" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    state.settings.cycleLength = Number(f.get("cycleLength")) || 28;
    state.settings.periodLength = Number(f.get("periodLength")) || 5;
    if (f.get("start")) {
      const record = { id: last.id || uid("cycle"), start:f.get("start"), end:f.get("end") || "", flow:f.get("flow"), notes:f.get("notes") || "" };
      const index = state.data.cicloMenstrual.periodos.findIndex(x=>x.id===record.id);
      if(index>=0) state.data.cicloMenstrual.periodos[index]=record; else state.data.cicloMenstrual.periodos.push(record);
    }
    saveState(); closeModal(); render(); toast("Configuração do ciclo atualizada.");
  };
}

function addPeriodoCiclo() {
  openModal("Registrar ciclo",
    field("Início da menstruação", "start", "date", todayISO(), "required") +
    field("Fim da menstruação", "end", "date", "") +
    selectField("Intensidade do fluxo", "flow", ["Leve","Moderado","Intenso"], "Moderado") +
    textareaField("Observações", "notes", ""),
    { submit:"Registrar ciclo" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    if (!start) { toast("Informe o início da menstruação.", "error"); return; }
    if (end && end < start) { toast("A data de fim não pode ser anterior ao início.", "error"); return; }
    const duration = start && end ? Math.max(1, daysBetween(start, end) + 1) : "";
    const record = {id:uid("cycle"),start,end,flow:String(f.get("flow") || "Moderado"),duration,notes:String(f.get("notes") || ""),createdAt:new Date().toISOString()};
    state.data.cicloMenstrual.periodos = [record, ...(state.data.cicloMenstrual.periodos || [])];
    saveState(); apiRequest("/api/cycle",{method:"POST",body:JSON.stringify({id:record.id,type:"period",date:start,payload:record})}).catch(()=>{}); closeModal(); render(); toast("Ciclo registrado com sucesso.");
  };
}

function addSintomaCiclo() {
  const l=false;
  openModal(l?"Record how you feel today":"Registrar como você está hoje",
    selectField("Humor", "mood", ["Muito baixo","Baixo","Neutro","Bom","Muito bom"], "Neutro") +
    selectField("Dor", "pain", ["Baixa","Moderada","Intensa"], "Baixa") +
    selectField("Cólicas", "cramps", ["Baixa","Moderada","Intensa"], "Baixa") +
    selectField("Acne", "acne", ["Baixa","Moderada","Intensa"], "Baixa") +
    selectField("Dor de cabeça", "headache", ["Nenhuma","Baixa","Moderada","Intensa"], "Nenhuma") +
    selectField("Inchaço", "bloating", ["Nenhum","Baixo","Moderado","Intenso"], "Nenhum") +
    selectField("Sensibilidade nas mamas", "breastTenderness", ["Nenhuma","Baixa","Moderada","Intensa"], "Nenhuma") +
    selectField("Náusea", "nausea", ["Nenhuma","Baixa","Moderada","Intensa"], "Nenhuma") +
    selectField("Energia física", "physicalEnergy", ["Baixa","Moderada","Intensa"], "Moderada") +
    selectField("Energia mental", "mentalEnergy", ["Baixa","Moderada","Intensa"], "Moderada") +
    textareaField("Observações", "notes", ""),
    { submit:"Registrar" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const info = cycleInfo();
    const record = {id:uid("symptom"),date:todayISO(),phase:info.phase,mood:String(f.get("mood") || "Neutro"),pain:String(f.get("pain") || "Baixa"),cramps:String(f.get("cramps") || "Baixa"),acne:String(f.get("acne") || "Baixa"),headache:String(f.get("headache") || "Nenhuma"),bloating:String(f.get("bloating") || "Nenhum"),breastTenderness:String(f.get("breastTenderness") || "Nenhuma"),nausea:String(f.get("nausea") || "Nenhuma"),physicalEnergy:String(f.get("physicalEnergy") || "Moderada"),mentalEnergy:String(f.get("mentalEnergy") || "Moderada"),notes:String(f.get("notes") || ""),createdAt:new Date().toISOString()};
    state.data.cicloMenstrual.sintomas = [record, ...(state.data.cicloMenstrual.sintomas || [])];
    saveState(); closeModal(); render(); toast("Registro de sintomas salvo com sucesso.");
  };
}


function editPeriodoCiclo(id) {
  const record = state.data.cicloMenstrual.periodos.find(x => x.id === id);
  if (!record) return;
  openModal("Editar ciclo",
    field("Início da menstruação", "start", "date", record.start || "", "required") +
    field("Fim da menstruação", "end", "date", record.end || "") +
    selectField("Intensidade do fluxo", "flow", ["Leve","Moderado","Intenso"], record.flow || "Moderado") +
    textareaField("Observações", "notes", record.notes || ""),
    { submit:"Salvar alterações" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    if (!start) { toast("Informe o início da menstruação.", "error"); return; }
    if (end && end < start) { toast("A data de fim não pode ser anterior ao início.", "error"); return; }
    record.start = start;
    record.end = end;
    record.flow = String(f.get("flow") || "Moderado");
    record.duration = start && end ? Math.max(1, daysBetween(start, end) + 1) : "";
    record.notes = String(f.get("notes") || "");
    record.updatedAt = new Date().toISOString();
    saveState(); closeModal(); render(); toast("Ciclo atualizado.");
  };
}

function editSintomaCiclo(id) {
  const record = state.data.cicloMenstrual.sintomas.find(x => x.id === id);
  if (!record) return;
  openModal("Editar registro do ciclo",
    field("Data", "date", "date", record.date || todayISO(), "required") +
    selectField("Humor", "mood", ["Muito baixo","Baixo","Neutro","Bom","Muito bom"], record.mood || "Neutro") +
    selectField("Dor", "pain", ["Baixa","Moderada","Intensa"], record.pain || "Baixa") +
    selectField("Cólicas", "cramps", ["Baixa","Moderada","Intensa"], record.cramps || "Baixa") +
    selectField("Acne", "acne", ["Baixa","Moderada","Intensa"], record.acne || "Baixa") +
    selectField("Dor de cabeça", "headache", ["Nenhuma","Baixa","Moderada","Intensa"], record.headache || "Nenhuma") +
    selectField("Inchaço", "bloating", ["Nenhum","Baixo","Moderado","Intenso"], record.bloating || "Nenhum") +
    selectField("Sensibilidade nas mamas", "breastTenderness", ["Nenhuma","Baixa","Moderada","Intensa"], record.breastTenderness || "Nenhuma") +
    selectField("Náusea", "nausea", ["Nenhuma","Baixa","Moderada","Intensa"], record.nausea || "Nenhuma") +
    selectField("Energia física", "physicalEnergy", ["Baixa","Moderada","Intensa"], record.physicalEnergy || "Moderada") +
    selectField("Energia mental", "mentalEnergy", ["Baixa","Moderada","Intensa"], record.mentalEnergy || "Moderada") +
    textareaField("Observações", "notes", record.notes || ""),
    { submit:"Salvar alterações" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const date = String(f.get("date") || "");
    if (!date) { toast("Informe a data.", "error"); return; }
    const phaseInfo = cycleInfo(date);
    record.date = date;
    record.phase = phaseInfo.hasData ? phaseInfo.phase : record.phase;
    record.mood = String(f.get("mood") || "Neutro");
    record.pain = String(f.get("pain") || "Baixa");
    record.cramps = String(f.get("cramps") || "Baixa");
    record.acne = String(f.get("acne") || "Baixa");
    record.headache = String(f.get("headache") || "Nenhuma");
    record.bloating = String(f.get("bloating") || "Nenhum");
    record.breastTenderness = String(f.get("breastTenderness") || "Nenhuma");
    record.nausea = String(f.get("nausea") || "Nenhuma");
    record.physicalEnergy = String(f.get("physicalEnergy") || "Moderada");
    record.mentalEnergy = String(f.get("mentalEnergy") || "Moderada");
    record.notes = String(f.get("notes") || "");
    record.updatedAt = new Date().toISOString();
    saveState(); closeModal(); render(); toast("Registro atualizado.");
  };
}

let currentReminderAudio=null;
function sourceLabel(type,id){const map={tarefa:[state.data.tarefas,"Tarefa"],compromisso:[state.data.compromissos,"Compromisso"],estudo:[state.data.estudos,"Estudo"],treino:[state.data.treinos,"Treino"]};const [arr,label]=map[type]||[[],"Atividade"];const item=arr.find(x=>x.id===id);return {label,item};}
function createReminderFor(type,id){const {label,item}=sourceLabel(type,id);if(!item){toast("Item não encontrado.","error");return;}openReminderForm({sourceType:type,sourceId:id,sourceName:item.title||item.name||item.subject||label});}
function openReminderForm(existing=null){const n=state.settings.notifications,r=existing||{};openModal(r.id?"Editar lembrete":"Novo lembrete",field("Título","title","text",r.title||r.sourceName||"","required")+field("Data de início","date","date",r.date||todayISO(),"required")+field("Horário","time","time",r.time||"08:00","required")+selectField("Recorrência","repeat",[{value:"once",label:"Uma vez"},{value:"daily",label:"Todos os dias"},{value:"weekdays",label:"Dias úteis"},{value:"weekly",label:"Semanal"}],r.repeat||"once")+field("Data de término (opcional)","endDate","date",r.endDate||"")+selectField("Avisar com","mode",[{value:"beep",label:"🔔 Som LiDire"},{value:"text",label:"📝 Texto"},{value:"voice",label:"🔊 Texto + voz"}],r.mode||n.mode||"beep")+textareaField("Mensagem","message",r.message||n.message||"")+`<div class="form-field"><span>Áudio</span><select name="audioId"><option value="">Usar áudio padrão</option>${(state.data.audios||[]).map(a=>`<option value="${a.id}" ${a.id===r.audioId?"selected":""}>${esc(a.name)}</option>`).join("")}</select></div>`,{submit:r.id?"Salvar":"Criar lembrete"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const item={id:r.id||uid("rem"),title:String(f.get("title")||"Lembrete"),date:String(f.get("date")||todayISO()),time:String(f.get("time")||"08:00"),repeat:String(f.get("repeat")||"once"),endDate:String(f.get("endDate")||""),mode:String(f.get("mode")||"beep"),message:String(f.get("message")||""),audioId:String(f.get("audioId")||""),sourceType:r.sourceType||"manual",sourceId:r.sourceId||"",done:false,paused:!!r.paused};state.settings.notifications.enabled=true;state.settings.notifications.mode=item.mode||"beep";state.settings.notifications.sound=true;const idx=state.data.lembretes.findIndex(x=>x.id===item.id);if(idx>=0)state.data.lembretes[idx]=item;else state.data.lembretes.unshift(item);saveState();apiRequest("/api/reminders",{method:"POST",body:JSON.stringify({...item,timezoneOffsetMinutes:new Date().getTimezoneOffset()})}).catch(e=>toast("Lembrete salvo no aparelho, mas não foi sincronizado com o servidor.","error"));closeModal();render();if("Notification" in window && Notification.permission!=="granted") requestNotificationPermission();else if(!state.settings.notifications.pushEnabled) enableLiDirePush().catch(()=>{});toast(r.id?"Lembrete atualizado.":"Lembrete criado.");};}
function reminderRepeatLabel(r){return r.repeat==="daily"?"Todos os dias":r.repeat==="weekdays"?"Dias úteis":r.repeat==="weekly"?"Semanal":"Uma vez";}
function renderReminders(){const rs=state.data.lembretes||[];return `<div class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">Meus lembretes</div><small>Vincule lembretes a tarefas, compromissos, estudos e treinos.</small></div><button class="ghost-button" data-action="new-reminder">+ Criar</button></div>${rs.length?`<div class="item-list">${rs.map(r=>`<div class="list-item ${r.paused?"completed":""}"><div class="module-icon small">🔔</div><div class="item-main"><strong>${esc(r.title)}</strong><span>${dateBR(r.date)} · ${esc(r.time)} · ${esc(reminderRepeatLabel(r))}${r.endDate?` · até ${dateBR(r.endDate)}`:""}</span><small>${esc(r.message||"")}${r.sourceType&&r.sourceType!=="manual"?` · Vinculado a ${esc(r.sourceType)}`:""}</small></div><div class="item-actions"><button data-action="toggle-reminder" data-id="${r.id}">${r.paused?"▶":"⏸"}</button><button data-action="edit-reminder" data-id="${r.id}">${icon("edit")}</button><button data-action="delete-reminder" data-id="${r.id}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<p class="muted">Nenhum lembrete criado.</p>`}</div>`;}
let notificationRecorder = null;
let notificationChunks = [];

function base64UrlToUint8ArrayClient(base64url) {
  const padded = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
  return bytes;
}

async function registerLiDirePushServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Este navegador não oferece Web Push.");
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function enableLiDirePush() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Este navegador não oferece notificações Push.");
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("A permissão de notificações não foi concedida.");
  const config = await apiRequest("/api/push/public-key", { timeoutMs: 10000 });
  if (!config.configured || !config.publicKey) throw new Error("As notificações Push ainda não foram configuradas no servidor.");
  const registration = await registerLiDirePushServiceWorker();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8ArrayClient(config.publicKey) });
  await apiRequest("/api/push/subscribe", { method: "POST", body: JSON.stringify({ subscription: subscription.toJSON() }) });
  state.settings.notifications.pushEnabled = true;
  state.settings.notifications.pushConfigured = true;
  state.settings.notifications.enabled = true;
  saveState();
  toast("Notificações Push ativadas neste dispositivo.");
  render();
  return true;
}

async function disableLiDirePush() {
  try {
    const registration = await registerLiDirePushServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await apiRequest("/api/push/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe();
    }
  } catch (_) {}
  state.settings.notifications.pushEnabled = false;
  saveState();
  toast("Notificações Push desativadas neste dispositivo.");
  render();
}

async function testLiDirePush() {
  try { await apiRequest("/api/push/test", { method: "POST", body: "{}" }); toast("Teste Push enviado. Confira as notificações do aparelho."); }
  catch (e) { toast(e.message || "Não foi possível testar o Push.", "error"); }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    toast("Este navegador não oferece notificações.", "error");
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try { await enableLiDirePush(); } catch (pushError) { toast(pushError.message || "Push ainda não configurado.", "error"); }
      return true;
    }
    toast("A permissão de notificações não foi concedida.", "error");
    return false;
  } catch (_) {
    toast("Não foi possível solicitar a permissão de notificações.", "error");
    return false;
  } finally {
    render();
  }
}

function ensureLiDireAudioContext() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!window.__lidireAudioContext) window.__lidireAudioContext = new Ctx();
    if (window.__lidireAudioContext.state === "suspended") window.__lidireAudioContext.resume().catch(() => {});
    return window.__lidireAudioContext;
  } catch (_) {
    return null;
  }
}

function unlockLiDireNotificationAudio() {
  try {
    const audio = window.__lidireNotificationAudio || (window.__lidireNotificationAudio = new Audio("/lidire-notificacao.wav"));
    audio.preload = "auto";
    audio.volume = 0.65;
    const p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
  } catch (_) {}
  ensureLiDireAudioContext();
}

function playBrowserFallbackBeep() {
  try {
    const ctx = ensureLiDireAudioContext();
    if (!ctx) return false;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
    return true;
  } catch (_) {
    return false;
  }
}

function playLiDireNotificationSound() {
  try {
    if (!window.__lidireNotificationAudio) {
      window.__lidireNotificationAudio = new Audio("/lidire-notificacao.wav");
      window.__lidireNotificationAudio.preload = "auto";
      window.__lidireNotificationAudio.volume = 0.65;
    }
    const audio = window.__lidireNotificationAudio;
    audio.currentTime = 0;
    const promise = audio.play();
    if (promise && typeof promise.then === "function") {
      promise.catch(() => {
        playBrowserFallbackBeep();
      });
    }
    return true;
  } catch (_) {
    return playBrowserFallbackBeep();
  }
}

// Compatibilidade com chamadas antigas.
function playReminderBeep() { playLiDireNotificationSound(); }

function playSavedReminderVoice(audioId="") {
  if (currentReminderAudio) { try { currentReminderAudio.pause(); currentReminderAudio.currentTime=0; } catch(_){} currentReminderAudio=null; }
  const selected = audioId ? (state.data.audios||[]).find(a=>a.id===audioId) : null;
  const url = selected?.dataUrl || state.settings.notifications?.voiceDataUrl;
  if (!url) { toast("Nenhuma voz personalizada foi gravada.", "error"); return; }
  const audio = new Audio(url);
  currentReminderAudio=audio;
  audio.play().catch(() => toast("O navegador bloqueou a reprodução automática. Toque novamente para reproduzir.", "error"));
}

function testReminderNotification() {
  const n = state.settings.notifications || defaultState.settings.notifications;
  if (n.sound) playReminderBeep();
  if (n.mode === "voice" && n.voiceDataUrl) playSavedReminderVoice();
  if ((n.mode === "text" || n.mode === "voice") && "Notification" in window && Notification.permission === "granted") {
    new Notification(n.title || "LiDire — Lembrete", { body: n.message || "Hora do seu lembrete." });
  } else if (n.mode === "text") {
    toast(n.message || "Hora do seu lembrete.");
  }
  if (n.mode === "beep") toast("Teste sonoro executado.");
}

function localDateISO(date=new Date()) {
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function reminderOccurrenceKey(r, dateISO) {
  return `${r.id}|${dateISO}|${String(r.time||"00:00")}`;
}
function reminderAppliesToday(r, now, dateISO) {
  const start=String(r.date||"");
  if(!start || dateISO < start) return false;
  if(r.endDate && dateISO > String(r.endDate)) return false;
  if(r.repeat === "weekdays" && [0,6].includes(now.getDay())) return false;
  if(r.repeat === "weekly") {
    const startDate=new Date(`${start}T12:00:00`);
    if(Number.isNaN(startDate.getTime()) || startDate.getDay() !== now.getDay()) return false;
  }
  return true;
}
function notifyReminder(r, occurrenceKey) {
  const n=state.settings.notifications || defaultState.settings.notifications;
  if(r.paused || r.done) return;
  // O lembrete deve disparar mesmo se o usuário não abriu a tela de configurações.
  n.enabled = true;
  r.lastTriggeredKey=occurrenceKey;
  if(r.repeat === "once") r.done=true;
  saveState();
  const title=String(r.title||n.title||"LiDire — Lembrete");
  const message=String(r.message||n.message||"Hora do seu lembrete.");
  const mode = String(r.mode || n.mode || "beep");

  if(n.sound !== false || mode === "beep") playReminderBeep();
  if(mode === "voice" && (r.audioId || n.voiceDataUrl)) playSavedReminderVoice(r.audioId||"");

  if((mode === "text" || mode === "voice" || mode === "beep") && "Notification" in window && Notification.permission === "granted") {
    try { new Notification(title,{body:message,icon:"/logo-lidire-oficial.png"}); } catch(_) {}
  }
  if (mode === "beep") toast(`🔔 ${title}: ${message}`);
  else if (mode === "text" || mode === "voice") toast(`🔔 ${title}: ${message}`);
}
function checkDueReminders() {
  const now=new Date();
  const dateISO=localDateISO(now);
  const timeNow=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const reminders=Array.isArray(state.data.lembretes)?state.data.lembretes:[];
  let changed=false;
  reminders.forEach(r=>{
    if(r.paused || r.done || !r.date || !r.time) return;
    if(!reminderAppliesToday(r,now,dateISO)) return;
    if(String(r.time) > timeNow) return;
    const key=reminderOccurrenceKey(r,dateISO);
    if(r.lastTriggeredKey === key) return;
    notifyReminder(r,key);
    changed=true;
  });
  if(changed) saveState();
}
let reminderSchedulerStarted=false;
function startReminderScheduler() {
  if(reminderSchedulerStarted) return;
  reminderSchedulerStarted=true;
  checkDueReminders();
  window.__lidireReminderScheduler=setInterval(checkDueReminders,1000);
}

function startReminderVoiceRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast("Seu navegador não permite gravação de voz aqui.", "error"); return; }
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {
    notificationChunks = [];
    notificationRecorder = new MediaRecorder(stream);
    notificationRecorder.ondataavailable = e => { if (e.data.size) notificationChunks.push(e.data); };
    notificationRecorder.onstop = () => {
      const blob = new Blob(notificationChunks, { type: notificationRecorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => { const name = prompt("Nome do áudio gravado:", "Meu áudio") || "Meu áudio"; const audio={id:uid("audio"),name:name.trim()||"Meu áudio",dataUrl:reader.result,createdAt:new Date().toISOString()}; state.data.audios.unshift(audio); state.settings.notifications.voiceDataUrl=reader.result; state.settings.notifications.audioId=audio.id; saveState(); render(); toast("Áudio salvo na biblioteca."); };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
      notificationRecorder = null;
    };
    notificationRecorder.start();
    toast("Gravando… toque novamente em 'Parar gravação' quando terminar.");
    render();
  }).catch(() => toast("Permita o acesso ao microfone para gravar sua mensagem.", "error"));
}

function stopReminderVoiceRecording() {
  if (notificationRecorder && notificationRecorder.state !== "inactive") notificationRecorder.stop();
}

function audioLibrary(){const audios=state.data.audios||[];return appShell(`${pageHeader("LEMBRETES","Biblioteca de áudios","Guarde várias mensagens de voz e escolha qual usar em cada lembrete.", `<button class="primary-button compact" data-action="start-reminder-recording">🎙 Gravar</button>`)}<div class="content-card">${audios.length?`<div class="item-list">${audios.map(a=>`<div class="list-item"><div class="module-icon small">🎙</div><div class="item-main"><strong>${esc(a.name)}</strong><span>Áudio gravado</span></div><div class="item-actions"><button data-action="play-audio" data-id="${a.id}">▶</button><button data-action="pause-audio">⏸</button><button data-action="stop-audio">⏹</button><button data-action="rename-audio" data-id="${a.id}">✎</button><button data-action="delete-audio" data-id="${a.id}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<p class="muted">Nenhum áudio gravado ainda.</p>`}</div>`);}
function configuracoesNotificacoes() {
  const n = state.settings.notifications;
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  const recording = !!notificationRecorder && notificationRecorder.state === "recording";
  return appShell(`${pageHeader("LEMBRETES", "Notificações e lembretes", "Escolha como a LiDire deve avisar você.", `<button type="button" class="primary-button compact" data-action="test-reminder">🔔 Testar</button>`)}
    <div class="content-card">
      <div class="card-toolbar"><div><div class="toolbar-title">Notificações</div><small>Status: ${permission === "granted" ? "permitidas" : permission === "denied" ? "bloqueadas" : permission === "unsupported" ? "não suportadas" : "ainda não configuradas"}</small></div><label class="switch"><input type="checkbox" data-action="toggle-notifications" ${n.enabled ? "checked" : ""}><span></span></label></div>
      ${permission !== "granted" && permission !== "unsupported" ? `<button class="secondary-button" data-action="request-notification-permission">Permitir notificações</button>` : ""}
      <p class="muted">A permissão do aparelho é necessária para notificações do navegador. O funcionamento em segundo plano pode variar conforme navegador e dispositivo.</p>
      <div class="content-card" style="margin-top:12px;padding:14px">
        <div class="card-toolbar"><div><div class="toolbar-title">📲 Notificações Push</div><small>Receba lembretes e avisos da família mesmo com a LiDire fechada.</small></div><span class="status-pill">${state.settings.notifications.pushEnabled ? "ATIVADAS" : "DESATIVADAS"}</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          ${state.settings.notifications.pushEnabled ? `<button type="button" class="secondary-button" data-action="disable-push">Desativar Push</button><button type="button" class="secondary-button" data-action="test-push">🔔 Testar Push</button>` : `<button type="button" class="primary-button" data-action="enable-push">Ativar notificações Push</button>`}
        </div>
      </div>
    </div>
    <div class="content-card">
      <h3>Modo padrão dos lembretes</h3>
      <label class="form-field"><span>Como quer ser avisado?</span><select name="notificationMode"><option value="beep" ${n.mode === "beep" ? "selected" : ""}>🔔 Bip</option><option value="text" ${n.mode === "text" ? "selected" : ""}>📝 Texto</option><option value="voice" ${n.mode === "voice" ? "selected" : ""}>🔊 Texto + voz</option></select></label>
      ${field("Título do lembrete", "notificationTitle", "text", n.title || "LiDire — Lembrete")}
      ${textareaField("Mensagem padrão", "notificationMessage", n.message || "Hora do seu lembrete.")}
      <label class="form-field"><span><input type="checkbox" name="notificationSound" ${n.sound ? "checked" : ""}> Som de aviso LiDire</span><small class="muted">Usa a assinatura sonora curta da LiDire.</small></label>
      <button class="primary-button" data-action="save-notification-settings">Salvar configurações</button>
    </div>
    <div class="content-card">
      <h3>Mensagem de voz personalizada</h3><button class="ghost-button" data-action="audio-library">🎙 Biblioteca de áudios</button>
      <p class="muted">Grave sua própria mensagem para o modo Texto + voz. Exemplo: “Cláudio, cadê a garrafa d'água?”</p>
      ${recording ? `<button class="secondary-button" data-action="stop-reminder-recording">⏹ Parar gravação</button>` : `<button class="secondary-button" data-action="start-reminder-recording">🎙 Gravar minha voz</button>`}
      ${n.voiceDataUrl && !recording ? `<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="muted">Mensagem gravada.</span><button class="text-button" data-action="play-reminder-voice">▶ Reproduzir</button><button class="text-button" data-action="pause-reminder-voice">⏸ Pausar</button><button class="text-button" data-action="stop-reminder-voice">⏹ Parar</button><button class="text-button" data-action="audio-library">🎙 Biblioteca</button><button class="text-button" data-action="delete-reminder-voice">Excluir</button></div>` : ""}
    </div>${renderReminders()}</div>`);
}

/* =========================================================
   PERFIL
   ========================================================= */

function perfil() {
  const lang=false; const hasPhoto=!!state.user.photo; const name=state.user.name||"LiDire User";
  const plan = state.settings.subscriptionPlan || "free";
  const planLabel = plan === "premium" ? (lang?"PREMIUM MEMBER":"MEMBRO PREMIUM") : (lang?"FREE MEMBER":"MEMBRO GRATUITO");
  return appShell(`
    ${pageHeader("PROFILE", lang?"Profile":"Perfil", lang?"Your account, preferences and connections.":"Sua conta, preferências e conexões.", `<button class="ghost-button compact" data-page="configuracoes">⚙ ${lang?"Settings":"Configurações"}</button>`)}
    <section class="v5-profile-hero"><div class="v5-profile-avatar" data-action="profile-photo">${hasPhoto?`<img src="${esc(state.user.photo)}" alt="">`:esc(name.charAt(0).toUpperCase())}<button type="button">✎</button></div><h2>${esc(name)}</h2><span class="v5-premium">${planLabel}</span><button class="primary-button compact" data-action="edit-profile">${lang?"Edit Profile":"Editar Perfil"}</button></section>
    <section class="v5-settings-card"><h3>♙ ${lang?"Personal Info":"Informações pessoais"}</h3><label>${lang?"Full Name":"Nome completo"}<input value="${esc(name)}" readonly></label><label>${lang?"Email Address":"E-mail"}<input value="${esc(state.user.email||"")}" readonly></label><label>${lang?"Phone Number":"Telefone"}<input value="${esc(state.user.phone||"")}" readonly></label></section>
    <section class="v5-settings-card"><h3>☆ ${lang?"Subscription":"Assinatura"}</h3><div class="v5-plan-row"><div><strong>${plan === "premium" ? (lang?"Premium Plan":"Plano Premium") : (lang?"Free Plan":"Plano Gratuito")}</strong><small>${plan === "premium" ? (lang?"LiDire + AI + Family":"LiDire + IA + Família") : (lang?"Explore LiDire before subscribing":"Conheça a LiDire antes de assinar")}</small></div><span>✦</span></div><button data-page="assinatura">${lang?"Manage subscription":"Gerenciar assinatura"} →</button><button data-page="assinatura">${lang?"View plan benefits":"Ver benefícios"} →</button></section>
    <section class="v5-settings-card"><h3>⚙ ${lang?"Preferences":"Preferências"}</h3><button data-action="open-notifications">🔔 <span>${lang?"Notifications":"Notificações"}</span><b>${state.settings.notifications.enabled?"ON":"OFF"}</b></button><button data-action="preference-theme">◐ <span>${lang?"Appearance":"Aparência"}</span><b>${state.settings.theme==="dark"?(lang?"Dark":"Escuro"):(lang?"Light":"Claro")}</b></button></section>
    <section class="v5-settings-card"><h3>⌘ ${lang?"Connectivity":"Conectividade"}</h3><button>▣ <span>Google Account</span><b>${lang?"Not connected":"Não conectado"}</b></button><button>◉ <span>Apple ID</span><b>${lang?"Not linked":"Não vinculado"}</b></button><button data-page="familia">👥 <span>${lang?"Family Sharing":"Compartilhamento Familiar"}</span><b class="v5-status">${lang?"ACTIVE":"ATIVO"}</b></button></section>
    <section class="v5-settings-card"><h3>🛡 ${lang?"Privacy":"Privacidade"}</h3><button data-page="privacidade">${lang?"Data Management":"Gerenciamento de dados"} →</button><button data-page="segurancaPIN">${lang?"Change Password":"Alterar senha"} →</button><button data-page="segurancaPIN">${lang?"Two-Factor Auth":"Autenticação em dois fatores"} →</button></section>
    <section class="v5-settings-card"><h3>ⓘ ${lang?"Support":"Suporte"}</h3><button data-page="suporte">${lang?"Help Center":"Central de ajuda"} →</button><button data-page="sobre">${lang?"About LiDire":"Sobre a LiDire"} →</button><button data-page="privacidade">${lang?"Privacy Policy":"Política de Privacidade"} →</button><button data-page="termos">${lang?"Terms of Service":"Termos de Serviço"} →</button></section>
    <button class="v5-signout" data-action="logout">↪ ${lang?"Sign Out":"Sair da conta"}</button>
  `);
}
/* =========================================================
   LiDire — idioma oficial: Português (Brasil)
   =========================================================
   LiDire 4.4 — idioma e aparência
   Português e English são aplicados à interface inteira.
   Aparência possui somente Claro e Escuro.
   ========================================================= */
function translateText(value){ return value; }
function applyLanguage(){
  document.documentElement.lang="pt-BR";
  document.body.dataset.language="pt-BR";
}

function applyTheme(){
  const theme=["light","dark"].includes(state.settings.theme)?state.settings.theme:"dark";
  state.settings.theme=theme;
  document.documentElement.dataset.theme=theme;
  document.body.dataset.theme=theme;
}
function preferencias(){return appShell(`${pageHeader("PREFERÊNCIAS","Idioma e preferências","Personalize a experiência da LiDire.")}<div class="content-card"><div class="settings-card"><button data-action="preference-theme"><span>🎨</span><div><strong>Aparência</strong><small>${state.settings.theme==="light"?"☀️ Claro":"🌙 Escuro"}</small></div>${icon("arrow")}</button></div></div>`);}
function dados(){return appShell(`${pageHeader("DADOS","Seus dados","Gerencie exportação e exclusão da sua conta.")}<div class="content-card"><div class="settings-card"><button data-action="export-data"><span>📤</span><div><strong>Exportar meus dados</strong><small>Solicitar uma cópia dos dados da conta</small></div>${icon("arrow")}</button><button data-action="delete-account"><span>🗑</span><div><strong>Excluir minha conta</strong><small>Solicitar a exclusão da conta e dos dados</small></div>${icon("arrow")}</button></div></div>`);}
function explorarHub(){const items=[["✓","Tarefas","Organize o que precisa ser feito.","tarefas"],["🛒","Compras","Listas e itens de compras.","compras"],["📚","Estudos","Planejamento e desempenho.","estudos"],["🏋️","Treinos","Exercícios e evolução.","treinos"],["💧","Hidratação","Meta diária de água.","hidratacao"],["🍽️","Alimentação","Dietas e refeições.","alimentacao"],["💰","Finanças","Receitas, despesas e limites.","financas"],["🎯","Objetivos","Metas e progresso.","objetivos"],["👨‍👩‍👧","Família","Compartilhamento da rotina.","familia"],["🌸","Ciclo","Acompanhamento do ciclo.","cicloMenstrual"],["🌦️","Clima e rotas","Temperatura, previsão e deslocamento.","climaRotas"],["📝","Anotações","Notas e informações importantes.","anotacoes"]];return appShell(`${pageHeader("MÓDULOS","Explorar","Tudo o que a LiDire pode organizar em um só lugar.")}<div class="content-card"><div class="settings-card">${items.map(x=>hubButton(...x)).join("")}</div></div>`);}



/* RESTORED CORE FUNCTIONS FROM MVP 4.9 — required by v5 pages map */
function agenda() {
  const items = [...state.data.compromissos].sort(
    (a, b) => {
      const da = `${a.date || ""} ${a.time || ""}`;
      const db = `${b.date || ""} ${b.time || ""}`;
      return da.localeCompare(db);
    }
  );

  return listPage({
    key: "compromissos",

    title: "Agenda",

    subtitle:
      "Seus compromissos organizados em um só lugar.",

    eyebrow: "SUA ROTINA",

    emptyTitle: "Sua agenda está livre",

    emptyText:
      "Cadastre compromissos, consultas, reuniões e outros horários.",

    render: (x) => `
      <div class="list-item">

        <div class="date-badge">
          <strong>
            ${x.date ? x.date.slice(8, 10) : "--"}
          </strong>

          <small>
            ${
              x.date
                ? new Date(
                    `${x.date}T12:00:00`
                  )
                    .toLocaleDateString(
                      "pt-BR",
                      { month: "short" }
                    )
                    .replace(".", "")
                : ""
            }
          </small>
        </div>

        <div class="item-main">

          <strong>${esc(x.title)}</strong>

          <span>
            ${x.time ? `◷ ${esc(x.time)}` : "Sem horário"}

            ${
              x.location
                ? ` · ${esc(x.location)}`
                : ""
            }
          </span>

        </div>

        <div class="item-actions">

          <button
            data-action="edit-compromisso"
            data-id="${x.id}"
          >
            ${icon("edit")}
          </button>

          ${x.address?`<button type="button" data-action="future-google-maps" data-id="${esc(x.id)}" title="Consultar no Google Maps">🗺️</button>`:""}
          <button
            data-action="delete-compromisso"
            data-id="${x.id}"
          >
            ${icon("trash")}
          </button>

        </div>

      </div>
    `
  });
}

function anotacoes(){const notes=state.data.anotacoes||[];return appShell(`${pageHeader("ORGANIZAÇÃO","Anotações","Registre ideias e informações importantes.",`<button class="primary-button compact" data-action="add-note">+ Nova anotação</button>`)}<div class="content-card">${notes.length?notes.map(n=>`<div class="list-item"><div class="module-icon small">📝</div><div class="item-main"><strong>${esc(n.title||"Anotação")}</strong><span>${esc(n.text||"")}</span></div><div class="item-actions"><button data-action="edit-note" data-id="${esc(n.id)}">✎</button><button data-action="delete-note" data-id="${esc(n.id)}">🗑</button></div></div>`).join(""):`<div class="empty-state"><div class="empty-orb">📝</div><h3>Suas anotações</h3><p>Nenhuma anotação ainda.</p></div>`}</div>`);}

function configuracoes(){return appShell(`${pageHeader("APLICATIVO","Configurações","Controle sua conta, preferências, segurança, privacidade e dados.")}<div class="content-card"><div class="settings-card">${hubButton("👤","Conta","Perfil e informações da sua conta","perfil")}${hubButton("🔒","Segurança","PIN, biometria e bloqueio do aplicativo","seguranca")}${hubButton("🌐","Preferências","Configurações gerais da LiDire","preferencias")}${hubButton("🤖","Assistente LiDire","Permissões e preferências da inteligência artificial","assistente")}${hubButton("🔔","Notificações e lembretes","Escolha texto, bip ou texto + voz","configuracoesNotificacoes")}${hubButton("🔐","Privacidade e permissões","Controle quais dados podem ser utilizados","privacidade")}${hubButton("📦","Dados","Exportação e gerenciamento dos seus dados","dados")}${hubButton("⚖️","Termos e políticas","Consulte os documentos legais da LiDire","termos")}${hubButton("🆘","Suporte","Ajuda, bugs e contato","suporte")}</div></div>`);}

function countFor(id) {
  if (id === "tarefas") {
    return state.data.tarefas.filter(
      (x) => !x.done
    ).length;
  }

  if (id === "agenda") {
    return state.data.compromissos.length;
  }

  if (id === "compras") {
    return state.data.compras.reduce(
      (total, lista) =>
        total +
        (lista.items || []).filter(
          (item) => !item.done
        ).length,
      0
    );
  }

  if (id === "cicloMenstrual") {
    return state.data.cicloMenstrual?.sintomas?.filter(x => x.date === todayISO()).length || 0;
  }

  return state.data[id]?.length || 0;
}

function hubButton(iconText, title, subtitle, target) {
  return `<button class="settings-card" data-page="${esc(target)}" style="width:100%;text-align:left;display:flex;align-items:center;gap:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:inherit;border-radius:18px;padding:15px;margin-bottom:10px"><span style="font-size:22px">${iconText}</span><span style="flex:1;display:flex;flex-direction:column;gap:3px"><strong>${esc(title)}</strong><small class="muted">${esc(subtitle)}</small></span>${icon("arrow")}</button>`;
}

function listPage(config) {
  const items = state.data[config.key] || [];

  return appShell(`

    ${pageHeader(
      config.eyebrow || "ORGANIZAÇÃO",
      config.title,
      config.subtitle,
      `
        <button
          class="primary-button compact"
          data-action="add-${config.key}"
        >
          ${icon("plus")} Adicionar
        </button>
      `
    )}

    ${
      config.stats
        ? `
          <div class="stats-grid mini">
            ${config.stats()}
          </div>
        `
        : ""
    }

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          ${items.length}
          ${items.length === 1 ? "item" : "itens"}
        </div>

        <div class="toolbar-filter">
          ${config.filter || ""}
        </div>

      </div>

      ${
        items.length
          ? `
            <div class="item-list">
              ${items.map(config.render).join("")}
            </div>
          `
          : emptyState(
              config.emptyTitle || "Nada por aqui ainda",
              config.emptyText ||
                "Adicione seu primeiro item para começar.",
              "Adicionar",
              `add-${config.key}`
            )
      }

    </div>

  `);
}

function moduleCard([id, title, desc, ico, page]) {
  const count = countFor(id);

  return `
    <button
      class="module-card"
      data-page="${page}"
    >

      <span class="module-icon">
        ${icon(ico)}
      </span>

      <span class="module-content">

        <strong>${esc(title)}</strong>

        <small>${esc(desc)}</small>

      </span>

      <span class="module-count">
        ${count}
      </span>

      <span class="module-arrow">
        ${icon("arrow")}
      </span>

    </button>
  `;
}

function openThemeSettings(){
  openModal("Aparência", `<p class="muted">Escolha a aparência da interface da LiDire.</p>${selectField("Aparência", "theme", [{value:"dark",label:"🌙 Escuro"},{value:"light",label:"☀️ Claro"}], state.settings.theme||"dark")}`, {submit:"Aplicar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.settings.theme=f.get("theme")||"dark";saveState();closeModal();applyTheme();render();toast(state.settings.theme==="light"?"Aparência clara aplicada.":"Aparência escura aplicada.");};
}

function politicaCookies(){const l=false;return appShell(`${pageHeader("POLICY",l?"Cookies & storage":"Cookies e armazenamento",l?"How LiDire uses local storage and session data.":"Como o aplicativo utiliza armazenamento local e dados de sessão.")}<div class="content-card"><p>${l?"The MVP uses local storage for some preferences and transition data. Authentication sessions are managed by the Worker. The final architecture will be consolidated during the D1 migration.":"O MVP utiliza armazenamento local para algumas preferências e dados de transição. A sessão de autenticação é administrada pelo Worker. A arquitetura definitiva será consolidada durante a migração para o D1."}</p></div>`);}

function politicaIA(){const l=false;return appShell(`${pageHeader("POLICY",l?"AI Policy":"Política de IA",l?"Rules for LiDire intelligent features.":"Regras para recursos inteligentes da LiDire.")}<div class="content-card"><p>${l?"AI features must respect user permissions. Actions that change or delete data may require confirmation. AI provider keys must remain on the server and never in public application code.":"Recursos de IA deverão respeitar as permissões do usuário. Ações que alterem ou excluam dados poderão exigir confirmação. Chaves de provedores de IA deverão permanecer no servidor e não no código público do aplicativo."}</p></div>`);}

function politicas(){const l=false;return appShell(`${pageHeader("LEGAL",l?"Policies":"Políticas",l?"Review the policies that apply to LiDire.":"Consulte as políticas aplicáveis ao uso da LiDire.")}<div class="content-card"><div class="settings-card">${hubButton("🔒",l?"Privacy Policy":"Política de Privacidade",l?"How personal data is handled":"Como os dados pessoais são tratados","privacidade")}${hubButton("🍪",l?"Cookies & storage":"Cookies e armazenamento",l?"Local storage and technologies used":"Armazenamento local e tecnologias utilizadas","politicaCookies")}${hubButton("🤖",l?"AI Policy":"Política de IA",l?"How AI features may use authorized data":"Como recursos de IA poderão utilizar dados autorizados","politicaIA")}</div></div>`);}

function priorityClass(priority) {
  const map = {
    Baixa: "priority-baixa",
    Normal: "priority-normal",
    "Média": "priority-média",
    Alta: "priority-alta"
  };

  return map[priority || "Normal"];
}

function privacidade(){const l=false;return appShell(`${pageHeader("LEGAL",l?"Privacy":"Privacidade",l?"Understand and control how your data is handled.":"Entenda e controle o tratamento dos seus dados.")}<div class="content-card"><h3>${l?"Privacy Policy":"Política de Privacidade"}</h3><label class="form-field"><span>Guardar conversas com a IA</span><input type="checkbox" data-action="toggle-ai-conversation-storage" ${state.settings.aiConversationStorage!==false?'checked':''}></label></h3><p class="muted">${l?"Initial version. The definitive document should undergo legal review before publication.":"Versão inicial. O documento definitivo deverá passar por revisão jurídica antes da publicação."}</p><p>${l?"LiDire should process only the data needed to provide the features chosen by the user, respecting granted permissions.":"A LiDire deverá tratar somente os dados necessários para oferecer as funcionalidades escolhidas pelo usuário, respeitando as permissões concedidas."}</p><p>${l?"Sensitive data, such as health, menstrual-cycle and location information, should remain private by default and only be used by features with specific authorization.":"Dados sensíveis, como informações de saúde, ciclo menstrual e localização, deverão permanecer privados por padrão e somente ser utilizados por recursos que tenham autorização específica."}</p><p>${l?"Users should have access to mechanisms to consult, export and request deletion of their data, as applicable.":"O usuário deverá ter acesso a mecanismos para consultar, exportar e solicitar a exclusão de seus dados, conforme aplicável."}</p></div>`);}

function profilePhotoModal() {
  const hasPhoto = !!state.user.photo;

  openModal(
    hasPhoto ? "Foto de perfil" : "Adicionar foto",
    `
      ${
        hasPhoto
          ? `
            <div class="profile-photo-preview">
              <img
                src="${esc(state.user.photo)}"
                alt="Foto de perfil"
              >
            </div>
          `
          : ""
      }

      <div class="profile-photo-actions">

        <label class="primary-button" style="cursor:pointer;">
          📷 Tirar foto com a câmera
          <input id="profile-camera-input" type="file" accept="image/*" capture="user" style="display:none;">
        </label>

        <label class="ghost-button" style="cursor:pointer;">
          🖼️ ${hasPhoto ? "Escolher outra foto" : "Escolher da galeria"}
          <input id="profile-photo-input" type="file" accept="image/*" style="display:none;">
        </label>

        ${
          hasPhoto
            ? `
              <button
                type="button"
                class="ghost-button"
                data-action="delete-profile-photo"
              >
                🗑 Excluir foto
              </button>
            `
            : ""
        }

      </div>

      <p class="muted">
        Escolha uma imagem do seu dispositivo.
      </p>
    `,
    {
      submit: "Fechar"
    }
  );

  const form = modal.querySelector("#lidire-form");

  /*
   * Não precisamos salvar o formulário.
   * A foto é processada diretamente no input.
   */
  form.onsubmit = (e) => {
    e.preventDefault();
    closeModal();
  };

  const inputs = [
    modal.querySelector("#profile-photo-input"),
    modal.querySelector("#profile-camera-input")
  ].filter(Boolean);

  inputs.forEach(input => {
    input.addEventListener("change", () => {

      const file = input.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast("Selecione uma imagem válida.", "error");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {

        state.user.photo = reader.result;
        saveState();
        apiRequest("/api/profile", { method: "PUT", body: JSON.stringify({name: state.user.name, email: state.user.email, age: state.user.age, phone: state.user.phone, address: state.user.address, profile_photo: reader.result}) })
          .then(response => { if (response.user) syncUserToState(response.user); })
          .catch(error => toast(error.message || "Não foi possível salvar a foto no servidor.", "error"))
          .finally(() => { closeModal(); render(); });
        toast("Foto de perfil atualizada.");
      };

      reader.readAsDataURL(file);
    });
  });
}

function receitas(){
  const list = Array.isArray(state.data.receitas) ? state.data.receitas : [];
  return appShell(`${pageHeader("ALIMENTAÇÃO","Receitas","Guarde suas receitas favoritas e organize ingredientes, preparo e observações.", `<button class="primary-button compact" data-action="recipe-coming-soon">+ Nova receita</button>`)}
  <div class="content-card">${list.length ? `<div class="item-list">${list.map(r=>`<div class="list-item"><div class="module-icon small">🍳</div><div class="item-main"><strong>${esc(r.name||"Receita")}</strong><span>${(r.ingredients||[]).length} ingredientes${r.calories?` · ${Number(r.calories)} kcal`:""}${r.servings?` · ${Number(r.servings)} porções`:""}</span><small>${esc(r.instructions||"")}</small></div></div>`).join("")}</div>` : `<div class="empty-state"><div class="empty-orb">🍳</div><h3>Suas receitas</h3><p>Peça à LiDire para salvar uma receita e ela aparecerá aqui.</p></div>`}</div>`);
}

function seguranca(){return appShell(`${pageHeader("SEGURANÇA","Segurança","Proteja o acesso ao aplicativo.")}<div class="content-card"><div class="settings-card">${hubButton("🔢","PIN / senha do aplicativo","Configurar bloqueio de acesso","segurancaPIN")}${hubButton("👆","Biometria","Usar a biometria do aparelho quando disponível","segurancaBiometria")}</div></div>`);}

function segurancaBiometria(){return appShell(`${pageHeader("SEGURANÇA","Biometria","Use a biometria do próprio sistema operacional.")}<div class="content-card"><p class="muted">A LiDire não deve armazenar dados biométricos. O aplicativo utilizará a API de biometria do dispositivo quando essa função for implementada.</p></div>`);}

function segurancaPIN(){return appShell(`${pageHeader("SEGURANÇA","PIN / senha","Configuração do bloqueio do aplicativo.")}<div class="content-card"><p class="muted">A configuração será conectada à tabela de segurança do D1. A senha/PIN nunca deverá ser armazenada em texto puro.</p></div>`);}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {

    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    const pa =
      priorityOrder[a.priority || "Normal"] || 3;

    const pb =
      priorityOrder[b.priority || "Normal"] || 3;

    if (pa !== pb) {
      return pa - pb;
    }

    const da = `${a.date || "9999-12-31"} ${a.time || "23:59"}`;
    const db = `${b.date || "9999-12-31"} ${b.time || "23:59"}`;

    return da.localeCompare(db);
  });
}

function suporte() {
  return appShell(`
    ${pageHeader("AJUDA", "Suporte", "Encontre ajuda, informe bugs ou entre em contato com a equipe LiDire.")}
    <div class="content-card"><div class="settings-card">
      <button data-action="report-bug"><span>🐞</span><div><strong>Informar bug</strong><small>Relate um problema encontrado no aplicativo.</small></div>${icon("arrow")}</button>
      <button data-action="support-email"><span>✉</span><div><strong>Contatar por e-mail</strong><small>Envie uma mensagem para o suporte da LiDire.</small></div>${icon("arrow")}</button>
    </div></div>
    <div class="content-card"><span class="eyebrow">EM BREVE</span><h3>Novas formas de suporte</h3><p class="muted">A estrutura está preparada para FAQ, central de ajuda, acompanhamento de chamados e outros canais futuramente.</p></div>
  `);
}

function tarefas() {
  const sorted = sortTasks(state.data.tarefas);

  return appShell(`

    ${pageHeader(
      "FAZER",
      "Tarefas",
      "Tire as coisas da cabeça e coloque em movimento.",
      `
        <button
          class="primary-button compact"
          data-action="add-tarefas"
        >
          ${icon("plus")} Adicionar
        </button>
      `
    )}

    <div class="stats-grid mini">

      ${statCard(
        state.data.tarefas.filter(x => x.done).length,
        "Concluídas",
        "cyan"
      )}

      ${statCard(
        state.data.tarefas.filter(x => !x.done).length,
        "Pendentes",
        "purple"
      )}

      ${statCard(
        state.data.tarefas.length
          ? Math.round(
              state.data.tarefas.filter(x => x.done).length /
              state.data.tarefas.length *
              100
            ) + "%"
          : "0%",
        "Progresso",
        "pink"
      )}

    </div>

    <div class="content-card">

      <div class="card-toolbar">
        <div class="toolbar-title">
          Ordenadas por prioridade, data e horário
        </div>
      </div>

      ${
        sorted.length
          ? `
            <div class="item-list">

              ${sorted.map((x) => `

                <div
                  class="list-item ${x.done ? "completed" : ""}"
                >

                  <div
                    class="task-priority ${priorityClass(
                      x.priority
                    )}"
                  ></div>

                  <button
                    class="check-button ${x.done ? "checked" : ""}"
                    data-action="toggle-tarefa"
                    data-id="${x.id}"
                  >
                    ${x.done ? "✓" : ""}
                  </button>

                  <div class="item-main">

                    <strong>
                      ${esc(x.title)}
                    </strong>

                    <span>

                      ${
                        x.priority
                          ? `Prioridade: ${esc(x.priority)}`
                          : "Prioridade: Normal"
                      }

                      ${
                        x.date
                          ? ` · ${dateBR(x.date)}`
                          : ""
                      }

                      ${
                        x.time
                          ? ` · ◷ ${esc(x.time)}`
                          : ""
                      }

                    </span>

                  </div>

                  <div class="item-actions">

                    <button
                      data-action="edit-tarefa"
                      data-id="${x.id}"
                    >
                      ${icon("edit")}
                    </button>

                    <button
                      data-action="delete-tarefa"
                      data-id="${x.id}"
                    >
                      ${icon("trash")}
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : emptyState(
              "Nenhuma tarefa criada",
              "Crie uma tarefa para começar a organizar seu dia.",
              "Adicionar tarefa",
              "add-tarefas"
            )
      }

    </div>

  `);
}

function sobre(){const l=false;return appShell(`${pageHeader("LIDIRE",l?"About LiDire":"Sobre a LiDire",l?"Your life organization copilot.":"Seu copiloto para a organização da vida.")}<div class="content-card"><h3>LiDire</h3><p>${l?"LiDire brings tasks, calendar, shopping, studies, workouts, hydration, nutrition, finances, goals, family and AI together in one place.":"A LiDire reúne tarefas, agenda, compras, estudos, treinos, hidratação, alimentação, finanças, objetivos, família e IA em um só lugar."}</p><p class="muted">MVP ${LIDIRE_VERSION} · ${l?"Built to evolve with your routine.":"Construída para evoluir com a sua rotina."}</p></div>`);}
function assinatura(){const l=false;return appShell(`${pageHeader("SUBSCRIPTION",l?"Subscription":"Assinatura",l?"Choose when and how you want to upgrade LiDire.":"Escolha quando e como deseja evoluir sua experiência na LiDire.")}<div class="content-card"><div class="v5-plan-row"><div><strong>${l?"Free Plan":"Plano Gratuito"}</strong><small>${l?"Core organization features":"Recursos essenciais de organização"}</small></div><span>◯</span></div><div class="content-card"><h3>${l?"Premium benefits":"Benefícios do Premium"}</h3><p>${l?"More AI usage, advanced planning and expanded family features can be offered here.":"Maior uso de IA, planejamento avançado e recursos familiares ampliados poderão ser oferecidos aqui."}</p><button class="primary-button" data-action="subscription-coming-soon">${l?"View upgrade options":"Ver opções de upgrade"}</button></div></div>`);}
function termos(){const l=false;return appShell(`${pageHeader("LEGAL",l?"Terms of Use":"Termos de Uso",l?"Review the rules for using LiDire.":"Consulte as regras de utilização da LiDire.")}<div class="content-card"><h3>${l?"LiDire Terms of Use":"Termos de Uso da LiDire"}</h3><p class="muted">${l?"Initial version. The final legal text should be reviewed before official publication.":"Versão inicial. O texto jurídico definitivo deverá ser revisado antes da publicação oficial."}</p><p>${l?"LiDire is a personal organization tool designed to help users manage routines, appointments, tasks, studies, nutrition, finances and other content they choose.":"A LiDire é uma ferramenta de organização pessoal destinada a ajudar o usuário a gerenciar rotina, compromissos, tarefas, estudos, alimentação, finanças e outros conteúdos escolhidos pelo próprio usuário."}</p><p>${l?"Users are responsible for information entered into their account and should protect their credentials.":"O usuário é responsável pelas informações inseridas na conta e deve manter suas credenciais protegidas."}</p><p>${l?"Some features may depend on external integrations, permissions or third-party services.":"Algumas funcionalidades poderão depender de integrações externas, permissões ou serviços de terceiros."}</p></div>`);}

const pages = {
  inicio: home,
  agenda,
  tarefas,
  compras,
  estudos,
  treinos,
  hidratacao,
  alimentacao,
  financas,
  objetivos,
  familia,
  "familia-settings": familySettings,
  cicloMenstrual,
  climaRotas,
  assistente,
  explorar: explorarHub,
  perfil,
  suporte,
  configuracoes,
  configuracoesNotificacoes,
  audioLibrary,
  dietLibrary,
  termos,
  politicas,
  privacidade,
  politicaCookies,
  politicaIA,
  seguranca,
  segurancaPIN,
  segurancaBiometria,
  preferencias,
  dados,
  receitas,
  assinatura,
  sobre,
  anotacoes
};

function navigateTo(page, replace = false) {
  currentPage = page || "inicio";
  currentShoppingList = null;
  const url = `#${encodeURIComponent(currentPage)}`;
  const stateObj = { page: currentPage, lidire: true };
  if (replace) history.replaceState(stateObj, "", url);
  else history.pushState(stateObj, "", url);
  render();
}

function goBack() {
  if (history.length > 1 && history.state?.lidire !== false) {
    history.back();
  } else {
    navigateTo("inicio");
  }
}

function enhanceReminderLinks(){if(!authUser)return;const sourceMap={tarefas:"tarefa",agenda:"compromisso",estudos:"estudo"};const src=sourceMap[currentPage];if(src){document.querySelectorAll('[data-action^="edit-"]').forEach(btn=>{const id=btn.dataset.id;const row=btn.closest(".list-item");if(row&&!row.querySelector("[data-action=\"create-reminder\"]")){const b=document.createElement("button");b.className="text-button";b.dataset.action="create-reminder";b.dataset.source=src;b.dataset.id=id;b.textContent="⏰";b.title="Criar lembrete";row.querySelector(".item-actions")?.prepend(b);}});}}
function render() {
  const root =
    document.getElementById("app");

  if (!root) return;

  if (!authChecked) {
    root.innerHTML = authLoadingScreen();
    return;
  }

  if (!authUser) {
    renderAuth();
    return;
  }

  if (
    currentPage === "compras" &&
    currentShoppingList
  ) {
    root.innerHTML =
      listaCompras(
        currentShoppingList
      );
  } else {
    root.innerHTML =
      (
        pages[currentPage] ||
        home
      )();
  }

  enhanceReminderLinks();
  applyTheme();
  applyLanguage();
  window.scrollTo({top:0,behavior:"smooth"});
  if(currentPage==="inicio") loadRealWeather();
  if(currentPage==="climaRotas") bindClimateRouteForms();
}

/* =========================================================
   MODAIS
   ========================================================= */

function openModal(
  title,
  body,
  options = {}
) {
  closeModal();

  modal =
    document.createElement("div");

  modal.className =
    "modal-backdrop";

  modal.innerHTML = `

    <div
      class="modal"
      role="dialog"
      aria-modal="true"
    >

      <div class="modal-header">

        <div>

          <span class="eyebrow">
            ${esc(
              options.eyebrow ||
              "LIDIRE"
            )}
          </span>

          <h2>
            ${esc(title)}
          </h2>

        </div>

        <button
          class="modal-close"
          data-action="close-modal"
        >
          ×
        </button>

      </div>

      <form
        id="lidire-form"
        class="form-grid"
      >

        ${body}

        <div class="modal-footer">

          <button
            type="button"
            class="ghost-button"
            data-action="close-modal"
          >
            Cancelar
          </button>

          <button
            class="primary-button"
            type="submit"
          >
            ${esc(
              options.submit ||
              "Salvar"
            )}
          </button>

        </div>

      </form>

    </div>
  `;

  document.body.appendChild(modal);
  applyLanguage();
  applyTheme();

  modal
    .querySelector(
      "input, select, textarea"
    )
    ?.focus();
}

function closeModal() {
  document
    .querySelector(
      ".modal-backdrop"
    )
    ?.remove();

  modal = null;
}

function field(
  label,
  name,
  type = "text",
  value = "",
  extra = ""
) {
  return `
    <label class="form-field">

      <span>
        ${esc(label)}
      </span>

      <input
        name="${esc(name)}"
        type="${type}"
        value="${esc(value)}"
        ${extra}
      >

    </label>
  `;
}

function textareaField(
  label,
  name,
  value = "",
  extra = ""
) {
  return `
    <label class="form-field">

      <span>
        ${esc(label)}
      </span>

      <textarea
        name="${esc(name)}"
        ${extra}
      >${esc(value)}</textarea>

    </label>
  `;
}

function selectField(
  label,
  name,
  options,
  selected = ""
) {
  return `
    <label class="form-field">

      <span>
        ${esc(label)}
      </span>

      <select name="${esc(name)}">

        ${options.map(option => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          return `
            <option
              value="${esc(value)}"
              ${value === selected ? "selected" : ""}
            >
              ${esc(label)}
            </option>
          `;
        }).join("")}

      </select>

    </label>
  `;
          }

/* =========================================================
   FORMULÁRIOS DE ADIÇÃO
   ========================================================= */

function addForm(key) {

  /* ---------------- AGENDA ---------------- */

  if (key === "compromissos") {

    openModal(
      "Novo compromisso",

      field(
        "Título",
        "title",
        "text",
        "",
        "required"
      ) +

      field(
        "Data",
        "date",
        "date",
        todayISO(),
        "required"
      ) +

      field(
        "Horário",
        "time",
        "time",
        nowTime()
      ) +

      field(
        "Local",
        "location"
      ) +

      field(
        "Endereço",
        "address",
        "text",
        "",
        'placeholder="Digite ou cole o endereço do compromisso"'
      ),

      {
        submit: "Adicionar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.compromissos.push({
        id: uid("c"),
        title: f.get("title"),
        date: f.get("date"),
        time: f.get("time"),
        location: f.get("location"),
        address: f.get("address") || ""
      });

      saveState();
      closeModal();
      render();

      toast(
        "Compromisso adicionado."
      );
    };

    return;
  }

  /* ---------------- TAREFAS ---------------- */

  if (key === "tarefas") {

    openModal(
      "Nova tarefa",

      field(
        "Tarefa",
        "title",
        "text",
        "",
        "required"
      ) +

      selectField(
        "Prioridade",
        "priority",
        [
          "Baixa",
          "Normal",
          "Média",
          "Alta"
        ],
        "Normal"
      ) +

      field(
        "Data",
        "date",
        "date"
      ) +

      field(
        "Horário",
        "time",
        "time"
      ),

      {
        submit: "Adicionar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.tarefas.push({
        id: uid("t"),
        title: f.get("title"),
        priority:
          f.get("priority") ||
          "Normal",
        date: f.get("date"),
        time: f.get("time"),
        done: false
      });

      saveState();
      closeModal();
      render();

      toast(
        "Tarefa adicionada."
      );
    };

    return;
  }

  /* ---------------- COMPRAS ---------------- */

  if (key === "compras") {

    openModal(
      "Nova lista de compras",

      field(
        "Nome da lista",
        "name",
        "text",
        "",
        "required"
      ),

      {
        submit: "Criar lista"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      if (!state.data.compras) {
        state.data.compras = [];
      }

      const lista = {
        id: uid("lista"),
        name:
          String(
            f.get("name") || ""
          ).trim(),
        items: []
      };

      if (!lista.name) {
        toast(
          "Digite o nome da lista.",
          "error"
        );
        return;
      }

      state.data.compras.push(
        lista
      );

      saveState();

      closeModal();

      currentPage = "compras";
      currentShoppingList = null;

      render();

      toast(
        "Lista criada com sucesso."
      );
    };

    return;
  }

  /* ---------------- ESTUDOS ---------------- */

  if (key === "estudos") {

    openModal(
      "Novo estudo",

      field(
        "Matéria",
        "subject",
        "text",
        "",
        "required"
      ) +

      field(
        "Assunto",
        "topic"
      ) +

      field(
        "Data",
        "date",
        "date",
        todayISO(),
        "required"
      ) +

      field(
        "Horário",
        "time",
        "time"
      ) +

      field(
        "Tempo planejado (min)",
        "duration",
        "number",
        "",
        "min=\"0\""
      ) +

      field(
        "Tempo realizado (min)",
        "effectiveDuration",
        "number",
        "",
        "min=\"0\""
      ) +

      textareaField(
        "Bloco de anotações",
        "notes",
        "",
        'class="notes-box" placeholder="Anote de onde parou e informações importantes sobre o assunto."'
      ) +

      field(
        "Link da bibliografia",
        "link",
        "url",
        "",
        'placeholder="https://..."'
      ),

      {
        submit: "Registrar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.estudos.push({
        id: uid("e"),
        subject:
          f.get("subject"),
        topic:
          f.get("topic"),
        date:
          f.get("date") || todayISO(),
        time:
          f.get("time") || "",
        duration:
          f.get("duration"),
        effectiveDuration:
          f.get("effectiveDuration") || "",
        notes:
          f.get("notes"),
        link:
          f.get("link"),
        done: false
      });

      saveState();
      closeModal();
      render();

      toast(
        "Estudo registrado."
      );
    };

    return;
  }

  /* ---------------- TREINOS ---------------- */

  if (key === "treinos") {

    openModal(
      "Novo treino",

      field(
        "Nome",
        "name",
        "text",
        "",
        "required"
      ) +

      field("Tipo", "type") +
      field("Data planejada", "date", "date", todayISO(), "required") +
      field("Horário do treino", "time", "time", "") +

      field(
        "Duração (min)",
        "duration",
        "number",
        "",
        "min=\"0\""
      ) +

      field(
        "Distância (km)",
        "distance",
        "number",
        "",
        'step="0.01" min="0"'
      ) +

      field(
        "Pace",
        "pace",
        "text",
        "",
        'placeholder="Ex.: 6:30 min/km"'
      ) +

      textareaField(
        "Observações",
        "observations"
      ),

      {
        submit: "Criar treino"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.treinos.push({
        id: uid("tr"),
        name: f.get("name"),
        type: f.get("type"),
        duration:
          f.get("duration"),
        distance:
          f.get("distance"),
        pace:
          f.get("pace"),
        observations: f.get("observations"),
        date: f.get("date") || todayISO(),
        time: f.get("time") || "",
        completed: false,
        completedAt: "",
        exercises: []
      });

      saveState();
      closeModal();
      render();

      toast(
        "Treino criado."
      );
    };

    return;
  }

  /* ---------------- HIDRATAÇÃO ---------------- */

  if (key === "hidratacao") {

    openModal(
      "Registrar água",

      field(
        "Quantidade (ml)",
        "amount",
        "number",
        "300",
        "required min=\"1\""
      ),

      {
        submit: "Registrar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.hidratacao.push({
        id: uid("h"),
        amount:
          Number(f.get("amount")),
        date:
          todayISO(),
        createdAt:
          new Date().toISOString()
      });

      saveState();
      closeModal();
      render();

      toast(
        "Hidratação registrada."
      );
    };

    return;
  }

  /* ---------------- ALIMENTAÇÃO ---------------- */

  if (key === "alimentacao") {
    addMealForm();
    return;
  }

  /* ---------------- FINANÇAS ---------------- */

  if (key === "financas") {

    openModal(
      "Novo lançamento",

      selectField(
        "Tipo",
        "type",
        [
          { value: "expense", label: "Despesa" },
          { value: "income", label: "Receita" }
        ],
        "expense"
      ) +

      field(
        "Descrição",
        "title",
        "text",
        "",
        "required"
      ) +

      field(
        "Valor",
        "value",
        "number",
        "",
        'step="0.01" min="0" required'
      ) +

      field(
        "Categoria",
        "category"
      ) +

      selectField(
        "Moeda",
        "currency",
        [
          { value: "BRL", label: "Real brasileiro (R$)" },
          { value: "USD", label: "Dólar americano (US$)" }
        ],
        "BRL"
      ) +

      field(
        "Data",
        "date",
        "date",
        todayISO()
      ),

      {
        submit: "Salvar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.financas.push({
        id: uid("f"),
        type: f.get("type"),
        title: f.get("title"),
        value:
          Number(f.get("value")),
        category:
          f.get("category") ||
          "Geral",
        currency:
          f.get("currency") || "BRL",
        date:
          f.get("date"),
        createdAt: new Date().toISOString()
      });

      saveState();
      closeModal();
      render();

      toast(
        "Lançamento salvo."
      );
    };

    return;
  }

  /* ---------------- OBJETIVOS ---------------- */

  if (key === "objetivos") {

    openGoalForm();
    return;
  }

  /* ---------------- FAMÍLIA ---------------- */

  if (key === "familia") {

    openModal(
      "Adicionar pessoa",

      field(
        "Nome",
        "name",
        "text",
        "",
        "required"
      ) +

      field(
        "Relação",
        "relation"
      ) +

      field(
        "E-mail",
        "email",
        "email",
        "",
        "required"
      ),

      {
        submit: "Adicionar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);
      const familyName = String(f.get("name") || "").trim();
      const familyEmail = String(f.get("email") || "").trim();
      if (!familyName) { toast("Informe o nome.", "error"); return; }
      if (!familyEmail) { toast("Informe o e-mail.", "error"); return; }

      state.data.familia.push({
        id: uid("m"),
        name:
          String(f.get("name") || "").trim(),
        relation:
          f.get("relation"),
        email:
          String(f.get("email") || "").trim()
      });

      saveState();
      closeModal();
      render();

      toast(
        "Pessoa adicionada."
      );
    };
  }
}

/* =========================================================
   REFEIÇÃO
   ========================================================= */

function openFoodCatalog() {
  const foods = state.data.alimentos || [];
  openModal("Cadastro de alimentos", `
    <p class="muted">Cadastre e gerencie seus alimentos. A unidade de medida fica vinculada ao cadastro.</p>
    <div class="content-card">
      <div class="item-list">
        ${foods.length ? foods.map(f => `
          <div class="list-item">
            <div class="item-main">
              <strong>${esc(f.name)}</strong>
              <span>${Number(f.calories || 0)} kcal · ${esc(f.unit || "g")}</span>
            </div>
            <div class="item-actions">
              <button type="button" data-food-edit="${f.id}" title="Editar alimento">${icon("edit")}</button>
              <button type="button" data-food-delete="${f.id}" title="Excluir alimento">${icon("trash")}</button>
            </div>
          </div>
        `).join("") : `<p class="muted">Nenhum alimento cadastrado.</p>`}
      </div>
    </div>
    <div class="form-field"><span>Novo alimento</span><input name="foodName" placeholder="Nome do alimento"></div>
    <label class="form-field"><span>Unidade de medida</span><select name="foodUnit"><option>g</option><option>kg</option><option>ml</option><option>L</option><option>unidade</option><option>porção</option></select></label>
    <label class="form-field"><span>Quantidade</span><input name="foodQuantity" type="number" min="0" step="0.1" placeholder="Ex.: 100"></label>
    <label class="form-field"><span>Calorias</span><input name="foodCalories" type="number" min="0" step="1" placeholder="kcal por 100 g/ml ou por unidade"></label>
  `,{submit:"Cadastrar alimento"});

  modal.querySelectorAll("[data-food-delete]").forEach(btn => btn.onclick = () => {
    state.data.alimentos = state.data.alimentos.filter(x => x.id !== btn.dataset.foodDelete);
    saveState(); openFoodCatalog(); toast("Alimento excluído.");
  });

  modal.querySelectorAll("[data-food-edit]").forEach(btn => btn.onclick = () => {
    const food = state.data.alimentos.find(x => x.id === btn.dataset.foodEdit);
    if (!food) return;
    openModal("Editar alimento",
      field("Nome do alimento", "name", "text", food.name || "", "required") +
      selectField("Unidade de medida", "unit", ["g","kg","ml","L","unidade","porção"], food.unit || "g") +
      field("Quantidade", "quantity", "number", food.quantity || "", 'min="0" step="0.1"') +
      field("Calorias", "calories", "number", food.calories || 0, 'min="0" step="1" required'),
      { submit: "Salvar alterações" }
    );
    modal.querySelector("#lidire-form").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      food.name = String(f.get("name") || "").trim();
      food.unit = f.get("unit") || "g";
      food.quantity = Number(f.get("quantity") || 0);
      food.calories = Number(f.get("calories") || 0);
      if (!food.name) { toast("Informe o nome do alimento.", "error"); return; }
      saveState(); openFoodCatalog(); toast("Alimento atualizado.");
    };
  });

  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get("foodName") || "").trim();
    if (!name) { toast("Digite o nome do alimento.", "error"); return; }
    state.data.alimentos.push({ id: uid("food"), name, unit: f.get("foodUnit") || "g", quantity: Number(f.get("foodQuantity") || 0), calories: Number(f.get("foodCalories") || 0) });
    saveState(); openFoodCatalog(); toast("Alimento cadastrado.");
  };
}

function addMealForm(existing = null) {

  let foods =
    existing?.foods
      ? clone(existing.foods)
      : [];

  function renderFoodFields() {

    const container =
      modal.querySelector(
        "#food-fields"
      );

    if (!container) return;

    container.innerHTML =
      foods.map((food, index) => `

        <div class="diet-food-row">

          <input
            name="food-name-${index}"
            placeholder="Alimento"
            value="${esc(food.name || "")}"
          >

          <input name="food-qty-${index}" type="number" min="0" step="0.01" placeholder="Quantidade" value="${esc(food.quantity||"")}">
          <select name="food-unit-${index}"><option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option><option value="porção">porção</option></select>
          <input name="food-cal-${index}" type="number" min="0" placeholder="kcal" value="${Number(food.calories||0)}">
          <select name="food-cal-mode-${index}"><option value="auto">Calcular automaticamente</option><option value="manual" ${food.calorieMode==="manual"?"selected":""}>Inserir manualmente</option></select>
          <button type="button" class="danger-button diet-remove-button" data-remove-food="${index}">Excluir</button>

        </div>

      `).join("");

    container
      .querySelectorAll(
        "[data-remove-food]"
      )
      .forEach(button => {

        button.onclick = () => {

          foods.splice(
            Number(
              button.dataset.removeFood
            ),
            1
          );

          renderFoodFields();
        };
      });
  }

  openModal(
    existing
      ? "Editar refeição"
      : "Nova refeição",

    field(
      "Nome da refeição",
      "name",
      "text",
      existing?.name || "",
      "required"
    ) +

    field(
      "Horário",
      "time",
      "time",
      existing?.time ||
      nowTime(),
      "required"
    ) +

    `
      <div class="form-field">

        <span>
          Alimentos e calorias
        </span>

        <div id="food-fields"></div>

        <button
          type="button"
          class="ghost-button"
          id="add-food-button"
        >
          + Adicionar alimento
        </button>

      </div>
    `,

    {
      submit:
        existing
          ? "Salvar"
          : "Adicionar"
    }
  );

  renderFoodFields();

  modal.querySelector(
    "#add-food-button"
  ).onclick = () => {

    foods.push({ name: "", quantity: "", unit: "g", calories: 0, calorieMode: "manual" });

    renderFoodFields();
  };

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    foods =
      foods.map((food, index) => ({
        name: f.get(`food-name-${index}`) || "",
        quantity: f.get(`food-qty-${index}`) || "",
        unit: f.get(`food-unit-${index}`) || "g",
        calorieMode: f.get(`food-cal-mode-${index}`) || "manual",
        calories: Number(f.get(`food-cal-${index}`) || 0)
      }))
      .filter(
        food => food.name.trim()
      );

    if (!foods.length) {
      toast(
        "Adicione pelo menos um alimento.",
        "error"
      );
      return;
    }

    const meal = {
      id:
        existing?.id ||
        uid("meal"),
      name:
        f.get("name"),
      time:
        f.get("time"),
      date:
        existing?.date ||
        todayISO(),
      foods
    };

    if (existing) {

      const index =
        state.data.alimentacao
          .findIndex(
            x => x.id === existing.id
          );

      if (index >= 0) {
        state.data.alimentacao[index] =
          meal;
      }

    } else {
      state.data.alimentacao.push(
        meal
      );
    }

    saveState();
    closeModal();
    render();

    toast(
      existing
        ? "Refeição atualizada."
        : "Refeição adicionada."
    );
  };
}

/* =========================================================
   DIETA
   ========================================================= */

function dietLibrary(){
  const diets=state.data.dietas||[];
  return appShell(`${pageHeader("ALIMENTAÇÃO","Biblioteca de dietas","Salve diferentes planos alimentares e reutilize quando precisar.", `<button class="primary-button compact" data-action="add-dieta">${icon("plus")} Nova dieta</button>`)}<div class="content-card">${diets.length?`<div class="item-list">${diets.map(d=>`<div class="list-item"><div class="module-icon small">🥗</div><div class="item-main"><strong>${esc(d.name||"Dieta")}</strong><span>${d.foods?.length||0} alimentos · salva em ${dateBR((d.createdAt||todayISO()).slice(0,10))}</span></div><div class="item-actions"><button data-action="use-diet" data-id="${d.id}" title="Usar">▶</button><button data-action="edit-diet" data-id="${d.id}">${icon("edit")}</button><button data-action="delete-diet" data-id="${d.id}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<div class="empty-state"><div class="empty-orb">🥗</div><h3>Nenhuma dieta salva</h3><p>Crie sua primeira dieta para começar sua biblioteca.</p></div>`}</div>`);
}
function saveDietToLibrary(diet){if(!diet?.name)return; if(!Array.isArray(state.data.dietas))state.data.dietas=[]; const copy=clone(diet); copy.id=uid("diet");copy.createdAt=new Date().toISOString();state.data.dietas.unshift(copy);}
function editDiet(id){const d=state.data.dietas.find(x=>x.id===id);if(d){state.settings.diet=clone(d);addDietForm(d);}}
function addDietForm(existingDiet = null) {
  const current = existingDiet || state.settings.diet || { name: "", foods: [] };
  let foods = clone(current.foods || []);

  function estimateCalories(name, quantity, unit) {
    const key = String(name || "").trim().toLowerCase();
    const catalog = (state.data.alimentos || []).find(f => String(f.name||"").trim().toLowerCase() === key);
    if (catalog && Number(catalog.calories) > 0) {
      const q = Number(String(quantity||"").replace(",", "."));
      if (!q) return Number(catalog.calories);
      const base = String(catalog.unit || unit || "g").toLowerCase();
      const u = String(unit || base).toLowerCase();
      if (base === u) {
        if (["g","ml"].includes(u)) return Math.round(Number(catalog.calories) * q / 100);
        return Math.round(Number(catalog.calories) * q);
      }
    }
    const common = {
      "arroz": 130, "arroz cozido": 130, "feijão": 76, "feijao": 76,
      "frango": 165, "peito de frango": 165, "ovo": 155, "banana": 89,
      "maçã": 52, "maca": 52, "batata": 87, "aveia": 389,
      "leite": 61, "pão": 265, "pao": 265
    };
    const kcal100 = common[key];
    const q = Number(String(quantity||"").replace(",", "."));
    if (!kcal100 || !q) return 0;
    return Math.round(kcal100 * q / 100);
  }

  function renderFoods() {
    const container = modal.querySelector("#diet-foods");
    if (!container) return;
    container.innerHTML = foods.map((food,index)=>`
      <div class="diet-food-row diet-food-row-complete">
        <label class="inline-field"><span>Alimento</span><input name="diet-food-${index}" placeholder="Ex.: arroz" value="${esc(food.name||"")}"></label>
        <label class="inline-field"><span>Quantidade</span><input name="diet-qty-${index}" type="number" min="0" step="0.01" placeholder="Qtd." value="${esc(food.quantity||"")}"></label>
        <label class="inline-field"><span>Unidade de medida</span><select name="diet-unit-${index}">${["g","kg","ml","L","unidade","porção"].map(u=>`<option value="${u}" ${String(food.unit||"g")===u?"selected":""}>${u}</option>`).join("")}</select></label>
        <label class="inline-field"><span>Parte/refeição</span><input name="diet-meal-${index}" placeholder="Ex.: Almoço" value="${esc(food.meal||"")}"></label>
        <label class="inline-field"><span>Calorias</span><input name="diet-cal-${index}" type="number" min="0" step="1" placeholder="kcal" value="${Number(food.calories||0)}"></label>
        <label class="inline-field"><span>Cálculo</span><select name="diet-cal-mode-${index}"><option value="auto" ${food.calorieMode!=="manual"?"selected":""}>Calcular automaticamente</option><option value="manual" ${food.calorieMode==="manual"?"selected":""}>Inserir manualmente</option></select></label>
        <button type="button" class="danger-button diet-remove-button" data-remove-diet="${index}">Excluir</button>
      </div>
    `).join("");
    container.querySelectorAll("[data-remove-diet]").forEach(btn=>btn.onclick=()=>{ foods.splice(Number(btn.dataset.removeDiet),1); renderFoods(); });
    const refreshAutoCalories = (idx) => {
      const mode = container.querySelector(`[name="diet-cal-mode-${idx}"]`);
      if (!mode || mode.value !== "auto") return;
      const q = container.querySelector(`[name="diet-qty-${idx}"]`).value;
      const u = container.querySelector(`[name="diet-unit-${idx}"]`).value;
      const n = container.querySelector(`[name="diet-food-${idx}"]`).value;
      const cal = container.querySelector(`[name="diet-cal-${idx}"]`);
      if (cal) cal.value = estimateCalories(n,q,u);
    };
    container.querySelectorAll('select[name^="diet-cal-mode-"]').forEach(sel=>sel.addEventListener("change",()=>refreshAutoCalories(Number(sel.name.split("-").pop()))));
    container.querySelectorAll('input[name^="diet-food-"],input[name^="diet-qty-"] ,select[name^="diet-unit-"]').forEach(input=>{
      const idx = Number(input.name.split("-").pop());
      input.addEventListener("input",()=>refreshAutoCalories(idx));
      input.addEventListener("change",()=>refreshAutoCalories(idx));
    });
    foods.forEach((_,idx)=>refreshAutoCalories(idx));
  }

  openModal("Inserir dieta", field("Nome da dieta","dietName","text",current.name||"")+`<div class="form-field"><span>Alimentos da dieta</span><small class="muted">Você pode adicionar vários alimentos sem apagar os anteriores.</small><div id="diet-foods"></div><button type="button" class="ghost-button" id="add-diet-food">+ Adicionar outro alimento</button></div>`,{submit:"Salvar dieta"});
  renderFoods();
  modal.querySelector("#add-diet-food").onclick=()=>{
    const form = modal.querySelector("#lidire-form");
    if (form) {
      const f = new FormData(form);
      const savedDraft = [];
      foods.forEach((food,index)=>{
        const name = f.get(`diet-food-${index}`) || "";
        const quantity = f.get(`diet-qty-${index}`) || "";
        const unit = f.get(`diet-unit-${index}`) || "g";
        const meal = f.get(`diet-meal-${index}`) || "";
        const mode = f.get(`diet-cal-mode-${index}`) || "auto";
        let calories = Number(f.get(`diet-cal-${index}`) || 0);
        if (mode === "auto") calories = estimateCalories(name, quantity, unit);
        savedDraft.push({name, quantity, unit, meal, calories, calorieMode: mode});
      });
      foods = savedDraft;
    }
    foods.push({name:"",quantity:"",unit:"g",meal:"",calories:0,calorieMode:"auto"});
    renderFoods();
  };
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);foods=foods.map((food,index)=>{const mode=f.get(`diet-cal-mode-${index}`)||"auto";let cal=Number(f.get(`diet-cal-${index}`)||0);if(mode==="auto")cal=estimateCalories(f.get(`diet-food-${index}`),f.get(`diet-qty-${index}`),f.get(`diet-unit-${index}`));return {name:f.get(`diet-food-${index}`)||"",quantity:f.get(`diet-qty-${index}`)||"",unit:f.get(`diet-unit-${index}`)||"g",meal:f.get(`diet-meal-${index}`)||"",calories:cal,calorieMode:mode};}).filter(food=>food.name.trim());const diet={id:current.id||uid("diet"),name:f.get("dietName")||"",foods,createdAt:current.createdAt||new Date().toISOString()};
    state.settings.diet=diet;
    if(!Array.isArray(state.data.dietas)) state.data.dietas=[];
    const idx=state.data.dietas.findIndex(x=>x.id===diet.id);
    if(idx>=0) state.data.dietas[idx]=diet; else state.data.dietas.unshift(diet);
    saveState();closeModal();render();toast("Dieta salva.");};
}

/* =========================================================
   DIETA → LISTA DE COMPRAS
   ========================================================= */

function createShoppingListFromDiet() {

  const diet =
    state.settings.diet;

  if (
    !diet ||
    !diet.foods ||
    !diet.foods.length
  ) {
    toast(
      "Cadastre os alimentos da dieta primeiro.",
      "error"
    );
    return;
  }

  const list = {
    id: uid("lista"),
    name:
      diet.name
        ? `Compras - ${diet.name}`
        : "Compras da dieta",
    items:
      diet.foods.map(food => ({
        id: uid("item"),
        name: food.name,
        quantity:
          food.quantity || "",
        category: "Dieta",
        done: false
      }))
  };

  state.data.compras.push(
    list
  );

  saveState();

  currentPage = "compras";
  currentShoppingList = list.id;

  render();

  toast(
    "Lista criada a partir da dieta."
  );
}

/* =========================================================
   TREINO → EXERCÍCIO
   ========================================================= */

function editWorkoutForm(t){openModal("Editar treino",field("Nome","name","text",t.name||"","required")+field("Tipo","type","text",t.type||"")+field("Data planejada","date","date",t.date||todayISO(),"required")+field("Horário do treino","time","time",t.time||"")+field("Duração (min)","duration","number",t.duration||"","min=\"0\"")+field("Distância (km)","distance","number",t.distance||"",'step="0.01" min="0"')+field("Pace","pace","text",t.pace||"")+textareaField("Observações","observations",t.observations||""),{submit:"Salvar"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);Object.assign(t,{name:f.get("name"),type:f.get("type"),date:f.get("date")||todayISO(),time:f.get("time")||"",duration:f.get("duration"),distance:f.get("distance"),pace:f.get("pace"),observations:f.get("observations")});saveState();closeModal();render();toast("Treino atualizado.");};}
function addExerciseForm(treinoId, existing = null) {

  openModal(
    existing
      ? "Editar exercício"
      : "Adicionar exercício",

    field(
      "Exercício",
      "name",
      "text",
      existing?.name || "",
      "required"
    ) +

    field(
      "Carga meta",
      "loadGoal",
      "text",
      existing?.loadGoal || "",
      'placeholder="Ex.: 20 kg"'
    ) +

    field(
      "Carga efetivada",
      "loadDone",
      "text",
      existing?.loadDone || "",
      'placeholder="Ex.: 18 kg"'
    ) +

    field(
      "Repetições meta",
      "repsGoal",
      "number",
      existing?.repsGoal || "",
      "min=\"0\""
    ) +

    field(
      "Repetições efetivadas",
      "repsDone",
      "number",
      existing?.repsDone || "",
      "min=\"0\""
    ),

    {
      submit:
        existing
          ? "Salvar"
          : "Adicionar"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const treino =
      state.data.treinos.find(
        x => x.id === treinoId
      );

    if (!treino) return;

    if (!treino.exercises) {
      treino.exercises = [];
    }

    const exercise = {
      id:
        existing?.id ||
        uid("exercise"),
      name:
        f.get("name"),
      loadGoal:
        f.get("loadGoal"),
      loadDone:
        f.get("loadDone"),
      repsGoal:
        f.get("repsGoal"),
      repsDone:
        f.get("repsDone")
    };

    if (existing) {

      const index =
        treino.exercises.findIndex(
          x => x.id === existing.id
        );

      if (index >= 0) {
        treino.exercises[index] =
          exercise;
      }

    } else {

      treino.exercises.push(
        exercise
      );

    }

    saveState();
    closeModal();
    render();

    toast(
      existing
        ? "Exercício atualizado."
        : "Exercício adicionado."
    );
  };
}

/* =========================================================
   ANIMAÇÃO DE EXERCÍCIO
   ========================================================= */

function exerciseVisual(name){const n=String(name||"").toLowerCase();if(/corrida|correr|run|esteira/.test(n))return "🏃‍♀️";if(/remada|row/.test(n))return "🚣";if(/puxada|pulldown|barra/.test(n))return "💪";if(/agachamento|squat/.test(n))return "🧎";if(/supino|bench|peito/.test(n))return "🏋️";if(/bicicleta|bike|ciclismo/.test(n))return "🚴";if(/abdominal|crunch|abd/.test(n))return "🤸";if(/alongamento|stretch/.test(n))return "🧘";return "🏋️";}
function animateExercise(id){const all=state.data.treinos.flatMap(t=>t.exercises||[]);const ex=all.find(x=>x.id===id);if(!ex)return;openModal(ex.name,`<div class="exercise-animation exercise-specific">${exerciseVisual(ex.name)}</div><p style="text-align:center"><strong>${esc(ex.name)}</strong><br><span class="muted">Demonstração visual específica para este exercício. Quando houver uma mídia cadastrada, ela será exibida aqui.</span></p>`,{submit:"Fechar"});}

/* =========================================================
   CONFIGURAÇÃO DE HIDRATAÇÃO
   ========================================================= */

function configHidratacao() {

  const goal =
    Number(state.settings.hydrationGoal) || 2000;

  const start =
    state.settings.hydrationStart || "08:00";

  const end =
    state.settings.hydrationEnd || "21:00";

  const intervalMinutes =
    Number(state.settings.hydrationIntervalMinutes) ||
    (Number(state.settings.hydrationInterval) || 2) * 60;

  openModal(
    "Meta de hidratação",

    field(
      "Meta diária (ml)",
      "goal",
      "number",
      goal,
      "min=\"1\" required"
    ) +

    field(
      "Início do período",
      "start",
      "time",
      start,
      "required"
    ) +

    field(
      "Fim do período",
      "end",
      "time",
      end,
      "required"
    ) +

    `<label class="form-field">
      <span>Intervalo de consumo</span>
      <select name="intervalMinutes" required>
        ${Array.from({ length: 24 }, (_, i) => {
          const minutes = (i + 1) * 30;
          const selected = minutes === intervalMinutes ? "selected" : "";
          return `<option value="${minutes}" ${selected}>${formatHydrationInterval(minutes)}</option>`;
        }).join("")}
      </select>
    </label>` +

    `<div class="hydration-profile-fields"><h4>Personalização da meta</h4>
      ${field("Sexo", "profileSex", "text", state.settings.hydrationProfile?.sex || state.user.sex || "")}
      ${field("Idade", "profileAge", "number", state.settings.hydrationProfile?.age || state.user.age || "", 'min="14" max="120"')}
      ${field("Peso (kg)", "profileWeight", "number", state.settings.hydrationProfile?.weight || state.user.weight || "", 'min="30" max="300" step="0.1"')}
      ${selectField("Atividade", "profileActivity", [{value:"moderate",label:"Moderada"},{value:"active",label:"Ativa"},{value:"very-active",label:"Muito ativa"},{value:"hot",label:"Ambiente quente"}], state.settings.hydrationProfile?.activity || "moderate")}
      ${selectField("Objetivo", "profileGoal", [{value:"health",label:"Saúde geral"},{value:"performance",label:"Performance"},{value:"weight-loss",label:"Controle de peso"}], state.settings.hydrationProfile?.goal || "health")}
    </div>` +

    `<div class="form-help hydration-calculation" id="hydration-calculation">
      A quantidade por intervalo será calculada automaticamente.
    </div>`,

    {
      submit: "Salvar meta"
    }
  );

  const form = modal.querySelector("#lidire-form");
  const calculation = modal.querySelector("#hydration-calculation");

  function updateHydrationCalculation() {
    const formData = new FormData(form);
    const currentGoal = Number(formData.get("goal")) || 0;
    const currentStart = formData.get("start") || "08:00";
    const currentEnd = formData.get("end") || "21:00";
    const currentIntervalMinutes = Number(formData.get("intervalMinutes")) || 30;

    const [sh, sm] = currentStart.split(":").map(Number);
    const [eh, em] = currentEnd.split(":").map(Number);

    let minutes =
      (eh * 60 + em) -
      (sh * 60 + sm);

    if (minutes <= 0) minutes += 24 * 60;

    const count = Math.max(1, Math.ceil(minutes / currentIntervalMinutes));
    const amount = currentGoal > 0 ? Math.round(currentGoal / count) : 0;

    calculation.innerHTML = `
      <strong>${amount.toLocaleString("pt-BR")} ml por consumo</strong>
      <span>(${count} consumos previstos entre ${esc(currentStart)} e ${esc(currentEnd)})</span>
    `;
  }

  form.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("input", updateHydrationCalculation);
    input.addEventListener("change", updateHydrationCalculation);
  });

  updateHydrationCalculation();

  form.onsubmit = e => {
    e.preventDefault();

    const f = new FormData(e.target);

    state.settings.hydrationGoal = Number(f.get("goal"));
    state.settings.hydrationProfile = {
      sex: String(f.get("profileSex") || ""),
      age: Number(f.get("profileAge") || 0),
      weight: Number(f.get("profileWeight") || 0),
      activity: String(f.get("profileActivity") || "moderate"),
      goal: String(f.get("profileGoal") || "health")
    };
    state.user.age = state.settings.hydrationProfile.age || state.user.age;
    state.user.weight = state.settings.hydrationProfile.weight || state.user.weight;
    state.user.sex = state.settings.hydrationProfile.sex || state.user.sex;
    state.settings.hydrationGoal = calculateHydrationRecommendation().ml;
    state.settings.hydrationStart = f.get("start");
    state.settings.hydrationEnd = f.get("end");
    state.settings.hydrationIntervalMinutes = Number(f.get("intervalMinutes"));
    delete state.settings.hydrationInterval;

    saveState();
    closeModal();
    render();

    toast("Meta de hidratação atualizada.");
  };
}

/* =========================================================
   META DE CALORIAS
   ========================================================= */

function configCalorias() {

  openModal(
    "Meta diária de calorias",

    field(
      "Calorias por dia",
      "goal",
      "number",
      state.settings.calorieGoal,
      "min=\"1\" required"
    ),

    {
      submit: "Salvar meta"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    state.settings.calorieGoal =
      Number(f.get("goal"));

    saveState();
    closeModal();
    render();

    toast(
      "Meta de calorias atualizada."
    );
  };
}

/* =========================================================
   TETOS DE FINANÇAS
   ========================================================= */

function openFinanceEditModal(item){
  openModal("Editar lançamento",selectField("Tipo","type",[{value:"expense",label:"Despesa"},{value:"income",label:"Receita"}],item.type||"expense")+field("Descrição","title","text",item.title||"","required")+field("Valor","value","number",item.value||"",'step="0.01" min="0" required')+field("Categoria","category","text",item.category||"Geral")+selectField("Moeda","currency",[{value:"BRL",label:"Real brasileiro (R$)"},{value:"USD",label:"Dólar americano (US$)"}],item.currency||"BRL")+field("Data","date","date",item.date||todayISO()),{submit:"Salvar alterações"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);Object.assign(item,{type:f.get("type"),title:f.get("title"),value:Number(f.get("value")),category:f.get("category")||"Geral",currency:f.get("currency")||"BRL",date:f.get("date")||todayISO()});saveState();closeModal();render();toast("Lançamento atualizado.");};
}
function financeMonthlyReport(){
  const month=todayISO().slice(0,7);openModal("Relatório mensal",field("Mês","month","month",month,"required")+'<div id="finance-monthly-preview" class="content-card" style="margin-top:12px"></div>',{submit:"Fechar"});
  const update=()=>{const selected=modal.querySelector('[name="month"]').value||month;const rows=state.data.financas.filter(x=>String(x.date||"").startsWith(selected));const sum=(type,cur)=>rows.filter(x=>x.type===type&&(x.currency||"BRL")===cur).reduce((s,x)=>s+Number(x.value||0),0);const cats={};rows.filter(x=>x.type==="expense").forEach(x=>{const k=`${x.currency||"BRL"}::${x.category||"Geral"}`;cats[k]=(cats[k]||0)+Number(x.value||0);});modal.querySelector("#finance-monthly-preview").innerHTML=`<strong>Receitas</strong><p>${money(sum("income","BRL"),"BRL")} · ${money(sum("income","USD"),"USD")}</p><strong>Despesas</strong><p>${money(sum("expense","BRL"),"BRL")} · ${money(sum("expense","USD"),"USD")}</p><strong>Saldo</strong><p>${money(sum("income","BRL")-sum("expense","BRL"),"BRL")} · ${money(sum("income","USD")-sum("expense","USD"),"USD")}</p><strong>Despesas por categoria</strong>${Object.keys(cats).length?`<ul>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{const [cur,cat]=k.split("::");return `<li>${esc(cat)}: ${money(v,cur)}</li>`}).join("")}</ul>`:`<p class="muted">Nenhuma despesa no mês.</p>`}`;};modal.querySelector('[name="month"]').addEventListener("change",update);update();modal.querySelector(".modal-footer .primary-button").onclick=e=>{e.preventDefault();closeModal();};
}
function financeHistory(){
  openModal("Histórico financeiro",field("Data inicial","from","date",todayISO(),"required")+field("Data final","to","date",todayISO(),"required")+'<div id="finance-history-preview" class="content-card" style="margin-top:12px"></div>',{submit:"Fechar"});
  const update=()=>{const f=new FormData(modal.querySelector("#lidire-form"));const from=f.get("from"),to=f.get("to");const rows=state.data.financas.filter(x=>(!from||(x.date||"")>=from)&&(!to||(x.date||"")<=to));modal.querySelector("#finance-history-preview").innerHTML=rows.length?`<div class="item-list">${rows.map(x=>`<div class="list-item"><div class="item-main"><strong>${esc(x.title)}</strong><span>${dateBR(x.date)} · ${esc(x.category||"Geral")}</span></div><strong class="finance-value ${x.type}">${x.type==="income"?"+":"-"} ${money(x.value,x.currency||"BRL")}</strong></div>`).join("")}</div>`:`<p class="muted">Nenhum lançamento encontrado no período.</p>`;};modal.querySelectorAll('[name="from"],[name="to"]').forEach(x=>x.addEventListener("change",update));update();modal.querySelector(".modal-footer .primary-button").onclick=e=>{e.preventDefault();closeModal();};
}
function parseQuantity(value){const m=String(value||"").trim().match(/^(\\d+(?:[.,]\\d+)?)\\s*([a-zA-ZÀ-ÿ]+)?$/);if(!m)return null;return {value:Number(m[1].replace(",",".")),unit:(m[2]||"").toLowerCase()};}
function combineQuantities(a,b){const x=parseQuantity(a),y=parseQuantity(b);if(!x||!y||x.unit!==y.unit)return null;const total=x.value+y.value;const formatted=Number.isInteger(total)?String(total):String(total).replace(".",",");return `${formatted}${x.unit?" "+x.unit:""}`;}
function openMergeShoppingModal(lists){openModal("Juntar listas de compras",field("Nome da nova lista","name","text","Lista de compras combinada","required")+`<label class="form-field"><span>Listas selecionadas</span><div class="muted">${lists.map(x=>`${esc(x.name)} (${(x.items||[]).length} itens)`).join(" · ")}</div></label><label class="form-field"><span><input type="checkbox" name="sumDuplicates" checked> Somar quantidades de itens iguais quando as unidades forem compatíveis</span></label>`,{submit:"Criar nova lista"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get("name")||"").trim();if(!name){toast("Digite o nome da nova lista.","error");return;}const sumDup=f.get("sumDuplicates")==="on",items=[];lists.flatMap(x=>x.items||[]).forEach(item=>{const existing=items.find(y=>y.name.toLowerCase()===String(item.name||"").toLowerCase());if(existing&&sumDup){const combined=combineQuantities(existing.quantity,item.quantity);if(combined)existing.quantity=combined;else if(item.quantity&&existing.quantity&&existing.quantity!==item.quantity)existing.quantity=`${existing.quantity} + ${item.quantity}`;}else if(!existing)items.push({id:uid("item"),name:item.name,quantity:item.quantity||"",category:item.category||"",done:false});});const list={id:uid("lista"),name,items};state.data.compras.push(list);saveState();closeModal();currentPage="compras";currentShoppingList=list.id;render();toast("Nova lista criada a partir das listas selecionadas.");};}

function configFinanceLimits() {

  const categories =
    new Set();

  state.data.financas.forEach(x => {
    if (x.category) {
      categories.add(
        x.category
      );
    }
  });

  Object.keys(
    state.settings.financeLimits || {}
  ).forEach(cat =>
    categories.add(cat)
  );

  const list =
    [...categories];

  openModal(
    "Tetos mensais por categoria",

    `
      ${
        list.length
          ? list.map(cat => `
              ${field(
                cat,
                `limit-${encodeURIComponent(cat)}`,
                "number",
                state.settings
                  .financeLimits?.[cat] || 0,
                'min="0" step="0.01"'
              )}
            `).join("")
          : `
            <p class="muted">
              Cadastre primeiro um gasto com uma categoria.
            </p>
          `
      }

      ${field(
        "Nova categoria",
        "newCategory"
      )}

      ${field(
        "Teto da nova categoria",
        "newLimit",
        "number",
        "",
        'min="0" step="0.01"'
      )}
    `,

    {
      submit: "Salvar tetos"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const limits = {
      ...(state.settings.financeLimits || {})
    };

    list.forEach(cat => {

      const value =
        Number(
          f.get(
            `limit-${encodeURIComponent(cat)}`
          ) || 0
        );

      limits[cat] = value;

    });

    const newCategory =
      String(
        f.get("newCategory") || ""
      ).trim();

    const newLimit =
      Number(
        f.get("newLimit") || 0
      );

    if (newCategory) {
      limits[newCategory] =
        newLimit;
    }

    state.settings.financeLimits =
      limits;

    saveState();
    closeModal();
    render();

    toast(
      "Tetos de gastos atualizados."
    );
  };
}

/* =========================================================
   OBJETIVO
   ========================================================= */

function openGoalForm(existing = null) {

  openModal(
    existing
      ? "Editar objetivo"
      : "Novo objetivo",

    field(
      "Objetivo",
      "title",
      "text",
      existing?.title || "",
      "required"
    ) +

    field(
      "Prazo",
      "deadline",
      "date",
      existing?.deadline || ""
    ) +

    field(
      "Progresso (%)",
      "progress",
      "number",
      existing?.progress || 0,
      'min="0" max="100"'
    ) +

    field(
      "Dinheiro necessário",
      "moneyGoal",
      "number",
      existing?.moneyGoal || 0,
      'min="0" step="0.01"'
    ) +

    selectField(
      "Moeda da meta financeira",
      "moneyCurrency",
      [
        { value: "BRL", label: "Real brasileiro (R$)" },
        { value: "USD", label: "Dólar americano (US$)" }
      ],
      existing?.moneyCurrency || "BRL"
    ) +`<label class="form-field"><span>Categoria financeira vinculada (opcional)</span><input name="financeCategory" value="${esc(existing?.financeCategory||"")}" placeholder="Ex.: Viagem, Notebook, Reserva"></label>` +

    textareaField(
      "Observações",
      "observations",
      existing?.observations || ""
    ),

    {
      submit:
        existing
          ? "Salvar"
          : "Criar objetivo"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const goal = {
      id:
        existing?.id ||
        uid("o"),

      title:
        f.get("title"),

      deadline:
        f.get("deadline"),

      progress:
        Number(
          f.get("progress") || 0
        ),

      moneyGoal:
        Number(
          f.get("moneyGoal") || 0
        ),

      moneyCurrency:
        f.get("moneyCurrency") || "BRL",

      financeCategory: String(f.get("financeCategory") || "").trim(),

      observations:
        f.get("observations"),

      metas:
        existing?.metas || []
    };

    updateGoalProgress(goal);

    if (existing) {

      const index =
        state.data.objetivos
          .findIndex(
            x => x.id === existing.id
          );

      if (index >= 0) {
        state.data.objetivos[index] =
          goal;
      }

    } else {

      state.data.objetivos.push(
        goal
      );

    }

    saveState();
    closeModal();
    render();

    toast(
      existing
        ? "Objetivo atualizado."
        : "Objetivo criado."
    );
  };
}

/* =========================================================
   META INTERNA DO OBJETIVO
   ========================================================= */

function calculateGoalProgress(goal) {
  const metas = Array.isArray(goal?.metas) ? goal.metas : [];
  if (!metas.length) return Number(goal?.progress || 0);
  const completed = metas.filter(meta => meta.done).length;
  return Math.round((completed / metas.length) * 100);
}

function updateGoalProgress(goal) {
  if (!goal) return;
  if (Number(goal.moneyGoal||0) > 0 && goal.financeCategory) {
    const cur=goal.moneyCurrency||"BRL";
    const linked=(state.data.financas||[]).filter(x=>x.type==="income" && (x.currency||"BRL")===cur && String(x.category||"").trim().toLowerCase()===String(goal.financeCategory).trim().toLowerCase()).reduce((sum,x)=>sum+Number(x.value||0),0);
    goal.moneyAccumulated=linked;
    goal.moneyRemaining=Math.max(Number(goal.moneyGoal)-linked,0);
    goal.progress=Math.min(100,Math.round((linked/Number(goal.moneyGoal))*100));
  } else if (Array.isArray(goal.metas) && goal.metas.length) {
    goal.progress = calculateGoalProgress(goal);
  }
}

function addMeta(goalId) {

  openModal(
    "Nova meta do objetivo",

    field(
      "Meta",
      "title",
      "text",
      "",
      "required"
    ) +

    selectField(
      "Periodicidade",
      "period",
      [
        "Diária",
        "Semanal",
        "Mensal"
      ],
      "Diária"
    ),

    {
      submit: "Adicionar meta"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const goal =
      state.data.objetivos.find(
        x => x.id === goalId
      );

    if (!goal) return;

    if (!goal.metas) {
      goal.metas = [];
    }

    goal.metas.push({
      id: uid("meta"),
      title:
        f.get("title"),
      period:
        f.get("period"),
      done: false
    });
    updateGoalProgress(goal);

    saveState();
    closeModal();
    render();

    toast(
      "Meta adicionada ao objetivo."
    );
  };
}

function confirmDeleteGoal(id) {
  const goal = state.data.objetivos.find(x => x.id === id);
  if (!goal) return;
  openModal(
    "Excluir objetivo",
    `<div class="confirm-delete-box"><div class="confirm-delete-icon">⚠</div><p>Tem certeza que deseja excluir <strong>${esc(goal.title)}</strong>?</p><p class="muted">As metas internas e o progresso deste objetivo também serão removidos.</p><div class="confirm-delete-actions"><button type="button" class="ghost-button" data-action="cancel-delete-objetivo">Cancelar</button><button type="button" class="danger-button" data-action="confirm-delete-objetivo" data-id="${goal.id}">Confirmar exclusão</button></div></div>`,
    { submit: "Cancelar" }
  );
  modal.querySelector(".modal-footer").style.display = "none";
}

/* =========================================================
   EDIÇÃO DE COMPROMISSO E TAREFA
   ========================================================= */


function addStudyPlan(existing = null) {
  const x = existing || {
    subject: "",
    period: "semanal",
    date: todayISO(),
    duration: "60",
    note: "",
    done: false
  };

  openModal(
    existing ? "Editar planejamento" : "Novo planejamento",
    `<label class="form-field"><span>Tipo de planejamento</span><select name="period" required><option value="semanal" ${x.period === "semanal" ? "selected" : ""}>Semanal</option><option value="mensal" ${x.period === "mensal" ? "selected" : ""}>Mensal</option></select></label>` +
    field("Matéria / assunto", "subject", "text", x.subject || "", "required") +
    field("Data do estudo", "date", "date", x.date || todayISO(), "required") +
    field("Duração planejada (min)", "duration", "number", x.duration || 60, 'min="1" required') +
    textareaField("Observações", "note", x.note || "", 'placeholder="Ex.: capítulo, exercícios ou conteúdo que será estudado."'),
    { submit: existing ? "Salvar" : "Adicionar" }
  );

  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const value = {
      period: f.get("period"),
      subject: String(f.get("subject") || "").trim(),
      date: f.get("date"),
      duration: Number(f.get("duration") || 0),
      note: f.get("note") || "",
      done: existing ? !!existing.done : false
    };

    if (!value.subject || !value.date || !value.duration) {
      toast("Preencha matéria, data e duração.", "error");
      return;
    }

    if (existing) Object.assign(existing, value);
    else state.data.studyPlans.push({ id: uid("plan"), ...value });

    saveState();
    closeModal();
    render();
    toast(existing ? "Planejamento atualizado." : "Planejamento adicionado.");
  };
}

function editItem(type, id) {

  const key =
    type === "compromisso"
      ? "compromissos"
      : "tarefas";

  const item =
    state.data[key].find(
      x => x.id === id
    );

  if (!item) return;

  if (type === "compromisso") {

    openModal(
      "Editar compromisso",

      field(
        "Título",
        "title",
        "text",
        item.title,
        "required"
      ) +

      field(
        "Data",
        "date",
        "date",
        item.date,
        "required"
      ) +

      field(
        "Horário",
        "time",
        "time",
        item.time || ""
      ) +

      field(
        "Local",
        "location",
        "text",
        item.location || ""
      ) +

      field(
        "Endereço",
        "address",
        "text",
        item.address || "",
        'placeholder="Digite ou cole o endereço do compromisso"'
      ),

      {
        submit: "Salvar"
      }
    );

  } else {

    openModal(
      "Editar tarefa",

      field(
        "Tarefa",
        "title",
        "text",
        item.title,
        "required"
      ) +

      selectField(
        "Prioridade",
        "priority",
        [
          "Baixa",
          "Normal",
          "Média",
          "Alta"
        ],
        item.priority ||
          "Normal"
      ) +

      field(
        "Data",
        "date",
        "date",
        item.date || ""
      ) +

      field(
        "Horário",
        "time",
        "time",
        item.time || ""
      ),

      {
        submit: "Salvar"
      }
    );
  }

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    Object.assign(
      item,
      Object.fromEntries(
        f.entries()
      )
    );

    saveState();
    closeModal();
    render();

    toast(
      "Alterações salvas."
    );
  };
}


/* =========================================================
   AÇÕES PRINCIPAIS
   ========================================================= */

function removeItem(
  key,
  id,
  message = "Item removido."
) {

  state.data[key] =
    state.data[key].filter(
      x => x.id !== id
    );

  saveState();
  render();

  toast(message);
}

async function fileToDataUrl(file){
  if(!(file instanceof File) || !file.size) return "";
  const maxSide=720;
  const maxChars=180000;
  const source=await new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result||""));
    r.onerror=reject;
    r.readAsDataURL(file);
  });
  if(!String(file.type||"").startsWith("image/")) throw new Error("Selecione uma imagem válida.");
  const img=await new Promise((resolve,reject)=>{
    const el=new Image();
    el.onload=()=>resolve(el);
    el.onerror=()=>reject(new Error("Não foi possível ler esta imagem. Escolha JPG ou PNG."));
    el.src=source;
  });
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width||1,img.naturalHeight||img.height||1));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
  canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
  const ctx=canvas.getContext("2d");
  if(!ctx) return source;
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(const quality of [0.78,0.68,0.58,0.48]){
    const data=canvas.toDataURL("image/jpeg",quality);
    if(data.length<=maxChars) return data;
  }
  return canvas.toDataURL("image/jpeg",0.38);
}
function openFamilyForm(existing=null){
  const defaults={
    agenda:true,tarefas:true,compras:true,estudos:false,treinos:false,
    hidratacao:false,alimentacao:false,financas:false,objetivos:true,
    cicloMenstrual:false,lembretes:true
  };
  const p={...defaults,...(existing?.permissions||{})};
  const labels={
    agenda:["📅","Agenda"],
    tarefas:["✓","Tarefas"],
    compras:["🛒","Compras"],
    estudos:["📚","Estudos"],
    treinos:["🏋️","Treinos"],
    hidratacao:["💧","Hidratação"],
    alimentacao:["🍽️","Alimentação"],
    financas:["💰","Finanças"],
    objetivos:["🎯","Objetivos"],
    cicloMenstrual:["🌸","Ciclo menstrual"],
    lembretes:["🔔","Lembretes"]
  };
  const perms=Object.entries(labels).map(([k,[ico,label]])=>`
    <label class="family-permission-option">
      <input type="checkbox" name="perm_${k}" ${p[k]?"checked":""}>
      <span class="family-permission-icon" aria-hidden="true">${ico}</span>
      <span class="family-permission-name">${label}</span>
    </label>
  `).join("");
  openModal(
    existing?"Editar pessoa":"Adicionar pessoa",
    field("Nome","name","text",existing?.name||"","required")+
    field("Relação","relation","text",existing?.relation||"Membro")+
    field("E-mail","email","email",existing?.email||"","required")+
    field("Endereço (opcional)","address","text",existing?.address||"",'placeholder="Rua, número, bairro, cidade"')+`<label class="form-field"><span>Foto do membro</span><input type="file" name="photo" accept="image/*"></label>`+
    `<div class="family-permissions-editor">
      <div class="family-permissions-editor-title">
        <h3>Permissões de compartilhamento</h3>
        <p class="muted">Escolha exatamente quais áreas esta pessoa poderá acessar.</p>
      </div>
      <div class="family-permission-options">${perms}</div>
    </div>`,
    {submit:existing?"Salvar alterações":"Adicionar"}
  );
  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const person=existing||{
      id:uid("family"),name:"",relation:"Membro",email:"",address:"",
      permissions:{},inviteStatus:"local"
    };
    person.name=String(f.get("name")||"").trim();
    person.relation=String(f.get("relation")||"Membro").trim();
    person.email=String(f.get("email")||"").trim();
    person.address=String(f.get("address")||"").trim();
    person.permissions={};
    Object.keys(defaults).forEach(k=>person.permissions[k]=f.get("perm_"+k)==="on");
    if(!person.name){toast("Informe o nome.","error");return;}
    if(!person.email){toast("Informe o e-mail.","error");return;}
    const photoFile=f.get("photo");
    try {
      if(photoFile && photoFile instanceof File && photoFile.size){
        person.photo=await fileToDataUrl(photoFile);
      }
      const check=await apiRequest(`/api/family/check-email?email=${encodeURIComponent(person.email)}`,{method:"GET"});
      if(!existing && check.alreadyFamilyMember){toast("Este e-mail já está cadastrado na família.","error");return;}
      const accountExists=!!check.accountExists;
      const needsInvite=!accountExists;
      if(!existing && needsInvite && !confirm("usuário não cadastrado. Enviar link de convite?")) return;
      const payload={name:person.name,relation:person.relation,email:person.email,address:person.address,permissions:person.permissions,photo:person.photo||""};
      if(existing?.serverId) {
        const data=await apiRequest(`/api/family/members/${encodeURIComponent(existing.serverId)}`,{method:"PUT",body:JSON.stringify(payload)});
        if(data?.member?.id) person.serverId=data.member.id;
        person.inviteStatus=data?.member?.status||person.inviteStatus;
      } else {
        // Mesmo quando o e-mail ainda não possui conta, gravamos o membro como
        // pending no D1 antes de gerar o convite. Assim o cadastro não fica
        // apenas no aparelho e continua visível após recarregar a página.
        const data=await apiRequest("/api/family/members",{method:"POST",body:JSON.stringify(payload)});
        if(data?.member?.id) person.serverId=data.member.id;
        person.inviteStatus=data?.member?.status||person.inviteStatus;
      }
      // Re-read the family list from D1 so the visible state is the same as the database.
      await loadFamilyMembers();
      closeModal();
      render();
      toast(existing?"Pessoa atualizada e salva no D1.":"Pessoa adicionada e salva no D1.");
      if(needsInvite && !existing) createFamilyInviteFor(person);
    } catch(error){ toast(error?.message||"Não foi possível salvar o familiar agora.","error"); }
  };
}
function encodeFamilyInvite(person){
  return btoa(unescape(encodeURIComponent(JSON.stringify({
    type:"family", id:person.id, email:person.email||"", language:false?"en-US":"pt-BR", ts:Date.now()
  })))).replace(/=+$/,"");
}
function decodeFamilyInvite(token){
  try{
    const raw=decodeURIComponent(escape(atob(String(token||""))));
    const data=JSON.parse(raw);
    return data?.type==="family"?data:null;
  }catch{return null;}
}
function renderInviteLanding(token){
  const invite=decodeFamilyInvite(token);
  if(!invite){
    document.getElementById("app").innerHTML=`
      <div class="invite-page"><div class="invite-card invite-invalid">
        <img src="/logo-lidire-oficial.png" alt="LiDire" class="invite-logo">
        <span class="eyebrow">LIDIRE</span>
        <h1>Convite inválido ou expirado.</h1>
        <p class="muted">Solicite um novo convite à pessoa que enviou este link.</p>
        <button class="primary-button" data-action="invite-back">Voltar para a LiDire</button>
      </div></div>`;
    return;
  }
  const lang=invite.language==="en-US" || (invite.language!="pt-BR" && false);
  document.documentElement.lang=lang?"en-US":"pt-BR";
  document.getElementById("app").innerHTML=`
    <div class="invite-page">
      <div class="invite-glow"></div>
      <section class="invite-card">
        <img src="/lidire-invite-preview.png" alt="Convite familiar LiDire" class="invite-banner">
        <img src="/logo-lidire-oficial.png" alt="LiDire" class="invite-logo">
        <span class="eyebrow">${lang?"FAMILY INVITATION":"CONVITE FAMILIAR"}</span>
        <h1>${lang?"You received an invitation to LiDire 💜":"Você recebeu um convite para a LiDire 💜"}</h1>
        <p>${lang?"Someone invited you to be part of their family routine on LiDire.":"Você foi convidado(a) para fazer parte da rotina familiar de alguém na LiDire."}</p>
        <div class="invite-note">
          <span>🔐</span>
          <div><strong>${lang?"Private and controlled sharing":"Compartilhamento privado e controlado"}</strong>
          <small>${lang?"You choose what information is shared. This link does not expose the sender's data.":"Você escolhe o que será compartilhado. Este link não expõe os dados de quem enviou o convite."}</small></div>
        </div>
        <button class="primary-button invite-main-action" data-action="invite-continue">${lang?"Continue to LiDire":"Continuar para a LiDire"}</button>
        <button class="ghost-button invite-secondary-action" data-action="invite-copy" data-token="${esc(token)}">${lang?"Copy invitation link":"Copiar link do convite"}</button>
        <small class="invite-footnote">${lang?"The invitation is a preview. Account access and permissions are only granted through the LiDire account flow.":"Este convite é uma prévia. O acesso à conta e as permissões só são concedidos pelo fluxo da conta LiDire."}</small>
      </section>
    </div>`;
}
function createFamilyInviteFor(person){
  const token=encodeFamilyInvite(person);
  const link=`${location.origin}/convite?token=${token}`;
  const lang=false;
  openModal(
    lang?"Family invitation":"Convite familiar",
    `<div class="invite-preview">
      <div class="invite-preview-card">
        <img src="/logo-lidire-oficial.png" alt="LiDire">
        <span class="eyebrow">${lang?"FAMILY INVITATION":"CONVITE FAMILIAR"}</span>
        <h3>${lang?"You received an invitation to LiDire 💜":"Você recebeu um convite para a LiDire 💜"}</h3>
        <p>${lang?"Private sharing, controlled by you.":"Compartilhamento privado, controlado por você."}</p>
      </div>
      <label class="form-field"><span>${lang?"Invitation link":"Link do convite"}</span><input id="familyInviteLink" value="${esc(link)}" readonly></label>
      <p class="muted invite-security-note">🔐 ${lang?"This link does not expose your data.":"Este link não expõe seus dados."}</p>
    </div>`,
    {submit:lang?"Copy link":"Copiar link"}
  );
  modal.querySelector("#lidire-form").onsubmit=e=>{
    e.preventDefault();
    navigator.clipboard?.writeText(link).catch(()=>{});
    const whatsapp=`https://wa.me/?text=${encodeURIComponent((lang?"Join me on LiDire 💜 ":"Venha fazer parte da minha família na LiDire 💜 ")+link)}`;
    closeModal();
    openModal(
      lang?"Share invitation":"Compartilhar convite",
      `<div class="invite-share-actions">
        <a class="primary-button" href="${whatsapp}" target="_blank" rel="noopener noreferrer">💬 ${lang?"Share on WhatsApp":"Compartilhar pelo WhatsApp"}</a>
        <button type="button" class="ghost-button" data-action="copy-family-invite" data-link="${esc(link)}">🔗 ${lang?"Copy link":"Copiar link"}</button>
        <button type="button" class="ghost-button" data-action="create-promo-link">📱 ${lang?"Installation QR code":"QR Code de instalação"}</button>
      </div>`,
      {submit:lang?"Close":"Fechar"}
    );
  };
}
function createPromoLink(){
  const link=`${location.origin}/divulgacao`;
  navigator.clipboard?.writeText(link).catch(()=>{});
  const lang=false;
  openModal(lang?"Install LiDire":"Instalar a LiDire",
    `<div class="install-invite-card" style="text-align:center">
      <p class="muted">${lang?"Scan the QR code with your phone to open the LiDire installation page.":"Aponte a câmera do celular para o QR Code e abra a página de instalação da LiDire."}</p>
      <img src="/lidire-install-qr.png" alt="QR Code LiDire" style="display:block;width:min(280px,80vw);height:auto;margin:18px auto;border-radius:18px;background:#fff;padding:12px;box-sizing:border-box" loading="eager">
      <strong style="display:block;margin-bottom:8px">${lang?"LiDire installation link":"Link de instalação da LiDire"}</strong>
      <label class="form-field"><input value="${esc(link)}" readonly></label>
      <div class="invite-share-actions"><button type="button" class="ghost-button" data-action="copy-promo-link" data-link="${esc(link)}">🔗 ${lang?"Copy link":"Copiar link"}</button><a class="ghost-button" href="/lidire-install-qr.png" download="LiDire-QR-Code.png">⬇ ${lang?"Download QR code":"Baixar QR Code"}</a></div>
    </div>`,
    {submit:lang?"Close":"Fechar"});
}

function handleAction(
  action,
  el
) {
  if(action==="toggle-ai-conversation-storage"){state.settings.aiConversationStorage=!!el.checked;saveState();toast(state.settings.aiConversationStorage?"Conversas com a IA serão registradas conforme suas preferências.":"Novas conversas com a IA não serão registradas.");return;}
  if(action==="future-google-maps"){toast("A consulta dos endereços no Google Maps será implementada em versões futuras.");return;}
  if(action==="future-sync-app"){toast(`${el.dataset.app} será implementado em versões futuras.`);return;}
  if(action==="delete-family-photo"){const p=state.data.familia.find(x=>x.id===el.dataset.id);if(p){p.photo="";saveState();render();toast("Foto removida.");}return;}
  if(action==="delete-familia"){const person=state.data.familia.find(x=>x.id===el.dataset.id);if(!person)return;if(!confirm(`Excluir ${person.name||"este membro"} da família?`))return;(async()=>{try{if(person.serverId)await apiRequest(`/api/family/members/${encodeURIComponent(person.serverId)}`,{method:"DELETE",body:"{}"});await loadFamilyMembers();render();toast("Membro excluído.");}catch(error){toast(error?.message||"Não foi possível excluir o membro.","error");}})();return;}
  if(action==="notify-reminder-family"){const r=state.data.lembretes.find(x=>x.id===el.dataset.id);if(!r)return;openFamilyPicker(`Notificar sobre: ${r.title||"Lembrete"}`,r.message||r.title||"Lembrete");return;}
  if(action==="notify-shopping-family"){openFamilyPicker("Notificar membro da família","Quero compartilhar uma lista de compras.");return;}

  if (action === "copy-promo-link") { const link=el.dataset.link||`${location.origin}/divulgacao`; navigator.clipboard?.writeText(link).catch(()=>{}); toast(false?"Installation link copied.":"Link de instalação copiado."); return; }
  if (action === "family-settings") { currentPage="familia-settings"; render(); return; }
  if (action === "open-notifications") { currentPage="configuracoesNotificacoes"; render(); return; }
  if (action === "family-toggle-feature") {
    state.settings.familySharing=state.settings.familySharing||{};
    const key=el.dataset.key;
    const current=state.settings.familySharing[key];
    state.settings.familySharing[key]=current===undefined ? false : !current;
    saveState(); render(); return;
  }
  if (action === "family-connect-app") {
    state.settings.familySharing=state.settings.familySharing||{};
    const key=`connected_${el.dataset.key}`;
    state.settings.familySharing[key]=!state.settings.familySharing[key];
    saveState(); render();
    toast(state.settings.familySharing[key]?"Integração marcada como conectada.":"Integração desconectada.");
    return;
  }
  if (action === "family-confirm-reschedule") {
    const item=state.data.compromissos.find(x=>x.id===el.dataset.id);
    if(item){ item.familyConfirmed=true; saveState(); render(); toast("Presença confirmada."); }
    return;
  }
  if (action === "family-propose-time") {
    const item=state.data.compromissos.find(x=>x.id===el.dataset.id);
    if(item) openModal("Propor outro horário", field("Novo horário","time","time",item.time||"20:00"), {submit:"Enviar proposta"});
    if(modal){ modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target); if(item){item.proposedTime=String(f.get("time")||"");saveState();}closeModal();toast("Proposta enviada à família.");}; }
    return;
  }
  if (action === "family-view-shopping") {
    currentShoppingList=el.dataset.id||null; currentPage="compras"; render(); return;
  }
  if (action === "family-remind-shopping") { toast("Lembrete da lista de compras agendado para mais tarde."); return; }
  if (action === "mark-family-notification-read") {
    const id=el.dataset.id; apiRequest(`/api/notifications/${encodeURIComponent(id)}`,{method:"POST",body:"{}"}).then(()=>loadFamilyNotifications(false)).catch(()=>{}); return;
  }
  if (action === "send-family-notification") {
    const person=state.data.familia.find(x=>x.id===el.dataset.id);
    if(!person) return;
    openModal(`Enviar para ${person.name||"familiar"}`,field("Título","title","text","LiDire — Família","required")+textareaField("Mensagem","message","",'required'),{submit:"Enviar notificação"});
    modal.querySelector("#lidire-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await apiRequest("/api/family/notifications",{method:"POST",body:JSON.stringify({memberId:person.serverId||"",recipientEmail:person.email,title:String(f.get("title")||"LiDire — Família"),message:String(f.get("message")||"")})});closeModal();toast("Notificação enviada.");}catch(error){toast(error?.message||"Não foi possível enviar a notificação.","error");}};
    return;
  }
  if (action === "route-use-gps") { const input=document.getElementById("route-origin"); if(input){input.value="Minha localização";input.dataset.gps="1";} getCurrentDeviceLocation().then(()=>toast("Localização autorizada. Agora informe o destino.")).catch(err=>toast(err.message,"error")); return; }
  if (action === "add-lugar") { openPlaceForm(); return; }
  if (action === "edit-lugar") { const place=(state.data.lugares||[]).find(x=>x.id===el.dataset.id); if(place) openPlaceForm(place); return; }
  if (action === "delete-lugar") { const place=(state.data.lugares||[]).find(x=>x.id===el.dataset.id); if(!place)return; if(!confirm(`Excluir o lugar “${place.name}”?`))return; state.data.lugares=state.data.lugares.filter(x=>x.id!==place.id); saveState(); render(); toast("Lugar excluído."); return; }
  if (action === "add-familia") { openFamilyForm(); return; }
  if (action === "edit-familia") { const person=state.data.familia.find(x=>x.id===el.dataset.id); if(person) openFamilyForm(person); return; }
  if (action === "family-invite-link") { const person=state.data.familia.find(x=>x.id===el.dataset.id); if(person) createFamilyInviteFor(person); return; }
  if (action === "create-family-invite") { openFamilyForm(); return; }
  if (action === "create-promo-link") { createPromoLink(); return; }
  if (action === "invite-copy") {
    const token=el.dataset.token||"";
    navigator.clipboard?.writeText(`${location.origin}/convite?token=${token}`).catch(()=>{});
    toast(false?"Invitation link copied.":"Link do convite copiado.");
    return;
  }
  if (action === "copy-family-invite") {
    navigator.clipboard?.writeText(el.dataset.link||"").catch(()=>{});
    toast(false?"Invitation link copied.":"Link do convite copiado.");
    return;
  }
  if (action === "invite-back") { history.replaceState(null,"",location.pathname); initAuth(); return; }
  if (action === "invite-continue") {
    const token=new URLSearchParams(location.search).get("convite")||"";
    sessionStorage.setItem("lidire_pending_family_invite",token);
    history.replaceState(null,"",location.pathname);
    authMode="login";
    authChecked=true;
    authUser=null;
    renderAuth();
    return;
  }
  if (action === "edit-lembrete") { const r=state.data.lembretes.find(x=>x.id===el.dataset.id); if(r) openReminderForm(r); return; }
  if (action === "delete-lembrete") { const r=state.data.lembretes.find(x=>x.id===el.dataset.id); if(!r)return; if(confirm(`Excluir o lembrete “${r.title||"Lembrete"}”?`)){state.data.lembretes=state.data.lembretes.filter(x=>x.id!==r.id);saveState();apiRequest(`/api/reminders/${encodeURIComponent(r.id)}`,{method:"DELETE",body:"{}"}).catch(()=>{});render();toast("Lembrete excluído.");} return; }
  if (action === "toggle-reminder") { const r=state.data.lembretes.find(x=>x.id===el.dataset.id); if(r){r.paused=!r.paused;saveState();apiRequest("/api/reminders",{method:"POST",body:JSON.stringify({...r,timezoneOffsetMinutes:new Date().getTimezoneOffset()})}).catch(()=>{});render();toast(r.paused?"Lembrete pausado.":"Lembrete ativado.");} return; }

  /* AUTENTICAÇÃO */

  if (action === "auth-switch") {
    handleAuthSwitch();
    return;
  }

  if (action === "auth-toggle-password") {
    togglePasswordInput("auth-password");
    return;
  }

  if (action === "auth-toggle-password-confirm") {
    togglePasswordInput("auth-password-confirm");
    return;
  }

  if (action === "forgot-password") {
    openPasswordRecovery();
    return;
  }

  if (action === "go-back") {
    goBack();
    return;
  }

  if (action === "logout") {
    if (!confirm("Deseja sair da sua conta? Você será desconectada deste dispositivo. Seus dados não serão excluídos.")) return;
    logoutLiDire();
    return;
  }

  if (action === "assistant-voice") {
    startAssistantVoice();
    return;
  }

  if (action === "assistant-speak-last") {
    if (lastAssistantResponse && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanAssistantText(lastAssistantResponse));
      utterance.lang = "pt-BR";
      window.speechSynthesis.speak(utterance);
    } else {
      toast("Faça uma pergunta primeiro.", "error");
    }
    return;
  }

  if (action === "auth-legal") {
    alert("Os Termos de Uso e a Política de Privacidade estarão disponíveis nesta etapa do cadastro.");
    return;
  }

  if (action === "assistant-open-module") {
    const page = String(el.dataset.page || "");
    if (page) {
      navigateTo(page);
    }
    return;
  }
  if (action === "recipe-coming-soon") { openRecipeGenerator(); return; }
  if (action === "note-coming-soon") { toast("As anotações serão conectadas ao D1 na próxima etapa."); return; }
  if (action === "assistant-focus") { startAssistantVoice(); return; }
  if (action === "subscription-coming-soon") { toast(false?"Subscription options will be connected in the next release.":"As opções de assinatura serão conectadas na próxima versão."); return; }
  if (action === "preference-theme") { openThemeSettings(); return; }
  if(action==="add-note"||action==="edit-note"){const n=action==="edit-note"?(state.data.anotacoes||[]).find(x=>x.id===el.dataset.id):null;openModal(n?"Editar anotação":"Nova anotação",field("Título","title","text",n?.title||"Anotação","required")+textareaField("Texto","text",n?.text||"",'required'),{submit:"Salvar"});modal.querySelector("#lidire-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const item={id:n?.id||uid("note"),title:String(f.get("title")||"Anotação"),text:String(f.get("text")||"")};const i=(state.data.anotacoes||[]).findIndex(x=>x.id===item.id);if(i>=0)state.data.anotacoes[i]=item;else state.data.anotacoes.unshift(item);saveState();try{await apiRequest("/api/notes",{method:"POST",body:JSON.stringify(item)});}catch{}closeModal();render();};return;}
  if(action==="delete-note"){const id=el.dataset.id;state.data.anotacoes=(state.data.anotacoes||[]).filter(x=>x.id!==id);saveState();apiRequest(`/api/notes/${encodeURIComponent(id)}`,{method:"DELETE"}).catch(()=>{});render();return;}
  if (action === "export-data") { apiRequest("/api/data/export",{method:"GET"}).then(data=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`lidire-dados-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Dados exportados do D1.");}).catch(e=>toast(e.message||"Não foi possível exportar os dados.","error")); return; }
  if (action === "delete-account") {
    if (!confirm("Excluir definitivamente sua conta e os dados associados? Esta ação não pode ser desfeita.")) return;
    apiRequest("/api/account", { method: "DELETE" })
      .then(() => { localStorage.removeItem(STORAGE_KEY); state = clone(defaultState); authUser = null; authChecked = true; authMode = "login"; renderAuth(); toast("Conta excluída."); })
      .catch(error => toast(error.message || "Não foi possível excluir a conta.", "error"));
    return;
  }

  /* QUICK ADD */

  if (action === "quick-add") {

    openModal(
      "Adicionar rápido",

      `
        <p class="muted" style="grid-column:1/-1;margin-top:-4px;">
          Crie rapidamente um registro sem precisar abrir o menu Explorar.
        </p>

        <div class="quick-actions">

          ${[
            ["compromissos", "▣", "Compromisso"],
            ["tarefas", "✓", "Tarefa"],
            ["compras", "🛒", "Lista de compras"],
            ["alimentacao", "🍽", "Refeição"],
            ["hidratacao", "◉", "Água"],
            ["financas", "R$", "Lançamento"],
            ["treinos", "♢", "Treino"],
            ["objetivos", "◎", "Objetivo"]
          ]
            .map(
              x => `
                <button
                  type="button"
                  class="quick-option"
                  data-action="quick-option"
                  data-key="${x[0]}"
                >
                  <span>${x[1]}</span>
                  ${x[2]}
                </button>
              `
            )
            .join("")}

        </div>
      `,

      {
        submit: "Fechar"
      }
    );

    modal.querySelector(
      ".modal-footer"
    ).style.display = "none";

    return;
  }

  if (action === "quick-option") {

    const key =
      el.dataset.key;

    closeModal();
    addForm(key);

    return;
  }

  if (action === "close-modal") {
    closeModal();
    return;
  }

  if (
    action.startsWith("add-") &&
    action !== "add-item-compra" &&
    action !== "add-study-plan" &&
    action !== "add-dieta" &&
    action !== "add-meta" &&
    action !== "add-exercicio"
  ) {

    addForm(
      action.slice(4)
    );

    return;
  }

  /* COMPRAS */

  if (action === "open-lista-compras") {

    currentPage = "compras";

    currentShoppingList =
      el.dataset.id;

    render();

    return;
  }

  if (action === "back-compras") {

    currentPage = "compras";
    currentShoppingList = null;

    render();

    return;
  }

  if (action === "edit-lista-compras") {
    const lista=state.data.compras.find(x=>x.id===el.dataset.id); if(!lista)return;
    openModal("Editar lista de compras",field("Nome da lista","name","text",lista.name||"","required"),{submit:"Salvar nome"});
    modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const name=String(new FormData(e.target).get("name")||"").trim();if(!name){toast("Digite o nome da lista.","error");return;}lista.name=name;saveState();closeModal();render();toast("Nome da lista atualizado.");};
    return;
  }
  if (action === "merge-shopping-lists") {
    const selected=[...document.querySelectorAll(".shopping-merge-check:checked")].map(x=>x.value);if(selected.length<2){toast("Selecione pelo menos duas listas.","error");return;}openMergeShoppingModal(state.data.compras.filter(x=>selected.includes(x.id)));return;
  }

  if (action === "delete-lista-compras") {

    const id =
      el.dataset.id;

    if (
      !confirm(
        "Excluir esta lista de compras?"
      )
    ) {
      return;
    }

    state.data.compras =
      state.data.compras.filter(
        x => x.id !== id
      );

    saveState();

    render();

    toast(
      "Lista excluída."
    );

    return;
  }

  if (action === "add-item-compra") {

    const listId =
      el.dataset.id;

    const lista =
      state.data.compras.find(
        x => x.id === listId
      );

    if (!lista) return;

    openModal(
      "Adicionar item",

      field(
        "Item",
        "name",
        "text",
        "",
        "required"
      ) +

      field(
        "Quantidade",
        "quantity"
      ) +

      field(
        "Categoria",
        "category"
      ),

      {
        submit: "Adicionar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      lista.items =
        lista.items || [];

      lista.items.push({
        id: uid("item"),
        name:
          f.get("name"),
        quantity:
          f.get("quantity"),
        category:
          f.get("category"),
        done: false
      });

      saveState();
      closeModal();
      render();

      toast(
        "Item adicionado."
      );
    };

    return;
  }

  if (action === "toggle-item-compra") {

    const lista =
      state.data.compras.find(
        x =>
          x.id ===
          el.dataset.listId
      );

    if (!lista) return;

    const item =
      (lista.items || []).find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!item) return;

    item.done = !item.done;

    saveState();
    render();

    return;
  }

  if (action === "delete-item-compra") {

    const lista =
      state.data.compras.find(
        x =>
          x.id ===
          el.dataset.listId
      );

    if (!lista) return;

    lista.items =
      (lista.items || []).filter(
        x =>
          x.id !==
          el.dataset.id
      );

    saveState();
    render();

    toast(
      "Item removido."
    );

    return;
  }

  if (action === "lista-dieta-para-compras") {
    const lista = state.data.compras.find(x => x.id === el.dataset.id);
    const diet = state.settings.diet;
    if (!lista || !diet?.foods?.length) { toast("Cadastre a dieta primeiro.", "error"); return; }
    const groups = [...new Set(diet.foods.map(f => f.meal || "Todos"))];
    openModal("Importar alimentos da dieta", `
      <p class="muted">Escolha a parte da dieta que deseja importar para esta lista.</p>
      ${selectField("Parte da dieta", "dietPart", groups.map(g => ({value:g,label:g})), "Todos")}
    `, {submit:"Importar"});
    modal.querySelector("#lidire-form").onsubmit = e => {
      e.preventDefault();
      const part = new FormData(e.target).get("dietPart");
      const foods = diet.foods.filter(f => part === "Todos" || (f.meal || "Todos") === part);
      lista.items = lista.items || [];
      foods.forEach(food => {
        const existing = lista.items.find(item => item.name.toLowerCase() === food.name.toLowerCase());
        if (!existing) lista.items.push({id:uid("item"), name:food.name, quantity:food.quantity || "", category:food.meal || "Dieta", done:false});
      });
      saveState(); closeModal(); render(); toast("Alimentos da dieta importados.");
    };
    return;
  }

  /* TAREFAS */

  if (action === "toggle-tarefa") {

    const item =
      state.data.tarefas.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (item) {
      item.done = !item.done;
    }

    saveState();
    render();

    return;
  }

  if (action === "edit-tarefa") {

    editItem(
      "tarefa",
      el.dataset.id
    );

    return;
  }

  if (action === "edit-compromisso") {

    editItem(
      "compromisso",
      el.dataset.id
    );

    return;
  }

  /* PLANEJAMENTO DE ESTUDOS */

  if (action === "add-study-plan") {
    addStudyPlan();
    return;
  }

  if (action === "toggle-study-plan") {
    const plan = (state.data.studyPlans || []).find(x => x.id === el.dataset.id);
    if (plan) plan.done = !plan.done;
    saveState();
    render();
    return;
  }

  if (action === "edit-study-plan") {
    const plan = (state.data.studyPlans || []).find(x => x.id === el.dataset.id);
    if (plan) addStudyPlan(plan);
    return;
  }

  if (action === "delete-study-plan") {
    state.data.studyPlans = (state.data.studyPlans || []).filter(x => x.id !== el.dataset.id);
    saveState();
    render();
    toast("Planejamento removido.");
    return;
  }

  /* ESTUDOS */

  if (action === "toggle-estudo") {

    const item =
      state.data.estudos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (item) {
      item.done = !item.done;
    }

    saveState();
    render();

    return;
  }

  if (action === "edit-estudo") {

    const item =
      state.data.estudos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!item) return;

    openModal(
      "Editar estudo",

      field(
        "Matéria",
        "subject",
        "text",
        item.subject,
        "required"
      ) +

      field(
        "Assunto",
        "topic",
        "text",
        item.topic || ""
      ) +

      field(
        "Data",
        "date",
        "date",
        item.date || todayISO()
      ) +

      field(
        "Horário",
        "time",
        "time",
        item.time || ""
      ) +

      field(
        "Tempo planejado (min)",
        "duration",
        "number",
        item.duration || "",
        "min=\"0\""
      ) +

      field(
        "Tempo realizado (min)",
        "effectiveDuration",
        "number",
        item.effectiveDuration || "",
        "min=\"0\""
      ) +

      textareaField(
        "Bloco de anotações",
        "notes",
        item.notes || "",
        'class="notes-box" placeholder="Anote de onde parou e informações importantes sobre o assunto."'
      ) +

      field(
        "Link da bibliografia",
        "link",
        "url",
        item.link || ""
      ),

      {
        submit: "Salvar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      Object.assign(
        item,
        {
          subject:
            f.get("subject"),
          topic:
            f.get("topic"),
          date:
            f.get("date") || todayISO(),
          time:
            f.get("time") || "",
          duration:
            f.get("duration"),
          effectiveDuration:
            f.get("effectiveDuration") || "",
          notes:
            f.get("notes"),
          link:
            f.get("link")
        }
      );

      saveState();
      closeModal();
      render();

      toast(
        "Estudo atualizado."
      );
    };

    return;
  }

  /* TREINOS */

  if (action === "add-exercicio") {

    addExerciseForm(
      el.dataset.id
    );

    return;
  }

  if (action === "animate-exercicio") {

    animateExercise(
      el.dataset.id
    );

    return;
  }

  if (action === "edit-exercicio") {

    const treino =
      state.data.treinos.find(
        x =>
          x.id ===
          el.dataset.treinoId
      );

    const exercise =
      treino?.exercises?.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (treino && exercise) {
      addExerciseForm(
        treino.id,
        exercise
      );
    }

    return;
  }

  if (action === "delete-exercicio") {

    const treino =
      state.data.treinos.find(
        x =>
          x.id ===
          el.dataset.treinoId
      );

    if (!treino) return;

    treino.exercises =
      (treino.exercises || [])
        .filter(
          x =>
            x.id !==
            el.dataset.id
        );

    saveState();
    render();

    toast(
      "Exercício removido."
    );

    return;
  }

  /* HIDRATAÇÃO */

  if (action === "quick-water") {

    state.data.hidratacao.push({
      id: uid("h"),
      amount:
        Number(
          el.dataset.value
        ),
      date:
        todayISO(),
      createdAt:
        new Date().toISOString()
    });

    saveState();
    render();

    toast(
      `+${el.dataset.value} ml registrados.`
    );

    return;
  }

  if (action === "config-hidratacao") {

    configHidratacao();
    return;
  }

  if (action === "reset-hidratacao") {

    if (
      confirm(
        "Limpar todos os registros de hidratação?"
      )
    ) {

      state.data.hidratacao =
        state.data.hidratacao.filter(
          x =>
            x.date !==
            todayISO()
        );

      saveState();
      render();

      toast(
        "Registros de hoje limpos."
      );
    }

    return;
  }

  /* ALIMENTAÇÃO */

  if (action === "food-catalog") { openFoodCatalog(); return; }

  if (action === "add-alimentacao") {

    addMealForm();
    return;
  }

  if (action === "edit-refeicao") {

    const meal =
      state.data.alimentacao.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (meal) {
      addMealForm(meal);
    }

    return;
  }

  if (action === "delete-refeicao") {

    removeItem(
      "alimentacao",
      el.dataset.id,
      "Refeição removida."
    );

    return;
  }

  if (action === "config-calorias") {

    configCalorias();
    return;
  }

  if (action === "add-dieta") {

    addDietForm();
    return;
  }

  if (action === "dieta-para-compras") {

    createShoppingListFromDiet();
    return;
  }

  /* FINANÇAS */
  if (action === "edit-financa") { const item=state.data.financas.find(x=>x.id===el.dataset.id); if(!item)return; openFinanceEditModal(item); return; }
  if (action === "finance-monthly-report") { financeMonthlyReport(); return; }
  if (action === "finance-history") { financeHistory(); return; }
  if (action === "report-bug") { openModal("Informar bug",textareaField("Descreva o problema","bug","",'required placeholder="O que aconteceu? Em qual tela?"'),{submit:"Preparar e-mail"}); modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const msg=new FormData(e.target).get("bug")||"";window.location.href=`mailto:?subject=${encodeURIComponent("Bug LiDire")}&body=${encodeURIComponent("Bug LiDire\n\n"+msg)}`;closeModal();};return; }
  if (action === "support-email") { window.location.href="mailto:?subject=Contato%20com%20a%20LiDire"; return; }

  if (action === "finance-zero-month") {
    const month = currentFinanceMonth();
    if (confirm("Zerar os lançamentos deste mês na visão atual? O histórico continuará armazenado e poderá ser consultado em Histórico.")) {
      if (!state.settings.financeMonthResets) state.settings.financeMonthResets = {};
      state.settings.financeMonthResets[month] = new Date().toISOString();
      saveState(); render(); toast("Mês zerado. O histórico foi preservado.");
    }
    return;
  }

  if (action === "config-tetos") {

    configFinanceLimits();
    return;
  }

  /* OBJETIVOS */

  if (action === "add-meta") {

    addMeta(
      el.dataset.id
    );

    return;
  }

  if (action === "toggle-meta") {

    const goal =
      state.data.objetivos.find(
        x =>
          x.id ===
          el.dataset.goalId
      );

    if (!goal) return;

    const meta =
      (goal.metas || []).find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!meta) return;

    meta.done =
      !meta.done;
    updateGoalProgress(goal);

    saveState();
    render();

    return;
  }

  if (action === "progress-objetivo") {

    const item =
      state.data.objetivos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!item) return;

    openModal(
      "Atualizar progresso",

      field(
        "Progresso (%)",
        "progress",
        "number",
        item.progress || 0,
        'min="0" max="100" required'
      ),

      {
        submit: "Atualizar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      item.progress =
        Number(
          f.get("progress")
        );

      saveState();
      closeModal();
      render();

      toast(
        "Progresso atualizado."
      );
    };

    return;
  }

  if (action === "delete-objetivo") {
    confirmDeleteGoal(el.dataset.id);
    return;
  }

  if (action === "confirm-delete-objetivo") {
    const item = state.data.objetivos.find(x => x.id === el.dataset.id);
    if (!item) { closeModal(); return; }
    state.data.objetivos = state.data.objetivos.filter(x => x.id !== item.id);
    saveState();
    closeModal();
    render();
    toast("Objetivo removido.");
    return;
  }

  if (action === "cancel-delete-objetivo") {
    closeModal();
    return;
  }

  if (action === "edit-objetivo") {

    const item =
      state.data.objetivos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (item) {
      openGoalForm(item);
    }

    return;
  }

  /* FAMÍLIA */

  if (action === "edit-familia") {
    const person = state.data.familia.find(x => x.id === el.dataset.id);
    if (!person) return;
    openModal(
      "Editar pessoa",
      field("Nome", "name", "text", person.name || "", "required") +
      field("Relação", "relation", "text", person.relation || "") +
      field("E-mail", "email", "email", person.email || "")+
      field("Endereço", "address", "text", person.address || ""),
      { submit: "Salvar alterações" }
    );
    modal.querySelector("#lidire-form").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      person.name = String(f.get("name") || "").trim();
      person.relation = String(f.get("relation") || "").trim();
      person.email = String(f.get("email") || "").trim();
      person.address = String(f.get("address") || "").trim();
      if (!person.name) { toast("Informe o nome.", "error"); return; }
      saveState(); closeModal(); render(); toast("Pessoa atualizada.");
    };
    return;
  }

  if (action === "request-notification-permission") { requestNotificationPermission(); return; }
  if (action === "enable-push") { enableLiDirePush().catch(e=>toast(e.message||"Não foi possível ativar o Push.","error")); return; }
  if (action === "disable-push") { disableLiDirePush(); return; }
  if (action === "test-push") { testLiDirePush(); return; }
  if (action === "toggle-notifications") {
    if (el.checked) {
      state.settings.notifications.enabled = true;
      saveState();
      if ("Notification" in window && Notification.permission !== "granted") {
        requestNotificationPermission().then(()=>{ if (Notification.permission !== "granted") { state.settings.notifications.enabled=false; saveState(); render(); } });
      } else {
        toast("Notificações de lembretes ativadas.");
      }
    } else {
      state.settings.notifications.enabled = false;
      saveState();
      toast("Notificações de lembretes desativadas.");
    }
    return;
  }
  if (action === "test-reminder") { testReminderNotification(); return; }
  if (action === "start-reminder-recording") { startReminderVoiceRecording(); return; }
  if (action === "stop-reminder-recording") { stopReminderVoiceRecording(); return; }
  if (action === "play-reminder-voice") { playSavedReminderVoice(); return; }
  if (action === "delete-reminder-voice") { state.settings.notifications.voiceDataUrl = ""; saveState(); render(); toast("Mensagem de voz excluída."); return; }
  if (action === "save-notification-settings") {
    const form = el.closest(".content-card")?.querySelector("#lidire-form");
    if (form) {
      const f = new FormData(form);
      state.settings.notifications.mode = String(f.get("notificationMode") || "text");
      state.settings.notifications.title = String(f.get("notificationTitle") || "LiDire — Lembrete");
      state.settings.notifications.message = String(f.get("notificationMessage") || "Hora do seu lembrete.");
      state.settings.notifications.sound = f.get("notificationSound") === "on";
    } else {
      // Fallback: this page is rendered without a surrounding modal form.
      const mode = document.querySelector('[name="notificationMode"]');
      const title = document.querySelector('[name="notificationTitle"]');
      const message = document.querySelector('[name="notificationMessage"]');
      const sound = document.querySelector('[name="notificationSound"]');
      if (mode) state.settings.notifications.mode = mode.value;
      if (title) state.settings.notifications.title = title.value;
      if (message) state.settings.notifications.message = message.value;
      if (sound) state.settings.notifications.sound = sound.checked;
    }
    saveState(); toast("Configurações de notificações salvas."); return;
  }
  if (action === "diet-library") { navigateTo("dietLibrary"); return; }
  if (action === "audio-library") { navigateTo("audioLibrary"); return; }
  if (action === "new-reminder") { openReminderForm(); return; }
  if (action === "create-reminder") { createReminderFor(el.dataset.source,el.dataset.id); return; }
  if (action === "edit-reminder") { const r=state.data.lembretes.find(x=>x.id===el.dataset.id); if(r) openReminderForm(r); return; }
  if (action === "delete-reminder") { const id=el.dataset.id; state.data.lembretes=state.data.lembretes.filter(x=>x.id!==id); saveState(); apiRequest(`/api/reminders/${encodeURIComponent(id)}`,{method:"DELETE",body:"{}"}).catch(()=>{}); render(); toast("Lembrete removido."); return; }
  if (action === "play-audio") { playSavedReminderVoice(el.dataset.id); return; }
  if (action === "pause-audio" || action === "pause-reminder-voice") { if(currentReminderAudio) currentReminderAudio.pause(); return; }
  if (action === "stop-audio" || action === "stop-reminder-voice") { if(currentReminderAudio){currentReminderAudio.pause();currentReminderAudio.currentTime=0;} return; }
  if (action === "rename-audio") { const a=state.data.audios.find(x=>x.id===el.dataset.id); if(a){const n=prompt("Novo nome do áudio:",a.name);if(n?.trim()){a.name=n.trim();saveState();render();toast("Áudio renomeado.");}} return; }
  if (action === "delete-audio") { if(!confirm("Excluir este áudio?"))return; state.data.audios=state.data.audios.filter(x=>x.id!==el.dataset.id); saveState(); render(); toast("Áudio excluído."); return; }
  if (action === "use-diet") { const d=state.data.dietas.find(x=>x.id===el.dataset.id); if(d){state.settings.diet=clone(d);saveState();navigateTo("alimentacao");toast("Dieta selecionada.");} return; }
  if (action === "edit-diet") { editDiet(el.dataset.id); return; }
  if (action === "delete-diet") { if(!confirm("Excluir esta dieta da biblioteca?"))return;state.data.dietas=state.data.dietas.filter(x=>x.id!==el.dataset.id);saveState();render();toast("Dieta excluída.");return; }
  if (action === "toggle-treino") { const t=state.data.treinos.find(x=>x.id===el.dataset.id); if(t){t.completed=!t.completed;t.completedAt=t.completed?new Date().toISOString():"";saveState();render();toast(t.completed?"Treino marcado como concluído.":"Treino voltou para planejado.");} return; }
  if (action === "edit-treino") { const t=state.data.treinos.find(x=>x.id===el.dataset.id); if(t) editWorkoutForm(t); return; }
  if (action === "animate-exercicio") { animateExercise(el.dataset.id); return; }

  if (action === "start-study-focus") { togglePomodoro(); return; }
  if (action === "reset-study-focus") { resetPomodoro(); return; }
  if (action === "set-study-focus") { setPomodoroTime(); return; }

  /* CICLO MENSTRUAL */

  if (action === "config-ciclo") {
    configCicloMenstrual();
    return;
  }

  if (action === "add-periodo-ciclo") {
    addPeriodoCiclo();
    return;
  }

  if (action === "add-sintoma-ciclo") {
    addSintomaCiclo();
    return;
  }

  if (action === "edit-periodo-ciclo") {
    editPeriodoCiclo(el.dataset.id);
    return;
  }

  if (action === "edit-sintoma-ciclo") {
    editSintomaCiclo(el.dataset.id);
    return;
  }

  if (action === "delete-sintoma-ciclo") {
    if (!confirm("Excluir este registro do ciclo?")) return;
    state.data.cicloMenstrual.sintomas = state.data.cicloMenstrual.sintomas.filter(x => x.id !== el.dataset.id);
    saveState();
    render();
    toast("Registro removido.");
    return;
  }

  if (action === "cycle-view-history") {
    const lang=false;
    const rows=[...(state.data.cicloMenstrual?.periodos||[])].sort((a,b)=>String(b.start).localeCompare(String(a.start)));
    openModal(lang?"Cycle history":"Histórico do ciclo", rows.length?rows.map(r=>`<div class="list-item"><div class="item-main"><strong>${dateBR(r.start)}</strong><span>${r.end?`${lang?"to":"até"} ${dateBR(r.end)}`:""} · ${esc(r.flow|| (lang?"Flow not informed":"Fluxo não informado"))}</span></div></div>`).join(""):`<p class="muted">${lang?"No cycle records yet.":"Nenhum registro de ciclo ainda."}</p>`,{submit:lang?"Close":"Fechar"});
    return;
  }

  if (action === "toggle-cycle-ai") {
    state.settings.cycleAiContext = !!el.checked;
    saveState();
    toast(el.checked ? "Uso do ciclo pela IA autorizado." : "Uso do ciclo pela IA desativado.");
    return;
  }

  /* ASSISTENTE */

  if (action === "assistant-question") {
    answerAssistant(el.dataset.question || "", false);
    return;
  }

  /* PERFIL */

  if (
    action ===
    "edit-profile"
  ) {

    openModal(
      "Editar perfil",

      field(
        "Nome",
        "name",
        "text",
        state.user.name,
        "required"
      ) +

      field(
        "E-mail",
        "email",
        "email",
        state.user.email || ""
      ) +

      field(
        "Idade",
        "age",
        "number",
        state.user.age || ""
      ) +

      field(
        "Telefone",
        "phone",
        "tel",
        state.user.phone || ""
      ) +

      field(
        "Endereço",
        "address",
        "text",
        state.user.address || ""
      ),

      {
        submit: "Salvar perfil"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      const profileData = Object.fromEntries(f.entries());

      try {
        const response = await apiRequest("/api/profile", {
          method: "PUT",
          body: JSON.stringify(profileData)
        });
        if (response.user) syncUserToState(response.user);
        else {
          state.user = { ...state.user, ...profileData };
          saveState();
        }
        closeModal();
        render();
        toast("Perfil atualizado.");
      } catch (error) {
        state.user = { ...state.user, ...profileData };
        saveState();
        closeModal();
        render();
        toast(error.message || "Perfil atualizado localmente.");
      }
    };

    return;
  }

  if (
    action === "profile-photo" ||
    action === "photo-profile"
  ) {

    profilePhotoModal();
    return;
  }

  if (action === "delete-profile-photo") {
    if (confirm("Excluir sua foto de perfil?")) {
      state.user.photo = "";
      saveState();
      apiRequest("/api/profile", { method: "PUT", body: JSON.stringify({name: state.user.name, email: state.user.email, age: state.user.age, phone: state.user.phone, address: state.user.address, profile_photo: ""}) })
        .then(response => { if (response.user) syncUserToState(response.user); })
        .catch(error => toast(error.message || "Não foi possível remover a foto do servidor.", "error"))
        .finally(() => { closeModal(); render(); });
      toast("Foto de perfil excluída.");
    }
    return;
  }

  /* EXCLUSÕES */

  const deletes = {
    "delete-compromisso": [
      "compromissos",
      "Compromisso removido."
    ],

    "delete-tarefa": [
      "tarefas",
      "Tarefa removida."
    ],

    "delete-estudo": [
      "estudos",
      "Registro removido."
    ],

    "delete-treino": [
      "treinos",
      "Treino removido."
    ],

    "delete-hidratacao": [
      "hidratacao",
      "Registro removido."
    ],

    "delete-financa": [
      "financas",
      "Lançamento removido."
    ],

    "delete-familia": [
      "familia",
      "Pessoa removida."
    ]
  };

  if (deletes[action]) {

    removeItem(
      deletes[action][0],
      el.dataset.id,
      deletes[action][1]
    );

    return;
  }

  /* RESET */

  if (
    action ===
    "clear-local"
  ) {

    if (
      confirm(
        "Isso apagará os dados salvos neste dispositivo. Continuar?"
      )
    ) {

      state =
        clone(defaultState);

      saveState();

      currentPage =
        "inicio";

      currentShoppingList =
        null;

      render();

      toast(
        "Dados locais redefinidos."
      );
    }
  }
}

/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener("submit", event => {
  if (event.target && event.target.id === "auth-form") {
    event.preventDefault();
    submitAuth(event.target);
    return;
  }
  if (event.target && event.target.id === "assistant-question-form") {
    event.preventDefault();
    const input = document.getElementById("assistant-question-input");
    answerAssistant(input?.value || "", false);
  }
});

document.addEventListener(
  "click",
  event => {

    const pageEl =
      event.target.closest(
        "[data-page]"
      );

    if (pageEl) {

      event.preventDefault();

      navigateTo(pageEl.dataset.page);

      return;
    }

    const actionEl =
      event.target.closest(
        "[data-action]"
      );

    if (actionEl) {

      event.preventDefault();

      handleAction(
        actionEl.dataset.action,
        actionEl
      );
    }
  }
);

document.addEventListener(
  "click",
  event => {

    if (
      event.target.classList.contains(
        "modal-backdrop"
      )
    ) {
      closeModal();
    }
  }
);

window.addEventListener("popstate", event => {
  const page = event.state?.page || (location.hash ? decodeURIComponent(location.hash.slice(1)) : "inicio");
  currentPage = pages[page] ? page : "inicio";
  currentShoppingList = null;
  render();
});

/* =========================================================
   API PÚBLICA DA LIDIRE
   ========================================================= */

window.LiDire = {

  state: () => state,

  save: saveState,

  go: page => {

    navigateTo(page);
  },

  reset: () => {

    if (
      confirm(
        "Redefinir todos os dados da LiDire?"
      )
    ) {

      state =
        clone(defaultState);

      saveState();

      currentPage =
        "inicio";

      render();
    }
  }

};

/* =========================================================
   PROTEÇÃO CONTRA ERROS DE INICIALIZAÇÃO
   ========================================================= */

window.addEventListener("error", event => {
  console.error("Erro na LiDire:", event.error || event.message);
  const root = document.getElementById("app");
  if (root && !root.innerHTML.trim()) {
    root.innerHTML = `
      <div class="auth-screen">
        <section class="auth-card">
          <div class="auth-brand"><strong>LiDire</strong></div>
          <h1 class="auth-title">Não foi possível carregar a LiDire.</h1>
          <p class="auth-subtitle">Atualize a página. Se o problema continuar, envie esta tela para análise.</p>
          <button class="primary-button" onclick="location.reload()">Atualizar página</button>
        </section>
      </div>`;
  }
});

window.addEventListener("unhandledrejection", event => {
  console.error("Erro assíncrono na LiDire:", event.reason);
});

/* =========================================================
   LEMBRETES — áudio, foco e retorno ao aplicativo
   ========================================================= */
function handleLiDireUserGesture() {
  if (window.__lidireAudioUnlocked) return;
  window.__lidireAudioUnlocked = true;
  unlockLiDireNotificationAudio();
}
["pointerdown","touchstart","keydown"].forEach(eventName => {
  window.addEventListener(eventName, handleLiDireUserGesture, { passive: true });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    ensureLiDireAudioContext();
    checkDueReminders();
  }
});
window.addEventListener("focus", () => {
  ensureLiDireAudioContext();
  checkDueReminders();
});
window.addEventListener("pageshow", () => {
  ensureLiDireAudioContext();
  checkDueReminders();
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */


document.addEventListener(
  "DOMContentLoaded",
  () => {

    injectLiDireStyles();
    applyTheme();
    if (!history.state?.lidire) history.replaceState({ page: currentPage, lidire: true }, "", "#inicio");
    initAuth();
    registerLiDirePushServiceWorker().catch(()=>{});
    startReminderScheduler();

  }
);
