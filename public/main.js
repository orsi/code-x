const AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
const AUDIO_GAIN_NODE = AUDIO_CONTEXT.createGain();
const AUDIO_FILES = {};
const FADEOUT_LETTERS_INTERVALS = {};
const MAX_FADEOUT_LETTER_TIME = 8000;
const MIN_FADEOUT_LETTER_TIME = 5000;
const MAX_NEXT_UPDATE_AUTO_TIME = 4000;
const MIN_NEXT_UPDATE_AUTO_TIME = 1000;
const RESOURCE_PATH = '/res/';
const STATE = {
  TITLE: 0,
  INTERACTIVE: 1,
  AUTO: 2,
  INFO: 3
};
const SCREENS = [];
const TIME_TIL_AUTO = 10000;
const TIME_TIL_FADEOUT_LETTER = 5000;
let $codexContainer;
let $codexInstructions;
let $enterButton;
let $infoButton;
let $infoExitButton;
let $screenTitle;
let $screenCodex;
let $screenInfo;
let $volumeButton;
let currentAudio = [];
let currentState = STATE.TITLE;
let isAudioMuted = false;
let lastKeypressTime;
let lastUpdateTime;
let lastUpdateAutoTime;
let nextUpdateAutoTime;

function hideLetter(letter) {
  // reset letter in codex object
  for (let i = 0; i < codex.length; i++) {
    // line
    const codexLine = codex[i];
    for (let j = 0; j < codexLine.length; j++) {
        // letter
        const codexLetter = codexLine[j];
        if (codexLetter.letter === letter) {
          codexLetter.element.style.opacity = 0;
          codexLetter.visible = false;
        }
    }
  }
}

function fadeInScreen(screen) {
  screen.classList.add('fade-in');
  screen.classList.add('fading-in');
  screen.classList.add('current-state');
}

function fadeOutAllScreens() {
  for (let i = 0; i < SCREENS.length; i++) {
    fadeOutScreen(SCREENS[i]);
  }
}
function fadeOutScreen(screen) {
  screen.classList.add('fade-out');
  screen.classList.add('fading-out');
  screen.classList.remove('current-state');
}

function fadeGain(value, seconds) {
  // cancel any current schedules
  AUDIO_GAIN_NODE.gain.cancelScheduledValues(AUDIO_CONTEXT.currentTime);
  // set checkpoint
  AUDIO_GAIN_NODE.gain.setValueAtTime(AUDIO_GAIN_NODE.gain.value, AUDIO_CONTEXT.currentTime);
  // now fade
  AUDIO_GAIN_NODE.gain.linearRampToValueAtTime(value, AUDIO_CONTEXT.currentTime + seconds);
}

function getFadeoutLetterTime() {
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
    Math.random() * (MAX_NEXT_UPDATE_AUTO_TIME - MIN_NEXT_UPDATE_AUTO_TIME)
  ) + MIN_NEXT_UPDATE_AUTO_TIME;
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

function loadAudioFiles() {
    for (i = 0; i < 26; i++) {
        const letter = String.fromCharCode(97 + i);
        AUDIO_FILES[letter] = new Audio(`${RESOURCE_PATH}${letter.toUpperCase()}.mp3`);
    }
}

function onClickEnterButton(ev) {
  transitionToInteractiveScreen();
}

function onClickInfoButton(ev) {
  transitionToInfoScreen();
}

function onClickInfoExitButton(ev) {
  transitionToInteractiveScreen();
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

function onDocumentKeydown(ev) {
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
          revealLetter(letter);
      } else if (keyCode >= 97 && keyCode <= 122) {
          // lower case letters
          const letter = String.fromCharCode(keyCode);
          revealLetter(letter);
      } else if (keyCode === 32) {
          // space
          resetCodex();
      } else if (keyCode === 27) {
        // escape
        transitionToTitleScreen();
        resetCodex();
      }
  } else if (currentState === STATE.AUTO) {
      if (keyCode >= 65 && keyCode <= 90) {
        // upper case letters
        transitionToInteractiveScreen();
        resetCodex();

        const letter = String.fromCharCode(keyCode).toLowerCase();
        revealLetter(letter);
      } else if (keyCode >= 97 && keyCode <= 122) {
        // lower case letters
        transitionToInteractiveScreen();
        resetCodex();

        const letter = String.fromCharCode(keyCode);
        revealLetter(letter);
      } else if (keyCode === 32) {
        // space
        transitionToInteractiveScreen();
        resetCodex();
      } else if (keyCode === 27) {
        // escape
        transitionToTitleScreen();
        resetCodex();
      }
      nextUpdateAutoTime = 0;
  } else if (currentState === STATE.INFO) {
    if (keyCode === 27) {
      // escape
      transitionToTitleScreen();
      resetCodex();
    }
  }
}

function onDOMContentLoaded() {
  // select elements
  $codexContainer = document.querySelector('#codex-container');
  $codexInstructions = document.querySelector('#codex-instructions');
  $enterButton = document.querySelector('#enter-button');
  $infoButton = document.querySelector('#codex-info-button');
  $infoExitButton = document.querySelector('#info-exit-button');
  $screenTitle = document.querySelector('#screen-title');
  $screenCodex = document.querySelector('#screen-codex');
  $screenInfo = document.querySelector('#screen-info');
  $volumeButton = document.querySelector('#codex-volume-button');

  SCREENS.push($screenTitle);
  SCREENS.push($screenCodex);
  SCREENS.push($screenInfo);

  // setup events
  document.addEventListener('keydown', onDocumentKeydown);
  document.addEventListener('mousemove', onMouseMove);
  $enterButton.addEventListener('click', onClickEnterButton);
  $infoButton.addEventListener('click', onClickInfoButton);
  $infoExitButton.addEventListener('click', onClickInfoExitButton);
  $volumeButton.addEventListener('click', onClickVolumeButton);

  // connect gain to audio context
  AUDIO_GAIN_NODE.connect(AUDIO_CONTEXT.destination);

  // load audio
  loadAudioFiles();

  // generate codex
  generateCodexHtml($codexContainer);

  // initialize title screen
  transitionToTitleScreen();
}

