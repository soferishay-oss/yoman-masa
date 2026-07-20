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

const stripNikud = (str, themeConfig) => {
  if (!str || typeof str !== 'string') return str;
  if (themeConfig?.hebrewCalendarNikud === true) return str;
  // Regex to remove Hebrew Niqqud (vowels and cantillation marks)
  return str.replace(/[\u0591-\u05C7]/g, '');
};

// Original: Generate a grid of dates for the current Gregorian month
export function getCalendarGrid(year, month, themeConfig = {}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startingDay = firstDay.getDay(); // 0 is Sunday
  const totalDays = lastDay.getDate();
  
  const days = [];
  
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
    
    let parasha = null;
    if (themeConfig.showParasha !== false && d.getDay() === 6) { // Saturday
      try {
        const sedra = new Sedra(hdate.getFullYear(), true); // true for Israel
        const parashat = sedra.lookup(hdate);
        if (parashat && parashat.chag) {
           parasha = stripNikud(Locale.gettext(parashat.chag, 'he'), themeConfig);
        } else if (parashat && parashat.parsha && parashat.parsha.length > 0) {
           const heParshiot = parashat.parsha.map(p => stripNikud(Locale.gettext(p, 'he'), themeConfig));
           parasha = `פרשת ${heParshiot.join(' ו')}`;
        }
      } catch (e) {
        console.error("Hebcal Sedra error:", e);
      }
    }
    
    let holidays = [];
    let omer = null;
    const dayEvents = hebcalEvents.filter(e => e.getDate().isSameDate(hdate));
    
    dayEvents.forEach(ev => {
      const desc = ev.getDesc();
      if (desc.startsWith('Omer ')) {
        omer = stripNikud(ev.render('he'), themeConfig);
      } else if (themeConfig.showHolidays !== false) {
        holidays.push(stripNikud(ev.render('he'), themeConfig));
      }
    });

    return {
      date: d,
      isCurrentMonth,
      hebrew: hdate.renderGematriya(),
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: gematriya(hdate.getDate()),
      hebrewMonthStr: stripNikud(Locale.gettext(hdate.getMonthName(), 'he'), themeConfig),
      hebrewYearStr: gematriya(hdate.getFullYear()),
      parasha,
      holidays,
      omer
    };
  };

  for (let i = 0; i < startingDay; i++) {
    const d = new Date(year, month, 0 - (startingDay - i - 1));
    days.push(createDayObj(d, false));
  }
  
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push(createDayObj(d, true));
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push(createDayObj(d, false));
  }
  
  return days;
}

// New: Generate a grid of dates for a Hebrew month
export function getHebrewCalendarGrid(hebYear, hebMonth, themeConfig = {}) {
  // First day of the Hebrew month
  const firstHDate = new HDate(1, hebMonth, hebYear);
  const totalDays = firstHDate.daysInMonth();
  
  const startingDay = firstHDate.greg().getDay(); // 0 is Sunday
  const days = [];
  
  const hebcalEvents = HebrewCalendar.calendar({ 
    year: hebYear, 
    isHebrewYear: true, 
    il: true, 
    omer: themeConfig.showOmer !== false 
  });
  
  const createDayObj = (hdate, isCurrentMonth) => {
    const d = hdate.greg();
    
    let parasha = null;
    if (themeConfig.showParasha !== false && d.getDay() === 6) { // Saturday
      try {
        const sedra = new Sedra(hdate.getFullYear(), true); // true for Israel
        const parashat = sedra.lookup(hdate);
        if (parashat && parashat.chag) {
           parasha = stripNikud(Locale.gettext(parashat.chag, 'he'), themeConfig);
        } else if (parashat && parashat.parsha && parashat.parsha.length > 0) {
           const heParshiot = parashat.parsha.map(p => stripNikud(Locale.gettext(p, 'he'), themeConfig));
           parasha = `פרשת ${heParshiot.join(' ו')}`;
        }
      } catch (e) {
        console.error("Hebcal Sedra error:", e);
      }
    }
    
    let holidays = [];
    let omer = null;
    const dayEvents = hebcalEvents.filter(e => e.getDate().isSameDate(hdate));
    
    dayEvents.forEach(ev => {
      const desc = ev.getDesc();
      if (desc.startsWith('Omer ')) {
        omer = stripNikud(ev.render('he'), themeConfig);
      } else if (themeConfig.showHolidays !== false) {
        holidays.push(stripNikud(ev.render('he'), themeConfig));
      }
    });

    return {
      date: d,
      isCurrentMonth,
      hebrew: hdate.renderGematriya(),
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: gematriya(hdate.getDate()),
      hebrewMonthStr: stripNikud(Locale.gettext(hdate.getMonthName(), 'he'), themeConfig),
      hebrewYearStr: gematriya(hdate.getFullYear()),
      parasha,
      holidays,
      omer
    };
  };

  const firstHDateAbs = firstHDate.abs();
  
  for (let i = 0; i < startingDay; i++) {
    const paddingHDate = new HDate(firstHDateAbs - (startingDay - i));
    days.push(createDayObj(paddingHDate, false));
  }
  
  for (let i = 0; i < totalDays; i++) {
    const currentHDate = new HDate(firstHDateAbs + i);
    days.push(createDayObj(currentHDate, true));
  }
  
  const remaining = 42 - days.length;
  const nextMonthStartAbs = firstHDateAbs + totalDays;
  for (let i = 0; i < remaining; i++) {
    const paddingHDate = new HDate(nextMonthStartAbs + i);
    days.push(createDayObj(paddingHDate, false));
  }
  
  return days;
}
