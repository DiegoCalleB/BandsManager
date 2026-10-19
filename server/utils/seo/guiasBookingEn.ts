import type { GuiaSeoEn } from './tipos.js';

export const GUIAS_BOOKING_EN: GuiaSeoEn[] = [
  {
    slug: 'how-to-make-an-epk',
    slugEs: 'como-hacer-un-epk',
    titulo: 'How to Make an EPK (Press Kit) for Your Band: What to Include',
    h1: 'How to make an EPK for your band',
    descripcion: 'What an EPK (electronic press kit) is, what it should include and what to leave out. A practical guide so venues and festivals get you in under a minute.',
    intro: 'The EPK, or electronic press kit, is the page a venue or festival opens to decide whether to book you. If it takes more than a minute to understand who you are, they close it.',
    resumen: ['A good EPK is understood in a minute: style, something to hear right away and contact details.', 'One verifiable proof point beats ten adjectives.', 'Share it as a link, not a PDF: it updates itself and does not weigh down the email.'],
    secciones: [
      {
        h2: 'What an EPK is and what it is for',
        parrafos: ['It is a presentation of your band built for the person who books: who you are, how you sound, where you have played and how to reach you. It is not a fan site and not a twenty-page résumé.', 'A good EPK answers three questions at a glance: do they fit my room, do they bring a crowd, and are they easy to work with?'],
      },
      {
        h2: 'What to include, in order of importance',
        pasos: [
          'One sentence that defines your style and who you sound like, with no superlatives you cannot back up.',
          'Something to listen to right away: a couple of tracks or a 30 to 60 second live teaser. No full-length shows.',
          'A good band photo, plus a landscape version for posters.',
          'One verifiable proof point of local traction, only one: tickets sold at a specific venue, for example.',
          'A short bio, four or five lines.',
          'Your technical rider and contact details, easy to find.',
        ],
      },
      {
        h2: 'What to cut',
        lista: ['Individual bios for every member with the instruments they have played since age twelve.', 'Twenty photos or heavy attachments that push your email into spam.', 'Filler adjectives: "powerful", "unique", "groundbreaking".', 'Links to every social network: two or three well chosen ones are enough.'],
      },
      {
        h2: 'PDF or link',
        parrafos: ['A link to a page beats an attached PDF every time: it opens on a phone, updates without resending and does not weigh down the email. If you can also see whether it was opened, you know when it is worth following up.'],
      },
    ],
    faq: [
      { q: 'What is the difference between an EPK and a press kit?', a: 'In practice they are the same thing. EPK stands for electronic press kit. What matters is that it is short, listenable and easy to share with a link.' },
      { q: 'How long should an EPK be?', a: 'One phone screen of scrolling, or one to two pages if it is a PDF. Keep the detail for whoever asks for it.' },
      { q: 'Do I need an EPK if I barely play live yet?', a: 'Yes, and that is when it helps most. A tidy EPK makes up for a short track record because it shows you are professional and easy to book.' },
    ],
    relacionadas: ['how-to-email-a-venue', 'how-to-get-gigs', '/en/technical-rider-template'],
    cta: { titulo: 'Your EPK, with one link', texto: 'In BandManager you build your band’s press kit and share it with your own URL, rider included.', boton: 'Create my EPK free' },
  },
  {
    slug: 'how-to-get-gigs',
    slugEs: 'como-conseguir-bolos',
    titulo: 'How to Get Gigs With Your Band: A Step-by-Step Method',
    h1: 'How to get gigs with your band',
    descripcion: 'A method to book shows without relying on luck: pick the right venues, write to them well, follow up and repeat without burning out.',
    intro: 'Getting gigs is not talent or connections, it is a process. The band that emails fifty well-chosen venues with a short message and a follow-up plays more than the one waiting for the phone to ring.',
    resumen: ['Getting gigs is a process: well-chosen venues, a short message and follow-up.', 'Prepare an EPK link, a clear rider and two or three possible dates first.', 'Follow up after a week and move on to the next venue after two tries.'],
    secciones: [
      {
        h2: '1. Pick venues that fit, not every venue',
        parrafos: ['Look at what they book: style, capacity, whether they host local or touring acts. A room where bands like yours already play is a room with an audience for you. Note the city, the contact and the latest lineup in a sheet or a CRM.'],
      },
      {
        h2: '2. Prepare the minimum before you write',
        lista: ['An EPK as a link, with something to listen to right away.', 'A clear technical rider so they have fewer questions.', 'Two or three possible dates, so you are not asking blind.'],
      },
      {
        h2: '3. Write a short, human message',
        parrafos: ['Under 120 words, two paragraphs. Acknowledge something specific about the venue, say what you bring (crowd, atmosphere) and link your EPK. Do not paste the same text to everyone: a venue can tell when it is a template.'],
      },
      {
        h2: '4. Follow up without nagging',
        pasos: ['Wait about seven days before writing again.', 'Send a one-line second message that adds something new: a date, a recent live clip.', 'If there is no reply after two follow-ups, leave it for next season and move to the next venue.'],
      },
      {
        h2: '5. Turn every gig into the next one',
        parrafos: ['Ask the venue or promoter to introduce you to other rooms, collect emails from the audience at every show and publish each date with a shareable page. A well-played gig is the best introduction to the next one.'],
      },
    ],
    faq: [
      { q: 'How many venues should I contact?', a: 'Start with twenty or thirty well chosen ones. Few will reply, and that is normal; what matters is keeping up the rhythm every week.' },
      { q: 'Is it better to email or to DM on Instagram?', a: 'Email for the proposal, because that is what venues use to book. Instagram is good for breaking the ice, not for closing dates.' },
      { q: 'What if I have no live recordings?', a: 'Record a 30 to 60 second teaser at rehearsal with good light and sound. It beats nothing and takes one afternoon.' },
    ],
    relacionadas: ['how-to-email-a-venue', 'how-to-make-an-epk', 'how-much-to-charge-for-a-gig'],
    cta: { titulo: 'Your contacts, without spreadsheets', texto: 'BandManager keeps your venues, drafts each proposal and never sends anything without your approval.', boton: 'Try BandManager free' },
  },
  {
    slug: 'how-to-email-a-venue',
    slugEs: 'email-a-una-sala',
    titulo: 'How to Email a Venue to Book a Gig (With a Short Template)',
    h1: 'How to email a venue to book a gig',
    descripcion: 'Structure, tone and mistakes to avoid when emailing a venue for a show. Includes a short template and what to do if they do not reply.',
    intro: 'The first email decides whether they read you or archive you. The key is to be brief, specific and easy to answer with a yes.',
    resumen: ['Keep it short: show you know the venue, say what you bring and propose two dates.', 'Put the press kit link in your signature, with no heavy attachments that land in spam.', 'If they do not reply, send a one-line follow-up after a week, then move on.'],
    secciones: [
      {
        h2: 'The structure that works',
        pasos: ['A clear subject line: band name, style and city.', 'One sentence showing you know the venue and its lineup.', 'What you bring: who you draw and in what format you play.', 'A single link to your press kit, ideally in the signature rather than the body.', 'A concrete proposal: two possible dates.'],
      },
      {
        h2: 'A short template',
        parrafos: ['Hi [name], we have followed you for a while and loved this autumn’s lineup at [venue]. We are [band], [style in a few words] from [city], and we would love to play your room. [Date 1] or [date 2] would work for us. The press kit is in my signature. Would you be up for taking a look?'],
      },
      {
        h2: 'Mistakes that close doors',
        lista: ['Long emails with the band’s entire history.', 'Heavy PDF, photo and audio attachments: that is what triggers spam filters.', 'Asking for a fee before they know who you are.', 'Corporate jargon and superlatives you cannot back up.', 'The same message sent to a hundred venues, with the name changed badly.'],
      },
      {
        h2: 'If they do not reply',
        parrafos: ['Wait a week and send one line: "Following up in case this slipped through. We are free on [date]." If there is still no answer, try another channel once and move on to other venues.'],
      },
    ],
    faq: [
      { q: 'What time should I send it?', a: 'Weekday mornings, when venue staff are in their inbox. Avoid weekends, when they are working.' },
      { q: 'Should I attach the press kit?', a: 'A link is better. An attachment is heavy, can land in spam and goes out of date the moment you change something.' },
      { q: 'Formal or casual tone?', a: 'In independent venues and small festivals, casual and friendly. In theatres and institutions, a slightly more formal register.' },
    ],
    relacionadas: ['how-to-get-gigs', 'how-to-make-an-epk', 'apply-to-music-festivals'],
    cta: { titulo: 'Drafts you approve', texto: 'BandManager writes each proposal in your band’s voice and waits for your go-ahead before sending.', boton: 'Try BandManager free' },
  },
  {
    slug: 'apply-to-music-festivals',
    slugEs: 'presentar-banda-festival',
    titulo: 'How to Apply to Music Festivals: Open Calls and Tips for Bands',
    h1: 'How to apply to music festivals with your band',
    descripcion: 'How to prepare your application for a festival open call: what they ask for, when to send it and how to stand out among hundreds of submissions.',
    intro: 'Festivals receive hundreds of applications. The ones that pass the first filter are easy to understand quickly and do exactly what the call asks.',
    resumen: ['Read the full rules: doing exactly what they ask is the first filter.', 'Prepare a press kit link, a short live video and a lean rider.', 'Cite one real proof point and explain why you fit that festival.'],
    secciones: [
      {
        h2: 'Before you send anything',
        lista: ['Read the full rules: dates, format, submission limit and what material they ask for.', 'Check that your style and draw fit the lineups of previous years.', 'Look at which slot bands similar to you played and aim for that one.'],
      },
      {
        h2: 'What material to prepare',
        pasos: ['A press kit as a link, with something to listen to right away and a quality photo.', 'A short live video with good sound, better than a full show.', 'A technical rider adjusted to festival format: fast changeovers and few channels.', 'Contact details and availability.'],
      },
      {
        h2: 'How to stand out',
        parrafos: ['Cite one real proof point, such as a sold-out room or a strong recent live set. Explain in one sentence why you fit this festival and not just any festival. And respect the deadlines: a late application does not get read.'],
      },
    ],
    faq: [
      { q: 'When should I send the application?', a: 'As early as possible within the window. Many calls are reviewed in order, and hundreds of submissions arrive in the last few days.' },
      { q: 'Is it worth applying without an album?', a: 'Yes, if you have a strong live show. Many festivals value the performance more than a recorded catalogue.' },
      { q: 'Can they ask me to play for free?', a: 'Sometimes. Decide beforehand what conditions you accept and what you ask in return: real exposure, backline or accommodation.' },
    ],
    relacionadas: ['how-to-make-an-epk', '/en/technical-rider-template', 'how-much-to-charge-for-a-gig'],
    cta: { titulo: 'Applications without losing track', texto: 'Keep your dates, proposals and press kit in BandManager so you never miss a call.', boton: 'Try BandManager free' },
  },
  {
    slug: 'how-much-to-charge-for-a-gig',
    slugEs: 'cuanto-cobrar-por-un-concierto',
    titulo: 'How Much to Charge for a Gig: Fee, Door Deal and Calculator',
    h1: 'How much to charge for a gig',
    descripcion: 'Work out your minimum fee and choose between a guarantee, a door deal or a mix with a worked example. Includes how to negotiate and a template.',
    intro: 'There is no universal rate for a band, which is why pricing a gig is so hard. What does exist is a method: know what it costs you to play, compare the three payment models with numbers and walk into the conversation with the venue knowing your floor.',
    resumen: ['Your minimum comes from adding real costs and the value of your time (rehearsal, load-in, travel and the show), not from what "people usually charge".', 'A guarantee, a door deal and a mix are not better or worse: they change who carries the risk. With your numbers you can see where they cross.', 'Talk money after the first yes, with your minimum clear, a proposal in writing and the payment terms agreed.'],
    secciones: [
      {
        h2: 'The three payment models',
        parrafos: ['Almost every deal is one of these three formulas or a blend. What changes between them is not how much you earn on average, but who carries the risk of a small crowd.'],
        tablas: [{ titulo: 'Guarantee, door deal and mixed', cabeceras: ['Model', 'How it works', 'Risk for you', 'When it fits'], filas: [['Guarantee', 'The venue pays an agreed amount no matter who comes.', 'Low. The venue carries it.', 'When you are starting, do not know your draw or the venue does not charge at the door.'], ['Door deal', 'You take a percentage of tickets, or what is left after costs.', 'High. If few come, you earn little.', 'When you bring a loyal crowd and the venue charges at the door.'], ['Mixed', 'A guaranteed minimum plus an extra above a given attendance.', 'Medium. You have a floor and an open ceiling.', 'When you want to protect the floor without giving up the upside.']] }],
      },
      {
        h2: 'Work out your minimum',
        parrafos: ['Your floor is the figure below which the gig costs you money. It takes three steps: add up real costs (transport, backline hire, food and sound if you provide it), add the hours it takes you across rehearsal, load-in, travel and the show, and put a value on that hour. Try it with your own numbers:'],
        calculadora: 'cache-minimo',
        tablas: [{ titulo: 'Worked example with the calculator’s values', cabeceras: ['Item', 'Working', 'Amount'], filas: [['Show costs', 'Transport, food and hire', '€120'], ['Value of your time', '4 people × 10 hours × €10', '€400'], ['Your minimum', '120 + 400', '€520'], ['Per person', '520 ÷ 4', '€130']] }],
      },
      {
        h2: 'Which model comes out better: an example in numbers',
        parrafos: ['Let us compare the three models against the minimum above, €520. The figures are made up to illustrate the reasoning, not data from any venue: a €450 guarantee, a door deal where the band takes €5.60 per attendee (€8 tickets and 70% after costs) and a mixed deal of €200 guaranteed plus €4 per attendee above 40.'],
        grafico: {
          alt: 'Line chart of what the band earns by attendance under three models. The guarantee is a flat line at 450 euros. The door deal starts at zero and rises steadily. The mix starts at 200 euros and rises above 40 attendees. A dashed line marks the 520 euro minimum: the door deal passes it at around 93 people and the mix reaches it at 120.',
          pie: 'Example figures, not real ones. What the band earns by attendance under each model, against a €520 minimum.',
          ejeX: { titulo: 'People attending', etiquetas: ['0', '20', '40', '60', '80', '100', '120'] },
          ejeY: { titulo: 'What the band earns', max: 720, unidad: '€' },
          series: [
            { nombre: 'Door deal', valores: [0, 112, 224, 336, 448, 560, 672], tipo: 'principal' },
            { nombre: 'Mixed', valores: [200, 200, 200, 280, 360, 440, 520], tipo: 'secundaria' },
            { nombre: 'Guarantee', valores: [450, 450, 450, 450, 450, 450, 450], tipo: 'neutra' },
            { nombre: 'Your minimum', valores: [520, 520, 520, 520, 520, 520, 520], tipo: 'referencia' },
          ],
          nota: { serie: 0, indice: 5, texto: 'You cover your minimum' },
        },
        lista: ['With a small crowd the guarantee wins, but at €450 you are already below your minimum: you would play at a loss.', 'The door deal only beats your minimum from about 93 people. If you are not sure you can bring them, it is a bet.', 'The mix secures €200 and does not reach your minimum until 120 people: good if the room fills, weak if it does not.'],
        aviso: 'The takeaway is not that one model is better, but that with your own figures you can see where each one pays off before you answer the venue.',
      },
      {
        h2: 'What raises or lowers what you can ask for',
        lista: ['A provable draw: tickets sold at other venues, a real figure and not a feeling.', 'The night and the slot: a Friday night is not a Tuesday at eight.', 'Capacity and ticket price: the venue can only pay what fits its door.', 'Format: an acoustic duo costs less to move than a full band with backline.', 'What the venue includes: sound, backline, accommodation and food all count as money.', 'Distance and costs: a date two hundred kilometres away changes your minimum.'],
      },
      {
        h2: 'How to talk money with a venue',
        parrafos: ['Better after the first yes than in the first email: before that they do not yet know who you are. Once the venue shows interest, ask how they work before you name a figure.'],
        pasos: ['Ask what capacity they have and what formula they usually offer bands like yours.', 'If they give you a figure, compare it with your minimum before answering. You do not have to say yes on the spot.', 'Propose your formula in one short sentence: "For this format we would be comfortable with a fee of X, or a minimum of Y plus a percentage above Z people."', 'If you cannot agree, ask for something measurable in return: a better date, real promotion, backline or accommodation.', 'Put what you agreed in writing, with date, time, amount and payment method.'],
      },
      {
        h2: 'A financial proposal to copy',
        parrafos: ['A table with these items avoids misunderstandings and can be pasted as is into an email or a contract.'],
        tablas: [{ titulo: 'Financial proposal', cabeceras: ['Item', 'Amount or condition', 'Who covers it'], filas: [['Performance fee', '[amount] plus taxes if applicable', 'Venue or promoter'], ['Sound and backline', 'Included or [amount]', 'Venue'], ['Transport', 'Included or [amount]', 'Band or venue'], ['Accommodation and food', 'Included or [amount]', 'Venue'], ['Performance rights', '[who handles them]', 'Venue or promoter'], ['Payment method and date', 'Transfer, cash or in instalments, on [date]', 'Venue or promoter']] }],
      },
      {
        h2: 'Mistakes that cost money',
        lista: ['Accepting without comparing with your minimum and finding out later you played at a loss.', 'Agreeing to a door deal without knowing how many people you will bring.', 'Not putting the amount and the payment date in writing.', 'Forgetting the small costs that add up: parking, cables, food.', 'Charging less "because it is a friendly venue" with nothing clear in return.'],
      },
      {
        h2: 'What we have not included: taxes and rights',
        parrafos: ['The figures in this guide do not account for taxes, contributions or performance rights, which depend on your country, how you invoice and the venue. Talk to an accountant about how to declare what you earn; here we only offer general guidance.'],
      },
    ],
    faq: [
      { q: 'Is it normal to play for free?', a: 'It happens when you start, but there should be something measurable in return: a good night, real promotion or contacts. Playing for free for the sake of it does not build a career.' },
      { q: 'How much does a small band charge?', a: 'It depends on the city, the venue and the crowd you bring, so there is no reliable figure. Work out your minimum and negotiate from there.' },
      { q: 'Guarantee or door deal?', a: 'If you do not know your draw, a guarantee or a mixed deal with a minimum. If you bring a loyal crowd and the venue charges at the door, the door can pay more.' },
      { q: 'Who pays the performance rights fees?', a: 'Usually the venue or the promoter. Clarify who handles it before you confirm the date.' },
      { q: 'When do I bring up money?', a: 'After the first yes. Before that, ask how they work and what capacity they have; then propose your formula.' },
    ],
    relacionadas: ['how-to-split-band-money', 'gig-contract-checklist', 'how-to-get-gigs'],
    cta: { titulo: 'Know what you really earn', texto: 'BandManager tracks your gigs, fees and costs so you can see which shows are worth it.', boton: 'Try BandManager free' },
  },
];
