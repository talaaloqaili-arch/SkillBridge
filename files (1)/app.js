/* =========================================================
   App data and storage
   ========================================================= */
const CATS = [];
const SEED = [];
const FAQ = [];
const memoryStorage = {};
const PAGE = window.PAGE || location.pathname.replace(/\/$/, '') || '/';
const ICONS = {
  Programming: 'fa-code',
  'UI/UX Design': 'fa-pen-ruler',
  'Digital Marketing': 'fa-chart-line',
  'Data Analysis': 'fa-chart-pie',
  Languages: 'fa-language',
  'Video Editing': 'fa-film'
};
let selectedCategory = 'all';
let chatHistory = [];
let selectedSkillId = '';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

async function initializeData() {
  const api = window.SkillBridgeAPI;
  const data = api ? await api.loadData() : { categories: [], skills: [], faq: [] };

  CATS.splice(0, CATS.length, ...(data.categories || []));
  SEED.splice(0, SEED.length, ...(data.skills || []));
  FAQ.splice(0, FAQ.length, ...(data.faq || []));
}

const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) return JSON.parse(value);
    } catch (error) {
      console.warn('Could not read local demo data:', error);
    }
    return Object.prototype.hasOwnProperty.call(memoryStorage, key)
      ? memoryStorage[key]
      : fallback;
  },

  set(key, value) {
    memoryStorage[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Could not save local demo data:', error);
    }
  }
};

function getUsers() {
  const value = storage.get('sb_users', []);
  return Array.isArray(value) ? value : [];
}

function getCurrentUser() {
  return getUsers().find((user) => user.e === storage.get('sb_me', null));
}

function getSkills() {
  const value = storage.get('sb_l', []);
  return SEED.concat(Array.isArray(value) ? value : []);
}

function getRequests() {
  const value = storage.get('sb_r', []);
  return Array.isArray(value) ? value : [];
}

/* =========================================================
   DOM helpers
   ========================================================= */
function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== '') element.textContent = String(text);
  return element;
}

function appendChildren(parent, children) {
  children.filter(Boolean).forEach((child) => parent.append(child));
  return parent;
}

function createIcon(className) {
  return createElement('i', 'fa-solid ' + className);
}

function createButton(label, className, action, iconClass = '') {
  const button = createElement('button', className);
  button.type = 'button';
  button.dataset.action = action;
  if (iconClass) button.append(createIcon(iconClass));
  if (label) button.append(document.createTextNode(label));
  return button;
}

function createField(labelText, input) {
  const label = createElement('label', '', labelText);
  label.append(input);
  return label;
}

function createInput(id, className, placeholder, value = '') {
  const input = createElement('input', className);
  input.id = id;
  input.placeholder = placeholder || '';
  input.value = value;
  return input;
}

function createTextarea(id, className, rows, value = '', placeholder = '') {
  const textarea = createElement('textarea', className);
  textarea.id = id;
  textarea.rows = rows;
  textarea.value = value;
  textarea.placeholder = placeholder;
  return textarea;
}

function createSelect(id, className, values, selected = '') {
  const select = createElement('select', className);
  select.id = id;
  values.forEach((value) => {
    const option = createElement('option', '', value);
    option.value = value;
    option.selected = value === selected;
    select.append(option);
  });
  return select;
}

function setAttributes(element, attributes) {
  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null) element.setAttribute(name, String(value));
  });
  return element;
}

function setStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

/* =========================================================
   Navigation and shared UI
   ========================================================= */
function go(path) {
  let destination;
  switch (path) {
    case '/': destination = 'index.html'; break;
    case '/skills':
    case '/discover': destination = 'skills.html'; break;
    case '/ai':
    case '/assistant': destination = 'ai.html'; break;
    case '/how': destination = 'how.html'; break;
    case '/about': destination = 'about.html'; break;
    case '/login': destination = 'login.html'; break;
    case '/signup': destination = 'signup.html'; break;
    case '/dashboard': destination = 'dashboard.html'; break;
    default:
      console.error('Unknown page:', path);
      return;
  }
  location.href = destination;
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('s');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('s'), 2600);
}

function renderNavigation() {
  const user = getCurrentUser();
  const container = $('#nb');
  if (container) {
    container.replaceChildren();
    if (user) {
      container.append(
        createButton(user.name.split(' ')[0], 'b', 'dashboard', 'fa-user'),
        createButton('Logout', 'b by', 'logout')
      );
    } else {
      container.append(createButton('Demo profile', 'b', 'login'));
      if (PAGE !== '/signup') {
        container.append(createButton('Sign Up', 'b by', 'signup'));
      }
    }
    const themeButton = createButton('', 'b theme-toggle', 'toggle-theme');
    themeButton.type = 'button';
    themeButton.setAttribute('aria-pressed', String(getActiveTheme() === 'dark'));
    themeButton.title = getActiveTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeButton.setAttribute('aria-label', themeButton.title);
    themeButton.append(createIcon(getActiveTheme() === 'dark' ? 'fa-sun' : 'fa-moon'));
    container.append(themeButton);
  }

  $$('nav a').forEach((link) => {
    link.classList.toggle('on', link.dataset.r === PAGE);
  });
}

