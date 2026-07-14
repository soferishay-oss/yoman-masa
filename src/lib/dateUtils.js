import { HDate, Sedra, gematriya } from '@hebcal/core';

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
export function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startingDay = firstDay.getDay(); // 0 is Sunday
  const totalDays = lastDay.getDate();
  
  const days = [];
  
  const createDayObj = (d, isCurrentMonth) => {
    const hdate = new HDate(d);
    
    // Get parasha for Saturday
    let parasha = null;
    if (d.getDay() === 6) { // Saturday
      try {
        const sedra = new Sedra(hdate.getFullYear(), true); // true for Israel
        const parashat = sedra.lookup(hdate);
        if (parashat && parashat.chag) {
           parasha = parashat.chag;
        } else if (parashat && parashat.parsha && parashat.parsha.length > 0) {
           parasha = `פרשת ${parashat.parsha.join(' ו')}`;
        }
      } catch (e) {
        console.error("Hebcal Sedra error:", e);
      }
    }

    return {
      date: d,
      isCurrentMonth,
      hebrew: hdate.renderGematriya(), // full string
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: gematriya(hdate.getDate()),
      hebrewMonthStr: hdate.getMonthName('he'),
      hebrewYearStr: gematriya(hdate.getFullYear()),
      parasha
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
