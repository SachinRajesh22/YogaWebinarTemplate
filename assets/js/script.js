const {
  getBannerList,
  getVideoList,
  getClassList,
  getTestimonialList,
} = window.WebinarAPI;
const { saveRegistration } = window.FirebaseRegistration;

const state = {
  classes: [],
  selectedClassId: '',
  fields: {
    name: false,
    phone: false,
    email: false,
    classId: false,
  },
  isSubmitting: false,
};

const elements = {
  bannerState: document.querySelector('#bannerState'),
  bannerList: document.querySelector('#bannerList'),
  videoState: document.querySelector('#videoState'),
  videoList: document.querySelector('#videoList'),
  classState: document.querySelector('#classState'),
  classList: document.querySelector('#classList'),
  testimonialState: document.querySelector('#testimonialState'),
  testimonialList: document.querySelector('#testimonialList'),
  form: document.querySelector('#registrationForm'),
  nameInput: document.querySelector('#nameInput'),
  phoneInput: document.querySelector('#phoneInput'),
  emailInput: document.querySelector('#emailInput'),
  classSelect: document.querySelector('#classSelect'),
  submitButton: document.querySelector('#submitButton'),
  formStatus: document.querySelector('#formStatus'),
  selectedClassSummary: document.querySelector('#selectedClassSummary'),
  registrationPanel: document.querySelector('#registrationPanel'),
  errors: {
    name: document.querySelector('#nameError'),
    phone: document.querySelector('#phoneError'),
    email: document.querySelector('#emailError'),
    classId: document.querySelector('#classError'),
  },
};

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');
  bindFormEvents();
  bindRegistrationOpeners();
  observeRevealItems(document);
  loadPageContent();
});

function bindFormEvents() {
  elements.nameInput.addEventListener('input', () => validateField('name'));
  elements.nameInput.addEventListener('blur', () => validateField('name'));
  elements.phoneInput.addEventListener('input', () => validateField('phone'));
  elements.phoneInput.addEventListener('blur', () => validateField('phone'));
  elements.emailInput.addEventListener('input', () => validateField('email'));
  elements.emailInput.addEventListener('blur', () => validateField('email'));
  elements.classSelect.addEventListener('change', () => {
    state.selectedClassId = elements.classSelect.value;
    validateField('classId');
    updateSelectedClassSummary();
    openRegistrationPanel();
  });
  elements.form.addEventListener('submit', handleFormSubmit);
}

function bindRegistrationOpeners(root = document) {
  root.querySelectorAll('[data-open-registration]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      openRegistrationPanel();
    });
  });
}

async function loadPageContent() {
  renderLoading(elements.bannerState, elements.bannerList, createBannerSkeleton());
  renderLoading(elements.videoState, elements.videoList, createVideoSkeleton());
  renderLoading(elements.classState, elements.classList, createClassSkeleton());
  renderLoading(elements.testimonialState, elements.testimonialList, createTestimonialSkeleton());

  await Promise.all([
    loadBanners(),
    loadVideos(),
    loadClasses(),
    loadTestimonials(),
  ]);
}

