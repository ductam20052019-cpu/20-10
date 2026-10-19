(() => {
  const scene = document.getElementById('gift-letter-scene');
  const envelope = document.getElementById('gift-envelope-view');
  const openButton = document.getElementById('gift-open-letter');
  const letter = document.getElementById('gift-letter-content');
  const pocketButton = document.getElementById('gift-pocket-button');
  const delivered = document.getElementById('gift-delivered-view');
  const message = document.getElementById('gift-delivered-message');
  let stage = 'waiting';

  window.addEventListener('tiny:gift-arrived', () => {
    if (stage !== 'waiting') return;
    stage = 'envelope';
    scene.dataset.stage = stage;
    scene.hidden = false;
    scene.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => scene.classList.add('gift-visible'));
    openButton.focus({ preventScroll: true });
  });

  openButton.addEventListener('click', () => {
    if (stage !== 'envelope') return;
    stage = 'opening';
    scene.dataset.stage = stage;
    openButton.disabled = true;
    openButton.setAttribute('aria-expanded', 'true');
    scene.classList.add('gift-opening');

    const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    setTimeout(() => {
      stage = 'letter';
      scene.dataset.stage = stage;
      envelope.hidden = true;
      letter.hidden = false;
      scene.scrollTop = 0;
      letter.focus({ preventScroll: true });
    }, delay);
  });

  pocketButton.addEventListener('click', () => {
    if (stage !== 'letter') return;
    stage = 'delivered';
    scene.dataset.stage = stage;
    pocketButton.disabled = true;
    letter.hidden = true;
    delivered.hidden = false;
    message.textContent = 'Đã giao tận tay người tớ muốn tặng.';
    scene.scrollTop = 0;
    delivered.focus({ preventScroll: true });
  });
})();