function getActiveTheme() {
  const savedTheme = storage.get('skillswap_theme', null);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initializeTheme() {
  const savedTheme = storage.get('skillswap_theme', null);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.dataset.theme = savedTheme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function toggleTheme() {
  const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  storage.set('skillswap_theme', nextTheme);
  renderNavigation();
}

function logout() {
  storage.set('sb_me', null);
  showToast('Logged out');
  go('/');
}

function joinPath() {
  return getCurrentUser() ? '/skills' : '/signup';
}

function renderJoinButton() {
  const button = $('#joinBtn');
  const label = $('#joinLabel');
  if (!button || !label) return;
  button.dataset.path = joinPath();
  label.textContent = getCurrentUser() ? 'Browse skills' : 'Join SkillSwap';
}

function renderPopularSkills() {
  const container = $('#popular');
  if (!container) return;
  container.replaceChildren();
  getSkills().slice(0, 4).forEach((skill) => container.append(createSkillCard(skill)));
}

function renderFaq() {
  const container = $('#faqList');
  if (!container) return;
  container.replaceChildren();
  FAQ.forEach((entry, index) => {
    const item = createElement('div', index === 0 ? 'fi on' : 'fi');
    const question = createElement('button', 'fq', entry[0]);
    question.type = 'button';
    question.setAttribute('aria-expanded', String(index === 0));
    const chevron = createElement('span', 'fx');
    chevron.append(createIcon('fa-chevron-down'));
    question.append(chevron);
    const answer = createElement('div', 'fa', entry[1]);
    item.append(question, answer);
    container.append(item);
  });
}

function toggleFaq(question) {
  const item = question.closest('.fi');
  if (!item) return;
  const shouldOpen = !item.classList.contains('on');
  $$('.fi').forEach((entry) => {
    entry.classList.remove('on');
    const control = $('.fq', entry);
    if (control) control.setAttribute('aria-expanded', 'false');
  });
  if (shouldOpen) {
    item.classList.add('on');
    question.setAttribute('aria-expanded', 'true');
  }
}

/* =========================================================
   Skill discovery and exchange requests
   ========================================================= */
function createSkillCard(skill) {
  const card = createElement('article', 'card');
  const category = createElement('div', 'cat');
  category.append(createIcon(ICONS[skill.c] || 'fa-star'));
  category.append(document.createTextNode(' ' + (skill.c || '')));

  const title = createElement('h3', '', skill.t || '');
  const description = createElement('p', 'mu', skill.d || '');
  setStyles(description, { fontSize: '14px' });

  const wants = createElement('div', 'wants');
  wants.append(createIcon('fa-right-left'));
  wants.append(document.createTextNode(' WANTS TO LEARN: ' + (skill.w || '')));

  const details = createElement('div', 'mu', (skill.l || '') + ' · ' + (skill.m || ''));
  setStyles(details, { fontSize: '12px' });

  const footer = createElement('div', 'cf');
  const student = createElement('div', 'um');
  const avatar = createElement('div', 'av', (skill.u || 'S').slice(0, 2).toUpperCase());
  const userInfo = createElement('span');
  userInfo.append(
    document.createTextNode(skill.u || 'Student'),
    document.createElement('br'),
    document.createTextNode(skill.e === 'seed' ? 'Illustrative student' : 'Local demo profile')
  );
  student.append(avatar, userInfo);

  const user = getCurrentUser();
  footer.append(student);
  if (user && user.e === skill.e) {
    footer.append(createElement('span', '', 'Your skill'));
  } else {
    const requestButton = createButton('Request exchange', 'b by sm', 'request');
    requestButton.dataset.skillId = skill.id;
    footer.append(requestButton);
  }

  card.append(category, title, description, wants, details, footer);
  return card;
}

function renderSkillResults() {
  const queryInput = $('#q');
  const tabs = $('#tabs');
  const resultsContainer = $('#res');
  if (!tabs || !resultsContainer) return;

  if (queryInput && !queryInput.value && location.search) {
    queryInput.value = new URLSearchParams(location.search).get('q') || '';
  }

  tabs.replaceChildren();
  ['all', ...CATS].forEach((category) => {
    const label = category === 'all' ? 'All skills' : category;
    const tab = createButton(label, category === selectedCategory ? 'tab on' : 'tab', 'category');
    tab.dataset.category = category;
    tabs.append(tab);
  });

  const query = (queryInput?.value || '').toLowerCase();
  const format = $('#lv')?.value || '';
  const level = $('#skillLevelFilter')?.value || '';
  const matches = getSkills().filter((skill) => (
    (selectedCategory === 'all' || skill.c === selectedCategory) &&
    (!format || skill.m === format) &&
    (!level || skill.l === level) &&
    [skill.t, skill.d, skill.c, skill.w, skill.u].join(' ').toLowerCase().includes(query)
  ));

  resultsContainer.replaceChildren();
  if (!matches.length) {
    resultsContainer.append(createElement(
      'p',
      'mu',
      'No skills match your search. Try another keyword or share your own!'
    ));
    setStyles(resultsContainer.firstElementChild, {
      padding: '40px 0',
      textAlign: 'center'
    });
    return;
  }

  const count = createElement(
    'div',
    'mu',
    matches.length + ' skill' + (matches.length === 1 ? '' : 's') + ' found'
  );
  setStyles(count, { fontSize: '14px' });
  const grid = createElement('div', 'grid');
  matches.forEach((skill) => grid.append(createSkillCard(skill)));
  resultsContainer.append(count, grid);
}

function openRequestDialog(skillId) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Please log in first');
    go('/login');
    return;
  }

  const skill = getSkills().find((entry) => entry.id === skillId);
  const dialog = $('#dlg');
  if (!skill || !dialog) return;
  selectedSkillId = skillId;
  dialog.replaceChildren();

  const title = createElement('h3', '', 'Request: ' + skill.t);
  setStyles(title, { marginBottom: '6px' });
  const description = createElement(
    'p',
    'mu',
    'Offer your skill in return. ' + skill.u + ' wants to learn ' + skill.w + '.'
  );
  setStyles(description, { fontSize: '14px', marginBottom: '14px' });

  const message = createTextarea(
    'rm',
    'inp',
    4,
    'Hi ' + skill.u + '! I can teach ' + user.teach + ' and I would love to learn ' + skill.c + ' from you.'
  );
  const actions = createElement('div', 'row');
  setStyles(actions, { margin: '16px 0 0', justifyContent: 'flex-end' });
  actions.append(
    createButton('Cancel', 'b', 'close-dialog'),
    createButton('Send', 'b by', 'send-request')
  );
  dialog.append(title, description, message, actions);
  dialog.showModal();
}