function onMouseMove(ev) {
  if (currentState === STATE.AUTO) {
    const clientX = ev.clientX;
    const clientY = ev.clientY;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const midHeight = windowHeight / 2;
    const distanceFromMidHeight = midHeight - clientY;
    const normalizeDistance =  (2 - 0.25) * ((distanceFromMidHeight - (-midHeight)) / (midHeight - (-midHeight))) + 0.25;
    let playbackRate = normalizeDistance;

    for (let i = 0; i < currentAudio.length; i++) {
      currentAudio[i].playbackRate.value = playbackRate;
    }
  }
}

function revealLetter (letter) {
  // fade out instructions if visible
  if ($codexInstructions.style.opacity !== '0') {
    $codexInstructions.style.opacity = '0';
  }

  let doPlayAudio = false;
  for (let i = 0; i < codex.length; i++) {
      // line
      const codexLine = codex[i];
      for (let j = 0; j < codexLine.length; j++) {
          // letter
          const codexLetter = codexLine[j];
          if (codexLetter.letter === letter) {
              doPlayAudio = true;
              codexLetter.element.style.opacity = 1;
              codexLetter.visible = true;
          }
      }
  }
  if (doPlayAudio) {
    playLetterAudio(letter);
  }
}

function resetCodex () {
  // reset all visiblity in codex object
  for (let i = 0; i < codex.length; i++) {
      // line
      const codexLine = codex[i];
      for (let j = 0; j < codexLine.length; j++) {
          // letter
          const codexLetter = codexLine[j];
          codexLetter.element.style.opacity = 0;
          codexLetter.visible = false;
      }
  }

  // fade out all playing audio and stop
  fadeGain(0, .5);
  setTimeout(function () {
    for (let i = 0; i < currentAudio.length; i++) {
      const audioSource = currentAudio[i];
      audioSource.disconnect();
    }
    // reset gain if not muted
    if (isAudioMuted === false) {
      fadeGain(1, .5);
    }
    currentAudio = [];
  }, 2100);
}

function playLetterAudio(letter) {
    const $letterAudio = AUDIO_FILES[letter];
    if ($letterAudio === undefined) {
        return;
    }
    var source = AUDIO_CONTEXT.createBufferSource();
    currentAudio.push(source);
    var request = new XMLHttpRequest();
    request.open('GET', $letterAudio.src, true);
    request.responseType = 'arraybuffer';
    request.onload = function () { 
      AUDIO_CONTEXT.decodeAudioData(
        request.response, 
        function(buffer) {
          source.buffer = buffer;
          source.connect(AUDIO_GAIN_NODE);
          source.loop = false;
          source.start(0);
        },
        function(e) { 
          console.log("Error with decoding audio data" + e.err); 
        }
      );
    }
    request.send()
}

function transitionToAutoScreen() {
  currentState = STATE.AUTO;
  lastUpdateAutoTime = new Date().getTime();
  nextUpdateAutoTime = 0;
  resetCodex();
  fadeGain(1, .5);
}

function transitionToInfoScreen() {
  currentState = STATE.INFO;
  fadeOutAllScreens();
  fadeInScreen($screenInfo);
  resetCodex();
}

function transitionToInteractiveScreen() {
  currentState = STATE.INTERACTIVE;
  fadeOutAllScreens();
  fadeInScreen($screenCodex);
  lastUpdateTime = lastKeypressTime = new Date().getTime();
  fadeGain(1, .5);
  update();
}

function transitionToTitleScreen() {
  currentState = STATE.TITLE;
  fadeOutAllScreens();
  fadeInScreen($screenTitle);
  resetCodex();
}

function update() {
  const now = new Date().getTime();
  const delta = now - lastUpdateTime;
  lastUpdateTime = now;

  // switch to auto state when a key hasn't been pressed
  // in 10 seconds
  if (currentState === STATE.INTERACTIVE && 
    now - lastKeypressTime > TIME_TIL_AUTO
  ) {
    transitionToAutoScreen();
  }

  if (currentState === STATE.AUTO && 
    lastUpdateTime - lastUpdateAutoTime > nextUpdateAutoTime
  ) {
    updateAuto();
    lastUpdateAutoTime = now;
  }

  // if we're still in interactive or auto mode, keep updating
  if (currentState === STATE.INTERACTIVE || currentState === STATE.AUTO) {
    requestAnimationFrame(update);
  }
}

function updateAuto() {
  const keyCode = getRandomKeyCode();
  const letter = String.fromCharCode(keyCode).toLowerCase();
  revealLetter(letter);

  // fade out letter
  setTimeout(function () {
    hideLetter(letter);
  }, getFadeoutLetterTime());

  // randomly reveal a letter every 2-6 seconds
  nextUpdateAutoTime = getNextUpdateAutoTime();
}

// on load
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

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