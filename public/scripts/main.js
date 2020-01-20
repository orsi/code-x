const AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
const AUDIO_DISTORTION = AUDIO_CONTEXT.createWaveShaper();
const AUDIO_DISTORTION_GAIN = AUDIO_CONTEXT.createGain();
const AUDIO_DRY_CHANNEL = AUDIO_CONTEXT.createGain();
const AUDIO_EFFECTS_CHANNEL = AUDIO_CONTEXT.createGain();
const AUDIO_LETTER_BUFFERS = {};
const AUDIO_MASTER_GAIN = AUDIO_CONTEXT.createGain();
const AUDIO_REVERB = AUDIO_CONTEXT.createConvolver();
const AUDIO_REVERSE_REVERB = AUDIO_CONTEXT.createConvolver();
const FADEOUT_LETTERS_INTERVALS = {};
const MAX_FADEOUT_LETTER_TIME = 8000;
const MIN_FADEOUT_LETTER_TIME = 5000;
const MAX_NEXT_AUTO_UPDATE_TIME = 2000;
const MIN_NEXT_AUTO_UPDATE_TIME = 1000;
const RESOURCE_PATH = '/res/';
const STATE = {
  TITLE: 0,
  INTERACTIVE: 1,
  AUTO: 2,
  DEBUG: 3
};
const TIME_TIL_AUTO = 10000;
const TIME_TIL_FADEOUT_LETTER = 5000;
let $codex;
let $codexInstructions;
let $enterButton;
let $markSutherland;
let $redBar;
let $screenTitle;
let $screenCodex;
let $volumeButton;
let currentAudio = [];
let currentState;
let fadeTimeoutMap = {};
let isInitialized = false;
let isAudioLoaded = false;
let isAudioMuted = false;
let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let isMobileAudioEnabled = false;
let lastClientX;
let lastClientY;
let lastKeypressTime = new Date().getTime();
let lastUpdateTime = new Date().getTime();
let lastUpdateAutoTime = new Date().getTime();
let lettersLoaded = 0;
let letterTimeouts = [];
let maxNextAutoUpdateTime = 4000;
let minNextAutoUpdateTime = 1000;
let totalLetters = 26;
let nextUpdateAutoTime = 0;
let previousState;

function hideLetter(letter) {
  // reset letter in codex object
  for (let i = 0; i < codex.length; i++) {
    // line
    const codexLine = codex[i];
    for (let j = 0; j < codexLine.length; j++) {
      // letter
      const codexLetter = codexLine[j];
      if (codexLetter.letter === letter) {
        fadeOutElement(codexLetter.element, 3000);
        codexLetter.visible = false;
      }
    }
  }
}

function fadeInElement($element, time, callback) {
  const uuid = getUUID();

  if ($element.classList.contains('fade-in')) {
    // currently fading in
    return;
  }

  if (time === undefined) {
    time = 300;
  }

  // make sure style has an opacity
  
  $element.style.opacity = 0;
  $element.classList.add('fade-in');

  var last = new Date().getTime();
  var tick = function() {
    const now = new Date().getTime();
    const opacity = parseFloat($element.style.opacity) + (now - last) / time;
    $element.style.opacity = opacity;
    last = now;

    if (opacity < 1) {
      fadeTimeoutMap[uuid] =  requestAnimationFrame(tick);
    } else {
      $element.style.opacity = 1;
      $element.classList.remove('fade-in');

      delete fadeTimeoutMap[uuid];

      if (callback) {
        callback();
      }
    }
  };

  tick();
}