function sendRequest() {
  const user = getCurrentUser();
  const skill = getSkills().find((entry) => entry.id === selectedSkillId);
  const dialog = $('#dlg');
  if (!user || !skill || !dialog) return;

  const requests = getRequests();
  if (requests.some((request) => request.from === user.e && request.sid === skill.id)) {
    dialog.close();
    showToast('You already sent this request');
    return;
  }

  requests.push({
    from: user.e,
    sid: skill.id,
    title: skill.t,
    to: skill.u,
    msg: $('#rm', dialog)?.value || '',
    at: Date.now()
  });
  storage.set('sb_r', requests);
  dialog.close();
  showToast('Request sent!');
  if (PAGE === '/dashboard') renderDashboardPage();
}

function searchSkills(event) {
  event.preventDefault();
  const query = $('#homeSkillSearch')?.value.trim() || '';
  location.href = 'skills.html' + (query ? '?q=' + encodeURIComponent(query) : '');
}

/* =========================================================
   Dynamic page builders
   ========================================================= */
function renderAboutPage() {
  const main = $('#app');
  const section = createElement('section', 'dark');
  const wrapper = createElement('div', 'wrap about');
  const copy = createElement('div');
  copy.append(
    createElement('span', 'tag', 'About Us'),
    createElement('h2', '', 'Good things grow when we share.'),
    createElement(
      'p',
      'mu',
      'SkillSwap is built around a simple belief: every student has something to teach and something to learn. We bring those strengths together through practical, mutual skill exchange.'
    ),
    createElement(
      'p',
      'mu',
      'Like a bridge, we connect people through collaboration. Our goal is to make learning feel more human, more accessible, and more connected to the future you are building.'
    )
  );
  const values = createElement('div', 'chk');
  ['Be curious', 'Be generous', 'Grow together'].forEach((value) => {
    const item = createElement('span');
    item.append(createIcon('fa-check'), document.createTextNode(' ' + value));
    values.append(item);
  });
  copy.append(values);

  const image = createElement('div', 'imgc');
  image.append(createAboutIllustration());
  image.append(
    createElement('h3', '', 'A community, not a classroom.'),
    createElement('p', 'mu', 'Bring your curiosity. Leave with more possibilities.')
  );
  wrapper.append(copy, image);
  section.append(wrapper);
  main.replaceChildren(section);
}

function createAboutIllustration() {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 480 300');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Two students sharing skills across a bridge');

  const addShape = (tagName, attributes) => {
    const shape = document.createElementNS(namespace, tagName);
    Object.entries(attributes).forEach(([name, value]) => shape.setAttribute(name, value));
    svg.append(shape);
    return shape;
  };
  const addStudent = (x, shirt, skin, hair) => {
    addShape('path', {
      d: `M${x - 35} 220v-38a35 35 0 0 1 70 0v38z`,
      fill: shirt
    });
    addShape('circle', { cx: x, cy: 145, r: 25, fill: skin });
    addShape('path', {
      d: `M${x - 25} 144a25 25 0 0 1 50 0c-12-8-34-8-50 0z`,
      fill: hair
    });
  };

  addShape('circle', { cx: 240, cy: 145, r: 125, fill: '#ffc83d', opacity: '.18' });
  addShape('path', {
    d: 'M35 225Q240 55 445 225',
    fill: 'none',
    stroke: '#ffc83d',
    'stroke-width': '8',
    'stroke-linecap': 'round'
  });
  addShape('rect', { x: 20, y: 220, width: 440, height: 14, rx: 7, fill: '#f8fafc' });
  [100, 170, 240, 310, 380].forEach((x, index) => {
    addShape('path', {
      d: `M${x} ${index === 2 ? 130 : 152}V220`,
      stroke: '#f8fafc',
      'stroke-width': '3',
      opacity: '.45'
    });
  });
  addShape('path', {
    d: 'M0 270q30-12 60 0t60 0 60 0 60 0 60 0 60 0 60 0 60 0 60 0v30H0z',
    fill: '#ffc83d',
    opacity: '.35'
  });
  addStudent(120, '#f8fafc', '#f2c29b', '#2b2118');
  addStudent(360, '#ffc83d', '#d9a37a', '#5a3a22');

  const skillLabels = [
    { x: 44, y: 48, text: 'Python' },
    { x: 337, y: 48, text: 'Figma' }
  ];
  skillLabels.forEach(({ x, y, text }) => {
    addShape('rect', { x, y, width: 100, height: 36, rx: 18, fill: '#fffdf6' });
    const label = document.createElementNS(namespace, 'text');
    label.setAttribute('x', String(x + 50));
    label.setAttribute('y', String(y + 23));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '15');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', '#1e293b');
    label.textContent = text;
    svg.append(label);
  });

  return svg;
}

