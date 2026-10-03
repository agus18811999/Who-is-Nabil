/**
 * ==============================================================================
 * PORTFOLIO APPLICATION ENGINE - MOHMMAD NABILAH ABROR
 * Architecture: Vanilla JS Data Layer, Micro-Interactions, Modal & API Gateway
 * ==============================================================================
 */

// 1. GLOBAL CONFIGURATION
const CONFIG = {
  // Ganti URL berikut dengan Web App URL hasil deployment Apps Script Anda:
  API_URL: 'https://script.google.com/macros/s/AKfycbw2yY5EJyiiJciRNUfFgfEhOSP7y9wtrN5lab918N6uQi896MGpyCDs6YkXaiJBddc/exec',
  FETCH_TIMEOUT_MS: 8000
};

// 2. FALLBACK INITIAL DATA (Source of Truth dari CV)
// Menjamin website tampil 100% lengkap dan profesional tanpa jeda loading kosong


// 3. APPLICATION STATE
const AppState = {
  data: {
    profile: null,
    experiences: [],
    projects: [],
    skills: [],
    achievements: [],
    certifications: [],
    leadership: [],
    config: {}
  },
  isLoading: true,
  isApiConnected: false,
  activeFilter: 'all'
};

// ==============================================================================
// 3. INISIALISASI HALAMAN & FETCH DARI GOOGLE SHEETS
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Pasang sistem interaksi UI terlebih dahulu
  setupNavigation();
  setupScrollEffects();
  setupCounters();
  setupModal();
  setupContactForm();
  
  // Tarik 100% data langsung dari Google Sheets API (Zero Mock Data)
  fetchApiData();
});


// 5. DATA RENDERERS
function renderAllSections() {
  renderProjects(AppState.data.projects);
  renderExperience(AppState.data.experiences, AppState.activeFilter);
  renderSkills(AppState.data.skills);
  renderAchievements(AppState.data.achievements);
  renderCertifications(AppState.data.certifications);
  renderLeadership(AppState.data.leadership);
}

// GANTI FUNGSI renderProjects DI js/app.js DENGAN KODE DINAMIS INI:
// ==============================================================================
// SISTEM PROYEK & MODAL STUDI KASUS (ANTI-STUCK + DIAGNOSTIC LOGS)
// ==============================================================================

// 1. Render Seluruh Kartu Proyek dengan Banner Visual Seragam 100%
// ==============================================================================
// SISTEM PORTOFOLIO PROYEK DINAMIS (FILTER KATEGORI + PREVIEW & GITHUB URL)
// ==============================================================================
let rawBackendProjects = [];
let activeProjectFilter = 'all';

