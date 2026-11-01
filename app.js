(() => {
  'use strict';
  const config = window.CAMPAIGN_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };
  const formUrl = safeUrl(config.formUrl);
  if (!config.preview && formUrl) $('.preview').hidden = true;
  if (formUrl) $('#form-link').href = formUrl;
  else { $('#form-link').textContent = 'Inscrições em breve'; $('#form-note').textContent = 'Prévia: formulário ainda não configurado.'; }

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
  let audioContext;
  $('#sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('#sound').setAttribute('aria-pressed', String(soundEnabled));
    $('#sound span').textContent = soundEnabled ? 'Som ativado' : 'Som desativado';
  });
  async function playChime() {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      await audioContext.resume();
      if (!soundEnabled) return;
      const now = audioContext.currentTime;
      [783.99, 987.77, 1174.66, 1567.98].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, now + i * .13);
        gain.gain.linearRampToValueAtTime(.075, now + i * .13 + .012);
        gain.gain.exponentialRampToValueAtTime(.001, now + i * .13 + 1.1);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(now + i * .13); oscillator.stop(now + i * .13 + 1.2);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* O restante da experiência funciona sem áudio. */ }
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
    setTimeout(() => { reveal.showModal(); opening = false; }, reducedMotion.matches ? 0 : 650);
  }));
  reveal.addEventListener('close', () => { lastGift?.classList.remove('open'); lastGift?.focus(); });
  reveal.querySelectorAll('.close,.back').forEach(button => button.addEventListener('click', () => reveal.close()));
  $('#form-link').addEventListener('click', event => {
    if (!formUrl) { event.preventDefault(); $('#form-pending').hidden = false; }
  });
  const info = $('#info');
  const information = {
    regulamento: ['Regulamento', 'O regulamento oficial será disponibilizado antes da abertura das inscrições. Esta versão é uma prévia da experiência natalina.', 'regulationUrl'],
    privacidade: ['Privacidade', 'Esta prévia não coleta nome ou telefone. O aviso oficial sobre o uso dos dados da campanha será disponibilizado antes das inscrições.', 'privacyUrl'],
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
