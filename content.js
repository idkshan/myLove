/* Everything personal on the site is in this file.

   - Change the text between the quotes.
   - Anything in [square brackets] is filler: replace it with your own words.
   - Write {name} anywhere and it becomes her nickname, in italics.
   - Keep the commas and quotes as they are.

   Photos and songs come from the "Us" folder. After changing anything in
   "Us", run:  python tools/prepare_media.py                                  */

window.SITE = {
  name: "My Love",                // her nickname
  from: "Shawn",            // how you sign off
  date: "November 17, 2026",   // shown at the very end ("" to hide)

  /* The first screen: one button, before anything starts */
  start: {
    button: "Click Me"
  },

  /* The opening screen with the heart. The words appear after the heart has played once. */
  welcome: {
    eyebrow: "One month",
    greeting: "Hello, {name}!",
    message: `I made something for you: a little
collection of us, filled with photos we've
taken together. I hope you enjoy it!`,
    button: "Open"
  },

  /* One chapter for each time we met, in order (1st, 2nd, ...).
     - label:    small line above the title
     - title:    the chapter's title
     - text:     how you felt (empty line = new paragraph)
     - song:     the song's name, shown in the music panel
     - captions: one line per photo ("" for no caption)*/
  chapters: [
    {
      label: "The 1st time",
      title: "The Beginning",
      text: `
The very first time we met, I remember feeling a mix of nervousness and excitement. I was looking forward to finally seeing you, but at the same time, I couldn't help but feel a little shy because I wasn't sure how things would go. 
Seeing you again after our trip to Tagaytay and all the conversations we had online felt different in the best way possible. It was nice getting to spend time together in person again, having fun, laughing, and getting to know each other just a little more.`,
      song: "probably - kanegi.",
      captions: {
        "her1.jpg": "One of the first pics I took of you.",
        "her2.jpg": "Finally got to meet McQueen.",
        "her3.jpg": "One of my fav photos during the ice skating.",
        "her4.jpg": "What got you staring at me like that huh?",
        "her6.jpg": "When I took this, I really thought you were super cute.",
        "her7.jpg": "I kept staring at you a lot when we were at Chowking.",
        "her8.jpg": "Ty McQueen for giving me a chance to meet her.",
        "together1.jpg": "First photo together. (I look chopped)"
      }
    },
    {
      label: "The 2nd time",
      title: "Your Touch",
      text: `
I was really excited to meet you for the second time, especially since we had already planned to play billiards and do other fun stuff together. We really sucked at billiards, though, HAHAHAHA. But honestly, that made it even more fun because we got to laugh at how bad we were. I also remember wanting to see you try the punching machine, and it was really fun watching you do it. Your McQueen shirt and Crocs were also really cool to me. I genuinely liked them a lot, and I even got to try the crocs on myself. Looking back, I probably should've just stolen them from you. Tsk.

But if there's one thing that stood out to me the most throughout that day, it would have to be holding your hand. Out of everything we did, that little moment meant so much to me. I really liked feeling your touch, and even though we only got to hold hands briefly, it was something I had been looking forward to. There was something so comforting and special about finally being able to hold your hand instead of just imagining what it would feel like. I remember how happy I was during that moment, and honestly, I wish it could have lasted a little longer. It might have seemed like such a small thing, but to me, it was one of the sweetest parts of that day. It made me realize just how much I wanted to be close to you and how much I enjoyed having you beside me.
`,
      song: "Fallin' All In You - Shawn Mendes",
      captions: {
        "her1.jpg": "You really wanted to win huh?",
        "her2.jpg": "I hope this gave you something to remember me by.",
        "her3.jpg": "My fav photo for this meetup.",
        "her4.jpg": "I can never get enough of your touch."
      }
    },
    {
      label: "The 3rd time",
      title: "Cake and Clicky",
      text: `
One of my favorite times I spent with you, especially since we got to make something together. Although, we kinda fucked up the instructions HAHAHAHA. Nevertheless, I still enjoyed every bit of it because I got to experience something new with you. And hey, the cake wasn't so bad in the end!

We also got one of the clicky things you wanted, even though they didn't have the Cinnamoroll one you were hoping for, which was too bad. We also got to watch a movie together, and I managed to get you to somewhat use my jacket, which I secretly really liked. Also, not gonna lie, I kinda put more effort into trying to look good for this meetup HAHAHAHA.`,
      song: "I Like Me Better - Lauv",
      captions: {
        "her1.jpg": "The star of the show.",
        "her3.jpg": "Another pic of you with food. Still look cute tho.",
        "her4.jpg": "Your loud ass clicky.",
        "together1.jpg": "Why do I look so awkward here bruh? You look good tho.",
        "together2.jpg": "I like your smile a lot."
      }
    },
    {
      label: "The 4th time",
      title: "Honest Feelings",
      text: `
So uh, I'm sorry for cooking like shit and serving you some burnt ahh food. But you mf, you made me cook everything while you happily enjoyed munching on your food. No worries, though. I actually liked watching you eat because you kinda resembled a little hamster to me that time, which I found really cute.

We also got to try karaoke together. It was fun singing songs with you, but you mf really tricked me into thinking the room was soundproof by pretending to make noises inside the room when I went to check. You kept laughing while I was completely clueless for a bit HAHAHAHA. But looking back, it was really nice seeing you laugh that much, and I'm glad I got to be part of what made you laugh.

We also got to try bowling, which was really fun. It was nice playing again, especially since we ended up tying in our scores. I did feel a little sore the next day, ngl, but it was definitely worth it.

But honestly, what made that day especially memorable for me was what happened toward the end. When we finally settled somewhere to rest and talk, I kept trying to find the courage to tell you how I felt again. That's also why I kept delaying the time I was supposed to leave HAHAHAHA.

When I finally decided to tell you, I was honestly expecting to get turned down again. I had already prepared myself for that possibility, thinking it would be my last attempt. But I never expected that you would actually feel the same way about me. Hearing you open up about your feelings made me genuinely happy. It was such a relief finally knowing that what I felt wasn't one-sided.

I also got to hold your hand again during our last few hours there. I even got to hug you, even though it was brief. And yes, I know I ran away from your hug that one time, and I'm never going to let myself do that again.

After that, I felt more comfortable expressing how much I liked you because I no longer felt like I had to keep everything to myself. I didn't mind waiting for you to be ready, and I still don't. Just knowing that you felt the same way was already more than enough for me. I want you to know that you don't have to rush anything. I'll gladly take things at your pace because I genuinely want this to work between us. There will always be a place in my heart for you, and I'll be patient until the day you're ready.
`,
      song: "me & u - Luke Chiang, HILLARI",
      captions: {
        "her2.jpg": "You must really like copying me.",
        "her4.jpg": "This photo looked good to me.",
        "her6.jpg": "YOU'RE SO CUTEEEEE.",
        "together1.jpg": "Another good photo of us together.",
        "together2.jpg": "I really wanted to do this photobooth with you. I like how the photos turned out."
      }
    },
    {
      label: "The 5th time",
      title: "The Contract",
      text: `
I was really looking forward to this hangout, especially since you told me you had cut your hair that time. When I finally got to see it, it was very fucking cute, bruh. I loved it so much. I was also really looking forward to spending some private time with just the two of us, where I could simply be close to you without having to worry about anything else.

I wanted to hug you so badly, and I finally got to do it. One thing I definitely didn't expect, though, was the little plan you had prepared for me that day. I never imagined you were planning to make things official, and you even pulled out a whole contract HAHAHAHA. That honestly felt like a dream to me because I finally got to call you my girlfriend. I also finally got to say "I love you" to you without holding back or having to keep those words to myself.

I also got to kiss you that day. Everything felt so surreal, and I honestly couldn't have asked for a more memorable moment. Thank you for choosing me and for making me your boyfriend. I'll treasure that day and everything that led us here. 
`,
      song: "Infatuated - Rangga Jones",
      captions: {
        "her1.jpg": "Reading the reciept but not looking at me tsk.",
        "her2.jpg": "Wonder who is this peeking?",
        "her3.jpg": "Amazing contract with an amazing photo.",
        "together1.jpg": "My fav photo of us together during this hangout.",
        "together2.jpg": "Your cheeks were soft. I love it.",
        "together3.jpg": "Default pose."
      }
    },
    {
      label: "The 6th time",
      title: "Physical Touch",
      text: `
Being with you now that we're finally official gives everything a different feeling. Having the person I love right beside me is honestly one of the best feelings in the world. I loved your kisses and hugs so much, and I wish I could stay in those moments a little longer every time.
Tbh, I might not even be able to last a week without your touch. You're so soft, and I absolutely love it. I already find myself looking forward to the next time I get to hold you close again. I look forward to making even more memories with you, sharing more hugs and kisses, and experiencing all the little things that come with being together.
`,
      song: "Magic - WIM",
      captions: {
        "together1.jpg": "Weird ahh angle.",
        "together2.jpg": "I love this photo of us together."
      }
    },
    {
      label: "The 7th time",
      title: "My Place",
      text: `
I never expected the day would come when you'd be in my room with just the two of us. I really hoped you enjoyed spending time with me that day because I definitely did. Also, mb for the spontaneous meetup with my parents. It was my fault for getting lost in translation with my mom HAHAHAHA. But I hope you enjoyed meeting them, too. Also, mb for all the unexpected side quests we had that day, but hey, at least you got milk tea out of it. But mf, you really left me alone in the car by myself. It's all goods, though HAHAHAHA.

But seriously, I really appreciated you commuting all the way to Laguna just to spend time with me. I know it wasn't exactly a short or easy trip, so it genuinely meant a lot that you made the effort to come all the way here. Thank you for giving me your time and for choosing to spend that day with me.

I'll make sure to visit your area next time so you won't always have to be the one traveling. No matter where we end up going, I'm always happy as long as I get to spend that time with you
`,
      song: "Duello - Christian Kuria",
      captions: {
        "her1.jpg": "Look at this cutie taking pics.",
        "together1.jpg": "Cute photo of us together.",
        "together2.jpg": "Your face looks so kissable.",
        "together3.jpg": "I really loved that I was close to you during the photos we took."
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
I'm not really sure where to start, but I guess I'd like to start by saying I'm sorry. I know these past couple of weeks have been rough for you, and I know I've been a major part of why. I haven't been the best boyfriend, and I'm still learning how to give you the reassurance you need. I always try to find ways to be there for you, especially when you're feeling down or not doing well. But I also understand that it's difficult when I'm not physically there beside you. Despite that, you still manage to stay strong in your own way, and I genuinely admire and respect you for that.

I also know that my personality can be difficult to deal with at times, and I tend to overstimulate you every now and then. I know my actions aren't always the best, and I have my own shortcomings, but I want you to know that I'm willing to work on them and become better for you. I don't want you to think that I'm changing simply because I have to accommodate your needs. I'm doing this because I love you, and I don't mind growing and changing for the person I love most. I will always try to make time for you, even when things get difficult. I will always do my best to be there for you, no matter how complicated things get. Most importantly, I will continue learning how to understand you better because I want to love you in ways that make you feel appreciated, understood, and reassured.

Please don't be too harsh on yourself either. You mean so much to me, and it hurts seeing you beat yourself up, especially when things get tough. You're a much stronger girl than you give yourself credit for. You've been through a lot these past couple of weeks, yet you still manage to keep pushing forward. I know it hasn't been easy, and I know there are times when things feel overwhelming, but I hope you never forget how much you've already overcome. You don't always have to be strong, though. It's okay to have bad days, to feel tired, and to let yourself rest. You don't have to figure everything out on your own. Both of us will eventually get through everything we're dealing with, and I'll be right here beside you every step of the way, regardless of how things turn out.

I also want you to remember that you don't have to be perfect for me to love you. You don't have to hide your feelings or pretend that everything is okay when it isn't. I want to be someone you can comfortably turn to, someone you can share your worries with, and someone who makes even your difficult days a little easier. I may not always get things right, but I promise to keep trying and to never stop learning how to love you better.

I love you, my love. You mean the entire world to me, and I hope I never make you doubt that. I will continue choosing you, loving you, and growing alongside you. I look forward to making more memories with you, whether they're good, bad, silly, or unexpected. I know not every day will be perfect, and we might have our own struggles along the way, but I want to experience all of it with you. My time with you is something I'll always cherish, and I'm grateful for every moment you've shared with me.

Thank you for all the memories you've given me, for all the little things you do, and for allowing me to be part of your life. Thank you for choosing to be with me and for letting me love you. I hope I can continue giving you reasons to smile and making you feel just how special you are to me.

Happy Monthsary, my love! Here's to more months together, more memories, more laughter, more hugs and kisses, and even more little adventures with you. No matter what comes our way, I want us to keep choosing each other and working things out together.

I love you so, so much, my love.
`,
    signoff: "Forever yours,"          // your name is added underneath
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
    fade: 1.5           // seconds for one song to fade into the next
  }
};