function renderProjects(projectsData, selectedFilter = 'all') {
  const container = document.getElementById('projectsContainer');
  const filterContainer = document.getElementById('projectsFilterContainer');
  if (!container) return;

  // 1. Simpan data murni dari Google Sheets Backend
  if (Array.isArray(projectsData) && projectsData.length > 0) {
    rawBackendProjects = projectsData.filter(item => {
      return !item.status || String(item.status).toLowerCase() === 'active';
    });
  } else if ((!rawBackendProjects || rawBackendProjects.length === 0) && AppState.data && Array.isArray(AppState.data.projects)) {
    rawBackendProjects = AppState.data.projects.filter(item => !item.status || String(item.status).toLowerCase() === 'active');
  }

  if (!rawBackendProjects || rawBackendProjects.length === 0) {
    return;
  }

  activeProjectFilter = selectedFilter;

  // 2. OTOMATIS AMBIL KATEGORI UNIK DARI GOOGLE SHEETS UNTUK TOMBOL FILTER
  // (Product Management, Business Consulting, Web Development, Market Research, dll.)
  const uniqueCategories = [];
  rawBackendProjects.forEach(p => {
    const rawCat = (p.category || 'General').trim();
    if (!uniqueCategories.includes(rawCat)) {
      uniqueCategories.push(rawCat);
    }
  });

  // 3. Render Tombol Filter Dinamis
  if (filterContainer) {
    let filterHtml = `
      <button class="projects-filter-btn ${activeProjectFilter === 'all' ? 'active' : ''}" data-filter="all">
        <span>Semua Portofolio</span>
        <span class="projects-filter-counter">${rawBackendProjects.length}</span>
      </button>
    `;

    uniqueCategories.forEach(cat => {
      const count = rawBackendProjects.filter(p => (p.category || 'General').trim() === cat).length;
      const isActive = activeProjectFilter === cat ? 'active' : '';
      filterHtml += `
        <button class="projects-filter-btn ${isActive}" data-filter="${escapeHTML(cat)}">
          <span>${escapeHTML(cat)}</span>
          <span class="projects-filter-counter">${count}</span>
        </button>
      `;
    });

    filterContainer.innerHTML = filterHtml;

    // Pasang Event Listener Klik Tombol Filter
    filterContainer.querySelectorAll('.projects-filter-btn').forEach(btn => {
      btn.onclick = () => {
        filterContainer.querySelectorAll('.projects-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const chosen = btn.getAttribute('data-filter');
        renderProjects(null, chosen);
      };
    });
  }

  // 4. Saring Proyek Sesuai Filter yang Dipilih
  const filteredProjects = rawBackendProjects.filter(p => {
    if (activeProjectFilter === 'all') return true;
    return (p.category || 'General').trim() === activeProjectFilter;
  });

  // Gambar cadangan beresolusi tinggi jika kolom preview_url di spreadsheet belum diisi
  const defaultImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=85'
  ];

  // 5. Render Kartu Proyek Lengkap dengan preview_url & github_url
  container.innerHTML = filteredProjects.map((project, idx) => {
    const pId = String(project.id || `proj_${idx + 1}`).trim();
    const pName = project.projectName || project.project_name || project.name || 'Proyek Bisnis Strategis';
    const pCat = project.category || 'Business Portfolio';
    const pPeriod = project.period || '2025 – Present';
    const pSummary = project.shortSummary || project.short_summary || project.summary || '';
    const pImpact = project.impactMetrics || project.impact_metrics || project.impact || 'Pertumbuhan terukur dan hasil valid';
    const pBrand = project.clientOrBrand || project.client_or_brand || project.client || pName;

    // Ambil kolom preview_url dan github_url dari Google Sheets
    const previewUrl = project.previewUrl || project.preview_url || '';
    const githubUrl = project.githubUrl || project.github_url || '';

    // Ambil gambar dari preview_url (jika format gambar) atau fallback
    const pImg = (previewUrl && previewUrl.startsWith('http') && (previewUrl.includes('unsplash') || previewUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)))
      ? previewUrl
      : defaultImages[idx % defaultImages.length];

    // Parsing tools/keahlian secara aman
    let toolsList = [];
    if (Array.isArray(project.toolsUsed)) {
      toolsList = project.toolsUsed;
    } else if (typeof project.toolsUsed === 'string') {
      try {
        toolsList = JSON.parse(project.toolsUsed);
      } catch (e) {
        toolsList = project.toolsUsed.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    if (toolsList.length === 0) toolsList = ['Strategy', 'Execution', 'Analysis'];

    return `
      <article class="project-card-luxe" data-id="${escapeHTML(pId)}">
        
        <!-- Media Frame Mac-Style -->
        <div class="project-media-stage">
          <div class="media-frame-mac">
            <div class="browser-dots" aria-hidden="true">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="browser-url-pill">${escapeHTML(pBrand.toLowerCase().replace(/[^a-z0-9]/g, ''))}.portfolio • Live</span>
            </div>

            <div class="media-img-container">
              <img src="${escapeHTML(pImg)}" alt="${escapeHTML(pName)}" class="project-img-cover" loading="lazy" />
              <div class="media-sheen-sweep" aria-hidden="true"></div>
            </div>

            <div class="media-floating-badge badge-top-right">
              <span class="badge-spark spark-blue"></span>
              <span>Portofolio Terverifikasi</span>
            </div>
          </div>
        </div>

        <!-- Body Kartu Proyek -->
        <div class="project-content-stage">
          <div class="project-meta-strip">
            <span class="category-pill-luxe">${escapeHTML(pCat)}</span>
            <span class="project-timeline">${escapeHTML(pPeriod)}</span>
          </div>

          <h3 class="project-name-luxe">${escapeHTML(pName)}</h3>
          <p class="project-summary-luxe">${escapeHTML(pSummary)}</p>

          <!-- Kapsul Hasil & Validasi Bisnis (360° Simetris) -->
          <div class="project-impact-ribbon">
            <div class="impact-indicator-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="impact-text-group">
              <span class="impact-small-label">HASIL & VALIDASI BISNIS:</span>
              <span class="impact-bold-val">${escapeHTML(pImpact)}</span>
            </div>
          </div>

          <!-- Cloud Chip Keahlian -->
          <div class="project-chips-cloud">
            ${toolsList.slice(0, 5).map(tool => `<span class="tech-chip">${escapeHTML(tool)}</span>`).join('')}
          </div>

          <!-- Action Row: Link Preview, GitHub/Dokumen, & Bedah Studi Kasus -->
          <div class="project-action-row">
            <div class="project-external-links">
              ${(previewUrl && previewUrl !== '#' && previewUrl.startsWith('http')) ? `
                <a href="${escapeHTML(previewUrl)}" target="_blank" rel="noopener noreferrer" class="btn-project-link link-preview" title="Buka Demo / Website Langsung">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span>Live Web ↗</span>
                </a>
              ` : ''}

              ${(githubUrl && githubUrl !== '#' && githubUrl.startsWith('http')) ? `
                <a href="${escapeHTML(githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn-project-link link-github" title="Buka Dokumen / Pitch Deck / Repository">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  <span>Dokumen / Repo ↗</span>
                </a>
              ` : ''}
            </div>

            <button type="button" class="btn-case-modal" onclick="openProjectModal('${escapeHTML(pId)}')">
              <span>Bedah Studi Kasus</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

      </article>
    `;
  }).join('');
}

// 6. Fungsi Membuka Modal (Dilengkapi Link preview_url & github_url Resmi)
function openProjectModal(projectId) {
  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('modalBody');
  if (!modal || !modalBody) return;

  try {
    const projects = (rawBackendProjects && rawBackendProjects.length > 0) 
      ? rawBackendProjects 
      : (AppState.data && Array.isArray(AppState.data.projects) ? AppState.data.projects : []);

    const project = projects.find(p => String(p.id).trim().toLowerCase() === String(projectId).trim().toLowerCase()) 
                 || projects[0];

    if (!project) return;

    const pName = project.projectName || project.project_name || project.name || 'Detail Proyek';
    const pCat = project.category || 'Strategic Case Study';
    const pPeriod = project.period || '2025';
    const pProblem = project.problemStatement || project.problem_statement || project.problem || 'Menghadapi tantangan strategis dalam efisiensi operasional dan pertumbuhan pasar.';
    const pRole = project.roleAndApproach || project.role_and_approach || project.role || 'Memimpin perumusan solusi terstruktur dan eksekusi komersial.';
    const pSolution = project.solutionAndResults || project.solution_and_results || project.solution || 'Menghasilkan optimasi proses bisnis dan kepuasan pemangku kepentingan.';
    const pImpact = project.impactMetrics || project.impact_metrics || project.impact || 'Pertumbuhan terukur dan hasil valid.';

    // Ambil kolom preview_url dan github_url untuk modal
    const previewUrl = project.previewUrl || project.preview_url || '';
    const githubUrl = project.githubUrl || project.github_url || '';

    let tools = [];
    if (Array.isArray(project.toolsUsed)) tools = project.toolsUsed;
    else if (typeof project.toolsUsed === 'string') {
      try { tools = JSON.parse(project.toolsUsed); } catch (e) { tools = project.toolsUsed.split(','); }
    }
    if (tools.length === 0) tools = ['Strategy', 'Analysis', 'Execution'];

    modalBody.innerHTML = `
      <div class="modal-case-header">
        <div class="modal-badge-meta">
          <span class="modal-cat-tag">${escapeHTML(pCat)}</span>
          <span class="modal-period-tag">${escapeHTML(pPeriod)}</span>
        </div>
        <h2 class="modal-case-title">${escapeHTML(pName)}</h2>
      </div>

      <!-- Kapsul Metrik Dampak -->
      <div class="modal-impact-banner">
        <div class="modal-impact-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <div>
          <span class="modal-impact-label">DAMPAK UTAMA & METRIK KEBERHASILAN:</span>
          <strong class="modal-impact-text">${escapeHTML(pImpact)}</strong>
        </div>
      </div>

      <!-- Bento Breakdown 3-Tahap -->
      <div class="modal-bento-grid">
        <div class="modal-bento-card bento-problem">
          <div class="bento-step-badge step-1">01 • TANTANGAN & MASALAH</div>
          <h4 class="bento-step-title">Tantangan Bisnis</h4>
          <p class="bento-step-desc">${escapeHTML(pProblem)}</p>
        </div>

        <div class="modal-bento-card bento-approach">
          <div class="bento-step-badge step-2">02 • PERAN & PENDEKATAN</div>
          <h4 class="bento-step-title">Pendekatan Eksekusi</h4>
          <p class="bento-step-desc">${escapeHTML(pRole)}</p>
        </div>

        <div class="modal-bento-card bento-solution bento-full">
          <div class="bento-step-badge step-3">03 • SOLUSI & HASIL NYATA</div>
          <h4 class="bento-step-title">Solusi & Dampak yang Dihasilkan</h4>
          <p class="bento-step-desc">${escapeHTML(pSolution)}</p>
        </div>
      </div>

      <!-- Tools Cloud -->
      <div class="modal-tools-deck">
        <span class="modal-tools-label">METODOLOGI & PERALATAN KERJA:</span>
        <div class="modal-chips-row">
          ${tools.map(t => `<span class="modal-chip">${escapeHTML(String(t).trim())}</span>`).join('')}
        </div>
      </div>

      <!-- Modal Footer Lengkap dengan preview_url & github_url -->
      <div class="modal-action-footer">
        <div class="modal-external-actions">
          ${(previewUrl && previewUrl !== '#' && previewUrl.startsWith('http')) ? `
            <a href="${escapeHTML(previewUrl)}" target="_blank" rel="noopener noreferrer" class="btn-modal-ext ext-web">
              <span>Buka Live Website ↗</span>
            </a>
          ` : ''}

          ${(githubUrl && githubUrl !== '#' && githubUrl.startsWith('http')) ? `
            <a href="${escapeHTML(githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn-modal-ext ext-repo">
              <span>Buka Dokumen / Repo ↗</span>
            </a>
          ` : ''}
        </div>

        <div class="modal-main-actions">
          <button type="button" class="btn-close-modal-footer" onclick="closeModal()">Tutup</button>
          <a href="#contact" class="btn-modal-contact" onclick="closeModal()">
            <span>Diskusikan Kolaborasi</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

  } catch (err) {
    console.error('[Modal Error]', err);
    document.body.style.overflow = '';
    closeModal();
  }
}

function closeModal() {
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.classList.remove('active');
  }
  // SELALU BUKA KEMBALI KUNCI SCROLL HALAMAN
  document.body.style.overflow = '';
}

// GANTI FUNGSI renderExperience DI js/app.js DENGAN KODE INI:
// GANTI FUNGSI renderExperience DI js/app.js DENGAN KODE DINAMIS INI:
// GANTI FUNGSI renderExperience DI js/app.js DENGAN KODE INI:
// GANTI FUNGSI renderExperience DI js/app.js DENGAN KODE INI:
let currentExpFilter = 'all';

function renderExperience(experiencesData, filter = 'all') {
  const container = document.getElementById('experienceTimeline');
  if (!container) return;

  const experiences = Array.isArray(experiencesData) && experiencesData.length > 0 
    ? experiencesData 
    : (AppState.data && Array.isArray(AppState.data.experiences) ? AppState.data.experiences : []);

  if (experiences.length === 0) return;

  currentExpFilter = filter;

  // 1. Koleksi visual kontekstual untuk tiap peran
  const visualMap = {
    exp_01: { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=85', tag: 'Partnership Growth Hub', tagColor: 'badge-sky', skills: ['Pipeline Mgmt', 'B2B Sales', 'Negotiation', 'Cross-Functional'] },
    exp_02: { img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1000&q=85', tag: 'C-Suite Executive Operations', tagColor: 'badge-cobalt', skills: ['Executive Decks', 'Stakeholder Mgmt', 'Strategic Priorities', 'Market Research'] },
    exp_03: { img: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=85', tag: 'Corporate & SME Acquisition', tagColor: 'badge-azure', skills: ['Client Acquisition', 'Contract Proposal', 'Market Intelligence', 'SME Pitching'] },
    exp_04: { img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=85', tag: 'B2B Market Lead Mapping', tagColor: 'badge-cyan', skills: ['Lead Generation', 'Company Mapping', 'Database Building', 'Lead Qualification'] },
    exp_05: { img: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=85', tag: 'Digital Media Deals', tagColor: 'badge-sky', skills: ['Commercial Proposals', 'Media Partnerships', 'Prospect Mapping', 'Pitch Decks'] },
    exp_06: { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=85', tag: 'Market Intelligence & Trends', tagColor: 'badge-emerald', skills: ['Primary Research', 'Secondary Research', 'Competitive Benchmarking', 'Segmentation'] },
    exp_07: { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=85', tag: 'Agile Marketing PM & SOP', tagColor: 'badge-sky', skills: ['ClickUp & Sheets', 'SOP Development', 'Timeline Governance', 'Milestone Tracking'] },
    exp_08: { img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=85', tag: 'Fintech Prospecting Pipeline', tagColor: 'badge-gold', skills: ['Lead Qualification', 'Pitch Decks', 'Value Propositions', 'Sales Presentations'] },
    exp_09: { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=85', tag: 'Team Leadership (6-10 Interns)', tagColor: 'badge-cobalt', skills: ['Team Mentorship', '80+ Partner Pipeline', 'Market Penetration', 'Operations'] },
    exp_10: { img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=85', tag: 'MECE & Root Cause Analysis', tagColor: 'badge-emerald', skills: ['MECE Framework', '5 Whys Diagnostic', 'Financial Feasibility', 'Executive Decks'] },
    exp_11: { img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=85', tag: 'Industrial Robotics Expansion', tagColor: 'badge-azure', skills: ['Robotics Technology', 'Product Positioning', 'Sales Strategy', 'Industrial Clients'] }
  };

  // 2. Fungsi Cerdas Klasifikasi Kategori Pengalaman dari Teks Database
  function getExpCategory(exp) {
    const role = String(exp.roleTitle || exp.role_title || exp.role || '').toLowerCase();
    const comp = String(exp.companyName || exp.company_name || exp.company || '').toLowerCase();

    // Kategori: Executive & Lead
    if (role.includes('chief') || role.includes('head') || role.includes('lead') || 
        role.includes('president') || role.includes('vp') || role.includes('director') || 
        role.includes('cbo') || role.includes('vice')) {
      return 'leadership';
    }

    // Kategori: Konsultasi & Riset
    if (role.includes('consultant') || role.includes('konsultan') || role.includes('researcher') || 
        role.includes('riset') || role.includes('project officer') || comp.includes('consultant') || 
        comp.includes('educativa') || comp.includes('damirich') || comp.includes('renjana')) {
      return 'consulting';
    }

    // Kategori: Business Development
    return 'bd';
  }

  // 3. Hitung Jumlah Dinamis untuk Lencana Filter
  const counts = { all: experiences.length, leadership: 0, consulting: 0, bd: 0 };
  experiences.forEach(exp => {
    const cat = getExpCategory(exp);
    if (counts[cat] !== undefined) counts[cat]++;
  });

  // Tampilkan angka lencana di tombol filter
  const filterTabsContainer = document.querySelector('.experience-filter-tabs');
  if (filterTabsContainer) {
    const btnAll = filterTabsContainer.querySelector('[data-filter="all"] .filter-counter-pill');
    const btnLead = filterTabsContainer.querySelector('[data-filter="leadership"] .filter-counter-pill');
    const btnConsult = filterTabsContainer.querySelector('[data-filter="consulting"] .filter-counter-pill');
    const btnBd = filterTabsContainer.querySelector('[data-filter="bd"] .filter-counter-pill');

    if (btnAll) btnAll.textContent = counts.all;
    if (btnLead) btnLead.textContent = counts.leadership;
    if (btnConsult) btnConsult.textContent = counts.consulting;
    if (btnBd) btnBd.textContent = counts.bd;
  }

  // 4. Saring Kartu Sesuai Filter Aktif
  const filtered = experiences.filter(exp => {
    if (currentExpFilter === 'all') return true;
    const cat = getExpCategory(exp);
    return cat === currentExpFilter;
  });

  // Helper format tanggal
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const clean = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const parts = clean.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${months[monthIdx] || parts[1]} ${parts[0]}`;
    }
    return clean;
  }

  // 5. Render Kartu Pengalaman
  container.innerHTML = filtered.map(exp => {
    const pId = String(exp.id || 'exp_01').trim();
    const visual = visualMap[pId] || { 
      img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85', 
      tag: 'Strategic Business Execution',
      tagColor: 'badge-sky',
      skills: ['Business Development', 'Strategy', 'Market Research', 'Analysis']
    };

    const compName = exp.companyName || exp.company_name || exp.company || 'Company';
    const roleTitle = exp.roleTitle || exp.role_title || exp.role || 'Role Title';
    const location = exp.location || 'Indonesia';
    const empType = exp.employmentType || exp.employment_type || 'Remote';
    const desc = exp.shortDescription || exp.short_description || exp.description || '';
    const metric = exp.achievementsMetrics || exp.achievements_metrics || exp.metrics || 'Key Results Achieved';

    const initials = compName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    const sDate = formatDisplayDate(exp.startDate || exp.start_date);
    const eDate = formatDisplayDate(exp.endDate || exp.end_date);
    const periodDisplay = (sDate && eDate) ? `${sDate} – ${eDate}` : (sDate || eDate || '2026');

    return `
      <div class="exp-timeline-node">
        
        <div class="exp-beacon-marker" aria-hidden="true">
          <span class="beacon-core"></span>
          <span class="beacon-ring"></span>
          <span class="beacon-ring-outer"></span>
        </div>

        <article class="exp-luxe-card">
          
          <div class="exp-card-media-band">
            <img src="${visual.img}" alt="${escapeHTML(compName)}" class="exp-media-thumb" loading="lazy" />
            <div class="exp-media-overlay"></div>
            
            <div class="exp-media-floating-badges">
              <span class="exp-media-tag ${visual.tagColor}">
                <span class="tag-sparkle"></span>
                ${escapeHTML(visual.tag)}
              </span>
              <span class="exp-period-pill">${escapeHTML(periodDisplay)}</span>
            </div>
          </div>

          <div class="exp-card-inner">
            
            <div class="exp-identity-row">
              <div class="exp-brand-icon">
                <span>${initials}</span>
                <span class="icon-verified-dot" title="Verified Track Record">✓</span>
              </div>
              <div class="exp-role-heading-group">
                <div class="exp-company-sub">
                  <span class="exp-company-text">${escapeHTML(compName)}</span>
                  <span class="exp-dot-sep">•</span>
                  <span class="exp-location-pill">${escapeHTML(location)} (${escapeHTML(empType)})</span>
                </div>
                <h3 class="exp-role-title">${escapeHTML(roleTitle)}</h3>
              </div>
            </div>

            <p class="exp-narrative-summary">${escapeHTML(desc)}</p>

            <div class="exp-result-capsule">
              <div class="exp-result-icon-box">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div class="exp-result-text-stack">
                <span class="exp-result-label">PROVEN OUTCOME & DELIVERABLE</span>
                <p class="exp-result-val">${escapeHTML(metric)}</p>
              </div>
            </div>

            <div class="exp-skills-cloud">
              ${visual.skills.map(skill => `<span class="exp-chip">${escapeHTML(skill)}</span>`).join('')}
            </div>

          </div>
        </article>

      </div>
    `;
  }).join('');

  // 6. AKTIFKAN EVENT LISTENER KLIK PADA TOMBOL FILTER
  setupExpFilterClickHandlers(experiences);
}