function renderLoginPage() {
  const main = $('#app');
  const section = createElement('section', 'wrap');
  const form = createElement('div', 'form');
  const userOptions = getUsers().map((user) => user.e);
  const select = createSelect('userChoice', 'inp', userOptions);
  getUsers().forEach((user, index) => {
    select.options[index].textContent = user.name + ' · ' + user.teach;
  });
  const label = createField('Profile', select);
  const error = createElement('div', 'err');
  error.id = 'er';
  const button = createButton('Continue as demo profile', 'b by lg', 'login-submit');
  const signupText = createElement('p', 'mu', 'New here? ');
  const signupLink = createElement('a', '', 'Create a demo profile');
  signupLink.href = 'signup.html';
  setStyles(signupLink, { fontWeight: '700', color: 'var(--tx)' });
  signupText.append(signupLink);

  form.append(
    createElement('h2', '', 'Choose your profile'),
    createElement(
      'p',
      'mu',
      'This demo has no real accounts or passwords. Create a local demo profile if you have not made one yet.'
    ),
    label,
    error,
    button,
    signupText
  );
  section.append(form);
  main.replaceChildren(section);
}

function renderSignupPage() {
  const main = $('#app');
  const section = createElement('section', 'wrap');
  const form = createElement('form', 'form');
  form.dataset.form = 'signup';

  const name = createInput('n', 'inp', '');
  name.maxLength = 60;
  name.autocomplete = 'nickname';
  const teach = createSelect('t', 'inp', CATS, CATS[0] || '');
  const want = createSelect('w', 'inp', CATS, CATS[1] || CATS[0] || '');
  const error = createElement('div', 'err');
  error.id = 'er';
  const submit = createElement('button', 'b by lg', 'Create demo profile');
  submit.type = 'submit';
  const loginText = createElement('p', 'mu', 'Already created a demo profile? ');
  const loginLink = createElement('a', '', 'Choose profile');
  loginLink.href = 'login.html';
  setStyles(loginLink, { fontWeight: '700', color: 'var(--tx)' });
  loginText.append(loginLink);

  form.append(
    createElement('h2', '', 'Join SkillSwap'),
    createElement(
      'p',
      'mu',
      'Create a local demo profile. Use a nickname and do not enter private information.'
    ),
    createField('Display name or nickname', name),
    createField('I can teach', teach),
    createField('I want to learn', want),
    error,
    submit,
    loginText,
    createElement(
      'p',
      'mu',
      'Demo only: profile data and shared skills stay in this browser. This is not secure authentication or a production database.'
    )
  );
  section.append(form);
  main.replaceChildren(section);
}

function createDashboardPanel(title, iconName, content) {
  const panel = createElement('div', 'panel');
  const heading = createElement('h3');
  heading.append(createIcon(iconName), document.createTextNode(' ' + title));
  panel.append(heading, content);
  return panel;
}

function renderMatchList(user) {
  const matches = getSkills().filter((skill) =>
    skill.e !== user.e && skill.c === user.want && skill.w === user.teach
  );
  const panel = createElement('div', 'panel');
  const heading = createElement('h3');
  heading.append(createIcon('fa-star'), document.createTextNode(' Best matches for you'));
  panel.append(heading);
  if (!matches.length) {
    const text = createElement('p', 'mu', 'No perfect match yet. Browse all skills or share yours.');
    const link = createElement('a', '', 'Browse all skills');
    link.href = 'skills.html';
    link.style.fontWeight = '700';
    text.replaceChildren(link, document.createTextNode(' or share yours.'));
    panel.append(text);
    return panel;
  }

  matches.forEach((skill) => {
    const row = createElement('div', 'it');
    const label = createElement('span');
    label.append(
      createElement('b', '', skill.t),
      document.createElement('br'),
      createElement('small', 'mu', skill.u + ' · wants ' + skill.w)
    );
    const request = createButton('Request', 'b by sm', 'request');
    request.dataset.skillId = skill.id;
    row.append(label, request);
    panel.append(row);
  });
  return panel;
}

function renderRequestList(user) {
  const sent = getRequests().filter((request) => request.from === user.e);
  const panel = createElement('div', 'panel');
  const heading = createElement('h3');
  heading.append(
    createIcon('fa-paper-plane'),
    document.createTextNode(' My requests (' + sent.length + ')')
  );
  panel.append(heading);
  if (!sent.length) {
    panel.append(createElement('p', 'mu', 'You have not sent any requests yet.'));
    return panel;
  }

  sent.forEach((request) => {
    const row = createElement('div', 'it');
    const label = createElement('span');
    label.append(
      createElement('b', '', request.title),
      document.createElement('br'),
      createElement(
        'small',
        'mu',
        'to ' + request.to + ' · ' + new Date(request.at).toLocaleDateString()
      )
    );
    const cancel = createButton('Cancel', 'b sm', 'delete-request');
    cancel.dataset.timestamp = String(request.at);
    row.append(label, cancel);
    panel.append(row);
  });
  return panel;
}

function renderMySkills(user) {
  const skills = storage.get('sb_l', []).filter((skill) => skill.e === user.e);
  const panel = createElement('div', 'panel');
  panel.style.gridColumn = '1 / -1';
  const heading = createElement('h3');
  heading.append(
    createIcon('fa-toolbox'),
    document.createTextNode(' My shared skills (' + skills.length + ')')
  );
  panel.append(heading);
  if (!skills.length) {
    panel.append(createElement('p', 'mu', 'Nothing shared yet.'));
  } else {
    skills.forEach((skill) => {
      const row = createElement('div', 'it');
      const label = createElement('span');
      label.append(
        createElement('b', '', skill.t),
        document.createTextNode(' · ' + skill.c + ' '),
        createIcon('fa-right-left'),
        document.createTextNode(' ' + skill.w)
      );
      const remove = createButton('Delete', 'b sm', 'delete-skill');
      remove.dataset.skillId = skill.id;
      row.append(label, remove);
      panel.append(row);
    });
  }
  const add = createButton('Share a skill', 'b by', 'add-skill', 'fa-plus');
  add.style.marginTop = '16px';
  panel.append(add);
  return panel;
}

