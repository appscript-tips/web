let allPosts = [];
let filteredPosts = [];
let currentDisplayed = 0;
const postsPerLoad = 9;

let currentImages = [];
let currentSlideIndex = 0;
let selectedCategory = "";

window.addEventListener('DOMContentLoaded', () => { 
  fetchData(); 

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      filterAndRender();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchInput.value.trim() !== "" ? "flex" : "none";
      }
    });

    searchInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        filterAndRender();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = "";
        clearSearchBtn.style.display = "none";
        filterAndRender();
        searchInput.focus();
      }
    });
  }
});

async function fetchData() {
  try {
    const response = await fetch('./posts.json');
    if (!response.ok) throw new Error("File tidak ditemukan.");
    
    const data = await response.json();
    allPosts = data.posts || data;
    
    renderCategories(data.categories || extractCatsFromPosts(allPosts));
    filterAndRender(); 
  } catch (error) {
    console.error(error);
    const grid = document.getElementById('postsGrid');
    if (grid) {
      grid.innerHTML = "<div class='loading-state'>Gagal memuat data.</div>";
    }
  }
}

function extractCatsFromPosts(posts) {
  const cats = new Set();
  posts.forEach(p => { if(p.kategori) cats.add(p.kategori.trim()); });
  return Array.from(cats).sort();
}

function renderCategories(categories) {
  const bar = document.getElementById('categoriesBar');
  if (!bar) return;
  
  let html = `<button class="cat-pill ${selectedCategory === '' ? 'active' : ''}" onclick="selectCategory('', this)">Semua</button>`;
  
  categories.forEach(cat => {
    html += `<button class="cat-pill ${selectedCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}', this)">${cat}</button>`;
  });
  bar.innerHTML = html;
}

function selectCategory(cat, btnElem) {
  selectedCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');
  filterAndRender();
}

function filterAndRender() {
  const inputElem = document.getElementById('searchInput');
  const keyword = inputElem ? inputElem.value.toLowerCase().trim() : "";
  const searchInfo = document.getElementById('searchInfo');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchInfo) {
    if (keyword !== "") {
      searchInfo.style.display = "block";
      searchInfo.innerHTML = `Menampilkan hasil pencarian untuk: <b>"${inputElem.value.trim()}"</b>`;
      if (clearSearchBtn) clearSearchBtn.style.display = "flex";
    } else {
      searchInfo.style.display = "none";
      searchInfo.innerHTML = "";
      if (clearSearchBtn) clearSearchBtn.style.display = "none";
    }
  }

  filteredPosts = allPosts.filter(post => {
    const judul = (post.judul || "").toLowerCase();
    
    const matchKeyword = keyword === "" || judul.includes(keyword);
    const matchCategory = (selectedCategory === "" || (post.kategori || "").trim().toLowerCase() === selectedCategory.toLowerCase());
    
    return matchKeyword && matchCategory;
  });

  currentDisplayed = 0;
  const grid = document.getElementById('postsGrid');
  if (grid) grid.innerHTML = "";
  
  if (filteredPosts.length === 0) {
    if (grid) {
      grid.innerHTML = "<div class='loading-state'>Hasil tidak ditemukan.</div>";
    }
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    return;
  }

  loadMorePosts();
}

function loadMorePosts() {
  const grid = document.getElementById('postsGrid');
  if (!grid) return;

  const end = Math.min(currentDisplayed + postsPerLoad, filteredPosts.length);

  for (let i = currentDisplayed; i < end; i++) {
    const post = filteredPosts[i];
    const originalIndex = allPosts.indexOf(post);
    
    const images = (post.gambar || "").split(',').map(s => s.trim()).filter(s => s !== "");
    const thumbnailSrc = images.length > 0 ? images[0] : "https://via.placeholder.com/600x400/e2e8f0/64748b?text=Tanpa+Gambar";
    const kategoriText = post.kategori || "Uncategorized";

    const cardHtml = `
      <div class="card" onclick="openModal(${originalIndex})">
        <div class="card-thumb-container">
          <span class="category-badge">${kategoriText}</span>
          <img src="${thumbnailSrc}" class="card-thumb" alt="Thumbnail" loading="lazy">
        </div>
        <div class="card-content">
          <h3 class="card-title">${post.judul}</h3>
          <span class="card-action-text">Klik untuk lihat detail <span>→</span></span>
        </div>
      </div>
    `;
    grid.insertAdjacentHTML('beforeend', cardHtml);
  }

  currentDisplayed = end;
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  if (loadMoreContainer) {
    loadMoreContainer.style.display = (currentDisplayed >= filteredPosts.length) ? 'none' : 'block';
  }
}