// Fungsi Khusus Menangani Klik Filter
function setupExpFilterClickHandlers(experiencesList) {
  const filterTabs = document.querySelectorAll('.experience-filter-tabs .filter-btn');
  filterTabs.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      // Hilangkan status aktif dari tombol lain
      filterTabs.forEach(b => b.classList.remove('active'));
      // Aktifkan tombol yang baru saja diklik
      btn.classList.add('active');

      const targetFilter = btn.getAttribute('data-filter') || 'all';
      renderExperience(experiencesList, targetFilter);
    };
  });
}

// GANTI FUNGSI renderSkills DI js/app.js DENGAN KODE DINAMIS INI:
function renderSkills(skillsData) {
  const container = document.getElementById('skillsContainer');
  if (!container || !skillsData) return;

  // Metadata visual untuk tiap klaster keahlian
  const clusterMeta = {
    bd: {
      caption: 'KLASTER KOMERSIAL',
      title: 'Business Development & Sales',
      icon: '💼',
      iconClass: 'icon-sky',
      fillClass: 'fill-sky',
      sparkClass: 'spark-blue',
      badgeTag: 'Growth & Pipeline Velocity',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=85'
    },
    strategy: {
      caption: 'KLASTER STRATEGIS',
      title: 'Strategy & Financial Analysis',
      icon: '📈',
      iconClass: 'icon-cobalt',
      fillClass: 'fill-cobalt',
      sparkClass: 'spark-cobalt',
      badgeTag: 'Finance Minor & Valuation',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=85'
    },
    tools: {
      caption: 'KLASTER TEKNOLOGI',
      title: 'Tools & Technology Stack',
      icon: '⚙️',
      iconClass: 'icon-cyan',
      fillClass: 'fill-cyan',
      sparkClass: 'spark-cyan',
      badgeTag: 'Automation & Analytics',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=85'
    }
  };

  // Normalisasi data: Menangani baik format Objek Kategori maupun Array dari Google Sheets API
  let normalizedClusters = [];

  if (Array.isArray(skillsData)) {
    // Jika data berasal langsung dari sheet 'Skills' Google Sheets
    const groups = {
      bd: { ...clusterMeta.bd, items: [] },
      strategy: { ...clusterMeta.strategy, items: [] },
      tools: { ...clusterMeta.tools, items: [] }
    };

    skillsData.forEach(item => {
      const cat = (item.category || '').toLowerCase();
      const level = item.proficiencyLevel || item.level || 'Advanced';
      const skillObj = { name: item.skillName || item.name, level: level };

      if (cat.includes('sales') || cat.includes('development') || cat.includes('partnership')) {
        groups.bd.items.push(skillObj);
      } else if (cat.includes('strategy') || cat.includes('analytic') || cat.includes('finance')) {
        groups.strategy.items.push(skillObj);
      } else {
        groups.tools.items.push(skillObj);
      }
    });

    normalizedClusters = Object.values(groups);
  } else {
    // Format fallback data bawaan
    normalizedClusters = Object.keys(skillsData).map(key => {
      const meta = clusterMeta[key] || clusterMeta.bd;
      return {
        ...meta,
        title: skillsData[key].title || meta.title,
        icon: skillsData[key].icon || meta.icon,
        items: skillsData[key].items || []
      };
    });
  }

  // Render kartu bento dengan progress meter
  container.innerHTML = normalizedClusters.map(cluster => {
    return `
      <article class="skill-luxe-card">
        
        <!-- Media Banner Visual -->
        <div class="skill-card-media-band">
          <img src="${cluster.image}" alt="${escapeHTML(cluster.title)}" class="skill-media-img" loading="lazy" />
          <div class="skill-media-overlay"></div>
          <div class="skill-media-badge">
            <span class="badge-spark ${cluster.sparkClass}"></span>
            <span>${escapeHTML(cluster.badgeTag)}</span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="skill-card-body">
          <div class="skill-header-row">
            <div class="skill-cat-icon-box ${cluster.iconClass}">
              <span>${cluster.icon}</span>
            </div>
            <div>
              <span class="skill-cluster-caption">${escapeHTML(cluster.caption)}</span>
              <h3 class="skill-cat-heading">${escapeHTML(cluster.title)}</h3>
            </div>
          </div>

          <!-- List Kemahiran dengan Meter Track -->
          <div class="skill-meter-list">
            ${cluster.items.map(item => {
              const isIntermediate = String(item.level).toLowerCase().includes('intermediate');
              const percent = isIntermediate ? 85 : 95;
              const levelLabel = isIntermediate ? 'Intermediate • 85%' : 'Advanced • 95%';
              const levelClass = isIntermediate ? 'level-intermediate' : 'level-advanced';

              return `
                <div class="skill-meter-item">
                  <div class="skill-info-row">
                    <span class="skill-name">${escapeHTML(item.name)}</span>
                    <span class="skill-level-text ${levelClass}">${levelLabel}</span>
                  </div>
                  <div class="skill-meter-track">
                    <div class="skill-meter-fill ${cluster.fillClass}" style="width: ${percent}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </article>
    `;
  }).join('');
}

// GANTI FUNGSI renderAchievements DI js/app.js DENGAN KODE DINAMIS INI:
let currentAchFilter = 'all';

function renderAchievements(achievementsData, filter = 'all') {
  const container = document.getElementById('achievementsContainer');
  if (!container || !achievementsData || achievementsData.length === 0) return;

  currentAchFilter = filter;

  // Koleksi gambar visual podium/panggung resolusi tinggi yang bervariasi
  const galleryImages = [
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=85'
  ];

  // Fungsi cerdas mendeteksi tingkatan kategori juara dari teks database Google Sheets
  function classifyTier(ach) {
    const text = `${ach.awardTitle || ''} ${ach.title || ''} ${ach.awardRank || ''} ${ach.eventCompetition || ''} ${ach.event || ''}`.toLowerCase();
    
    if (text.includes('beasiswa') || text.includes('scholarship') || text.includes('awardee')) {
      return 'scholarship';
    }
    if (text.includes('1st') || text.includes('juara 1') || text.includes('first') || text.includes('best presenter') || text.includes('champion')) {
      return '1st';
    }
    if (text.includes('2nd') || text.includes('juara 2') || text.includes('second') || text.includes('runner up')) {
      return '2nd';
    }
    if (text.includes('3rd') || text.includes('juara 3') || text.includes('third')) {
      return '3rd';
    }
    if (text.includes('honorable') || text.includes('mention') || text.includes('finalis') || text.includes('finalist') || text.includes('harapan')) {
      return 'mention';
    }
    return '1st'; // default tier
  }

  // Hitung jumlah untuk masing-masing tombol filter
  const counts = { all: achievementsData.length, '1st': 0, '2nd3rd': 0, mention: 0, scholarship: 0 };
  achievementsData.forEach(ach => {
    const tier = classifyTier(ach);
    if (tier === '1st') counts['1st']++;
    else if (tier === '2nd' || tier === '3rd') counts['2nd3rd']++;
    else if (tier === 'mention') counts['mention']++;
    else if (tier === 'scholarship') counts['scholarship']++;
  });

  // Perbarui angka counter di bilah filter
  const elCountAll = document.getElementById('count-all');
  const elCount1st = document.getElementById('count-1st');
  const elCount2nd3rd = document.getElementById('count-2nd3rd');
  const elCountMention = document.getElementById('count-mention');
  const elCountScholarship = document.getElementById('count-scholarship');
  if (elCountAll) elCountAll.textContent = counts.all;
  if (elCount1st) elCount1st.textContent = counts['1st'];
  if (elCount2nd3rd) elCount2nd3rd.textContent = counts['2nd3rd'];
  if (elCountMention) elCountMention.textContent = counts.mention;
  if (elCountScholarship) elCountScholarship.textContent = counts.scholarship;

  // Filter kartu
  const filtered = achievementsData.filter(ach => {
    if (filter === 'all') return true;
    const tier = classifyTier(ach);
    if (filter === '1st') return tier === '1st';
    if (filter === '2nd-3rd') return tier === '2nd' || tier === '3rd';
    if (filter === 'mention') return tier === 'mention';
    if (filter === 'scholarship') return tier === 'scholarship';
    return true;
  });

  // Skema tema warna berdasarkan tingkatan juara
  const tierThemes = {
    '1st': {
      badgeClass: 'badge-gold-glow',
      icon: '🏆',
      cardTheme: 'theme-gold',
      chipClass: 'chip-gold',
      starColor: '★ Juara 1 / Best Presenter'
    },
    '2nd': {
      badgeClass: 'badge-silver-glow',
      icon: '🥈',
      cardTheme: 'theme-silver',
      chipClass: 'chip-silver',
      starColor: '★ Juara 2 / Runner Up'
    },
    '3rd': {
      badgeClass: 'badge-bronze-glow',
      icon: '🥉',
      cardTheme: 'theme-bronze',
      chipClass: 'chip-bronze',
      starColor: '★ Juara 3 / 2nd Runner Up'
    },
    'mention': {
      badgeClass: 'badge-purple-glow',
      icon: '🎖️',
      cardTheme: 'theme-purple',
      chipClass: 'chip-purple',
      starColor: '★ Honorable Mention / Finalis'
    },
    'scholarship': {
      badgeClass: 'badge-emerald-glow',
      icon: '🏛️',
      cardTheme: 'theme-emerald',
      chipClass: 'chip-emerald',
      starColor: '★ Beasiswa Prestasi Nasional'
    }
  };

  container.innerHTML = filtered.map((ach, idx) => {
    const tier = classifyTier(ach);
    const theme = tierThemes[tier] || tierThemes['1st'];
    
    const title = ach.title || ach.awardTitle || 'National Award Winner';
    const event = ach.event || ach.eventCompetition || 'National Business Competition';
    const organizer = ach.organizer || ach.organizerInstitution || 'Top Tier University';
    const year = ach.year || '2024';
    const desc = ach.desc || ach.credentialDescription || 'Pencapaian kompetitif dalam kejuaraan bisnis nasional.';
    const certUrl = ach.credentialUrl || ach.credential_url || 'https://drive.google.com';
    const cardImg = galleryImages[idx % galleryImages.length];

    return `
      <article class="ach-luxe-card ${theme.cardTheme}">
        
        <!-- Viewport Gambar yang Seragam 100% -->
        <div class="ach-media-viewport">
          <img src="${cardImg}" alt="${escapeHTML(event)}" class="ach-img-cover" loading="lazy" />
          <div class="ach-media-overlay"></div>

          <!-- Lencana Peringkat Berwarna Dinamis -->
          <div class="ach-media-badge-group">
            <span class="ach-rank-pill ${theme.badgeClass}">
              <span class="laurel-leaf">${theme.icon}</span>
              <span>${escapeHTML(title)}</span>
            </span>
            <span class="ach-year-pill">Tahun ${escapeHTML(year)}</span>
          </div>
        </div>

        <!-- Badan Kartu -->
        <div class="ach-card-body">
          <div class="ach-card-top-meta">
            <span class="ach-cat-pill">${escapeHTML(theme.starColor.replace('★ ', ''))}</span>
            <span class="ach-organizer-link">${escapeHTML(organizer)}</span>
          </div>

          <h3 class="ach-card-title">${escapeHTML(event)}</h3>
          <p class="ach-card-desc">${escapeHTML(desc)}</p>

          <!-- Footer: Metric Chip & Tombol Sertifikat -->
          <div class="ach-card-footer-box">
            <div class="ach-metric-chip ${theme.chipClass}">
              <span class="chip-star">★</span>
              <span>${escapeHTML(title)}</span>
            </div>

            <a href="${escapeHTML(certUrl)}" target="_blank" rel="noopener noreferrer" class="btn-cert-luxe">
              <span>Lihat Sertifikat & Penghargaan</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>

      </article>
    `;
  }).join('');

  // Aktifkan event listener klik tombol filter
  setupAchFilterListeners();
}

function setupAchFilterListeners() {
  const filterBtns = document.querySelectorAll('.ach-filter-btn');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetFilter = btn.getAttribute('data-filter');
      if (typeof AppState !== 'undefined' && AppState.data && AppState.data.achievements) {
        renderAchievements(AppState.data.achievements, targetFilter);
      }
    };
  });
}

// GANTI FUNGSI renderCertifications DI js/app.js DENGAN KODE MURNI BACKEND INI:
let rawBackendCerts = [];
let activeCertFilter = 'all';

function renderCertifications(backendData, selectedFilter = 'all') {
  const container = document.getElementById('certsContainer');
  const filterContainer = document.getElementById('certsFilterContainer');
  if (!container) return;

  if (Array.isArray(backendData)) {
    rawBackendCerts = backendData.filter(item => {
      return !item.status || String(item.status).toLowerCase() === 'active';
    });
  }

  if (!rawBackendCerts || rawBackendCerts.length === 0) {
    container.innerHTML = `
      <div class="certs-empty-notice">
        <span class="empty-icon">📂</span>
        <h3>Menghubungkan ke Database Backend...</h3>
        <p>Memuat daftar sertifikasi resmi dari Google Sheets...</p>
      </div>
    `;
    return;
  }

  activeCertFilter = selectedFilter;

  // 1. Ambil kategori unik dari Google Sheets untuk filter otomatis
  const uniqueCategories = [];
  rawBackendCerts.forEach(cert => {
    const cat = (cert.credentialCategory || cert.credential_category || 'Umum').trim();
    if (!uniqueCategories.includes(cat)) {
      uniqueCategories.push(cat);
    }
  });

  // Update Summary Ribbon di Header
  const totalCertsEl = document.getElementById('summary-total-certs');
  const totalIssuersEl = document.getElementById('summary-total-issuers');
  if (totalCertsEl) totalCertsEl.textContent = `${rawBackendCerts.length}+`;
  if (totalIssuersEl) {
    const uniqueIssuers = [...new Set(rawBackendCerts.map(c => (c.issuer || '').trim()))].filter(Boolean);
    totalIssuersEl.textContent = `${uniqueIssuers.length} Institusi`;
  }

  // 2. Render Tombol Filter Dinamis
  if (filterContainer) {
    let filterHtml = `
      <button class="certs-filter-btn ${activeCertFilter === 'all' ? 'active' : ''}" data-filter="all">
        <span>Semua Kredensial</span>
        <span class="certs-filter-counter">${rawBackendCerts.length}</span>
      </button>
    `;

    uniqueCategories.forEach(cat => {
      const count = rawBackendCerts.filter(c => (c.credentialCategory || c.credential_category || 'Umum').trim() === cat).length;
      const isActive = activeCertFilter === cat ? 'active' : '';
      filterHtml += `
        <button class="certs-filter-btn ${isActive}" data-filter="${escapeHTML(cat)}">
          <span>${escapeHTML(cat)}</span>
          <span class="certs-filter-counter">${count}</span>
        </button>
      `;
    });

    filterContainer.innerHTML = filterHtml;

    filterContainer.querySelectorAll('.certs-filter-btn').forEach(btn => {
      btn.onclick = () => {
        const chosen = btn.getAttribute('data-filter');
        renderCertifications(null, chosen);
      };
    });
  }

  // 3. Filter Data
  const filteredCerts = rawBackendCerts.filter(cert => {
    if (activeCertFilter === 'all') return true;
    const cat = (cert.credentialCategory || cert.credential_category || 'Umum').trim();
    return cat === activeCertFilter;
  });

  // 4. Penentuan Warna Gradasi Kartu
  function getCardTheme(categoryText = '', issuerText = '') {
    const combined = `${categoryText} ${issuerText}`.toLowerCase();
    if (combined.includes('executive') || combined.includes('leadership') || combined.includes('mckinsey')) {
      return { surface: 'surface-mckinsey', pill: 'pill-navy' };
    }
    if (combined.includes('universitas') || combined.includes('ugm') || combined.includes('academic') || combined.includes('entrepreneurship')) {
      return { surface: 'surface-ugm', pill: 'pill-gold' };
    }
    if (combined.includes('data') || combined.includes('analytic') || combined.includes('excel') || combined.includes('modeling')) {
      return { surface: 'surface-data', pill: 'pill-violet' };
    }
    if (combined.includes('sales') || combined.includes('development') || combined.includes('pipeline') || combined.includes('prospecting')) {
      return { surface: 'surface-bdsales', pill: 'pill-cyan' };
    }
    return { surface: 'surface-azure', pill: 'pill-azure' };
  }

  // 5. Render Kartu (DIPERBAIKI: Konversi tipe angka tahun ke String)
  container.innerHTML = filteredCerts.map(cert => {
    const name = cert.certificateName || cert.certificate_name || cert.name || 'Sertifikasi Keahlian';
    const issuer = cert.issuer || 'Institusi Penerbit';
    const category = cert.credentialCategory || cert.credential_category || 'Spesialisasi';
    const certUrl = cert.credentialUrl || cert.credential_url || '#';

    // PERBAIKAN DI SINI: Deteksi angka tahun dari berbagai kemungkinan nama kolom backend
    const rawYear = cert.issueYear ?? cert.issue_year ?? cert.year ?? cert.tahun ?? '2026';
    const validYear = String(rawYear).trim(); // Menjamin dikonversi menjadi teks

    const theme = getCardTheme(category, issuer);

    return `
      <article class="cert-luxe-card ${theme.surface}">
        
        <div class="card-ambient-refraction" aria-hidden="true"></div>

        <div class="cert-card-top">
          <div class="cert-issuer-badge-wrap">
            <span class="issuer-brand-pill ${theme.pill}">${escapeHTML(issuer)}</span>
            <span class="cert-type-pill">${escapeHTML(category)}</span>
          </div>

          <div class="cert-seal-pill">
            <span class="seal-glow-dot"></span>
            <span>Verified</span>
          </div>
        </div>

        <div class="cert-card-mid">
          <h3 class="cert-title">${escapeHTML(name)}</h3>
          
          <div class="cert-meta-info">
            <span class="cert-issuer-name">${escapeHTML(issuer)}</span>
            <span class="cert-dot-separator">•</span>
            <!-- Menampilkan tahun yang sudah valid -->
            <span class="cert-year-badge">Tahun ${escapeHTML(validYear)}</span>
          </div>
        </div>

        <div class="cert-card-bottom">
          <a href="${escapeHTML(certUrl)}" target="_blank" rel="noopener noreferrer" class="btn-cert-vault">
            <span>Buka Bukti Kredensial Resmi</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>

      </article>
    `;
  }).join('');
}

// GANTI / TAMBAHKAN FUNGSI renderLeadership DI js/app.js DENGAN KODE DINAMIS INI:
// GANTI FUNGSI renderLeadership DI js/app.js DENGAN KODE MURNI BACKEND (ZERO FALLBACK):
let rawBackendLeadership = [];
let activeLeadFilter = 'all';

function renderLeadership(backendData, selectedFilter = 'all') {
  const container = document.getElementById('leadershipContainer');
  const filterContainer = document.getElementById('leadFilterContainer');
  if (!container) return;

  // 1. Simpan data murni dari Google Sheets Backend
  if (Array.isArray(backendData)) {
    rawBackendLeadership = backendData.filter(item => {
      return !item.status || String(item.status).toLowerCase() === 'active';
    });
  }

  // 2. Jika database kosong atau sedang menunggu sinkronisasi backend
  if (!rawBackendLeadership || rawBackendLeadership.length === 0) {
    container.innerHTML = `
      <div class="certs-empty-notice" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: #ffffff; border-radius: 24px; border: 1px dashed #bae6fd;">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📂</span>
        <h3 style="font-size: 1.15rem; color: #0f172a; margin-bottom: 0.25rem;">Menghubungkan ke Database Backend...</h3>
        <p style="font-size: 0.875rem; color: #64748b;">Memuat data kepemimpinan dan kerelawanan dari Google Sheets.</p>
      </div>
    `;
    return;
  }

  activeLeadFilter = selectedFilter;

  // 3. Fungsi Cerdas Klasifikasi Kategori (Leadership vs Volunteer)
  function classifyItem(item) {
    const cat = String(item.category || item.credentialCategory || '').toLowerCase();
    const role = String(item.roleTitle || item.role_title || item.role || '').toLowerCase();
    const org = String(item.organizationName || item.organization_name || item.organization || '').toLowerCase();

    if (cat.includes('volun') || cat.includes('relawan') || cat.includes('pengabdian') || 
        role.includes('volunteer') || role.includes('relawan') || 
        org.includes('volunteer') || org.includes('peduli') || org.includes('komunitas')) {
      return 'volunteer';
    }
    return 'leadership';
  }

  // 4. Hitung Jumlah Dinamis untuk Tombol Filter
  const counts = { all: rawBackendLeadership.length, leadership: 0, volunteer: 0 };
  rawBackendLeadership.forEach(item => {
    const grp = classifyItem(item);
    if (grp === 'volunteer') counts.volunteer++;
    else counts.leadership++;
  });

  const elAll = document.getElementById('lead-count-all');
  const elLead = document.getElementById('lead-count-lead');
  const elVol = document.getElementById('lead-count-vol');
  if (elAll) elAll.textContent = counts.all;
  if (elLead) elLead.textContent = counts.leadership;
  if (elVol) elVol.textContent = counts.volunteer;

  // 5. Event Listener Tombol Filter
  if (filterContainer) {
    filterContainer.querySelectorAll('.lead-filter-btn').forEach(btn => {
      btn.onclick = () => {
        filterContainer.querySelectorAll('.lead-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const chosen = btn.getAttribute('data-filter');
        renderLeadership(null, chosen);
      };
    });
  }

  // 6. Filter Data yang Ditampilkan
  const filtered = rawBackendLeadership.filter(item => {
    if (activeLeadFilter === 'all') return true;
    return classifyItem(item) === activeLeadFilter;
  });

  // 7. Skema Warna Mewah Menyeluruh
  function getLeadTheme(item) {
    const grp = classifyItem(item);
    const org = String(item.organizationName || item.organization || '').toLowerCase();

    if (grp === 'volunteer') {
      return {
        surface: 'surface-lead-volunteer',
        badgePill: 'pill-lead-emerald',
        typeLabel: 'Volunteer & Social Impact',
        icon: '🌱'
      };
    }

    if (org.includes('forum') || org.includes('fmei') || org.includes('ekonomi') || org.includes('policy')) {
      return {
        surface: 'surface-lead-policy',
        badgePill: 'pill-lead-violet',
        typeLabel: 'National Policy Delegate',
        icon: '🏛️'
      };
    }

    return {
      surface: 'surface-lead-governance',
      badgePill: 'pill-lead-sapphire',
      typeLabel: 'Executive Governance',
      icon: '⚖️'
    };
  }

  // 8. Render Kartu Dinamis dari Google Sheets
  container.innerHTML = filtered.map(item => {
    const role = item.roleTitle || item.role_title || item.role || 'Peran Kepemimpinan';
    const org = item.organizationName || item.organization_name || item.organization || 'Nama Organisasi';
    const period = item.period || '2024';
    const scope = item.scopeOfWork || item.scope_of_work || item.desc || 'Menjalankan inisiatif strategis organisasi.';
    const contributions = item.keyContributions || item.key_contributions || 'Memberikan dampak nyata bagi institusi dan masyarakat.';

    let skills = [];
    if (Array.isArray(item.skills)) {
      skills = item.skills;
    } else if (typeof item.skills === 'string') {
      skills = item.skills.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      skills = ['Strategic Governance', 'Social Impact'];
    }

    const theme = getLeadTheme(item);

    return `
      <article class="lead-luxe-card ${theme.surface}">
        
        <div class="card-ambient-refraction" aria-hidden="true"></div>

        <div class="lead-card-top">
          <div class="lead-badge-wrap">
            <span class="lead-type-pill ${theme.badgePill}">${theme.icon} ${theme.typeLabel}</span>
            <span class="lead-period-pill">${escapeHTML(period)}</span>
          </div>

          <div class="lead-verified-seal">
            <span class="lead-seal-dot"></span>
            <span>Verified Impact</span>
          </div>
        </div>

        <div class="lead-card-mid">
          <div class="lead-org-sub">
            <span class="lead-org-name">${escapeHTML(org)}</span>
          </div>

          <h3 class="lead-role-title">${escapeHTML(role)}</h3>
          
          <p class="lead-scope-desc">${escapeHTML(scope)}</p>

          <!-- KOTAK KONTRIBUSI MEWAH BARU (TANPA BORDER SEBELAH/SIDE BORDER JELEK) -->
          <div class="lead-contribution-capsule">
            <div class="lead-contrib-header">
              <div class="lead-contrib-icon-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <span class="lead-contrib-lbl">KONTRIBUSI & INOVASI KUNCI</span>
            </div>
            <p class="lead-contrib-val">${escapeHTML(contributions)}</p>
          </div>

          <!-- Applied Methodology Chips -->
          <div class="lead-chips-wrap">
            ${skills.map(s => `<span class="lead-chip">${escapeHTML(s)}</span>`).join('')}
          </div>
        </div>

      </article>
    `;
  }).join('');
}
// 6. API CLIENT (Hydration dari Google Apps Script)
async function fetchApiData() {
  if (!CONFIG.API_URL || CONFIG.API_URL.includes('XXXXX')) {
    console.warn('PERINGATAN: CONFIG.API_URL belum diisi dengan Web App URL Google Apps Script Anda.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

    // Mengambil seluruh worksheet (Profile, Projects, Experience, Skills, Achievements, Certifications) dalam 1 round-trip
    const response = await fetch(`${CONFIG.API_URL}?action=getInitialData`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Jaringan bermasalah: ' + response.statusText);

    const result = await response.json();

    if (result.success && result.data) {
      AppState.data = result.data;
      AppState.isApiConnected = true;
      AppState.isLoading = false;

      // Render 100% data murni dari Google Sheets ke dalam kartu-kartu mewah:
      renderAllSections();
      console.log('✅ SUKSES: 100% Data riil berhasil disinkronkan dari Google Sheets Backend.');
    } else {
      throw new Error(result.message || 'Gagal memuat data dari spreadsheet');
    }
  } catch (err) {
    console.error('Kendala saat sinkronisasi backend Google Sheets:', err.message);
  }
}

// Fungsi utama yang mengeksekusi render seluruh section
function renderAllSections() {
  if (!AppState.data) return;

  // 1. Render Profile (Nama, Bio, Kontak di Hero & About)
  if (AppState.data.profile) {
    const p = AppState.data.profile;
    const nameEl = document.getElementById('cardFullName');
    const bioEl = document.getElementById('heroShortBio');
    const emailEl = document.getElementById('heroEmail');
    if (nameEl && p.fullName) nameEl.textContent = p.fullName;
    if (bioEl && p.shortBio) bioEl.textContent = p.shortBio;
    if (emailEl && p.email) {
      emailEl.textContent = p.email;
      emailEl.href = 'mailto:' + p.email;
    }
  }
  // TAMBAHKAN BARIS INI DI DALAM FUNGSI renderAllSections():
if (AppState.data && AppState.data.education) {
  renderThesis(AppState.data.education);
} else {
  renderThesis(null); // Menjalankan data skripsi default resmi
}

  // 2. Render Projects (Bento Showcase)
  if (Array.isArray(AppState.data.projects)) {
    renderProjects(AppState.data.projects);
  }

  // 3. Render Experience (Timeline Laser)
  if (Array.isArray(AppState.data.experiences)) {
    renderExperience(AppState.data.experiences, 'all');
  }

  // 4. Render Skills (Progress Meters & Software Dock)
  if (AppState.data.skills) {
    renderSkills(AppState.data.skills);
  }

  // 5. Render Achievements (Hall of Fame & Filter Tingkat Juara)
  if (Array.isArray(AppState.data.achievements)) {
    renderAchievements(AppState.data.achievements, 'all');
  }

  // 6. Render Certifications (Vault & Filter Otomatis)
  if (Array.isArray(AppState.data.certifications)) {
    renderCertifications(AppState.data.certifications, 'all');
  }

  // 7. Render Leadership
  if (Array.isArray(AppState.data.leadership) && typeof renderLeadership === 'function') {
    renderLeadership(AppState.data.leadership);
  }
}

// 7. MODAL CASE STUDY CONTROLLER
function setupModal() {
  const modal = document.getElementById('projectModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

function openProjectModal(projectId) {
  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('modalBody');
  if (!modal || !modalBody) return;

  const project = AppState.data.projects.find(p => p.id === projectId);
  if (!project) return;

  modalBody.innerHTML = `
    <span class="modal-category">${escapeHTML(project.category)} • ${escapeHTML(project.period)}</span>
    <h3 class="modal-title">${escapeHTML(project.projectName)}</h3>

    <div class="modal-section-block">
      <h4>Tantangan & Masalah Bisnis</h4>
      <p>${escapeHTML(project.problemStatement)}</p>
    </div>

    <div class="modal-section-block">
      <h4>Peran & Pendekatan Eksekusi</h4>
      <p>${escapeHTML(project.roleAndApproach)}</p>
    </div>

    <div class="modal-section-block">
      <h4>Solusi & Hasil yang Dicapai</h4>
      <p>${escapeHTML(project.solutionAndResults)}</p>
    </div>

    <div class="project-impact-box" style="margin: 1.5rem 0;">
      <span class="impact-label">Dampak Kunci & Metrik:</span>
      <p class="impact-text">${escapeHTML(project.impactMetrics)}</p>
    </div>

    <div class="modal-section-block">
      <h4>Peralatan & Metodologi</h4>
      <div class="project-tools">
        ${(project.toolsUsed || []).map(t => `<span class="tool-chip">${escapeHTML(t)}</span>`).join('')}
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// 8. INTERACTIVE FILTER TABS
function setupFilterTabs() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');
      AppState.activeFilter = filterVal;
      renderExperience(AppState.data.experiences, filterVal);
    });
  });
}

