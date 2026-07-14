export function getHebrewDate(date = new Date()) {
  return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
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
  
  // Padding for previous month
  for (let i = 0; i < startingDay; i++) {
    const d = new Date(year, month, 0 - (startingDay - i - 1));
    days.push({
      date: d,
      isCurrentMonth: false,
      hebrew: getHebrewDate(d),
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(d)
    });
  }
  
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      hebrew: getHebrewDate(d),
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(d)
    });
  }
  
  // Padding for next month (to complete the 42 items grid)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      hebrew: getHebrewDate(d),
      gregorian: getGregorianDate(d),
      gregorianDay: d.getDate(),
      hebrewDay: new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(d)
    });
  }
  
  return days;
}