function fadeOutElement($element, time, callback) {
  const uuid = getUUID();
  if ($element.classList.contains('fade-out')) {
    // currently fading out
    return;
  }

  // set defaults
  if (time === undefined) {
    time = 300;
  }

  // make sure style has an opacity
  if (!$element.style.opacity) {
    $element.style.opacity = 1;
  }
  $element.classList.add('fade-out');

  let lastUpdate = new Date().getTime();
  const tick = function() {
    const now = new Date().getTime();
    const opacity = parseFloat($element.style.opacity) - (now - lastUpdate) / time;
    $element.style.opacity = opacity;
    lastUpdate = now;

    if (opacity > 0) {
      fadeTimeoutMap[uuid] = requestAnimationFrame(tick);
    } else {
      $element.style.opacity = 0;
      $element.classList.remove('fade-out');

      delete fadeTimeoutMap[uuid];

      if (callback) {
        callback();
      }
    }
  };

  tick();
}

function fadeGain(value, seconds) {
  if (seconds === undefined) {
    seconds = .1;
  }

  // cancel any current schedules
  AUDIO_MASTER_GAIN.gain.cancelScheduledValues(AUDIO_CONTEXT.currentTime);
  // set checkpoint
  AUDIO_MASTER_GAIN.gain.setValueAtTime(AUDIO_MASTER_GAIN.gain.value, AUDIO_CONTEXT.currentTime);
  // now fade
  AUDIO_MASTER_GAIN.gain.linearRampToValueAtTime(value, AUDIO_CONTEXT.currentTime + seconds);
}

function getDelayFadeoutLetterTime() {
  const nextTime = Math.floor(
    Math.random() * (MAX_FADEOUT_LETTER_TIME - MIN_FADEOUT_LETTER_TIME)
  ) + MIN_FADEOUT_LETTER_TIME;
  return nextTime;
}

/**
 * Returns a random key code between 65 and 90 for all
 * uppercase letters.
 */
function getRandomKeyCode() {
  const keyCode = Math.floor(Math.random() * 26) + 65
  return keyCode;
}

function getNextUpdateAutoTime() {
  const nextTime = Math.floor(
    Math.random() * (maxNextAutoUpdateTime - minNextAutoUpdateTime)
  ) + minNextAutoUpdateTime;
  return nextTime;
}

/**
 * Generates the html for the main Codex paragraph within
 * the given container.
 * @param {HTMLElement} container 
 */
function generateCodexHtml(container) {
  // container.innerHTML = mainParagraph;
  for (let i = 0; i < codex.length; i++) {
    // line
    const line = codex[i];
    const $div = document.createElement('div');
    $div.classList.add('line');
    container.appendChild($div);
    for (let j = 0; j < line.length; j++) {
      // letter
      const letter = line[j];
      const $span = letter.element = document.createElement('span');
      $span.textContent = letter.letter;
      $span.classList.add('letter');
      $span.style.color = letter.color;
      $span.style.opacity = 0;
      $div.appendChild($span);
    }
  }
}

function getDistanceFromCenter() {
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const midHeight = windowHeight / 2;
  const midWidth = windowWidth / 2;
  const mouseY = lastClientY ? lastClientY : midHeight;
  const mouseX = lastClientX ? lastClientX : midWidth;
  const maxDistance = Math.sqrt(Math.pow((windowWidth - midWidth), 2) + Math.pow((windowHeight - midHeight), 2));
  const distanceFromCenter = Math.sqrt(Math.pow((midWidth - mouseX), 2) + Math.pow((midHeight - mouseY), 2));
  const normalizedValue = distanceFromCenter / maxDistance;
  return normalizedValue;
}

function getVerticalDistanceFromCenter() {
  const windowHeight = window.innerHeight;
  const maxVerticalDistance = windowHeight / 2;
  const mouseY = lastClientY ? lastClientY : maxVerticalDistance;
  const distanceFromCenter = maxVerticalDistance - mouseY;
  const normalizedValue = distanceFromCenter / maxVerticalDistance;
  return normalizedValue;
}

function getHorizontalDistanceFromCenter() {
  const maxWidth = window.innerWidth;
  const maxHorizontalDistance = maxWidth / 2;
  const mouseX = lastClientX ? lastClientX : maxHorizontalDistance;
  const distanceFromCenter = mouseX - maxHorizontalDistance;
  const normalizedValue = distanceFromCenter / maxHorizontalDistance;
  return normalizedValue;
}