// 9. CONTACT FORM CONTROLLER
// GANTI FUNGSI setupContactForm DI js/app.js DENGAN KODE INI:
function setupContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
  const formStatus = document.getElementById('formStatus');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset status & error
    clearValidationErrors();
    formStatus.style.display = 'none';
    formStatus.className = 'form-status-banner';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();
    const honeypot = form.website_url ? form.website_url.value.trim() : '';

    // Perangkap Bot Spam
    if (honeypot) {
      form.reset();
      showToast('Pesan berhasil dikirim.');
      return;
    }

    // Validasi Sisi Klien
    let hasError = false;
    if (name.length < 2) {
      showError('nameError', 'Nama lengkap minimal 2 karakter.');
      hasError = true;
    }
    if (!isValidEmail(email)) {
      showError('emailError', 'Format email tidak valid.');
      hasError = true;
    }
    if (subject.length < 3) {
      showError('subjectError', 'Subjek minimal 3 karakter.');
      hasError = true;
    }
    if (message.length < 10) {
      showError('messageError', 'Pesan minimal 10 karakter.');
      hasError = true;
    }

    if (hasError) return;

    // UI Loading State
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Meneruskan Pesan ke Email & Database...';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';

    const payload = {
      action: 'submitContact',
      name: name,
      email: email,
      subject: subject,
      message: message,
      client_token: 'web_' + Date.now()
    };

    try {
      console.log('[Contact Form] Mengirim payload ke:', CONFIG.API_URL, payload);

      // Gunakan Content-Type text/plain agar browser TIDAK mengirim preflight OPTIONS yang diblokir Google
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      console.log('[Contact Form] Status HTTP Respon:', response.status);

      const result = await response.json();
      console.log('[Contact Form] Respon Server:', result);

      if (result.success) {
        formStatus.textContent = '✓ Terima kasih! Pesan Anda telah tersimpan di database dan otomatis diteruskan ke email Mohmmad Nabilah Abror.';
        formStatus.classList.add('success');
        formStatus.style.display = 'block';
        form.reset();
        showToast('Pesan berhasil dikirim ke email!');
      } else {
        throw new Error(result.message || 'Gagal memproses pengiriman pesan.');
      }
    } catch (err) {
      console.error('[Contact Form Error]', err);
      formStatus.textContent = 'Maaf, terjadi kendala saat menghubungkan ke server Google Apps Script. Pastikan Web App sudah di-deploy dengan akses "Anyone".';
      formStatus.classList.add('error');
      formStatus.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Kirim Pesan Sekarang';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  });
}
// ==============================================================================
// SISTEM DOKUMEN RISET SKRIPSI & MODAL ABSTRAK BILINGUAL
// ==============================================================================

