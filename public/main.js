const audioFiles = {};
const resourcePath = '/res/';
const STATE = {
    TITLE: 0,
    CODEX: 1,
    INFO: 2
};
let $codexContainer;
let $enterButton;
let $screenTitle;
let $screenCodex;
let currentState = STATE.TITLE;

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
        audioFiles[letter] = new Audio(`${resourcePath}${letter.toUpperCase()}.mp3`);
    }
}

function onClickEnterButton(ev) {
    transitionToCodexScreen();
}

function onDocumentKeypress(ev) {
    if (currentState === STATE.CODEX) {
        if (ev.charCode >= 65 && ev.charCode <= 90) {
            // upper case letters
            const letter = String.fromCharCode(ev.charCode).toLowerCase();
            revealLetters(letter);
        } else if (ev.charCode >= 97 && ev.charCode <= 122) {
            // lower case letters
            const letter = String.fromCharCode(ev.charCode);
            revealLetters(letter);
        } else if (ev.charCode === 32) {
            // space
            resetCodex();
        }
    }
}

function onDOMContentLoaded() {
    $screenTitle = document.querySelector('#screen-title');
    $screenCodex = document.querySelector('#screen-codex');
    $enterButton = document.querySelector('#enter-button');
    $enterButton.addEventListener('click', onClickEnterButton)
    $codexContainer = document.querySelector('#codex-container');

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

function revealLetters (letter) {
    for (let i = 0; i < codex.length; i++) {
        // line
        const codexLine = codex[i];
        for (let j = 0; j < codexLine.length; j++) {
            // letter
            const codexLetter = codexLine[j];
            if (codexLetter.letter === letter && !codexLetter.visible) {
                playLetterAudio(codexLetter.letter);
                codexLetter.element.style.opacity = 1;
                codexLetter.visible = true;
            }
        }
    }
}

function resetCodex () {
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
}

function playLetterAudio(letter) {
    const letterAudio = audioFiles[letter];
    if (letterAudio === undefined) {
        return;
    }
    letterAudio.play();
}

function transitionToCodexScreen() {
    $screenTitle.classList.add('fade-out');
    $screenTitle.classList.add('fading-out');
    $screenTitle.classList.remove('current-state');
    $screenCodex.classList.add('fade-in');
    $screenCodex.classList.add('fading-in');
    $screenCodex.classList.add('current-state');
    currentState = STATE.CODEX;
}

function transitionToTitleScreen() {
    $screenCodex.classList.add('fade-out');
    $screenCodex.classList.add('fading-out');
    $screenCodex.classList.remove('current-state');
    $screenTitle.classList.add('fade-in');
    $screenTitle.classList.add('fading-in');
    $screenTitle.classList.add('current-state');
    currentState = STATE.TITLE;
}

// setup events
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('keypress', onDocumentKeypress);


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