function renderDashboardPage() {
  const user = getCurrentUser();
  if (!user) {
    go('/login');
    return;
  }
  const main = $('#app');
  const section = createElement('section', 'wrap');
  const title = createElement('h2');
  title.append(
    document.createTextNode('Hi ' + user.name.split(' ')[0] + ' '),
    createIcon('fa-hand')
  );
  const intro = createElement('p', 'mu');
  intro.style.marginBottom = '28px';
  intro.append(
    document.createTextNode('You teach '),
    createElement('b', '', user.teach),
    document.createTextNode(' · You want to learn '),
    createElement('b', '', user.want)
  );

  const grid = createElement('div', 'dg');
  const aiPanel = createDashboardPanel(
    'AI-generated recommendations',
    'fa-wand-magic-sparkles',
    createElement(
      'p',
      'mu',
      'Ask local Ollama to suggest skill exchanges using your selected skills and bundled illustrative demo profiles only.'
    )
  );
  aiPanel.classList.add('dashboard-ai');
  const recommendButton = createButton(
    'Generate recommendations',
    'b by',
    'dashboard-recommend'
  );
  recommendButton.style.marginTop = '14px';
  const result = createElement('div', 'ai-result');
  result.id = 'dashboardAiResult';
  result.setAttribute('aria-live', 'polite');
  aiPanel.append(recommendButton, result);

  const assistantPanel = createDashboardPanel(
    'AI learning tools',
    'fa-wand-magic-sparkles',
    createElement(
      'p',
      'mu',
      'Create a roadmap, ask a learning question, or explore an exchange with illustrative demo profiles.'
    )
  );
  const assistantButton = createButton('Open AI assistant', 'b by', 'ai');
  assistantButton.style.marginTop = '14px';
  assistantPanel.append(assistantButton);

  grid.append(
    aiPanel,
    assistantPanel,
    renderMatchList(user),
    renderRequestList(user),
    renderMySkills(user)
  );
  section.append(
    createElement('span', 'tag', 'Dashboard'),
    title,
    intro,
    grid
  );
  main.replaceChildren(section);
}

function renderAiPage() {
  const main = $('#app');
  const wrapper = createElement('section', 'wrap');
  wrapper.append(
    createElement('span', 'tag', 'Local Ollama AI'),
    createElement('h2', '', 'Your learning assistant.'),
    createElement(
      'p',
      'mu',
      'Chat, explore learning paths, and compare skill exchanges. Your prompts are sent only to Ollama running on this device.'
    )
  );
  wrapper.append(createAiSettings(), createAiTabs());
  wrapper.append(createChatTool(), createRecommendationTool(), createRoadmapTool(), createMatchTool());
  main.replaceChildren(wrapper);
  initializeAiPage();
}

function createAiSettings() {
  const panel = createElement('div', 'panel ai-settings');
  const model = createInput('aiModel', 'inp', '');
  model.autocomplete = 'off';
  const field = createField('Ollama model', model);
  const status = createElement('span', 'mu', 'Connection not checked');
  status.id = 'aiStatus';
  status.setAttribute('role', 'status');
  const save = createButton('Save model', 'b', 'save-ai-settings');
  const check = createButton('Test connection', 'b', 'check-ai');
  panel.append(field, save, check, status);
  return panel;
}

function createAiTabs() {
  const tabs = createElement('div', 'ai-tabs');
  setAttributes(tabs, { role: 'tablist', 'aria-label': 'AI tools' });
  [
    ['chat', 'Chat'],
    ['recommend', 'Recommendations'],
    ['roadmap', 'Learning roadmap'],
    ['match', 'Skill match']
  ].forEach(([mode, label], index) => {
    const button = createButton(label, index === 0 ? 'tab on' : 'tab', 'ai-mode');
    button.dataset.aiTab = mode;
    setAttributes(button, { role: 'tab', 'aria-selected': index === 0 });
    tabs.append(button);
  });
  return tabs;
}

function createAiTool(mode, title) {
  const section = createElement('section', 'panel ai-tool');
  section.id = 'aiTool-' + mode;
  if (mode !== 'chat') section.hidden = true;
  section.append(createElement('h3', '', title));
  return section;
}

function createChatTool() {
  const tool = createAiTool('chat', 'Ask about learning a skill');
  const messages = createElement('div', 'chat-messages');
  messages.id = 'chatMessages';
  messages.setAttribute('aria-live', 'polite');

  const form = createElement('form', 'ai-form');
  form.dataset.form = 'ai-chat';
  const input = createTextarea(
    'chatInput',
    'inp',
    3,
    '',
    'Ask about programming, design, or learning strategies...'
  );
  const label = createElement('label', 'sr-only', 'Your question');
  label.htmlFor = 'chatInput';
  const submit = createElement('button', 'b by', 'Send');
  submit.id = 'chatSubmit';
  submit.type = 'submit';
  form.append(label, input, submit);
  tool.append(messages, form);
  return tool;
}

function createRecommendationTool() {
  const tool = createAiTool('recommend', 'Find possible exchanges');
  const form = createAiForm('ai-recommend');
  const user = getCurrentUser();
  form.append(
    createField('Skills you can teach', createInput('recommendKnown', 'inp', 'e.g. HTML, drawing', user?.teach || '')),
    createField('Skills you want to learn', createInput('recommendWant', 'inp', 'e.g. JavaScript', user?.want || '')),
    createField(
      'Interests and goals',
      createTextarea('recommendInterests', 'inp', 3, '', 'What would you like to build or practice?')
    ),
    createSubmitButton('Recommend exchanges')
  );
  const result = createElement('div', 'ai-result');
  result.id = 'recommendResult';
  result.setAttribute('aria-live', 'polite');
  tool.append(form, result);
  return tool;
}

