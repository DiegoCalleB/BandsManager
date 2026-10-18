import type { GuiaSeoEn } from './tipos.js';

export const GUIAS_DIRECTO_EN: GuiaSeoEn[] = [
  {
    slug: 'how-to-make-a-setlist',
    slugEs: 'como-hacer-un-setlist',
    titulo: 'How to Make a Setlist: Structure, Order and Free Templates',
    h1: 'How to make a setlist that works',
    descripcion: 'What a setlist is and how to build one: work out the time, shape the show in five stretches, order by key and tuning, and copy three templates.',
    intro: 'A setlist is the ordered list of songs for a show, with the transitions and often the key and tuning of each one. Most of them fall apart in the middle: a good opener, a good closer and, between them, a playlist with no thread. The fix is not more songs, it is shape.',
    resumen: ['Start from the real length of your slot, not from the songs: almost every band overloads the set.', 'Shape the set in five stretches (hook, lift, breather, climb and closer), then order by key and tuning.', 'Bring a one-page sheet on stage, send the setlist to the sound engineer early and treat it as a draft until soundcheck.'],
    secciones: [
      {
        h2: 'Start with the time, not the songs',
        parrafos: ['Before opening any tool, write down two numbers: the minutes you have on stage and the average length of your songs. Then count half a minute of changeover per song and subtract five minutes of margin for surprises: a broken string, a request from the crowd, a dead mic.', 'The sum is simple: (slot minutes minus 5) divided by (average song length plus 0.5). It almost always gives you fewer songs than you thought.'],
        tablas: [{ titulo: 'How many songs fit in your slot', cabeceras: ['Slot', '4-minute songs', '3-minute songs'], filas: [['30 min', '5', '7'], ['45 min', '8', '11'], ['60 min', '12', '15'], ['75 min', '15', '20'], ['90 min', '18', '24']] }],
      },
      {
        h2: 'The energy curve in five stretches',
        parrafos: ['A set that works almost always has the same skeleton: it opens with something that hooks, builds, breathes, builds again and closes with something everyone can sing. It is not a magic formula, it is how a room’s attention tires and recovers.'],
        figura: 'curva-setlist',
        tablas: [{ titulo: 'The five stretches of a twelve-song set', cabeceras: ['Stretch', 'Songs', 'What you are after'], filas: [['Hook', '1 and 2', 'Grab them in the first 20 seconds. A mid or up-tempo song; save the deep slow one.'], ['Lift', '3 to 5', 'Raise the energy with shorter songs and big choruses. This is where casual listeners decide whether to stay.'], ['Breather', '6 and 7', 'A slower or stripped-back song. Without it, the room runs out of steam around song nine.'], ['Climb', '8 to 10', 'Rebuild the tension with your biggest songs.'], ['Closer', '11 and 12 (and encore)', 'A chorus everyone knows. Nothing experimental at the end.']] }],
        aviso: 'A rule of thumb that tends to work: the best-known song goes second to last, not last. The crowd reaches the peak before the closer and leaves singing the last one, which should be a safe chorus.',
      },
      {
        h2: 'Order by key and tuning',
        parrafos: ['Once the order sounds right, look at it through the band’s eyes. Two drop D songs in a row save a tuning change. Three different capo positions in a row are three moments when the guitarist looks at the neck instead of the crowd. If you can group by tuning without breaking the curve, do it; if not, cover the change with a thirty-second intro or a story.', 'Keys work in a similar way: you do not need theory, you only need to listen to the joins. If two songs in a row sound bad sung at low volume in your living room, move one.'],
        tablas: [{ titulo: 'How each key change sounds', cabeceras: ['Move', 'Effect', 'When to use it'], filas: [['A fourth or fifth up', 'Sounds like building', 'To climb after the breather'], ['A tone down', 'Sounds like easing off', 'Right before the slow song'], ['Same key twice', 'Flat', 'Only if the tempo changes a lot'], ['A semitone', 'Sounds like a mistake', 'Avoid it unless it is on purpose']] }],
      },
      {
        h2: 'Plan the transitions, not just the songs',
        parrafos: ['Most setlists list twelve songs and zero transitions. On stage, every gap turns into a question. Decide before you go on:'],
        lista: ['Which songs run straight into each other, with a direct count-in from the last note.', 'Which need a bridge: a drum fill, a keyboard pad, a tuning moment.', 'Which call for a story or a line from the singer.', 'Where you need a real break: water, a guitar swap, talking to the crowd.'],
        aviso: 'Write the transitions as separate lines in the setlist. "Switch to acoustic" is part of the show just as much as the song before it.',
      },
      {
        h2: 'A one-page sheet for the stage',
        parrafos: ['The version that ends up taped to the floor in front of the drummer should fit on one page, be readable under stage lights from two metres away and carry only the essentials: title, key and tuning. Lyrics and chords go on a tablet or phone, in a view built for the stage, not on paper.'],
      },
      {
        h2: 'Send it to the sound engineer early',
        parrafos: ['The thing that most improves your live sound is handing the engineer, the day before, a setlist with durations and the songs that need something special: a switch to acoustic, a harmony vocal, a click, a sample. If the venue has an in-house engineer who has never heard you, add the stage plot: they will assume you do not have one.', 'A link beats a PDF: the PDF is out of date the moment you change the order.'],
      },
      {
        h2: 'Three templates to copy',
        parrafos: ['These are skeletons, not sentences: swap the song types for your own and adjust the length to your slot.'],
        tablas: [
          { titulo: '45-minute support slot', cabeceras: ['#', 'Song', 'Role'], filas: [['1', 'Your best opener', 'Hook'], ['2', 'Your second best song', 'Hook'], ['3', 'New or lesser-known song', 'Lift'], ['4', 'Best-known song', 'Peak'], ['5', 'Slow or stripped back', 'Breather'], ['6', 'Building song', 'Climb'], ['7', 'The one you want remembered', 'Closer']] },
          { titulo: '75-minute headline show', cabeceras: ['Block', 'Songs', 'Role'], filas: [['Opening', '1 to 3', 'Hook and lift'], ['First third', '4 to 7', 'New material with the big choruses'], ['Breather', '8 and 9', 'A slow song and an acoustic one'], ['Climb', '10 to 13', 'Your best-known songs'], ['Closer', '14 and 15', 'A known chorus and an encore']] },
          { titulo: '30-minute festival set', cabeceras: ['#', 'Idea'], filas: [['1 to 2', 'Open strong and do not talk: the crowd is passing through'], ['3 to 4', 'Lift with your most recognisable songs'], ['5', 'A single short breather'], ['6 to 7', 'Close with your best-known and keep one in reserve']] },
        ],
      },
      {
        h2: 'How to do it in BandManager',
        lista: ['Save each song with its key, BPM and length in your repertoire.', 'Build the setlist by dragging songs and check the set’s energy map to see whether the curve breathes.', 'Export the setlist as a PDF to print it and take it on stage.', 'Share it as text with the rest of the band and use stage mode, with lyrics, chords and transposition.'],
      },
      {
        h2: 'Treat it as a draft until soundcheck',
        parrafos: ['The best bands rebuild the last three songs after soundcheck, depending on the room. If it is small and the crowd is older, they cut the loudest closer and promote the singalong. If the crowd is young and standing, the opposite. A setlist is a plan, not a contract: build it to be edited, not to be preserved.'],
      },
    ],
    faq: [
      { q: 'How many songs fit in an hour?', a: 'Between twelve and fifteen, depending on whether each runs three or four minutes, counting half a minute of changeover and five minutes of margin.' },
      { q: 'Which song goes first and which last?', a: 'First, something that hooks within twenty seconds, not necessarily your best song. Last, a chorus everyone knows; the best-known song usually goes just before.' },
      { q: 'Should I change the setlist for each venue?', a: 'Yes. A standing room wants more energy and a theatre allows more nuance. Keep a base version and adjust the last three songs after soundcheck.' },
      { q: 'How many covers should I include?', a: 'Two or three, placed where the room can let loose, help you connect. Keep them under a third of the set.' },
    ],
    relacionadas: ['how-to-run-band-rehearsals', 'how-to-run-a-soundcheck', 'how-to-promote-a-gig'],
    cta: { titulo: 'Setlists that order themselves', texto: 'In BandManager you build your repertoire, see the energy curve and export the setlist as a PDF.', boton: 'Try BandManager free' },
  },

  {
    slug: 'tour-day-sheet',
    slugEs: 'hoja-de-ruta-de-gira',
    titulo: 'Tour Day Sheet Template: What to Include for a Gig or Tour',
    h1: 'Tour day sheet: what to include',
    descripcion: 'How to prepare the day sheet for a show or a tour: times, contacts, load-in, sound and accommodation. With a checklist.',
    intro: 'The day sheet is the document that prevents phone calls at two in the morning. Every band member should be able to open it and know what to do and when.',
    resumen: ['One sheet per day with venue, contacts, times, food and accommodation.', 'On tour, add realistic travel times and one person in charge of each date.', 'Share it in a live document, not a PDF lost in the group chat.'],
    secciones: [
      {
        h2: 'What a one-day sheet includes',
        lista: ['Venue and address, with a map link and the load-in access.', 'Venue contact and the sound engineer’s phone number.', 'Arrival, load-in, soundcheck, doors and stage times.', 'Set length and the running order if there are other bands.', 'Dressing room, food and where to sleep.', 'What each person brings: backline, instruments and cables.'],
      },
      {
        h2: 'For a multi-date tour',
        pasos: ['One sheet per day with the same sections, ordered by date.', 'Realistic travel times between cities, with a margin for surprises.', 'Accommodation and van parking confirmed in advance.', 'A planned budget per date: fuel, tolls, per diems.', 'One person in charge of each date who handles the venue contact.'],
      },
      {
        h2: 'How to share it',
        parrafos: ['A shared document everyone sees up to date beats a PDF going around the group chat. If a soundcheck time changes, it must change for everyone at once.'],
      },
    ],
    faq: [
      { q: 'What is the difference between a rider and a day sheet?', a: 'The rider says what you need (sound, backline, hospitality). The day sheet says when and where everything happens that day.' },
      { q: 'Who writes it?', a: 'Whoever manages the band, with the information the venue gives. Everyone should read it before leaving.' },
      { q: 'When should I send it?', a: 'Early enough to fix mistakes: about three days before a single date, and weeks before once a tour is locked.' },
    ],
    relacionadas: ['/en/technical-rider-template', 'hospitality-rider', 'how-to-run-band-rehearsals'],
    cta: { titulo: 'Tour and calendar in one place', texto: 'BandManager brings together your shows, times and contacts so the whole band sees the same thing.', boton: 'Try BandManager free' },
  },
  {
    slug: 'hospitality-rider',
    slugEs: 'rider-de-hospitalidad',
    titulo: 'Hospitality Rider for Bands: What to Ask a Venue (and What Not)',
    h1: 'Hospitality rider: what to ask a venue for',
    descripcion: 'What a hospitality rider is, what an independent band can reasonably ask for and how to present it without sounding demanding.',
    intro: 'The hospitality rider lists what you need to be comfortable during the show: dressing room, food, drinks and logistics. For an independent band, less is more.',
    resumen: ['Ask only for the basics: dressing room, water, food, parking and guest list.', 'Keep it apart from the technical rider and mark what is essential.', 'Ask first what the venue provides: many already have it covered.'],
    secciones: [
      {
        h2: 'What is usually requested',
        lista: ['A dressing room with a key, or a safe space for the instruments.', 'Enough water for everyone, in the dressing room and on stage.', 'Food or meals for the crew, or an agreed amount.', 'Parking close by for the van and access for loading.', 'Guest list spots, with a clear number.'],
      },
      {
        h2: 'What not to ask for',
        parrafos: ['Things the venue cannot deliver or that look like whims: specific brands, exaggerated quantities. In a small room, ask for the basics. Anything else is appreciated more when it is offered than when it is demanded.'],
      },
      {
        h2: 'How to present it',
        pasos: ['Keep it apart from the technical rider: the sound engineer does not need to read about the food.', 'Mark what is essential and what is nice to have.', 'Ask first what the venue provides: many already have it covered.', 'Confirm it in writing in the day sheet.'],
      },
    ],
    faq: [
      { q: 'Is a hospitality rider required?', a: 'No, but it helps avoid misunderstandings. A few clear lines are enough.' },
      { q: 'Is it negotiable?', a: 'Yes. It is common to adapt it to each venue’s or festival’s budget and conditions.' },
      { q: 'Where do I include it?', a: 'In a section separate from the technical rider and the press kit, or as its own document.' },
    ],
    relacionadas: ['/en/technical-rider-template', 'tour-day-sheet', 'gig-contract-checklist'],
    cta: { titulo: 'All your documents at hand', texto: 'Keep your rider and press kit in BandManager and share them with a link in every proposal.', boton: 'Try BandManager free' },
  },
  {
    slug: 'how-to-run-band-rehearsals',
    slugEs: 'como-organizar-ensayos',
    titulo: 'How to Run Band Rehearsals That Are Actually Productive',
    h1: 'How to run band rehearsals',
    descripcion: 'How to plan rehearsals that get results: frequency, a goal for each session, a shared calendar and how to stop wasting time.',
    intro: 'A rehearsal with no goal turns into a chat with noise. With a simple structure, two hours get more done than four with no plan.',
    resumen: ['One goal per rehearsal, written down at the start and reviewed at the end.', 'Structure: setup, warm-up, work, full run-through and a plan for the next one.', 'Two weeks before a show, move from working on songs to working on the live set.'],
    secciones: [
      {
        h2: 'One goal per rehearsal',
        parrafos: ['Before you start, decide what you want to achieve: lock a new song, polish the transitions, prepare a show. Write it down at the start and review it at the end.'],
      },
      {
        h2: 'A structure that works',
        pasos: ['Ten minutes of setup and tuning.', 'Warm up with a song you already know well.', 'Work on the session’s goal.', 'One full run of the set, without stopping, as if it were live.', 'Five minutes to decide what the next rehearsal will cover.'],
      },
      {
        h2: 'Calendar and attendance',
        lista: ['Fix a recurring day and time, and respect it.', 'Confirm attendance ahead of time: if a key member is missing, better to move the rehearsal than to do it half-way.', 'Share the repertoire and the recording of the last rehearsal so people practise at home.'],
      },
      {
        h2: 'Before a show',
        parrafos: ['Two weeks out, move from working on songs to working on the live show: the full set, the time between songs and the stage logistics. Record one run and listen back: you hear things you do not notice while playing.'],
      },
    ],
    faq: [
      { q: 'How long should a rehearsal last?', a: 'Two to three hours is what you can sustain with quality. Beyond that, concentration drops.' },
      { q: 'How often per week?', a: 'Once a week is usual for bands that juggle jobs; step it up before important shows.' },
      { q: 'What if we cannot all make it?', a: 'Rehearse by sections (rhythm, harmonies) and book one full rehearsal before each date.' },
    ],
    relacionadas: ['how-to-make-a-setlist', 'tour-day-sheet', 'how-to-promote-a-gig'],
    cta: { titulo: 'Shared rehearsals and calendar', texto: 'BandManager manages rehearsals, attendance and repertoire for the whole band.', boton: 'Try BandManager free' },
  },
  {
    slug: 'how-to-promote-a-gig',
    slugEs: 'promocionar-un-concierto',
    titulo: 'How to Promote a Gig: A 4-Week Plan for Your Band',
    h1: 'How to promote a gig',
    descripcion: 'A week-by-week promotion plan for a gig: poster, socials, trackable links, local press and how to fill the room.',
    intro: 'Filling a room does not depend on the venue alone. With four weeks, a clear poster and a link you can share, you already have a campaign.',
    resumen: ['Four weeks are enough: base, noise, countdown and measurement.', 'One single page for the show to share on every channel.', 'A different link per channel tells you which one brings the most people.'],
    secciones: [
      {
        h2: 'Week 4: set the base',
        pasos: ['Lock the date, time, price and where to buy tickets.', 'Design a readable poster: venue, date and time at first glance.', 'Create a single page or link for the show to share on every channel.'],
      },
      {
        h2: 'Weeks 3 and 2: start making noise',
        lista: ['Announce the date on your socials with a short live clip, not just the poster.', 'Email local press and blogs with a brief note and the link to the show.', 'Ask the venue to share it and tag the band.', 'Invite people in person: word of mouth still fills rooms best.'],
      },
      {
        h2: 'Last week: remind and count down',
        parrafos: ['Post a countdown with different content each day: a rehearsal, a song, the guest list. Send your fans an email with the date and the ticket link. On the day, remind people of the time and the address.'],
      },
      {
        h2: 'Measure what works',
        parrafos: ['Use a different link for each channel (Instagram, email, poster) and see which one brings more clicks to tickets. Next time, put your effort into what worked.'],
      },
    ],
    faq: [
      { q: 'How far ahead should I announce a gig?', a: 'Three to four weeks for a local venue. If there are advance tickets or it is a festival, earlier.' },
      { q: 'Does paid social advertising work?', a: 'It can, with a tight local audience and a small budget. First exhaust the free options: your mailing list and your socials.' },
      { q: 'What goes on the poster?', a: 'Band name, venue, date, time and price. Everything else is secondary.' },
    ],
    relacionadas: ['how-to-collect-fan-emails', 'how-to-make-a-setlist', 'how-to-get-gigs'],
    cta: { titulo: 'A page for every show', texto: 'BandManager creates the public page for the show, the poster and trackable short links.', boton: 'Try BandManager free' },
  },
];