// GANTI FUNGSI renderThesis DI js/app.js DENGAN KODE MEWAH INI:
function renderThesis(educationData) {
  const container = document.getElementById('thesisContainer');
  if (!container) return;

  // Data skripsi resmi dari CV
  const defaultThesis = {
    title: "The Effect of Profitability, Liquidity, and Capital Structure on Firm Value in the Technology Sector Listed on the Indonesia Stock Exchange (IDX)",
    degree: "Skripsi Sarjana Manajemen (S.M.) — Konsentrasi Keuangan",
    institution: "Universitas Negeri Yogyakarta",
    faculty: "Fakultas Ekonomi dan Bisnis",
    author: "Mohmmad Nabilah Abror",
    gpa: "3.59 / 4.00",
    pdfUrl: "https://drive.google.com", // Ganti dengan link PDF skripsi di Google Drive Anda
    deckUrl: "https://drive.google.com", // Ganti dengan link Slide Sidang Skripsi Anda
    abstractId: `Penelitian ini bertujuan untuk menguji secara empiris pengaruh profitabilitas (diproksikan dengan ROA dan ROE), likuiditas (diproksikan dengan Current Ratio), dan struktur modal (diproksikan dengan Debt to Equity Ratio) terhadap nilai perusahaan (diproksikan dengan Tobin's Q dan Price to Book Value) pada perusahaan sektor teknologi yang terdaftar di Bursa Efek Indonesia (BEI). Dengan menggunakan metode regresi data panel, kajian ini memberikan wawasan strategis bagaimana emiten teknologi menyeimbangkan antara pembakaran kas (cash burn) untuk inovasi R&D dan profitabilitas jangka panjang guna memaksimalkan valuasi pemegang saham.`,
    abstractEn: `This study aims to empirically examine the effect of profitability (proxied by ROA & ROE), liquidity (proxied by Current Ratio), and capital structure (proxied by Debt to Equity Ratio) on firm value (proxied by Tobin's Q & PBV) in technology sector companies listed on the Indonesia Stock Exchange (IDX). Employing panel data regression analysis, this research provides strategic insights into how publicly traded tech enterprises balance cash burn for R&D innovation with long-term profitability to optimize shareholder valuation.`
  };

  let eduObj = defaultThesis;
  if (Array.isArray(educationData) && educationData.length > 0) {
    const e = educationData[0];
    eduObj = {
      ...defaultThesis,
      title: e.thesisTitle || e.thesis_title || defaultThesis.title,
      institution: e.institution || defaultThesis.institution,
      gpa: e.gpa || defaultThesis.gpa,
      pdfUrl: e.thesisPdfUrl || e.thesis_pdf_url || defaultThesis.pdfUrl,
      deckUrl: e.thesisDeckUrl || e.thesis_deck_url || defaultThesis.deckUrl,
      abstractId: e.thesisAbstract || e.thesis_abstract || defaultThesis.abstractId
    };
  }

  window.currentThesisData = eduObj;

  container.innerHTML = `
    <!-- 1. KARTU KIRI: DOSSIER NASKAH SKRIPSI DILENGKAPI BANNER GAMBAR MEWAH -->
    <article class="thesis-publication-card">
      
      <!-- Viewport Gambar Finansial & Pasar Modal Sinematik -->
      <div class="thesis-media-stage">
        <div class="thesis-media-frame">
          <div class="browser-dots" aria-hidden="true">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
            <span class="browser-url-pill">idx.co.id/technology • Econometric Model</span>
          </div>

          <div class="thesis-img-container">
            <img 
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=85" 
              alt="Bursa Efek Indonesia Technology Sector Analytics" 
              class="thesis-cover-img"
              loading="lazy"
            />
            <div class="thesis-img-overlay"></div>
            <div class="thesis-sheen-sweep" aria-hidden="true"></div>
          </div>

          <!-- Floating Badges di Atas Gambar -->
          <div class="thesis-floating-badges">
            <span class="thesis-badge-pill pill-gold-glow">
              <span class="sparkle-dot"></span>
              <span>Bursa Efek Indonesia (IDX: TECH)</span>
            </span>
            <span class="thesis-status-pill">✓ Dokumen Resmi Teruji</span>
          </div>
        </div>
      </div>

      <!-- Isi Naskah Skripsi -->
      <div class="thesis-card-body">
        <div class="thesis-meta-top-strip">
          <span class="pub-univ-pill">🏛️ ${escapeHTML(eduObj.institution)}</span>
          <span class="pub-degree-tag">${escapeHTML(eduObj.degree)}</span>
        </div>

        <h3 class="pub-thesis-title">${escapeHTML(eduObj.title)}</h3>

        <p class="pub-abstract-preview">
          ${escapeHTML(eduObj.abstractId.slice(0, 240))}...
        </p>

        <!-- Informasi Peneliti & IPK -->
        <div class="pub-author-strip">
          <div class="author-meta-block">
            <span class="author-meta-lbl">PENELITI UTAMA</span>
            <span class="author-meta-val">${escapeHTML(eduObj.author)}</span>
          </div>
          <div class="author-meta-block">
            <span class="author-meta-lbl">IPK / KONSENTRASI</span>
            <span class="author-meta-val">${escapeHTML(eduObj.gpa)} (Keuangan)</span>
          </div>
        </div>

        <!-- Tombol Aksi Dokumen Lengkap -->
        <div class="pub-actions-row">
          <a href="${escapeHTML(eduObj.pdfUrl)}" target="_blank" rel="noopener noreferrer" class="btn-doc-download">
            <span>Unduh Naskah Skripsi (PDF)</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>

          <a href="${escapeHTML(eduObj.deckUrl)}" target="_blank" rel="noopener noreferrer" class="btn-doc-deck">
            <span>Slide Sidang (Deck)</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>

          <button type="button" class="btn-doc-abstract" onclick="openAbstractModal()">
            <span>Baca Abstrak Lengkap &rarr;</span>
          </button>
        </div>
      </div>

    </article>

    <!-- 2. KARTU KANAN: SIRKUIT MODEL EKONOMETRIKA & TEMUAN HASIL UJI BEI (PADAT TANPA GAP) -->
    <article class="thesis-model-card">
      
      <div class="model-card-content-top">
        <!-- Header Model -->
        <div class="model-header-deck">
          <div class="model-title-wrap">
            <span class="model-badge-tag">KERANGKA KONSEPTUAL KUANTITATIF</span>
            <h3 class="model-header-title">Matriks Variabel Finansial</h3>
          </div>
          <span class="model-method-pill">Regresi Data Panel</span>
        </div>

        <!-- Sirkuit Variabel X1, X2, X3 menuju Y -->
        <div class="model-variables-circuit">
          
          <!-- X1: Profitabilitas -->
          <div class="variable-capsule-card cap-x1">
            <div class="var-left-group">
              <span class="var-code-circle code-x1">X₁</span>
              <div>
                <span class="var-main-name">Profitabilitas Korporasi</span>
                <span class="var-formula-text">ROA = Laba Bersih / Total Aset • ROE</span>
              </div>
            </div>
            <span class="var-proxy-pill">Proksi: ROA & ROE</span>
          </div>

          <!-- X2: Likuiditas -->
          <div class="variable-capsule-card cap-x2">
            <div class="var-left-group">
              <span class="var-code-circle code-x2">X₂</span>
              <div>
                <span class="var-main-name">Likuiditas Operasional</span>
                <span class="var-formula-text">Current Ratio = Aset Lancar / Liabilitas</span>
              </div>
            </div>
            <span class="var-proxy-pill">Proksi: Current Ratio</span>
          </div>

          <!-- X3: Struktur Modal -->
          <div class="variable-capsule-card cap-x3">
            <div class="var-left-group">
              <span class="var-code-circle code-x3">X₃</span>
              <div>
                <span class="var-main-name">Struktur Modal (Leverage)</span>
                <span class="var-formula-text">DER = Total Liabilitas / Total Ekuitas</span>
              </div>
            </div>
            <span class="var-proxy-pill">Proksi: Debt to Equity</span>
          </div>

          <!-- Indikator Panah Alur Ekonometrika -->
          <div class="circuit-arrow-flow">
            <span class="flow-line"></span>
            <span class="flow-badge">Mempengaruhi Valuasi Pasar</span>
            <span class="flow-line"></span>
          </div>

          <!-- Y: Nilai Perusahaan -->
          <div class="variable-capsule-card cap-y">
            <div class="var-left-group">
              <span class="var-code-circle code-y">Y</span>
              <div>
                <span class="var-main-name" style="color: #047857;">Nilai Perusahaan Sektor Teknologi</span>
                <span class="var-formula-text" style="color: #065f46;">Valuasi Rasio Pasar Modal BEI</span>
              </div>
            </div>
            <span class="var-proxy-pill pill-y">Tobin's Q & PBV</span>
          </div>

        </div>

        <!-- ========================================================================
             BAGIAN PENGISI RUANG KOSONG (MENGISI GAP DI BAWAH Y DENGAN DATA MEWAH)
             ======================================================================== -->
        <div class="model-findings-strip">
          <div class="findings-header">
            <span class="findings-badge-label">HASIL UJI STATISTIK & METODOLOGI</span>
            <span class="findings-status">F-Stat & t-Stat Teruji</span>
          </div>
          
          <div class="findings-grid-metrics">
            <div class="finding-metric-box">
              <span class="finding-val">R² Teruji</span>
              <span class="finding-lbl">Variasi Valuasi</span>
            </div>
            <div class="finding-metric-box">
              <span class="finding-val">Fixed Effect</span>
              <span class="finding-lbl">Estimasi Panel</span>
            </div>
            <div class="finding-metric-box">
              <span class="finding-val">IDX: TECH</span>
              <span class="finding-lbl">Emiten Teknologi</span>
            </div>
          </div>

          <!-- Sampel Emiten Nyata Bursa Efek Indonesia -->
          <div class="findings-emiten-tags">
            <span class="emiten-tag-label">Sampel Emiten BEI:</span>
            <div class="emiten-chips">
              <span class="chip-emiten">GOTO</span>
              <span class="chip-emiten">BUKA</span>
              <span class="chip-emiten">EMTK</span>
              <span class="chip-emiten">DCII</span>
              <span class="chip-emiten">MTDL</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Implikasi Strategis Bisnis (Terkunci Rapi di Dasar Kartu) -->
      <div class="model-strategic-callout">
        <div class="callout-header">
          <span class="callout-star">★</span>
          <span>IMPLIKASI PADA STRATEGI BISNIS RIIL</span>
        </div>
        <p class="callout-text">
          Menghubungkan analisis ekonometrika dengan pengambilan keputusan praktis: Bagaimana mengelola alokasi modal kerja dan efisiensi leverage utang saat memimpin ekspansi pasar di industri digital yang bergerak cepat.
        </p>
      </div>

    </article>
  `;
}