function openModal(index) {
  const post = allPosts[index];
  if (!post) return;

  const modal = document.getElementById('postModal');
  
  currentImages = (post.gambar || "").split(',').map(s => s.trim()).filter(s => s !== "");
  currentSlideIndex = 0;

  const wrapper = document.getElementById('slideshowWrapper');
  const mainContainer = document.getElementById('slideMainContainer');
  const thumbList = document.getElementById('thumbnailList');
  const prevBtn = document.querySelector('.slide-prev');
  const nextBtn = document.querySelector('.slide-next');

  if (mainContainer) mainContainer.innerHTML = "";
  if (thumbList) thumbList.innerHTML = "";

  if (currentImages.length > 0) {
    if (wrapper) wrapper.style.display = "block";
    
    if (prevBtn && nextBtn) {
      if (currentImages.length <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      } else {
        prevBtn.style.display = "flex";
        nextBtn.style.display = "flex";
      }
    }

    currentImages.forEach((imgUrl, i) => {
      if (mainContainer) {
        mainContainer.innerHTML += `<img src="${imgUrl}" class="slide-img ${i === 0 ? 'active' : ''}" id="slideImg_${i}" onclick="openLightbox('${imgUrl}')" style="cursor: pointer;" title="Klik untuk memperbesar">`;
      }
      if (thumbList) {
        thumbList.innerHTML += `
          <div class="thumb-item ${i === 0 ? 'active' : ''}" id="thumb_${i}" onclick="goToSlide(${i})">
            <img src="${imgUrl}" loading="lazy">
          </div>
        `;
      }
    });
    if (thumbList) thumbList.style.display = "flex";
  } else {
    if (wrapper) wrapper.style.display = "none";
    if (thumbList) thumbList.style.display = "none";
  }

  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  if (modalTitle) modalTitle.innerText = post.judul;
  if (modalDesc) modalDesc.innerText = post.konten;
  
  // 1. Link Tautan Eksternal (Unduh / Salin Web App)
  const linkBtn = document.getElementById('modalLink');
  let rawLink = (post.customLink || "").trim();

  if (linkBtn) {
    if (rawLink !== "") {
      if (!/^https?:\/\//i.test(rawLink)) {
        rawLink = 'https://' + rawLink;
      }
      linkBtn.href = rawLink;
      linkBtn.target = "_blank";
      linkBtn.rel = "noopener noreferrer";
      linkBtn.style.display = "inline-flex";
    } else {
      linkBtn.style.display = "none";
    }
  }

  // 2. Tombol Request WhatsApp
  const requestBtn = document.getElementById('requestCustomBtn');
  if (requestBtn) {
    const waNumber = "6285865480245"; // Ganti dengan nomor WhatsApp Anda
    const waText = encodeURIComponent(`Halo, saya ingin request custom terkait pembuatan web app menggunakan GOogle APps Script..: *${post.judul}*`);
    requestBtn.href = `https://wa.me/${waNumber}?text=${waText}`;
  }

  // 3. Tombol Tutorial / Cara Pasang
  const tutorialBtn = document.getElementById('tutorialBtn');
  if (tutorialBtn) {
    const tutorialLink = (post.tutorialLink || "").trim();
    if (tutorialLink !== "") {
      let formattedTutorial = tutorialLink;
      if (!/^https?:\/\//i.test(formattedTutorial)) {
        formattedTutorial = 'https://' + formattedTutorial;
      }
      tutorialBtn.href = formattedTutorial;
      tutorialBtn.target = "_blank";
      tutorialBtn.rel = "noopener noreferrer";
      tutorialBtn.style.display = "inline-flex";
    } else {
      tutorialBtn.href = "https://youtube.com"; // Ganti link panduan default jika diperlukan
      tutorialBtn.target = "_blank";
      tutorialBtn.style.display = "inline-flex";
    }
  }

  if (modal) modal.classList.add('show');
  document.body.style.overflow = "hidden";
}

function changeSlide(direction) {
  currentSlideIndex += direction;
  if (currentSlideIndex < 0) {
    currentSlideIndex = currentImages.length - 1;
  } else if (currentSlideIndex >= currentImages.length) {
    currentSlideIndex = 0;
  }
  updateSlideActiveState();
}

function goToSlide(index) {
  currentSlideIndex = index;
  updateSlideActiveState();
}

function updateSlideActiveState() {
  for (let i = 0; i < currentImages.length; i++) {
    const imgElem = document.getElementById(`slideImg_${i}`);
    const thumbElem = document.getElementById(`thumb_${i}`);
    
    if (i === currentSlideIndex) {
      if (imgElem) imgElem.classList.add('active');
      if (thumbElem) {
        thumbElem.classList.add('active');
        thumbElem.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    } else {
      if (imgElem) imgElem.classList.remove('active');
      if (thumbElem) thumbElem.classList.remove('active');
    }
  }
}

function openLightbox(imgUrl) {
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  if (lightbox && lightboxImg) {
    lightboxImg.src = imgUrl;
    lightbox.classList.add('show');
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightboxModal');
  if (lightbox) {
    lightbox.classList.remove('show');
  }
}

function closeModal() {
  const modal = document.getElementById('postModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = "auto";
}
