import { HDate, HebrewCalendar, Sedra, gematriya, Locale } from '@hebcal/core';

export function getHebrewDate(date = new Date()) {
  const hdate = new HDate(date);
  return hdate.renderGematriya(); // e.g. "ה' אלול תשפ"ד"
}

export function getGregorianDate(date = new Date()) {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Generate a grid of dates for the current month (or a specific month)
export function getCalendarGrid(year, month, themeConfig = {}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startingDay = firstDay.getDay(); // 0 is Sunday
  const totalDays = lastDay.getDate();
  
  const days = [];
  
  // Fetch hebcal events for the current month window
  // We fetch for both years if the month spans two gregorian years, but usually we just fetch for the year and next year just in case.
  const hebcalEvents = HebrewCalendar.calendar({ 
    year: year, 
    isHebrewYear: false, 
    il: true, 
    omer: themeConfig.showOmer !== false 
  }).concat(
    month === 11 ? HebrewCalendar.calendar({ year: year + 1, isHebrewYear: false, il: true, omer: themeConfig.showOmer !== false }) : []
  );
  
  const createDayObj = (d, isCurrentMonth) => {
    const hdate = new HDate(d);
    
    // Get parasha for Saturday
    let parasha = null;
    if (themeConfig.showParasha !== false && d.getDay() === 6) { // Saturday
      try {
        const sedra = new Sedra(hdate.getFullYear(), true); // true for Israel
        const parashat = sedra.lookup(hdate);
        if (parashat && parashat.chag) {
           parasha = Locale.gettext(parashat.chag, 'he');
        } else if (parashat && parashat.parsha && parashat.parsha.length > 0) {
           const heParshiot = parashat.parsha.map(p => Locale.gettext(p, 'he'));
           parasha = `פרשת ${heParshiot.join(' ו')}`;
        }
      } catch (e) {
        console.error("Hebcal Sedra error:", e);
      }
    }
    
    // Find holidays / omer
    let holidays = [];
    let omer = null;
    const dayEvents = hebcalEvents.filter(e => e.getDate().isSameDate(hdate));
    
    dayEvents.forEach(ev => {
      const desc = ev.getDesc();
      if (desc.startsWith('Omer ')) {
        omer = ev.render('he');
      } else if (themeConfig.showHolidays !== false) {
        // filter out rosh chodesh if not wanted, but generally we include it as holiday
        // check if it's a Chag or Rosh Chodesh
        holidays.push(ev.render('he'));
      }
    });

    return {
      date: d,
      isCurrentMonth,
      hebrew: hdate.renderGematriya(), // full string
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: gematriya(hdate.getDate()),
      hebrewMonthStr: Locale.gettext(hdate.getMonthName(), 'he'),
      hebrewYearStr: gematriya(hdate.getFullYear()),
      parasha,
      holidays,
      omer
    };
  };

  // Padding for previous month
  for (let i = 0; i < startingDay; i++) {
    const d = new Date(year, month, 0 - (startingDay - i - 1));
    days.push(createDayObj(d, false));
  }
  
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push(createDayObj(d, true));
  }
  
  // Padding for next month
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push(createDayObj(d, false));
  }
  
  return days;
}