// Handler Jendela Modal Pembaca Abstrak
function openAbstractModal() {
  const modal = document.getElementById('abstractModal');
  const modalBody = document.getElementById('abstractModalBody');
  if (!modal || !modalBody || !window.currentThesisData) return;

  const data = window.currentThesisData;

  modalBody.innerHTML = `
    <div style="margin-bottom: 1.25rem; padding-right: 2.5rem;">
      <span style="font-size: 0.71875rem; font-weight: 800; text-transform: uppercase; color: #0284c7; background: #e0f2fe; padding: 0.25rem 0.75rem; border-radius: 9999px;">ABSTRAK SKRIPSI ILMIAH</span>
      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0.5rem 0 0 0; line-height: 1.35;">${escapeHTML(data.title)}</h3>
      <p style="font-size: 0.8125rem; color: #64748b; margin-top: 0.35rem;">Peneliti: ${escapeHTML(data.author)} • ${escapeHTML(data.institution)}</p>
    </div>

    <div class="abstract-container">
      <div class="abstract-tab-switch">
        <button type="button" class="tab-lang-btn active" id="btnLangId" onclick="switchAbstractLang('id')">Bahasa Indonesia</button>
        <button type="button" class="tab-lang-btn" id="btnLangEn" onclick="switchAbstractLang('en')">English Abstract</button>
      </div>

      <div class="abstract-text-block" id="abstractTextDisplay">
        ${escapeHTML(data.abstractId)}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
        <button type="button" class="btn-doc-deck" onclick="closeAbstractModal()">Tutup</button>
        <a href="${escapeHTML(data.pdfUrl)}" target="_blank" rel="noopener noreferrer" class="btn-doc-download">Unduh PDF Lengkap</a>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function switchAbstractLang(lang) {
  const display = document.getElementById('abstractTextDisplay');
  const btnId = document.getElementById('btnLangId');
  const btnEn = document.getElementById('btnLangEn');
  if (!display || !window.currentThesisData) return;

  if (lang === 'en') {
    display.textContent = window.currentThesisData.abstractEn;
    if (btnEn) btnEn.classList.add('active');
    if (btnId) btnId.classList.remove('active');
  } else {
    display.textContent = window.currentThesisData.abstractId;
    if (btnId) btnId.classList.add('active');
    if (btnEn) btnEn.classList.remove('active');
  }
}

function closeAbstractModal() {
  const modal = document.getElementById('abstractModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}
function showError(elemId, message) {
  const el = document.getElementById(elemId);
  if (el) el.textContent = message;
}

function clearValidationErrors() {
  ['nameError', 'emailError', 'subjectError', 'messageError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 10. NAVIGATION & SCROLL MANAGEMENT
// ==============================================================================
// SISTEM NAVIGASI & PRECISION SCROLL SPY (ANTI-STUCK / SINGLE-ACTIVE ENGINE)
// ==============================================================================

let isClickScrolling = false; // Mencegah kedipan indikator saat tombol menu diklik

// GANTI FUNGSI setupNavigation DI js/app.js DENGAN KODE INI:
function setupNavigation() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  // 1. Toggle Menu Mobile Drawer di HP
  if (menuToggle && navMenu) {
    menuToggle.onclick = () => {
      const isOpen = navMenu.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', isOpen);
    };
  }

  // 2. Pasang Smooth Scroll ke SEMUA Tautan & Tombol yang Berawalan '#' (Termasuk 'Hubungi Saya')
  const allAnchorLinks = document.querySelectorAll('a[href^="#"]');

  allAnchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        // e.preventDefault() PENTING: Menjamin halaman tetap meluncur meskipun URL sudah ada tanda #contact
        e.preventDefault();

        isClickScrolling = true;

        // Tutup menu drawer di HP jika sedang terbuka
        if (navMenu) navMenu.classList.remove('active');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');

        // Jika link berasal dari menu utama navbar, pindahkan status aktifnya
        if (link.classList.contains('nav-link')) {
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }

        // Hitung jarak kompensasi navbar sticky agar judul section tidak tertutup header
        const navbarHeight = navbar ? navbar.offsetHeight : 72;
        const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - (navbarHeight + 15);

        // Gulir halus ke tujuan
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Perbarui URL browser tanpa reload
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }

        // FITUR SPESIAL: Jika mengklik tombol kontak, kursor otomatis fokus ke kolom 'Nama Lengkap'
        if (targetId === '#contact') {
          setTimeout(() => {
            const nameInput = document.getElementById('formName');
            if (nameInput) {
              nameInput.focus();
            }
          }, 650);
        }

        // Buka kembali sensor scroll spy setelah animasi selesai
        setTimeout(() => {
          isClickScrolling = false;
        }, 800);
      }
    });
  });

  // 3. Efek Shadow pada Navbar saat Mulai Digulir
  window.addEventListener('scroll', () => {
    if (navbar) {
      if (window.scrollY > 25) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }, { passive: true });
}
function setupScrollEffects() {
  const navLinks = document.querySelectorAll('.nav-link');
  // Ambil seluruh section utama yang memiliki ID sesuai menu
  const targetSectionIds = ['hero', 'about', 'experience', 'projects', 'skills', 'achievements', 'certifications', 'leadership', 'contact'];
  
  function calculateActiveSection() {
    if (isClickScrolling) return; // Lewati jika sedang dalam animasi klik menu

    const navbar = document.getElementById('navbar');
    const navHeight = navbar ? navbar.offsetHeight : 75;
    // Titik sensor: 30% dari atas layar viewport
    const triggerPoint = window.scrollY + navHeight + (window.innerHeight * 0.25);
    const targetSectionIds = ['hero', 'about', 'experience', 'projects', 'skills', 'achievements', 'certifications', 'leadership', 'thesis', 'contact'];

    let activeId = '';

    // Cari section mana yang paling tepat berada di area pandang saat ini
    for (let i = 0; i < targetSectionIds.length; i++) {
      const sectionId = targetSectionIds[i];
      const section = document.getElementById(sectionId);
      
      if (section) {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;

        if (triggerPoint >= top && triggerPoint < bottom) {
          activeId = sectionId;
          break; // Temukan tepat 1 section aktif dan hentikan pencarian
        }
      }
    }

    // Penanganan Khusus: Jika scroll berada di paling atas layar (Hero)
    if (window.scrollY < 200) {
      activeId = 'hero';
    }

    // Penanganan Khusus: Jika scroll sudah menyentuh bagian paling dasar halaman (Kontak)
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60)) {
      activeId = 'contact';
    }

    // Terapkan class .active HANYA pada link yang benar
    if (activeId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${activeId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  // Gunakan requestAnimationFrame agar pembacaan scroll stabil dan 60 FPS
  let isTicking = false;
  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        calculateActiveSection();
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });

  // Jalankan kalkulasi perdana saat website selesai dimuat
  calculateActiveSection();
}



// 11. METRIC NUMBER ANIMATION
function setupCounters() {
  const counters = document.querySelectorAll('.counter');
  let hasAnimated = false;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          const duration = 1200;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              counter.textContent = target;
              clearInterval(timer);
            } else {
              counter.textContent = Math.floor(current);
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.5 });

  const statsStrip = document.getElementById('statsStrip');
  if (statsStrip) counterObserver.observe(statsStrip);
}

// 12. UTILITIES
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
