// ============================================
// NAB ADVERTISING - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Particle Background ----
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      const size = Math.random() * 6 + 2;
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        animation-duration: ${Math.random() * 15 + 10}s;
        animation-delay: ${Math.random() * 10}s;
        opacity: ${Math.random() * 0.3 + 0.05};
      `;
      particlesContainer.appendChild(p);
    }
  }

  // ---- Sticky Header ----
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 50
        ? '0 4px 24px rgba(0,0,0,0.12)'
        : '0 2px 20px rgba(0,0,0,0.08)';
    });
  }

  // ---- Mobile Menu ----
  const menuToggle = document.getElementById('menuToggle');
  const navbar = document.getElementById('navbar');
  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => {
      navbar.classList.toggle('open');
      const spans = menuToggle.querySelectorAll('span');
      if (navbar.classList.contains('open')) {
        if(spans[0]) spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        if(spans[1]) spans[1].style.opacity = '0';
        if(spans[2]) spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
  }

  // Close menu on nav link click
  document.querySelectorAll('#navbar a').forEach(link => {
    link.addEventListener('click', () => {
      if(navbar) navbar.classList.remove('open');
      if(menuToggle) menuToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  // ---- Active Nav Link on Scroll ----
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#navbar ul > li > a');
  function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) a.classList.add('active');
    });
  }
  window.addEventListener('scroll', updateActiveLink);

  // ---- Counter Animation ----
  const counters = document.querySelectorAll('.stat-number');
  let counted = false;
  function startCounting() {
    if (counted) return;
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;
    const rect = statsSection.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.9) {
      counted = true;
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        let current = 0;
        const step = Math.ceil(target / 80);
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          counter.textContent = current.toLocaleString('ar');
          if (current >= target) clearInterval(timer);
        }, 20);
      });
    }
  }
  window.addEventListener('scroll', startCounting);
  startCounting();

  // ---- Portfolio Filter ----
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      portfolioItems.forEach(item => {
        const cat = item.getAttribute('data-cat');
        if (filter === 'all' || cat === filter) {
          item.style.display = 'block';
          item.style.animation = 'fadeIn 0.4s ease';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ---- Testimonials Slider ----
  const slides = document.querySelectorAll('.testimonial-item');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  let autoplayTimer;

  function goToSlide(index) {
    if(!slides.length || !dots.length) return;
    slides[currentSlide]?.classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide]?.classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(autoplayTimer);
      goToSlide(parseInt(dot.getAttribute('data-index')));
      startAutoplay();
    });
  });

  function startAutoplay() {
    if(slides.length && dots.length) autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }
  startAutoplay();

  // ---- Scroll Reveal ----
  const revealElements = document.querySelectorAll(
    '.service-card, .blog-card, .team-card, .stat-item, .portfolio-item, .why-item, .contact-info-item, .about-content, .about-visual'
  );
  revealElements.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => revealObserver.observe(el));

  // ---- Back to Top ----
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ---- Contact Form ----
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type=submit]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> تم الإرسال بنجاح!';
      btn.style.background = '#22c55e';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 3500);
    });
  }

  // ---- Smooth Anchor Scroll ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

  // ---- Booking Form ----
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const wrap = bookingForm.closest('.booking-form-wrap');
      bookingForm.classList.add('hide');
      const success = document.createElement('div');
      success.className = 'booking-success show';
      success.innerHTML = `
        <div class="success-icon"><i class="fas fa-check"></i></div>
        <h3>تم تأكيد طلب حجزك!</h3>
        <p>سيتواصل معك فريق VISION MEDIA خلال 24 ساعة لتأكيد الموعد وإرسال تفاصيل الاجتماع.</p>
        <div style="margin-top:24px">
          <a href="https://wa.me/966543944248" target="_blank" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px">
            <i class="fab fa-whatsapp"></i> تأكيد عبر واتساب
          </a>
        </div>`;
      wrap.appendChild(success);
    });
  }

  // ---- Typed Effect in Hero ----
  const highlight = document.querySelector('.hero-content .highlight');
  if (highlight) {
    const words = ['الأثر', 'المستقبل', 'الرؤية', 'الفارق'];
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    function typeEffect() {
      const word = words[wordIndex];
      if (!deleting) {
        highlight.textContent = word.slice(0, ++charIndex);
        if (charIndex === word.length) {
          deleting = true;
          setTimeout(typeEffect, 2200);
          return;
        }
      } else {
        highlight.textContent = word.slice(0, --charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }
      }
      setTimeout(typeEffect, deleting ? 60 : 120);
    }
    setTimeout(typeEffect, 2000);
  }

});
