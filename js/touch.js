// ---------- Touch controls ----------
// An on-screen NES pad for phones: a D-pad on the left, A and B on the right, START below.
// It presses the same inputs as the keyboard. It appears as soon as the screen is touched and
// hides again when a key is pressed, so touchscreen laptops still get the plain view. Phones (touch
// and nothing else) start with it showing, and ?touch in the address (index.html?touch) forces it
// on, to try it out with a mouse.
const FORCE_TOUCH = /[?&]touch\b/.test(location.search);
let touchOn = false;

function setTouch(on) {
  if (on === touchOn) return;
  touchOn = on;
  Object.assign(BTN, on ? { attack: 'A', item: 'B', start: 'START' } : { attack: 'Z', item: 'X', start: 'ENTER' });
  document.body.classList.toggle('touch', on);
  resize();
}

if (document.getElementById('pad')) {
  const mm = q => window.matchMedia && matchMedia(q).matches;
  setTouch(FORCE_TOUCH || (mm('(pointer: coarse)') && !mm('(any-pointer: fine)')));
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') setTouch(true); }, true);
  addEventListener('keydown', e => { if (!FORCE_TOUCH && KEYMAP[e.code]) setTouch(false); }, true);
  const buzz = () => navigator.vibrate && navigator.vibrate(8);

  // D-pad: the direction is whichever arm the finger is over, and sliding the finger around
  // switches direction without lifting it
  const dpad = document.getElementById('dpad');
  let dpadId = null, dpadCode = null;
  const setDir = code => {
    if (code === dpadCode) return;
    if (dpadCode) keyUp(dpadCode);
    if (code) { keyDown(code); buzz(); }
    dpadCode = code;
    dpad.dataset.dir = code ? code.slice(5).toLowerCase() : '';
  };
  const aim = e => {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.1) return setDir(null); // dead zone in the middle
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'TouchRight' : 'TouchLeft') : (dy > 0 ? 'TouchDown' : 'TouchUp'));
  };
  dpad.addEventListener('pointerdown', e => {
    dpadId = e.pointerId;
    dpad.setPointerCapture(e.pointerId);
    aim(e);
  });
  dpad.addEventListener('pointermove', e => { if (e.pointerId === dpadId) aim(e); });
  const dpadOff = e => { if (e.pointerId === dpadId) { dpadId = null; setDir(null); } };
  dpad.addEventListener('pointerup', dpadOff);
  dpad.addEventListener('pointercancel', dpadOff);

  // A, B and START: held while touched
  document.querySelectorAll('#pad [data-code]').forEach(b => {
    const code = b.dataset.code;
    b.addEventListener('pointerdown', e => {
      b.setPointerCapture(e.pointerId);
      b.classList.add('on');
      keyDown(code);
      buzz();
    });
    const off = () => { b.classList.remove('on'); keyUp(code); };
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
  });

  // no long-press menus, and iPhones only let sound start from the end of a tap
  addEventListener('contextmenu', e => { if (touchOn) e.preventDefault(); });
  addEventListener('touchend', () => { if (AC && AC.state === 'suspended') AC.resume(); });
}