function createRoadmapTool() {
  const tool = createAiTool('roadmap', 'Build a learning roadmap');
  const form = createAiForm('ai-roadmap');
  const levels = ['Beginner', 'Some experience', 'Intermediate'];
  const weeks = createInput('roadmapWeeks', 'inp', '', '4');
  weeks.type = 'number';
  weeks.min = '1';
  weeks.max = '52';
  weeks.required = true;
  form.append(
    createField('Skill to learn', createInput('roadmapSkill', 'inp', 'e.g. JavaScript')),
    createField('Current level', createSelect('roadmapLevel', 'inp', levels, levels[0])),
    createField('Duration in weeks', weeks),
    createSubmitButton('Create roadmap')
  );
  const result = createElement('div', 'ai-result');
  result.id = 'roadmapResult';
  result.setAttribute('aria-live', 'polite');
  tool.append(form, result);
  return tool;
}

function createMatchTool() {
  const tool = createAiTool('match', 'Evaluate a skill exchange');
  tool.append(createElement(
    'p',
    'mu ai-disclaimer',
    'Uses illustrative profiles from the bundled demo catalog only; it does not inspect private user accounts.'
  ));
  const form = createAiForm('ai-match');
  const user = getCurrentUser();
  form.append(
    createField('Student A can teach', createInput('matchATeach', 'inp', 'e.g. HTML', user?.teach || '')),
    createField('Student A wants to learn', createInput('matchAWant', 'inp', 'e.g. JavaScript', user?.want || '')),
    createField('Student B can teach', createInput('matchBTeach', 'inp', 'e.g. JavaScript')),
    createField('Student B wants to learn', createInput('matchBWant', 'inp', 'e.g. HTML')),
    createSubmitButton('Evaluate match')
  );
  const result = createElement('div', 'ai-result');
  result.id = 'matchResult';
  result.setAttribute('aria-live', 'polite');
  tool.append(form, result);
  return tool;
}

function createAiForm(formName) {
  const form = createElement('form', 'form ai-form');
  form.dataset.form = formName;
  return form;
}

function createSubmitButton(label) {
  const button = createElement('button', 'b by', label);
  button.type = 'submit';
  return button;
}

/* =========================================================
   AI assistant
   ========================================================= */
function initializeAiPage() {
  const service = window.OllamaService;
  const modelInput = $('#aiModel');
  if (!service || !modelInput) return;
  modelInput.value = service.getSettings().model;
  chatHistory = [];
  appendAiMessage('assistant', 'Hi! Ask me about learning a skill, or choose one of the AI tools above.');
}

