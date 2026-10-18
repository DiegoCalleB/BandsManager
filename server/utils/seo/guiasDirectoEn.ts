import type { GuiaSeoEn } from './tipos.js';

export const GUIAS_DIRECTO_EN: GuiaSeoEn[] = [
  {
    slug: 'how-to-make-a-setlist',
    slugEs: 'como-hacer-un-setlist',
    titulo: 'How to Make a Setlist for a Gig: Order, Energy and Length',
    h1: 'How to make a setlist for a gig',
    descripcion: 'Criteria for ordering the songs of a live set: opener, energy curve, keys, transitions and closer. With steps to build it in one afternoon.',
    intro: 'A good setlist is not your best songs in a row. It is a journey with a start, tension and an ending, fitted to the time you are given.',
    secciones: [
      {
        h2: 'Start with the time you have',
        parrafos: ['Ask how long your slot is and how much changeover there is between acts. Count the real length of each song, plus the time you lose talking and tuning. There is always something to cut, so keep one or two songs in reserve.'],
      },
      {
        h2: 'Draw the energy curve',
        pasos: ['Open with a song that grabs people fast, not necessarily your strongest.', 'Build energy in the first third and win the room’s attention.', 'Place a breather around the middle: a slow song or one with a different dynamic.', 'Rebuild the tension toward the end.', 'Close with the song you want remembered and keep one in reserve for an encore.'],
      },
      {
        h2: 'Take care of the transitions',
        lista: ['Keys: moving between songs in nearby keys sounds more natural.', 'Tempo: avoid abrupt BPM jumps without a pause or a change of mood.', 'Instrument or tuning changes: group them so you do not stop the show every three minutes.'],
      },
      {
        h2: 'Print it and share it',
        parrafos: ['Bring readable copies to the stage, with large type and changes marked, and share the same version with the sound engineer. A setlist with a QR code to your socials turns every show into new followers.'],
      },
    ],
    faq: [
      { q: 'How many songs fit in an hour?', a: 'It depends on average length, but with three to four minute songs and talking between them, usually twelve to fourteen.' },
      { q: 'Should I change the setlist for each venue?', a: 'Yes. A standing room calls for more energy; a theatre allows more nuance. Keep a base version and adjust it.' },
      { q: 'How do I fit in covers?', a: 'Two or three, placed where the crowd can let loose, help you connect. Keep them under a third of the set.' },
    ],
    relacionadas: ['how-to-run-band-rehearsals', 'how-to-promote-a-gig', '/en/technical-rider-template'],
    cta: { titulo: 'Setlists that order themselves', texto: 'In BandManager you build your repertoire, see the energy curve and export the setlist as a PDF with a QR code.', boton: 'Try BandManager free' },
  },
  {
    slug: 'tour-day-sheet',
    slugEs: 'hoja-de-ruta-de-gira',
    titulo: 'Tour Day Sheet Template: What to Include for a Gig or Tour',
    h1: 'Tour day sheet: what to include',
    descripcion: 'How to prepare the day sheet for a show or a tour: times, contacts, load-in, sound and accommodation. With a checklist.',
    intro: 'The day sheet is the document that prevents phone calls at two in the morning. Every band member should be able to open it and know what to do and when.',
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
