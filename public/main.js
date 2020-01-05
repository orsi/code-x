const AUDIO_FILES = {};
const FADEOUT_LETTERS_INTERVALS = {};
const MAX_FADEOUT_LETTER_TIME = 8000;
const MIN_FADEOUT_LETTER_TIME = 5000;
const MAX_NEXT_UPDATE_AUTO_TIME = 5000;
const MIN_NEXT_UPDATE_AUTO_TIME = 2000;
const RESOURCE_PATH = '/res/';
const STATE = {
  TITLE: 0,
  INTERACTIVE: 1,
  AUTO: 2,
  INFO: 3
};
const TIME_TIL_AUTO = 15000;
const TIME_TIL_FADEOUT_LETTER = 5000;
let $codexContainer;
let $codexInstructions;
let $enterButton;
let $screenTitle;
let $screenCodex;
let currentAudio = [];
let currentState = STATE.TITLE;
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

function getFadeoutLetterTime() {
  const nextTime = Math.floor(
    Math.random() * (MAX_FADEOUT_LETTER_TIME - MIN_FADEOUT_LETTER_TIME)
  ) + MIN_FADEOUT_LETTER_TIME;
  console.log('next fadeout time', nextTime);
  return nextTime;
}

function getNextUpdateAutoTime() {
  const nextTime = Math.floor(
    Math.random() * (MAX_NEXT_UPDATE_AUTO_TIME - MIN_NEXT_UPDATE_AUTO_TIME)
  ) + MIN_NEXT_UPDATE_AUTO_TIME;
  console.log('next auto time', nextTime);
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

function onDocumentKeydown(ev) {
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
      if ((keyCode >= 65 && keyCode <= 90) ||
        (keyCode >= 97 && keyCode <= 122) ||
        keyCode === 32
      ) {
        // upper case letters
        transitionToInteractiveScreen();
        resetCodex();
      } else if (keyCode === 27) {
        // escape
        transitionToTitleScreen();
        resetCodex();
      }
      nextUpdateAutoTime = 0;
  }
}

function onDOMContentLoaded() {
    $screenTitle = document.querySelector('#screen-title');
    $screenCodex = document.querySelector('#screen-codex');
    $enterButton = document.querySelector('#enter-button');
    $enterButton.addEventListener('click', onClickEnterButton)
    $codexContainer = document.querySelector('#codex-container');
    $codexInstructions = document.querySelector('#codex-instructions');

    // load audio
    loadAudioFiles();

    // generate codex
    generateCodexHtml($codexContainer);

    // initialize title screen
    $screenCodex.classList.add('fade-out');
    $screenCodex.classList.add('fading-out');
    $screenCodex.classList.remove('current-state');
    $screenTitle.classList.add('fade-in');
    $screenTitle.classList.add('fading-in');
    $screenTitle.classList.add('current-state');
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

  // fade out all playing audio and reset
  for (let i = 0; i < currentAudio.length; i++) {
    const audio = currentAudio[i];
    const fadeOutIntervals = {};
    if (audio.ended === false) {
      fadeOutIntervals[i] = setInterval(function () {
        if (audio.volume > 0) {
          audio.volume -= 0.02;
      }
        if (audio.volume <= 0.02) {
          audio.volume = 0;
          clearInterval(fadeOutIntervals[i]);
        }
      }, 50);
    }
  }
  currentAudio = [];
}

function playLetterAudio(letter) {
    const $letterAudio = AUDIO_FILES[letter];
    if ($letterAudio === undefined) {
        return;
    }
    // create new audio so same letter can play multiple time
    const clonedAudio = new Audio($letterAudio.src);
    currentAudio.push(clonedAudio);
    clonedAudio.play();
}

function transitionToAutoScreen() {
  currentState = STATE.AUTO;
  lastUpdateAutoTime = new Date().getTime();
  nextUpdateAutoTime = 0;
}

function transitionToInteractiveScreen() {
  currentState = STATE.INTERACTIVE;
    $screenTitle.classList.add('fade-out');
    $screenTitle.classList.add('fading-out');
    $screenTitle.classList.remove('current-state');
    $screenCodex.classList.add('fade-in');
    $screenCodex.classList.add('fading-in');
    $screenCodex.classList.add('current-state');

    lastUpdateTime = lastKeypressTime = new Date().getTime();
    update();
}

function transitionToTitleScreen() {
  currentState = STATE.TITLE;
    $screenCodex.classList.add('fade-out');
    $screenCodex.classList.add('fading-out');
    $screenCodex.classList.remove('current-state');
    $screenTitle.classList.add('fade-in');
    $screenTitle.classList.add('fading-in');
    $screenTitle.classList.add('current-state');
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

  // if we're still in interactive or auto mode, keepp updating
  if (currentState === STATE.INTERACTIVE || currentState === STATE.AUTO) {
    requestAnimationFrame(update);
  }
}

function updateAuto() {
  // pick a random letter and reveal
  // key codes between 65 and 90 are upper case
  const keyCode = Math.floor(Math.random() * 25) + 65;
  const letter = String.fromCharCode(keyCode).toLowerCase();
  revealLetter(letter);

  // fade out letter
  setTimeout(function () {
    hideLetter(letter);
  }, getFadeoutLetterTime());

  // randomly reveal a letter every 2-6 seconds
  nextUpdateAutoTime = getNextUpdateAutoTime();
}

// setup events
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('keydown', onDocumentKeydown);


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