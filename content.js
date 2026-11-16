/* Everything personal on the site is in this file.

   - Change the text between the quotes.
   - Anything in [square brackets] is filler: replace it with your own words.
   - Write {name} anywhere and it becomes her nickname, in italics.
   - Keep the commas and quotes as they are.

   Photos and songs come from the "Us" folder. After changing anything in
   "Us", run:  python tools/prepare_media.py                                  */

window.SITE = {
  name: "My Love",                // her nickname
  from: "[Your name]",            // how you sign off
  date: "[Our monthsary date]",   // shown at the very end ("" to hide)

  /* The first screen: one button, before anything starts */
  start: {
    button: "Click Me"
  },

  /* The opening screen with the heart. The words appear after the heart has played once. */
  welcome: {
    eyebrow: "One month",
    greeting: "Hey, {name}!",
    message: "I made something for you: a little collection of us. Take your time with it.",
    button: "Open"
  },

  /* One chapter for each time we met, in order (1st, 2nd, ...).
     - label:    small line above the title
     - title:    the chapter's title
     - text:     how you felt (empty line = new paragraph)
     - song:     the song's name, shown in the music panel
     - captions: one line per photo ("" for no caption)
     The photos and the song themselves come from Us/1st, Us/2nd, ...        */
  chapters: [
    {
      label: "The 1st time",
      title: "[A title for our 1st hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "probably - kanegi.",
      captions: {
        "her1.jpg": "[caption]",
        "her2.jpg": "[caption]",
        "her3.jpg": "[caption]",
        "her4.jpg": "[caption]",
        "her6.jpg": "[caption]",
        "her7.jpg": "[caption]",
        "her8.jpg": "[caption]",
        "together1.jpg": "[caption]"
      }
    },
    {
      label: "The 2nd time",
      title: "[A title for our 2nd hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "Fallin' All In You - Shawn Mendes",
      captions: {
        "her1.jpg": "[caption]",
        "her2.jpg": "[caption]",
        "her3.jpg": "[caption]",
        "her4.jpg": "[caption]"
      }
    },
    {
      label: "The 3rd time",
      title: "[A title for our 3rd hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "I Like Me Better - Lauv",
      captions: {
        "her1.jpg": "[caption]",
        "her3.jpg": "[caption]",
        "her4.jpg": "[caption]",
        "together1.jpg": "[caption]",
        "together2.jpg": "[caption]"
      }
    },
    {
      label: "The 4th time",
      title: "[A title for our 4th hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "me & u - Luke Chiang, HILLARI",
      captions: {
        "her2.jpg": "[caption]",
        "her4.jpg": "[caption]",
        "her6.jpg": "[caption]",
        "together1.jpg": "[caption]",
        "together2.jpg": "[caption]"
      }
    },
    {
      label: "The 5th time",
      title: "[A title for our 5th hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "Infatuated - Rangga Jones",
      captions: {
        "her1.jpg": "[caption]",
        "her2.jpg": "[caption]",
        "together1.jpg": "[caption]",
        "together2.jpg": "[caption]",
        "together3.jpg": "[caption]"
      }
    },
    {
      label: "The 6th time",
      title: "[A title for our 6th hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "Magic - WIM",
      captions: {
        "together1.jpg": "[caption]",
        "together2.jpg": "[caption]"
      }
    },
    {
      label: "The 7th time",
      title: "[A title for our 7th hangout]",
      text: `
[A paragraph about how you felt this time. Leave an empty line between paragraphs.]
`,
      song: "Duello - Christian Kuria",
      captions: {
        "her1.jpg": "[caption]",
        "together1.jpg": "[caption]",
        "together2.jpg": "[caption]",
        "together3.jpg": "[caption]"
      }
    }
  ],

  /* The "Next" buttons at the end of each page */
  pages: {
    next: "Next",             // big button at the end of each page
    back: "Back",             // small link under it
    finale: "One last thing"  // what the last Next button leads to
  },

  /* The bouquet finale: the flowers grow, a letter rises out of them, then the last message */
  flowers: {
    caption: "For you, {name}.",
    song: "UNDERSTAND - keshi"   // the song in media/song.mp3
  },

  /* The letter. Paste it between the backticks ( ` ). Empty line = new paragraph. */
  letter: {
    prompt: "Tap the letter",
    close: "Close the letter",
    again: "Read the letter again",   // link under the last message ("" to hide)
    greeting: "{name},",
    body: `
[This is where your letter goes. Write it the way you'd talk to her: it doesn't need to be long or perfect, it just needs to be yours.]

[Leave an empty line between paragraphs and the site will space them out for you.]

[A final paragraph to see how the ending sits.]
`,
    signoff: "Always yours,"          // your name is added underneath
  },

  /* The last message, shown after she closes the letter */
  closing: {
    eyebrow: "One last thing",
    message: "Happy first monthsary, {name}. Here's to all the memories we have yet to make.",
    signoff: "Love,"
  },

  /* Music */
  music: {
    volume: 0.05,      // starting volume, 0 to 1
    fade: 3           // seconds for one song to fade into the next
  }
};
