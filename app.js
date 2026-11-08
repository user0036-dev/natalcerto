(() => {
  'use strict';
  const config = {...(window.CAMPAIGN_CONFIG || {}), ...(window.CAMPAIGN_EXPERIENCE || {})};
  const $ = selector => document.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };
  const formUrl = safeUrl(config.formUrl);
  if (!config.preview && formUrl) $('.preview').hidden = true;
  if (formUrl) $('#form-link').href = formUrl;
  $('#form-link').hidden = true;


  const features = ['Perto de você, em Teresina e Timon.', 'Combustível e conveniência no seu caminho.', 'Confiança e praticidade perto de você.'];
  let featureIndex = 0;
  let paused = reducedMotion.matches;
  let interval;
  function setFeature(index) {
    featureIndex = index;
    $('#feature-text').textContent = features[index];
    document.querySelectorAll('.dots button').forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
  }
  function updateCarousel() {
    clearInterval(interval);
    $('#pause').textContent = paused ? '▶' : 'Ⅱ';
    $('#pause').setAttribute('aria-label', paused ? 'Retomar mensagens automáticas' : 'Pausar mensagens automáticas');
    if (!paused && !document.hidden) interval = setInterval(() => setFeature((featureIndex + 1) % features.length), 2000);
  }
  $('#pause').addEventListener('click', () => { paused = !paused; updateCarousel(); });
  document.querySelectorAll('.dots button').forEach((dot, i) => dot.addEventListener('click', () => { setFeature(i); paused = true; updateCarousel(); }));
  document.addEventListener('visibilitychange', updateCarousel);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) paused = true; updateCarousel(); });
  updateCarousel();

  let soundEnabled = true;
  const giftAudio = $('#gift-audio');
  const soundPath = config.soundUrl ?? 'assets/presente.mp3';
  if (soundPath) {
    try { const url = new URL(soundPath, document.baseURI); if (['http:', 'https:'].includes(url.protocol)) giftAudio.src = url.href; } catch {}
  }
  giftAudio.volume = Math.max(0, Math.min(1, Number.isFinite(config.soundVolume) ? config.soundVolume : .45));
  $('#sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('#sound').setAttribute('aria-pressed', String(soundEnabled));
    $('#sound span').textContent = soundEnabled ? 'Som ativado' : 'Som desativado';
    if (!soundEnabled) giftAudio.pause();
  });
  function playChime() {
    if (!soundEnabled || !giftAudio.getAttribute('src')) return;
    giftAudio.currentTime = 0;
    giftAudio.play().catch(() => {});
  }
  const frame = $('#campaign-form');
  const consent = $('#data-consent');
  const formArea = $('#participation-form');
  function resetConsent() {
    consent.checked = false;
    formArea.hidden = true;
    $('#form-link').hidden = true;
    frame.hidden = true;
    frame.removeAttribute('src');
    frameStarted = false;
    clearTimeout(frameTimer);
    $('#form-status').hidden = false;
    $('#form-status').textContent = 'Carregando formulário…';
    $('#consent-hint').textContent = 'Marque a caixa para liberar o formulário de participação.';
  }
  consent.addEventListener('change', () => {
    if (!consent.checked) { resetConsent(); return; }
    formArea.hidden = false;
    $('#form-link').hidden = !formUrl;
    $('#consent-hint').textContent = 'Autorização selecionada. Preencha o formulário abaixo para concluir sua inscrição.';
    loadForm();
  });
  let frameStarted = false;
  let frameTimer;
  function embeddedUrl() {
    try {
      const url = new URL(config.formEmbedUrl || formUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com' || !/^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[^/]+\/viewform$/.test(url.pathname)) return null;
      url.searchParams.set('embedded','true');
      return url.href;
    } catch { return null; }
  }
  function loadForm() {
    if (!consent.checked || frameStarted) return;
    const src = embeddedUrl();
    if (!src) { $('#form-status').hidden = true; $('#form-pending').hidden = false; return; }
    frameStarted = true;
    frame.hidden = false;
    frame.onload = () => { if (!consent.checked) return; clearTimeout(frameTimer); $('#form-status').hidden = true; };
    frame.src = src;
    frameTimer = setTimeout(() => { $('#form-status').textContent = 'Se o formulário não aparecer, use o link abaixo para abri-lo em outra aba.'; },10000);
  }
  const messages = [
    'Que a esperança acompanhe cada novo caminho.',
    'Que o Natal aproxime quem faz a sua vida melhor.',
    'Os melhores presentes são os momentos juntos.',
    'Que a alegria encontre você em cada parada.',
    'O melhor destino é estar perto de quem se ama.'
  ];
  let opening = false;
  let lastGift;
  const reveal = $('#reveal');
  document.querySelectorAll('[data-gift]').forEach(button => button.addEventListener('click', () => {
    if (opening) return;
    opening = true; lastGift = button;
    button.classList.add('open');
    playChime();
    if (!reducedMotion.matches) {
      const box = button.getBoundingClientRect();
      for (let i = 0; i < 20; i++) {
        const spark = document.createElement('span');
        spark.className = 'spark'; spark.setAttribute('aria-hidden', 'true');
        spark.style.left = `${box.left + box.width / 2}px`; spark.style.top = `${box.top}px`;
        spark.style.setProperty('--x', `${(Math.random() - .5) * 240}px`);
        spark.style.setProperty('--y', `${-40 - Math.random() * 170}px`);
        document.body.append(spark); spark.addEventListener('animationend', () => spark.remove());
      }
    }
    $('#christmas-message').textContent = messages[Number(button.dataset.gift)];
    $('#form-pending').hidden = true;
    setTimeout(() => { reveal.showModal(); document.body.classList.add('dialog-open'); resetConsent(); opening = false; }, reducedMotion.matches ? 0 : 180);
  }));
  reveal.addEventListener('close', () => { resetConsent(); document.body.classList.remove('dialog-open'); giftAudio.pause(); lastGift?.classList.remove('open'); lastGift?.focus({preventScroll:true}); });
  reveal.querySelectorAll('.close,.back').forEach(button => button.addEventListener('click', () => reveal.close()));
  $('#form-link').addEventListener('click', event => {
    if (!consent.checked) { event.preventDefault(); consent.focus(); return; }
    if (!formUrl) { event.preventDefault(); $('#form-pending').hidden = false; }
  });
  const info = $('#info');
  const information = {
    regulamento: ['Regulamento', 'O regulamento oficial será disponibilizado antes da abertura das inscrições. Esta versão é uma prévia da experiência natalina.', 'regulationUrl'],
    privacidade: ['Privacidade', 'A inscrição utiliza nome e telefone para a participação no sorteio e o contato com o vencedor. Leia a autorização apresentada antes do formulário.', 'privacyUrl'],
    contato: ['Contato', 'O canal oficial de atendimento da campanha será informado em breve.', 'contactUrl']
  };
  document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click', () => {
    const [title, text, key] = information[button.dataset.info];
    const url = safeUrl(config[key]);
    if (url) { window.location.assign(url); return; }
    $('#info-title').textContent = title; $('#info-text').textContent = text; info.showModal();
  }));
  info.querySelectorAll('.close,.close-info').forEach(button => button.addEventListener('click', () => info.close()));
})();


/* Rodapé acompanha as configurações reais da campanha. */
(() => {
  const config = window.CAMPAIGN_CONFIG || {};
  const keys = {regulamento: 'regulationUrl', privacidade: 'privacyUrl', contato: 'contactUrl'};
  const validLink = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
  const footer = document.querySelector('.footer');
  if (!footer) return;
  footer.querySelectorAll('[data-info]').forEach(button => {
    button.hidden = !validLink(config[keys[button.dataset.info]]);
  });
  const nav = footer.querySelector('nav');
  if (nav) nav.hidden = !nav.querySelector('[data-info]:not([hidden])');
  const note = footer.querySelector('small');
  if (note) note.hidden = !config.preview;
})();