async function loadBanners() {
  try {
    const banners = await getBannerList();
    const activeBanners = filterActiveItems(banners).filter((banner) => banner.image);

    elements.bannerState.innerHTML = '';

    if (!activeBanners.length) {
      renderEmptyState(elements.bannerList, 'No webinar banners are available right now.');
      return;
    }

    elements.bannerList.innerHTML = `
      <div id="bannerCarousel" class="carousel slide banner-carousel reveal-item" data-bs-ride="false" data-bs-touch="true">
        <div class="carousel-inner">
          ${activeBanners.map((banner, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
              <figure class="banner-frame">
                <img src="${escapeAttribute(banner.image)}" alt="Yoga webinar banner ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}">
                <figcaption class="banner-overlay">
                  <a class="btn btn-primary banner-register-button" href="#registration" data-open-registration aria-expanded="false">
                    Register Now
                  </a>
                </figcaption>
              </figure>
            </div>
          `).join('')}
        </div>
        ${activeBanners.length > 1 ? `
          <button class="carousel-control-prev" type="button" data-bs-target="#bannerCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous banner</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#bannerCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next banner</span>
          </button>
        ` : ''}
      </div>
    `;
    bindRegistrationOpeners(elements.bannerList);
    observeRevealItems(elements.bannerList);
  } catch (error) {
    renderErrorState(elements.bannerState, elements.bannerList, 'We could not load the webinar banner.', loadBanners);
  }
}

async function loadVideos() {
  try {
    const videos = await getVideoList();
    const activeVideos = filterActiveItems(videos).filter((video) => video.link);

    elements.videoState.innerHTML = '';

    if (!activeVideos.length) {
      renderEmptyState(elements.videoList, 'No intro videos are available right now.');
      return;
    }

    elements.videoList.innerHTML = activeVideos.map((video, index) => {
      const embedUrl = getYouTubeEmbedUrl(video.link);

      if (!embedUrl) {
        return '';
      }

      return `
        <div class="video-shell reveal-item" style="--reveal-delay: ${index * 100}ms">
          <iframe
            src="${escapeAttribute(embedUrl)}"
            title="Yoga webinar introduction video ${index + 1}"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
      `;
    }).join('');

    if (!elements.videoList.innerHTML.trim()) {
      renderEmptyState(elements.videoList, 'No playable intro videos are available right now.');
    } else {
      observeRevealItems(elements.videoList);
    }
  } catch (error) {
    renderErrorState(elements.videoState, elements.videoList, 'We could not load the intro video.', loadVideos);
  }
}

async function loadClasses() {
  try {
    const classes = await getClassList();
    state.classes = filterActiveItems(classes);
    elements.classState.innerHTML = '';

    renderClassOptions();
    validateField('classId', false);

    if (!state.classes.length) {
      renderEmptyState(elements.classList, 'No yoga classes are open for registration right now.');
      updateSelectedClassSummary();
      return;
    }

    elements.classList.innerHTML = state.classes.map((yogaClass, index) => `
      <div class="col-md-6 col-xl-4 reveal-item" style="--reveal-delay: ${(index % 3) * 100}ms">
        <article class="class-card h-100">
          <div class="class-card-body">
            <span class="class-type">${escapeHtml(yogaClass.type || 'Class')}</span>
            <h3>${escapeHtml(yogaClass.title || 'Untitled class')}</h3>
            ${yogaClass.subtitle ? `<p class="class-subtitle">${escapeHtml(yogaClass.subtitle)}</p>` : ''}
            ${yogaClass.description ? `<p>${escapeHtml(getShortDescription(yogaClass.description))}</p>` : ''}
            <ul class="class-meta">
              <li><strong>Date:</strong> ${escapeHtml(formatDate(yogaClass.date))}</li>
              <li><strong>Time:</strong> ${escapeHtml(formatClassTime(yogaClass.start_time, yogaClass.end_time))}</li>
              ${isOfflineClass(yogaClass.type) && yogaClass.place ? `<li><strong>Place:</strong> ${escapeHtml(yogaClass.place)}</li>` : ''}
            </ul>
          </div>
          <div class="class-card-footer">
            <span class="class-price">${escapeHtml(formatCurrency(yogaClass.amount))}</span>
            <button class="btn btn-primary register-class-button" type="button" data-class-id="${escapeAttribute(yogaClass.id)}">
              Register
            </button>
          </div>
        </article>
      </div>
    `).join('');

    document.querySelectorAll('.register-class-button').forEach((button) => {
      button.addEventListener('click', () => selectClassAndScroll(button.dataset.classId));
    });
    observeRevealItems(elements.classList);
  } catch (error) {
    state.classes = [];
    renderClassOptions();
    renderErrorState(elements.classState, elements.classList, 'We could not load the class list.', loadClasses);
    updateSelectedClassSummary();
  }
}

async function loadTestimonials() {
  try {
    const testimonials = filterActiveItems(await getTestimonialList());
    elements.testimonialState.innerHTML = '';

    if (!testimonials.length) {
      renderEmptyState(elements.testimonialList, 'No testimonials are available right now.');
      return;
    }

    if (testimonials.length === 1) {
      elements.testimonialList.innerHTML = `
        <div class="row justify-content-center">
          <div class="col-lg-7 reveal-item">${createTestimonialCard(testimonials[0])}</div>
        </div>
      `;
      observeRevealItems(elements.testimonialList);
      return;
    }

    elements.testimonialList.innerHTML = `
      <div id="testimonialCarousel" class="carousel slide reveal-item" data-bs-ride="false" data-bs-touch="true">
        <div class="carousel-inner">
          ${testimonials.map((testimonial, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
              <div class="row justify-content-center">
                <div class="col-lg-8">${createTestimonialCard(testimonial)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous testimonial</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next testimonial</span>
        </button>
      </div>
    `;
    observeRevealItems(elements.testimonialList);
    setupDraggableTestimonialCarousel();
  } catch (error) {
    renderErrorState(elements.testimonialState, elements.testimonialList, 'We could not load testimonials.', loadTestimonials);
  }
}

function createTestimonialCard(testimonial) {
  const imageMarkup = testimonial.image
    ? `<img src="${escapeAttribute(testimonial.image)}" alt="${escapeAttribute(testimonial.name || 'Participant')}" loading="lazy">`
    : `<span aria-hidden="true">${escapeHtml(getInitials(testimonial.name))}</span>`;

  return `
    <article class="testimonial-card">
      <div class="testimonial-avatar">${imageMarkup}</div>
      <blockquote>${escapeHtml(testimonial.comment || '')}</blockquote>
      <p class="testimonial-name">${escapeHtml(testimonial.name || 'Yoga participant')}</p>
    </article>
  `;
}

function renderClassOptions() {
  if (!state.classes.length) {
    elements.classSelect.innerHTML = '<option value="">No classes available</option>';
    state.selectedClassId = '';
    updateSubmitButtonState();
    return;
  }

  elements.classSelect.innerHTML = `
    <option value="">Select a class</option>
    ${state.classes.map((yogaClass) => `
      <option value="${escapeAttribute(yogaClass.id)}">${escapeHtml(yogaClass.title || `Class ${yogaClass.id}`)}</option>
    `).join('')}
  `;

  if (state.selectedClassId) {
    elements.classSelect.value = state.selectedClassId;
  }
}

function selectClassAndScroll(classId) {
  state.selectedClassId = classId;
  elements.classSelect.value = classId;
  validateField('classId');
  updateSelectedClassSummary();
  openRegistrationPanel();
  elements.formStatus.innerHTML = '';
  document.querySelector('#registration').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openRegistrationPanel() {
  if (!elements.registrationPanel) {
    return;
  }

  elements.registrationPanel.classList.add('is-open');
  elements.registrationPanel.classList.add('is-visible');
  elements.registrationPanel.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-open-registration]').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'true');
  });
}

function observeRevealItems(root) {
  const revealItems = root.querySelectorAll('.reveal-item:not(.is-visible)');

  if (!revealItems.length) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -8% 0px',
  });

  revealItems.forEach((item) => revealObserver.observe(item));

  window.setTimeout(() => {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }, 1200);
}

function setupDraggableTestimonialCarousel() {
  const carouselElement = document.querySelector('#testimonialCarousel');

  if (!carouselElement || !window.bootstrap) {
    return;
  }

  const carousel = window.bootstrap.Carousel.getOrCreateInstance(carouselElement, {
    interval: false,
    touch: true,
    ride: false,
  });

  let startX = 0;
  let isDragging = false;

  carouselElement.addEventListener('pointerdown', (event) => {
    isDragging = true;
    startX = event.clientX;
    carouselElement.classList.add('is-dragging');
  });

  carouselElement.addEventListener('pointerup', (event) => {
    if (!isDragging) {
      return;
    }

    const distance = event.clientX - startX;
    isDragging = false;
    carouselElement.classList.remove('is-dragging');

    if (Math.abs(distance) < 45) {
      return;
    }

    if (distance < 0) {
      carousel.next();
    } else {
      carousel.prev();
    }
  });

  carouselElement.addEventListener('pointerleave', () => {
    isDragging = false;
    carouselElement.classList.remove('is-dragging');
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const formIsValid = validateAllFields();

  if (!formIsValid || state.isSubmitting) {
    return;
  }

  state.isSubmitting = true;
  updateSubmitButtonState();
  renderFormStatus('info', 'Submitting your registration...');

  const registrationData = {
    Name: elements.nameInput.value.trim(),
    Phone: elements.phoneInput.value.trim(),
    Email: elements.emailInput.value.trim(),
    Class_ID: elements.classSelect.value,
  };

  try {
    await saveRegistration(registrationData);
    elements.form.reset();
    state.selectedClassId = '';
    Object.keys(state.fields).forEach((field) => {
      state.fields[field] = false;
      setFieldState(field, '', false);
    });
    updateSelectedClassSummary();
    renderFormStatus('success', 'Registration successful. Thank you for reserving your seat.');
  } catch (error) {
    renderFormStatus('error', `${error.message} Please check the setup and try again.`);
  } finally {
    state.isSubmitting = false;
    validateAllFields(false);
    updateSubmitButtonState();
  }
}

function validateAllFields(showErrors = true) {
  const validations = [
    validateField('name', showErrors),
    validateField('phone', showErrors),
    validateField('email', showErrors),
    validateField('classId', showErrors),
  ];

  return validations.every(Boolean);
}

function validateField(fieldName, showErrors = true) {
  const validators = {
    name: validateName,
    phone: validatePhone,
    email: validateEmail,
    classId: validateClassSelection,
  };

  const result = validators[fieldName]();
  state.fields[fieldName] = result.valid;

  if (showErrors) {
    setFieldState(fieldName, result.message, result.valid);
  }

  updateSubmitButtonState();
  return result.valid;
}

/**
 * Name rules:
 * - trim first so leading/trailing spaces cannot pass silently
 * - allow only letters and spaces
 * - require 2 to 50 visible characters
 */
function validateName() {
  const rawValue = elements.nameInput.value;
  const value = rawValue.trim();

  if (!value) {
    return invalid('Name is required.');
  }

  if (rawValue !== value) {
    return invalid('Name cannot start or end with a space.');
  }

  if (value.length < 2) {
    return invalid('Name must be at least 2 characters.');
  }

  if (value.length > 50) {
    return invalid('Name must be 50 characters or less.');
  }

  if (!/^[A-Za-z ]+$/.test(value)) {
    return invalid('Name can contain only letters and spaces.');
  }

  return valid();
}

/**
 * Indian mobile rule:
 * exactly 10 digits, numeric only, with 6/7/8/9 as the first digit.
 */
function validatePhone() {
  const value = elements.phoneInput.value.trim();

  if (!value) {
    return invalid('Phone number is required.');
  }

  if (!/^\d+$/.test(value)) {
    return invalid('Phone number must contain digits only.');
  }

  if (value.length !== 10) {
    return invalid('Phone number must be exactly 10 digits.');
  }

  if (!/^[6-9]/.test(value)) {
    return invalid('Phone number must start with 6, 7, 8, or 9.');
  }

  return valid();
}

/**
 * Email validation catches common bad formats before using a clear final pattern:
 * no spaces, one @, non-empty local/domain, no consecutive dots, and a dotted domain.
 */
function validateEmail() {
  const value = elements.emailInput.value.trim();

  if (!value) {
    return invalid('Email is required.');
  }

  if (/\s/.test(value)) {
    return invalid('Email cannot contain spaces.');
  }

  if ((value.match(/@/g) || []).length !== 1) {
    return invalid('Email must contain one @ symbol.');
  }

  if (value.includes('..')) {
    return invalid('Email cannot contain consecutive dots.');
  }

  const [localPart, domainPart] = value.split('@');

  if (!localPart) {
    return invalid('Email must include text before @.');
  }

  if (!domainPart) {
    return invalid('Email must include a domain after @.');
  }

  if (!domainPart.includes('.')) {
    return invalid('Email domain must include a dot.');
  }

  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
    return invalid('Enter a valid email address.');
  }

  return valid();
}

function validateClassSelection() {
  if (!elements.classSelect.value) {
    return invalid('Please select a class.');
  }

  return valid();
}

function setFieldState(fieldName, message, isValid) {
  const inputMap = {
    name: elements.nameInput,
    phone: elements.phoneInput,
    email: elements.emailInput,
    classId: elements.classSelect,
  };

  const input = inputMap[fieldName];
  const errorElement = elements.errors[fieldName];

  errorElement.textContent = message;
  input.classList.toggle('is-invalid', Boolean(message));
  input.classList.toggle('is-valid', isValid);
}

function updateSubmitButtonState() {
  const formIsValid = Object.values(state.fields).every(Boolean);
  elements.submitButton.disabled = !formIsValid || state.isSubmitting;
}

function updateSelectedClassSummary() {
  const selectedClass = state.classes.find((yogaClass) => String(yogaClass.id) === String(elements.classSelect.value));

  if (!selectedClass) {
    elements.selectedClassSummary.textContent = state.classes.length
      ? 'No class selected yet. Choose one from the class list or use the dropdown.'
      : 'Classes are not available yet. Please try again after the class list loads.';
    return;
  }

  elements.selectedClassSummary.innerHTML = `
    <strong>${escapeHtml(selectedClass.title || 'Selected class')}</strong>
    <span>${escapeHtml(formatDate(selectedClass.date))} · ${escapeHtml(formatClassTime(selectedClass.start_time, selectedClass.end_time))}</span>
  `;
}

function renderLoading(stateElement, listElement, skeletonMarkup) {
  stateElement.innerHTML = '<div class="loading-label">Loading...</div>';
  listElement.innerHTML = skeletonMarkup;
}

function renderEmptyState(container, message) {
  container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderErrorState(stateElement, listElement, message, retryCallback) {
  stateElement.innerHTML = '';
  listElement.innerHTML = `
    <div class="error-state">
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-outline-primary btn-sm" type="button">Retry</button>
    </div>
  `;
  listElement.querySelector('button').addEventListener('click', retryCallback);
}

function renderFormStatus(type, message) {
  elements.formStatus.className = `form-status mt-3 form-status-${type}`;
  elements.formStatus.innerHTML = `
    <div class="d-flex align-items-center justify-content-between gap-3">
      <span>${escapeHtml(message)}</span>
      ${type === 'error' ? '<button class="btn btn-sm btn-outline-danger" type="submit">Retry</button>' : ''}
    </div>
  `;
}

function filterActiveItems(items) {
  return items.filter((item) => Number(item.status) === 1);
}

function getYouTubeEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    let videoId = '';

    if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.replace('/', '');
    } else if (parsedUrl.searchParams.has('v')) {
      videoId = parsedUrl.searchParams.get('v');
    } else if (parsedUrl.pathname.includes('/embed/')) {
      videoId = parsedUrl.pathname.split('/embed/')[1];
    } else if (parsedUrl.pathname.includes('/shorts/')) {
      videoId = parsedUrl.pathname.split('/shorts/')[1];
    }

    videoId = videoId.split(/[?&/]/)[0];

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : '';
  } catch (error) {
    return '';
  }
}

function getShortDescription(description) {
  return description.length > 130 ? `${description.slice(0, 127).trim()}...` : description;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Date to be announced';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatClassTime(startTime, endTime) {
  const start = startTime || 'Start time TBA';
  const end = endTime || 'End time TBA';

  return `${start} - ${end}`;
}

function formatCurrency(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return 'Fee to be announced';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

function isOfflineClass(type) {
  return String(type || '').toLowerCase() === 'offline';
}

function getInitials(name) {
  if (!name) {
    return 'Y';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function createBannerSkeleton() {
  return '<div class="skeleton skeleton-banner"></div>';
}

function createVideoSkeleton() {
  return '<div class="skeleton skeleton-video"></div>';
}

function createClassSkeleton() {
  return Array.from({ length: 3 }, () => `
    <div class="col-md-6 col-xl-4">
      <div class="skeleton skeleton-card"></div>
    </div>
  `).join('');
}

function createTestimonialSkeleton() {
  return '<div class="skeleton skeleton-testimonial mx-auto"></div>';
}

function valid() {
  return { valid: true, message: '' };
}

function invalid(message) {
  return { valid: false, message };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