function appendAiMessage(role, content, className = '') {
  const messages = $('#chatMessages');
  if (!messages) return null;
  const bubble = createElement(
    'div',
    ('chat-message ' + (role === 'user' ? 'chat-user' : 'chat-assistant') + ' ' + className).trim(),
    content
  );
  messages.append(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function selectAiMode(mode) {
  $$('[data-ai-tab]').forEach((tab) => {
    const selected = tab.dataset.aiTab === mode;
    tab.classList.toggle('on', selected);
    tab.setAttribute('aria-selected', String(selected));
  });
  $$('.ai-tool').forEach((tool) => {
    tool.hidden = tool.id !== 'aiTool-' + mode;
  });
}

function setAiStatus(message, isError = false) {
  const status = $('#aiStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('ai-error', isError);
}

function saveAiSettings() {
  try {
    const settings = window.OllamaService.saveSettings({ model: $('#aiModel').value });
    setAiStatus('Model saved: ' + settings.model);
  } catch (error) {
    setAiStatus(error.message, true);
  }
}

async function checkAiConnection(button) {
  if (!window.OllamaService) {
    setAiStatus('The local AI service did not load. Reload this page and try again.', true);
    return;
  }
  if (button) button.disabled = true;
  setAiStatus('Checking local Ollama…');
  try {
    const result = await window.OllamaService.checkConnection();
    setAiStatus('Ollama is ready. Model: ' + result.model);
  } catch (error) {
    setAiStatus(error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function submitAiChat(event) {
  event.preventDefault();
  const input = $('#chatInput');
  const button = $('#chatSubmit');
  const content = input.value.trim();
  if (!content) {
    input.focus();
    return;
  }
  if (!window.OllamaService) {
    appendAiMessage('assistant', 'The local AI service did not load. Check the script references and reload the page.', 'ai-error');
    return;
  }

  input.value = '';
  appendAiMessage('user', content);
  chatHistory.push({ role: 'user', content });
  const pending = appendAiMessage('assistant', 'Ollama is thinking…', 'chat-pending');
  button.disabled = true;
  input.disabled = true;
  try {
    const answer = await window.OllamaService.chat(chatHistory);
    pending.textContent = answer;
    pending.classList.remove('chat-pending');
    chatHistory.push({ role: 'assistant', content: answer });
  } catch (error) {
    pending.textContent = error.message;
    pending.classList.remove('chat-pending');
    pending.classList.add('ai-error');
    chatHistory.pop();
    setAiStatus(error.message, true);
  } finally {
    button.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

function demoStudents() {
  const profiles = new Map();
  SEED.forEach((skill) => {
    if (!profiles.has(skill.u)) {
      profiles.set(skill.u, { name: skill.u, teach: [], want: [] });
    }
    const profile = profiles.get(skill.u);
    profile.teach.push(skill.c);
    profile.want.push(skill.w);
  });
  return Array.from(profiles.values());
}

async function runAiForm(event, resultId, action) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $('button[type="submit"]', form);
  const result = $('#' + resultId);
  if (!window.OllamaService || !result) {
    if (result) result.textContent = 'The local AI service did not load. Check the script references and reload.';
    return;
  }

  result.textContent = 'Ollama is generating a response…';
  result.classList.remove('ai-error');
  button.disabled = true;
  try {
    result.textContent = await action();
    setAiStatus('Response generated with ' + window.OllamaService.getSettings().model);
  } catch (error) {
    result.textContent = error.message;
    result.classList.add('ai-error');
    setAiStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function handleAiRecommendation(event) {
  return runAiForm(event, 'recommendResult', () =>
    window.OllamaService.recommend({
      known: $('#recommendKnown').value.trim(),
      want: $('#recommendWant').value.trim(),
      interests: $('#recommendInterests').value.trim()
    }, demoStudents())
  );
}

function handleAiRoadmap(event) {
  const weeks = Number($('#roadmapWeeks').value);
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) {
    event.preventDefault();
    $('#roadmapResult').textContent = 'Choose a duration between 1 and 52 weeks.';
    return;
  }
  return runAiForm(event, 'roadmapResult', () =>
    window.OllamaService.roadmap({
      skill: $('#roadmapSkill').value.trim(),
      level: $('#roadmapLevel').value,
      weeks
    })
  );
}

function handleAiMatch(event) {
  return runAiForm(event, 'matchResult', () =>
    window.OllamaService.match({
      teach: $('#matchATeach').value.trim(),
      want: $('#matchAWant').value.trim()
    }, {
      teach: $('#matchBTeach').value.trim(),
      want: $('#matchBWant').value.trim()
    })
  );
}

async function runDashboardRecommendation(button) {
  const result = $('#dashboardAiResult');
  const user = getCurrentUser();
  if (!result || !user) return;
  if (!window.OllamaService) {
    result.textContent = 'The local AI service did not load. Reload the dashboard and try again.';
    result.classList.add('ai-error');
    return;
  }
  result.classList.remove('ai-error');
  result.textContent = 'Ollama is generating recommendations…';
  if (button) button.disabled = true;
  try {
    result.textContent = await window.OllamaService.recommend({
      known: user.teach,
      want: user.want,
      interests: user.profile?.goal || ''
    }, demoStudents());
  } catch (error) {
    result.textContent = error.message;
    result.classList.add('ai-error');
  } finally {
    if (button) button.disabled = false;
  }
}

/* =========================================================
   Profile, demo account, and shared-skill actions
   ========================================================= */
function openSkillDialog() {
  if (!getCurrentUser()) {
    go('/login');
    return;
  }
  const dialog = $('#dlg');
  if (!dialog) return;
  dialog.replaceChildren();

  const title = createElement('h3', '', 'Share a skill');
  title.style.marginBottom = '10px';
  const skillTitle = createInput('skillTitle', 'inp', 'e.g. JavaScript for the web');
  const category = createSelect('skillCat', 'inp', CATS, CATS[0] || '');
  const want = createSelect('skillWant', 'inp', CATS, CATS[1] || CATS[0] || '');
  const format = createSelect('skillMode', 'inp', ['Online', 'Online / campus'], 'Online');
  const level = createSelect(
    'skillLevel',
    'inp',
    ['Beginner friendly', 'All levels welcome', 'Some experience'],
    'Beginner friendly'
  );
  [skillTitle, category, want, format, level].forEach((input) => {
    input.style.marginTop = '6px';
  });

  const actions = createElement('div', 'row');
  actions.style.justifyContent = 'flex-end';
  actions.style.marginTop = '16px';
  actions.append(createButton('Cancel', 'b', 'close-dialog'));
  const save = createButton('Save', 'b by', 'save-skill');
  actions.append(save);
  dialog.append(
    title,
    createField('Skill title', skillTitle),
    createField('Category', category),
    createField('I want to learn', want),
    createField('Format', format),
    createField('Level', level),
    actions
  );
  dialog.showModal();
}

function saveSkill() {
  const user = getCurrentUser();
  const title = $('#skillTitle')?.value.trim();
  const category = $('#skillCat')?.value;
  const want = $('#skillWant')?.value;
  if (!user) {
    go('/login');
    return;
  }
  if (!title || !category || !want) {
    showToast('Please complete all required fields');
    return;
  }

  const savedSkills = storage.get('sb_l', []);
  const skills = Array.isArray(savedSkills) ? savedSkills : [];
  skills.push({
    id: 's' + Date.now(),
    t: title,
    d: 'Shared by a student in the community.',
    c: category,
    w: want,
    m: $('#skillMode').value,
    l: $('#skillLevel').value,
    u: user.name,
    e: user.e
  });
  storage.set('sb_l', skills);
  $('#dlg').close();
  showToast('Skill shared');
  selectedCategory = 'all';
  renderCurrentPage();
}

function deleteRequest(timestamp) {
  storage.set('sb_r', getRequests().filter((request) => request.at !== Number(timestamp)));
  showToast('Request removed');
  renderCurrentPage();
}

function deleteSkill(skillId) {
  const savedSkills = storage.get('sb_l', []);
  const skills = Array.isArray(savedSkills) ? savedSkills : [];
  storage.set('sb_l', skills.filter((skill) => skill.id !== skillId));
  showToast('Skill removed');
  renderCurrentPage();
}

function login() {
  const profileId = $('#userChoice')?.value;
  const error = $('#er');
  if (!profileId) {
    if (error) error.textContent = 'Create a demo profile before continuing.';
    return;
  }
  const user = getUsers().find((item) => item.e === profileId);
  if (!user) {
    if (error) error.textContent = 'That demo profile is no longer available. Create a new one.';
    return;
  }
  storage.set('sb_me', profileId);
  go('/dashboard');
}

function signup(event) {
  event.preventDefault();
  const name = $('#n')?.value.trim();
  const teach = $('#t')?.value;
  const want = $('#w')?.value;
  const error = $('#er');
  if (!name || !teach || !want) {
    if (error) error.textContent = 'Please enter a display name and choose both skills.';
    return;
  }

  const user = {
    e: 'demo-' + createId(),
    name,
    teach,
    want,
    role: 'student'
  };
  const users = getUsers();
  users.push(user);
  storage.set('sb_users', users);
  storage.set('sb_me', user.e);
  go('/dashboard');
}

function createId() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(36).slice(2);
}

function removeLegacyCredentials() {
  const users = getUsers();
  const userIds = new Map();
  const savedSkills = storage.get('sb_l', []);
  const requests = getRequests();
  const activeId = storage.get('sb_me', null);
  const hasLegacyData = users.some((user) => user.p || String(user.e || '').includes('@')) ||
    String(activeId || '').includes('@') ||
    (Array.isArray(savedSkills) && savedSkills.some((skill) => String(skill.e || '').includes('@'))) ||
    requests.some((request) =>
      String(request.from || '').includes('@') || String(request.to || '').includes('@')
    );
  if (!hasLegacyData) return;

  const sanitizedUsers = users.map((user) => {
    const id = 'demo-' + createId();
    userIds.set(user.e, id);
    return {
      e: id,
      name: user.name || 'Student',
      teach: user.teach || CATS[0] || '',
      want: user.want || CATS[1] || '',
      role: 'student',
      ...(user.profile ? { profile: user.profile } : {})
    };
  });

  if (Array.isArray(savedSkills)) {
    savedSkills.forEach((skill) => {
      if (userIds.has(skill.e)) {
        skill.e = userIds.get(skill.e);
      } else if (String(skill.e || '').includes('@')) {
        skill.e = 'demo-' + createId();
      }
    });
    storage.set('sb_l', savedSkills);
  }

  storage.set('sb_users', sanitizedUsers);
  storage.set('sb_me', userIds.get(activeId) || null);
  storage.set('sb_r', []);
  console.info('Removed legacy demo email/password data. Demo profiles do not provide secure authentication.');
}

/* =========================================================
   Page setup and event delegation
   ========================================================= */
function renderCurrentPage() {
  switch (PAGE) {
    case '/about': renderAboutPage(); break;
    case '/login': renderLoginPage(); break;
    case '/signup': renderSignupPage(); break;
    case '/dashboard': renderDashboardPage(); break;
    case '/ai': renderAiPage(); break;
    case '/':
    case '/skills':
    case '/discover':
    case '/how':
      break;
    default:
      console.warn('No page content is configured for:', PAGE);
  }

  renderNavigation();
  renderJoinButton();
  renderPopularSkills();
  renderFaq();
  renderSkillResults();
}

function handleClick(event) {
  const actionElement = event.target.closest('[data-action]');
  if (actionElement) {
    const action = actionElement.dataset.action;
    switch (action) {
      case 'navigate': go(actionElement.dataset.path); break;
      case 'dashboard': go('/dashboard'); break;
      case 'login': go('/login'); break;
      case 'signup': go('/signup'); break;
      case 'logout': logout(); break;
      case 'skills': go('/skills'); break;
      case 'ai': go('/ai'); break;
      case 'category':
        selectedCategory = actionElement.dataset.category;
        renderSkillResults();
        break;
      case 'request': openRequestDialog(actionElement.dataset.skillId); break;
      case 'add-skill': openSkillDialog(); break;
      case 'save-skill': saveSkill(); break;
      case 'send-request': sendRequest(); break;
      case 'close-dialog': $('#dlg')?.close(); break;
      case 'delete-request': deleteRequest(actionElement.dataset.timestamp); break;
      case 'delete-skill': deleteSkill(actionElement.dataset.skillId); break;
      case 'login-submit': login(); break;
      case 'save-ai-settings': saveAiSettings(); break;
      case 'check-ai': checkAiConnection(actionElement); break;
      case 'ai-mode': selectAiMode(actionElement.dataset.aiTab); break;
      case 'dashboard-recommend': runDashboardRecommendation(actionElement); break;
      case 'toggle-theme': toggleTheme(); break;
      default: break;
    }
    return;
  }

  if (event.target.closest('.fq')) {
    toggleFaq(event.target.closest('.fq'));
    return;
  }
  if (event.target.closest('.logo')) {
    go('/');
    return;
  }
  if (event.target.closest('#mm')) {
    $('#nav')?.classList.toggle('o');
    return;
  }
  const joinButton = event.target.closest('#joinBtn');
  if (joinButton) go(joinButton.dataset.path || joinPath());
}

function handleInput(event) {
  if (['q', 'lv', 'skillLevelFilter'].includes(event.target.id)) {
    renderSkillResults();
  }
  if (event.target.id === 'homeSkillSearch') return;
}

function handleSubmit(event) {
  const formName = event.target.dataset.form;
  if (!formName && event.target.matches('.quick-search-form')) {
    searchSkills(event);
    return;
  }
  switch (formName) {
    case 'signup': signup(event); break;
    case 'ai-chat': submitAiChat(event); break;
    case 'ai-recommend': handleAiRecommendation(event); break;
    case 'ai-roadmap': handleAiRoadmap(event); break;
    case 'ai-match': handleAiMatch(event); break;
    default: break;
  }
}

async function bootApp() {
  await initializeData();
  removeLegacyCredentials();
  initializeTheme();
  renderCurrentPage();
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleInput);
  document.addEventListener('submit', handleSubmit);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
