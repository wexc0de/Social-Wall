const JSONBIN_BIN_ID = '69bdde4db7ec241ddc89c78f';
const JSONBIN_API_KEY = '$2a$10$tjO8isDPVduBRGAfE8ELFuVPKZO0zUkBgXyMUx57QsHw8UfztnyBi';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

let posts = [];
let activeFilter = 'All';

async function loadPosts() {
  setStatus('Loading...', '');
  try {
    const res = await fetch(JSONBIN_URL + '/latest', {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    posts = Array.isArray(data.record) ? data.record : [];
  } catch (e) {
    console.error('Loading failed:', e);
    setStatus('Loading failed. Check API key.', 'error');
    posts = [];
  }
}

async function savePosts() {
  const res = await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify(posts)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
}

async function addPost() {
  const authorInput = document.getElementById('author');
  const postInput   = document.getElementById('post');
  const catInput    = document.getElementById('cat');
  const btn         = document.getElementById('add-btn');

  const text   = postInput.value.trim();
  const author = authorInput.value.trim() || 'Anonymous';
  const cat    = catInput.value;

  if (!text) {
    setStatus('Please write something!', 'error');
    postInput.focus();
    return;
  }

  if (text.length < 10) {
    setStatus('Post is too short (min 10 characters).', 'error');
    postInput.focus();
    return;
  }

  const newPost = {
    id:     Date.now(),
    author: author,
    cat:    cat,
    text:   text,
    date:   new Date().toLocaleDateString('et-EE'),
  };

  posts.unshift(newPost);
  btn.disabled = true;
  setStatus('Saving...', '');

  try {
    await savePosts();
    postInput.value = '';
    updateCharCount(0);
    setStatus('Post added!', 'success');
  } catch (e) {
    console.error('Saving failed:', e);
    posts.shift();
    setStatus('Saving failed.', 'error');
  }

  setTimeout(() => {
    setStatus('');
    btn.disabled = false;
  }, 1500);

  activeFilter = 'All';
  renderFilters();
  renderPosts();
  updateCount();
}

function getCategories() {
  const cats = posts.map(p => p.cat);
  return ['All', ...new Set(cats)];
}

function renderFilters() {
  const container = document.getElementById('filters');
  container.innerHTML = getCategories().map(cat => `
    <button class="filter-btn ${cat === activeFilter ? 'active' : ''}" onclick="setFilter('${cat}')">${cat}</button>
  `).join('');
}

function setFilter(cat) {
  activeFilter = cat;
  renderFilters();
  renderPosts();
}

function renderPosts() {
  const list = document.getElementById('list');
  const filtered = activeFilter === 'All' ? posts : posts.filter(p => p.cat === activeFilter);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:8px;">❌</div>
        <p>${posts.length === 0 ? 'There are no posts yet. Be the first!' : 'There are no posts yet in this category.'}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map((post, i) => `
    <div class="post-card" style="animation-delay:${i * 35}ms">
      <div class="post-top">
        <span class="post-badge">${escHtml(post.cat)}</span>
        <span class="post-date">${escHtml(post.date)}</span>
      </div>
      <p class="post-text">${escHtml(post.text)}</p>
      <div class="post-author">— ${escHtml(post.author)}</div>
    </div>
  `).join('');
}

function updateCount() {
  document.getElementById('post-count').textContent =
    posts.length === 1 ? '1 posts' : `${posts.length} posts`;
}

function setStatus(msg, type = '') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status-msg ' + type;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateCharCount(len) {
  document.getElementById('char-num').textContent = len;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPosts();
  renderFilters();
  renderPosts();
  updateCount();

  const postInput = document.getElementById('post');
  postInput.addEventListener('input', () => updateCharCount(postInput.value.length));
  postInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addPost(); }
  });
});