/**
 * Public event information. Edit this file to change what the website says.
 * Never put guest, HR or secret data here: everything in this file is public.
 * All times are Sri Lanka Standard Time (Asia/Colombo, UTC+05:30).
 */
export const event = {
  organisation: 'iMET',
  name: 'Imperial Excellence Awards & Gala 2026',
  title: { top: 'Imperial', main: 'Excellence', sub: 'Awards & Gala', year: '2026' },
  shortName: 'Imperial Excellence',

  startISO: '2027-01-09T18:00:00+05:30',
  endISO: '2027-01-09T23:30:00+05:30',
  dayText: 'Saturday',
  dateText: '9 January 2027',
  timeText: '6:00 PM – 11:30 PM',
  timezoneText: 'Sri Lanka time (UTC+05:30)',
  venue: 'Cinnamon Life',
  city: 'Colombo',
  location: 'Colombo, Sri Lanka',

  tagline: 'Celebrating excellence. Recognising achievement. Inspiring the future.',
  intro:
    'An evening dedicated to honouring the outstanding achievements, dedication and contributions of our people throughout 2026.',
  closing:
    'Join us for an elegant evening of recognition, celebration and unforgettable memories as we honour the people who make iMET exceptional.',
  signoff: 'Please reserve the date',
  notes: ['Attendance is mandatory.', 'Further details will be communicated soon.'],

  pillars: [
    { title: 'Celebrating excellence', text: 'A night that honours the standard our people set, and the pride we take in it.' },
    { title: 'Recognising achievement', text: 'The milestones of 2026, and the individuals and teams whose work delivered them.' },
    { title: 'Inspiring the future', text: 'A shared moment to carry forward into everything we set out to achieve next.' },
  ],

  programme: [
    { heading: 'Arrival and welcome', detail: 'Guests are received as the evening opens.' },
    { heading: 'Recognition and awards', detail: 'The presentation of the Imperial Excellence Awards.' },
    { heading: 'Dinner and celebration', detail: 'Dinner, good company and a toast to the year.' },
  ],
  programmeNote: 'Full timings will be shared with invited guests.',

  themeLabel: 'Event theme',
  theme: [
    { name: 'Black', colour: '#050203' },
    { name: 'Red (Burgundy)', colour: '#7d1531' },
    { name: 'Gold', colour: '#e2b866' },
  ],

  contactEmail: '', // optional: approved HR or event team address shown in the footer
  seatingPlanUrl: '', // optional: HTTPS link to the approved seating plan, shown to confirmed guests
} as const;

export type EventConfig = typeof event;
