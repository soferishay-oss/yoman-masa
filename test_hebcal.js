import { HDate, HebrewCalendar, Locale } from '@hebcal/core';

const events = HebrewCalendar.calendar({ year: 5786, isHebrewYear: true, il: true, omer: true });
const nissanEvents = events.filter(e => e.getDate().getMonth() === 1 /* Nisan is month 1 */);
const omerEvent = nissanEvents.find(e => e.render('he').includes('עוֹמֶר'));
console.log(omerEvent.getFlags());
console.log(omerEvent.getDesc());