/**
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */
function getUUID() { // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 = (performance && performance.now && (performance.now()*1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16; //random number between 0 and 16
      if(d > 0){ //Use timestamp until depleted
          r = (d + r)%16 | 0;
          d = Math.floor(d/16);
      } else { //Use microseconds since page-load if supported
          r = (d2 + r)%16 | 0;
          d2 = Math.floor(d2/16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function impulseResponse(duration, decay, reverse) {
  var sampleRate = AUDIO_CONTEXT.sampleRate;
  var length = sampleRate * duration;
  var impulse = AUDIO_CONTEXT.createBuffer(2, length, sampleRate);
  var impulseL = impulse.getChannelData(0);
  var impulseR = impulse.getChannelData(1);

  if (!decay)
      decay = 2.0;
  for (var i = 0; i < length; i++){
    var n = reverse ? length - i : i;
    impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
  }
  return impulse;
}

function initialize() {
  // select elements
  $codex = document.querySelector('#codex');
  $codexInstructions = document.querySelector('#codex-instructions');
  $enterButton = document.querySelector('#enter-button');
  $redBar = document.querySelector('#red-bar');
  $markSutherland = document.querySelector('#mark-sutherland');
  $screenTitle = document.querySelector('#screen-title');
  $screenCodex = document.querySelector('#screen-codex');
  $volumeButton = document.querySelector('#codex-volume-button');

  // setup events
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('mousemove', onMouseMove);
  if (isMobile) {
    document.addEventListener('touchstart', onTouchDocument);
    $enterButton.addEventListener('touchstart', onClickEnterButton);
    $volumeButton.addEventListener('touchstart', onClickVolumeButton);
  } else {
    $enterButton.addEventListener('click', onClickEnterButton);
    $volumeButton.addEventListener('click', onClickVolumeButton);
  }
  
  // setup gains and effects 
  AUDIO_EFFECTS_CHANNEL.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
  AUDIO_DRY_CHANNEL.gain.setValueAtTime(1, AUDIO_CONTEXT.currentTime);
  AUDIO_REVERB.buffer = impulseResponse(5, 20, false);
  AUDIO_REVERSE_REVERB.buffer = impulseResponse(.8, 10, true);
  AUDIO_DISTORTION.curve = makeDistortionCurve(500);
  AUDIO_DISTORTION.oversample = '4x';
  // compensate for increase rms volume
  AUDIO_DISTORTION_GAIN.gain.setValueAtTime(0.04, AUDIO_CONTEXT.currentTime); 
  
  // routing
  AUDIO_EFFECTS_CHANNEL.connect(AUDIO_REVERB);
  AUDIO_EFFECTS_CHANNEL.connect(AUDIO_REVERSE_REVERB);
  AUDIO_EFFECTS_CHANNEL.connect(AUDIO_DISTORTION);
    AUDIO_DISTORTION.connect(AUDIO_DISTORTION_GAIN);
    AUDIO_DISTORTION_GAIN.connect(AUDIO_MASTER_GAIN);
    AUDIO_REVERB.connect(AUDIO_MASTER_GAIN);
    AUDIO_REVERSE_REVERB.connect(AUDIO_MASTER_GAIN);
  AUDIO_DRY_CHANNEL.connect(AUDIO_MASTER_GAIN);
  AUDIO_MASTER_GAIN.connect(AUDIO_CONTEXT.destination);

  // load audio
  loadAudioFiles();

  // initialize title screen
  setCurrentState(STATE.TITLE, $screenTitle);

  // start update
  update();
}

function loadAudioFiles() {
  for (i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i);
    AUDIO_LETTER_BUFFERS[letter] = AUDIO_CONTEXT.createBufferSource();
    let request = new XMLHttpRequest();
    request.open('GET', `${RESOURCE_PATH}${letter.toUpperCase()}.mp3`, true);
    request.responseType = 'arraybuffer';
    request.onreadystatechange = function() {
      if (request.readyState == XMLHttpRequest.DONE) {
        AUDIO_CONTEXT.decodeAudioData(
          request.response,
          function (buffer) {
            AUDIO_LETTER_BUFFERS[letter].buffer = buffer;
            AUDIO_LETTER_BUFFERS[letter].loop = false;
            lettersLoaded++;

            if (lettersLoaded == totalLetters) {
              isAudioLoaded = true;
            }
          },
          function (e) {
            console.log("Error with decoding audio data" + e.err);
          }
        );
      }
    }
    request.send();
  }
}

function makeDistortionCurve(amount) {
  var k = amount || 50;
  const sampleLength = 44100;
  const curve = new Float32Array(sampleLength);
  const deg = Math.PI / 180;
  for (let i = 0; i < sampleLength; ++i) {
    const x = i * 2 / sampleLength - 1;
    curve[i] = k * x * 20 * deg / ( Math.PI + k * Math.abs(x));
  }
  return curve;
}

function normalizeValue(value, valueMin, valueMax, min, max) {
  const normalizedValue = (max - min) * ((value - valueMin) / (valueMax -valueMin)) + min;
  return normalizedValue;
}

function enableMobileAudio() {
  // create gain to enable audio
  AUDIO_CONTEXT.createGain();

  if (AUDIO_CONTEXT.state === 'suspended') {
    AUDIO_CONTEXT.resume();
  }

  isMobileAudioEnabled = true;
}

function onClickEnterButton(ev) {
  if (isMobile) {
    enableMobileAudio();
    transition(STATE.TITLE, STATE.AUTO);
  } else {
    transition(STATE.TITLE, STATE.INTERACTIVE);
  }
}

function onClickVolumeButton(ev) {
  if (isAudioMuted) {
    fadeGain(1, .5);
    isAudioMuted = false;
    // change font-awesome icon
    const $icon = $volumeButton.querySelector('i');
    $icon.classList.remove('fa-volume-mute');
    $icon.classList.add('fa-volume-up');
  } else {
    fadeGain(0, .5);
    isAudioMuted = true;
    // change font-awesome icon
    const $icon = $volumeButton.querySelector('i');
    $icon.classList.remove('fa-volume-up');
    $icon.classList.add('fa-volume-mute');
  }
}

function onKeydown(ev) {
  lastKeypressTime = new Date().getTime();

  // get character code depending on browser compatibility
  let keyCode;
  if (ev.which || ev.keyCode || ev.charCode) {
    keyCode = ev.which || ev.keyCode || ev.charCode;
  }

  if (currentState === STATE.INTERACTIVE) {
    if (keyCode >= 65 && keyCode <= 90) {
      // upper case letters
      const letter = String.fromCharCode(keyCode).toLowerCase();
      showLetter(letter);

      // ensure instructions are hidden on first keypress
      if (+$codexInstructions.style.opacity !== 0) {
        fadeOutElement($codexInstructions);
      }
    } else if (keyCode >= 97 && keyCode <= 122) {
      // lower case letters
      const letter = String.fromCharCode(keyCode);
      showLetter(letter);

      // ensure instructions are hidden on first keypress
      if (+$codexInstructions.style.opacity !== 0) {
        fadeOutElement($codexInstructions);
      }
    } else if (keyCode === 32) {
      // space

      // fade out codex, reset
      fadeGain(0, 1);
      fadeOutElement($codex, 1000, function () {
        fadeInElement($codex, 0);
        fadeGain(1);
        resetCodex();
      });

      // ensure instructions are hidden on first keypress
      if (+$codexInstructions.style.opacity !== 0) {
        fadeOutElement($codexInstructions);
      }
    } else if (keyCode === 27) {
      // escape
      transition(STATE.INTERACTIVE, STATE.TITLE);
    }

  } else if (currentState === STATE.AUTO) {
    transition(STATE.AUTO, STATE.TITLE);
  } else if (currentState === STATE.TITLE) {
    if (keyCode === 'D'.charCodeAt(0)) {
      // upper case letters
      transition(STATE.TITLE, STATE.DEBUG);
    }
  } else if (currentState === STATE.DEBUG) {
    if (keyCode === 27) {
      // escape
      transition(STATE.DEBUG, STATE.TITLE);
    }
  }
}

function onMouseMove(e) {
  lastClientX = e.clientX;
  lastClientY = e.clientY;

  if (currentState === STATE.AUTO) {
    // convert -1-1 range to .25-2 for playbackRate
    let normalizedVerticalDistance = normalizeValue(getVerticalDistanceFromCenter(), -1, 1, 0.25, 2);
    for (let i = 0; i < currentAudio.length; i++) {
      currentAudio[i].playbackRate.value = normalizedVerticalDistance;
    }
    
    // cross fade between effects/dry channel
    const wetGain = getDistanceFromCenter();
    const dryGain = 1 - wetGain;
    AUDIO_EFFECTS_CHANNEL.gain.linearRampToValueAtTime(wetGain, AUDIO_CONTEXT.currentTime);
    AUDIO_DRY_CHANNEL.gain.linearRampToValueAtTime(dryGain, AUDIO_CONTEXT.currentTime);

    // modify letter updates according to distance from center ratio
    maxNextAutoUpdateTime = MAX_NEXT_AUTO_UPDATE_TIME / normalizedVerticalDistance;
    minNextAutoUpdateTime = MIN_NEXT_AUTO_UPDATE_TIME / normalizedVerticalDistance;
  }
}

function onTouchDocument(e) {
  lastClientX = e.touches[0].clientX;
  lastClientY = e.touches[0].clientY;

  if (currentState === STATE.AUTO) {
    // convert -1-1 range to .25-2 for playbackRate
    let normalizedVerticalDistance = normalizeValue(getVerticalDistanceFromCenter(), -1, 1, 0.25, 2);
    for (let i = 0; i < currentAudio.length; i++) {
      currentAudio[i].playbackRate.value = normalizedVerticalDistance;
    }
    
    // cross fade between effects/dry channel
    const wetGain = getDistanceFromCenter();
    const dryGain = 1 - wetGain;
    AUDIO_EFFECTS_CHANNEL.gain.linearRampToValueAtTime(wetGain, AUDIO_CONTEXT.currentTime);
    AUDIO_DRY_CHANNEL.gain.linearRampToValueAtTime(dryGain, AUDIO_CONTEXT.currentTime);

    // modify letter updates according to distance from center ratio
    maxNextAutoUpdateTime = MAX_NEXT_AUTO_UPDATE_TIME / normalizedVerticalDistance;
    minNextAutoUpdateTime = MIN_NEXT_AUTO_UPDATE_TIME / normalizedVerticalDistance;
  }
}

function playAudio(source, _playbackRate, _pan) {
  const cloneSource = AUDIO_CONTEXT.createBufferSource();
  cloneSource.buffer = source.buffer;
  
  // playback rate
  if (!isMobile) {
    const playbackRate = _playbackRate || 1;
    cloneSource.playbackRate.value = playbackRate;
  }
  currentAudio.push(cloneSource);
  
  // pan control
  const pan = _pan || 0;
  const pannerNode = AUDIO_CONTEXT.createPanner();
  pannerNode.panningModel = 'equalpower';
  const z = 1 - Math.abs(pan);
  pannerNode.setPosition(pan, 0, z);

  // sends
  cloneSource.connect(pannerNode);
  pannerNode.connect(AUDIO_DRY_CHANNEL);
  cloneSource.connect(AUDIO_EFFECTS_CHANNEL);

  cloneSource.onended = function () {
    if(this.stop) {
      this.stop(); 
    }
    if(this.disconnect) {
      this.disconnect();
    }
    currentAudio = currentAudio.filter(function (currentAudio) {
      return currentAudio !== cloneSource;
    });
  }
  cloneSource.start(0);
}

function playLetterAudio(letter, playbackRate, pan) {
  const audioBufferSource = AUDIO_LETTER_BUFFERS[letter];
  if (audioBufferSource === undefined) {
    return;
  }

  playAudio(audioBufferSource, playbackRate, pan);
}

function resetCodex() {
  // disconnect all playing audio
  for (let i = 0; i < currentAudio.length; i++) {
    const audioSource = currentAudio[i];
    audioSource.disconnect();
  }
  currentAudio = [];

  // reset all visibility in codex object
  for (let i = 0; i < codex.length; i++) {
    // line
    const codexLine = codex[i];
    for (let j = 0; j < codexLine.length; j++) {
      // letter
      const codexLetter = codexLine[j];
      codexLetter.visible = false;
    }
  }

  $codex.innerHTML = '';
  generateCodexHtml($codex);
}

function revealAll() {
  for (let i = 65; i <= 90; i++) {
    let letter = String.fromCharCode(i).toLowerCase();
    showLetter(letter);
  }
}

function showLetter(letter) {
  let shouldPlayAudio = false;
  for (let i = 0; i < codex.length; i++) {
    // line
    const codexLine = codex[i];
    for (let j = 0; j < codexLine.length; j++) {
      // letter
      const codexLetter = codexLine[j];
      if (codexLetter.letter === letter) {
        shouldPlayAudio = true;
        if (codexLetter.visible === false) {
          fadeInElement(codexLetter.element, 3000);
          codexLetter.visible = true;
        }
      }
    }
  }

  if (shouldPlayAudio) {
    if (currentState === STATE.INTERACTIVE) {
      playLetterAudio(letter);
    } else if (currentState === STATE.AUTO) {
      const normalizedPlaybackRate = normalizeValue(getVerticalDistanceFromCenter(), -1, 1, 0.25, 2);
      const pan = getHorizontalDistanceFromCenter();
      playLetterAudio(letter, normalizedPlaybackRate, pan);
    }
  }
}

function setCurrentState(state, $element) {
  previousState = currentState;
  currentState = state;
  const $currentStateElement = document.querySelector('.current-state');
  if ($currentStateElement !== null) {
    $currentStateElement.classList.remove('current-state');
  }
  $element.classList.add('current-state');
}

function transition(from, to) {
  if (from === STATE.TITLE) {
    stopAllFades();

    if (to === STATE.INTERACTIVE) {
      if (+$codexInstructions.style.opacity === 0) {
        fadeInElement($codexInstructions, 0);
      }

      fadeGain(1);
      resetCodex();
      lastKeypressTime = new Date().getTime(); // resets timer to auto
      fadeOutElement($screenTitle, 1000, function () {
        fadeInElement($screenCodex);
        setCurrentState(STATE.INTERACTIVE, $screenCodex);
      });
    } else if (to === STATE.DEBUG) {
      revealAll();
      fadeOutElement($screenTitle, 1000, function () {
        fadeInElement($screenCodex);
        setCurrentState(STATE.DEBUG, $screenCodex);
      });
    } else if (to === STATE.AUTO) {
      fadeGain(1);
      resetCodex();
      fadeOutElement($codexInstructions, 0);
      fadeOutElement($screenTitle, 1000, function () {
        fadeInElement($screenCodex);
        setCurrentState(STATE.AUTO, $screenCodex);
      });
    }

  } else if (from === STATE.DEBUG) {

    if (to === STATE.TITLE) {
      fadeOutElement($screenCodex, 1000, function () {
        fadeInElement($screenTitle);
        setCurrentState(STATE.TITLE, $screenCodex);
      });
    } 

  } else if (from === STATE.INTERACTIVE) {

    if (to === STATE.TITLE) {
      fadeGain(0);
      fadeOutElement($screenCodex, 1000, function () {
        fadeInElement($screenTitle);
        setCurrentState(STATE.TITLE, $screenTitle);
      });
    } else if (to === STATE.AUTO) {
      fadeGain(0);
      resetCodex();
      if (+$codexInstructions.style.opacity !== 0) {
        fadeOutElement($codexInstructions);
      }
      fadeGain(1);
      setCurrentState(STATE.AUTO, $screenCodex);
    }

  } else if (from === STATE.AUTO) {

    if (to === STATE.TITLE) {
      fadeGain(0);
      fadeOutElement($screenCodex, 1000, function () {
        fadeInElement($screenTitle);
        setCurrentState(STATE.TITLE, $screenTitle);
      });
    }

  }
}

function stopAllFades () {
  for (const key in fadeTimeoutMap) {
    if (Object.prototype.hasOwnProperty.call(fadeTimeoutMap, key)) {
      cancelAnimationFrame(fadeTimeoutMap[key]);
    }
  }

  const $fadeInElements = document.querySelectorAll('.fade-in');
  $fadeInElements.forEach(function ($element) { 
    $element.classList.remove('fade-in');
    $element.style.opacity = 1; 
  });

  const $fadeOutElements = document.querySelectorAll('.fade-out');
  $fadeOutElements.forEach(function ($element) { 
    $element.classList.remove('fade-out');
    $element.style.opacity = 0; 
  });
}

function update() {
  const now = new Date().getTime();
  const delta = now - lastUpdateTime;
  lastUpdateTime = now;
  
  if (currentState === STATE.TITLE) {
    if (!isAudioLoaded && !isInitialized) {
      const width = lettersLoaded / totalLetters * window.outerWidth;
      $redBar.style.width =  width + 'px';
    } else if (isAudioLoaded && !isInitialized) {
      // delay and hide mark sutherland, progress bar and show enter
      setTimeout(function () {
        fadeOutElement($markSutherland, 1000, function () {
          $markSutherland.parentNode.removeChild($markSutherland);
          fadeInElement($enterButton, 1000);
          $enterButton.classList.remove('display-none');
        });
      }, 750);
      isInitialized = true;
    }
  }

  // switch to auto state when a key hasn't been pressed
  // in 10 seconds
  if (currentState === STATE.INTERACTIVE &&
    now - lastKeypressTime > TIME_TIL_AUTO
  ) {
    transition(STATE.INTERACTIVE, STATE.AUTO);
  }

  if (currentState === STATE.AUTO &&
    lastUpdateTime - lastUpdateAutoTime > nextUpdateAutoTime
  ) {
    const keyCode = getRandomKeyCode();
    const letter = String.fromCharCode(keyCode).toLowerCase();
    showLetter(letter);

    // fade out letter
    setTimeout(function () {
      hideLetter(letter);
    }, getDelayFadeoutLetterTime());

    // randomly reveal a letter every 2-6 seconds
    nextUpdateAutoTime = getNextUpdateAutoTime();
    lastUpdateAutoTime = now;
  }

  requestAnimationFrame(update);
}

// on load
document.addEventListener('DOMContentLoaded', initialize);

/** MAIN CODEX META OBJECT */
const codex = [
  [
    {
      "color": "white",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "b",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "v",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "k",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "x",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "k",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "v",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "q",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "k",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "v",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "red",
      "letter": "v",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "j",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "b",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "b",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "x",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "z",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "v",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "z",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "z",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "z",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "q",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "z",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "k",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "x",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "w",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "m",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "b",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "k",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "r",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "p",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "g",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "h",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "s",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "b",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "y",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "f",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "a",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": " ",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "i",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "n",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "v",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "l",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "u",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "t",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "d",
      "visible": false,
      "element": null
    }
  ],
  [
    {
      "color": "white",
      "letter": "c",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "o",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "d",
      "visible": false,
      "element": null
    },
    {
      "color": "red",
      "letter": "e",
      "visible": false,
      "element": null
    },
    {
      "color": "white",
      "letter": "x",
      "visible": false,
      "element": null
    }
  ]
];