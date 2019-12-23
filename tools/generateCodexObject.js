const codex = `while staring at the computer the
abecedarian catalogued every key
her restless fingers caressed the
machine coaxing morphemes to dance
across the surface of the screen
like animated insects on a hot
summer afternoon moving quickly
from letter to letter she created
intricate visual patterns as
vowels and consonants shifted
positions in a japing lattice a b
c became x y z while reading was a
road a car a mnemonic mechanism
driving towards form and meaning
up down left to right her eye
scanned then trapped the lazy
graphemes as if they were dazzling
quartz crystals crows in mad
flight or dark passage ways
through an ancient egyptian sphinx
slowly gathering clues to familiar
words and images she probed the
husk of a paragraph housing the
fossilised body of an involuted
codex`;

const data = [[]];
let lineCount = 0;
for (let i = 0; i < codex.length; i++) {
  let line = data[lineCount];
  if (codex[i].charCodeAt() === 10) {
    data.push([]);
    lineCount++;
    continue;
  }

  line.push({
    color: 'white',
    letter: codex[i],
    visible: false,
    element: null
  });
}

const fs = require('fs');
try {
  fs.writeFileSync('./codex.json', JSON.stringify(data, null, 2))
} catch (err) {
  console.error(err)
}
