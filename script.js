const $ = (selector) => document.querySelector(selector);
const film = $('#film');
const scenes = [...document.querySelectorAll('.scene')];
const progress = [...document.querySelectorAll('.progress i')];
const nextButton = $('#nextButton');
let sceneIndex = 0;
let timer;
let isPlaying = false;
let soundOn = false;

function playChime() {
  if (!soundOn || !window.AudioContext) return;
  const context = new AudioContext();
  [0, .15, .33].forEach((offset, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = [523.25, 659.25, 783.99][index];
    gain.gain.setValueAtTime(.0001, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(.06, context.currentTime + offset + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + offset + .8);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + .85);
  });
}

function showScene(index) {
  clearTimeout(timer);
  sceneIndex = index;
  scenes.forEach((scene, position) => {
    const active = position === index;
    scene.classList.toggle('active', active);
    scene.setAttribute('aria-hidden', String(!active));
  });
  progress.forEach((bar, position) => {
    bar.classList.toggle('done', position < index);
    bar.classList.toggle('current', position === index && index > 0);
  });
  const finished = index === scenes.length - 1;
  film.classList.toggle('finished', finished);
  if (!finished && isPlaying) timer = setTimeout(() => showScene(index + 1), 6500);
}

function beginFilm() {
  isPlaying = true;
  film.classList.add('playing');
  showScene(1);
  playChime();
}

function advance() {
  if (!isPlaying) return;
  if (sceneIndex < scenes.length - 1) showScene(sceneIndex + 1);
}

if (film) {
$('#beginButton').addEventListener('click', (event) => { event.stopPropagation(); beginFilm(); });
nextButton.addEventListener('click', (event) => { event.stopPropagation(); advance(); });
film.addEventListener('click', (event) => {
  if (event.target.closest('button, dialog, input, select, label')) return;
  advance();
});
window.addEventListener('keydown', (event) => {
  if ((event.key === ' ' || event.key === 'ArrowRight') && !$('#rsvpDialog').open) { event.preventDefault(); advance(); }
});

$('#replayButton').addEventListener('click', (event) => { event.stopPropagation(); showScene(1); isPlaying = true; film.classList.add('playing'); });

$('#soundButton').addEventListener('click', () => {
  soundOn = !soundOn;
  const button = $('#soundButton');
  button.setAttribute('aria-pressed', String(soundOn));
  button.setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
  button.innerHTML = `<span>♪</span> Sound ${soundOn ? 'on' : 'off'}`;
  if (soundOn) playChime();
});

const dialog = $('#rsvpDialog');
$('#rsvpButton').addEventListener('click', (event) => { event.stopPropagation(); dialog.showModal(); });
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

$('#rsvpForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent('RSVP — Kalyani & Shuvam');
  const body = encodeURIComponent(`Name: ${data.get('name')}\nResponse: ${data.get('attendance')}\nGuests: ${data.get('guests')}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  dialog.close();
});
}

$('#calendarButton')?.addEventListener('click', (event) => {
  event.stopPropagation();
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kalyani and Shuvam//Wedding//EN', 'BEGIN:VEVENT', 'UID:kalyani-shuvam-20030425@example.com', 'DTSTAMP:20260425T000000Z', 'DTSTART:20030425T124500Z', 'DTEND:20030425T174500Z', 'SUMMARY:Wedding of Kalyani & Shuvam', 'LOCATION:The Garden Mandap, Kathmandu', 'DESCRIPTION:Wedding ceremony at 6:30 PM Nepal Time.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  link.download = 'kalyani-shuvam-wedding.ics';
  link.click();
  URL.revokeObjectURL(link.href);
  const toast = $('#toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }
});

const weddingDate = new Date('2003-04-25T18:30:00+05:45');
function updateCountdown() {
  if (!$('#days')) return;
  const remaining = Math.max(0, weddingDate - new Date());
  const day = 86400000;
  $('#days').textContent = Math.floor(remaining / day);
  $('#hours').textContent = String(Math.floor((remaining % day) / 3600000)).padStart(2, '0');
  $('#minutes').textContent = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
  $('#seconds').textContent = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
}
updateCountdown();
if ($('#days')) setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('revealed'); });
}, { threshold: .14 });
document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
