export interface Timezone {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const getAllTimezones = (): Timezone[] => {
  const timezones: Timezone[] = [
    // UTC
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00', region: 'UTC' },
    
    // Africa
    { value: 'Africa/Abidjan', label: 'Abidjan', offset: '+00:00', region: 'Africa' },
    { value: 'Africa/Accra', label: 'Accra', offset: '+00:00', region: 'Africa' },
    { value: 'Africa/Addis_Ababa', label: 'Addis Ababa', offset: '+03:00', region: 'Africa' },
    { value: 'Africa/Algiers', label: 'Algiers', offset: '+01:00', region: 'Africa' },
    { value: 'Africa/Cairo', label: 'Cairo', offset: '+02:00', region: 'Africa' },
    { value: 'Africa/Casablanca', label: 'Casablanca', offset: '+01:00', region: 'Africa' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: '+02:00', region: 'Africa' },
    { value: 'Africa/Lagos', label: 'Lagos', offset: '+01:00', region: 'Africa' },
    { value: 'Africa/Nairobi', label: 'Nairobi', offset: '+03:00', region: 'Africa' },
    
    // America
    { value: 'America/New_York', label: 'New York (EST)', offset: '-05:00', region: 'America' },
    { value: 'America/Chicago', label: 'Chicago (CST)', offset: '-06:00', region: 'America' },
    { value: 'America/Denver', label: 'Denver (MST)', offset: '-07:00', region: 'America' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: '-08:00', region: 'America' },
    { value: 'America/Toronto', label: 'Toronto', offset: '-05:00', region: 'America' },
    { value: 'America/Vancouver', label: 'Vancouver', offset: '-08:00', region: 'America' },
    { value: 'America/Mexico_City', label: 'Mexico City', offset: '-06:00', region: 'America' },
    { value: 'America/Sao_Paulo', label: 'São Paulo', offset: '-03:00', region: 'America' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: '-03:00', region: 'America' },
    { value: 'America/Lima', label: 'Lima', offset: '-05:00', region: 'America' },
    { value: 'America/Bogota', label: 'Bogotá', offset: '-05:00', region: 'America' },
    { value: 'America/Caracas', label: 'Caracas', offset: '-04:00', region: 'America' },
    
    // Asia
    { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00', region: 'Asia' },
    { value: 'Asia/Shanghai', label: 'Shanghai', offset: '+08:00', region: 'Asia' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: '+08:00', region: 'Asia' },
    { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00', region: 'Asia' },
    { value: 'Asia/Seoul', label: 'Seoul', offset: '+09:00', region: 'Asia' },
    { value: 'Asia/Mumbai', label: 'Mumbai', offset: '+05:30', region: 'Asia' },
    { value: 'Asia/Kolkata', label: 'Kolkata', offset: '+05:30', region: 'Asia' },
    { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00', region: 'Asia' },
    { value: 'Asia/Riyadh', label: 'Riyadh', offset: '+03:00', region: 'Asia' },
    { value: 'Asia/Bangkok', label: 'Bangkok', offset: '+07:00', region: 'Asia' },
    { value: 'Asia/Jakarta', label: 'Jakarta', offset: '+07:00', region: 'Asia' },
    { value: 'Asia/Manila', label: 'Manila', offset: '+08:00', region: 'Asia' },
    { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', offset: '+08:00', region: 'Asia' },
    { value: 'Asia/Tehran', label: 'Tehran', offset: '+03:30', region: 'Asia' },
    { value: 'Asia/Karachi', label: 'Karachi', offset: '+05:00', region: 'Asia' },
    { value: 'Asia/Dhaka', label: 'Dhaka', offset: '+06:00', region: 'Asia' },
    
    // Europe
    { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00', region: 'Europe' },
    { value: 'Europe/Paris', label: 'Paris', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Rome', label: 'Rome', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Madrid', label: 'Madrid', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Brussels', label: 'Brussels', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Zurich', label: 'Zurich', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Vienna', label: 'Vienna', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Prague', label: 'Prague', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Warsaw', label: 'Warsaw', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Moscow', label: 'Moscow', offset: '+03:00', region: 'Europe' },
    { value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00', region: 'Europe' },
    { value: 'Europe/Athens', label: 'Athens', offset: '+02:00', region: 'Europe' },
    { value: 'Europe/Stockholm', label: 'Stockholm', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Oslo', label: 'Oslo', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Copenhagen', label: 'Copenhagen', offset: '+01:00', region: 'Europe' },
    { value: 'Europe/Helsinki', label: 'Helsinki', offset: '+02:00', region: 'Europe' },
    
    // Australia & Oceania
    { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00', region: 'Australia' },
    { value: 'Australia/Melbourne', label: 'Melbourne', offset: '+11:00', region: 'Australia' },
    { value: 'Australia/Brisbane', label: 'Brisbane', offset: '+10:00', region: 'Australia' },
    { value: 'Australia/Perth', label: 'Perth', offset: '+08:00', region: 'Australia' },
    { value: 'Australia/Adelaide', label: 'Adelaide', offset: '+10:30', region: 'Australia' },
    { value: 'Pacific/Auckland', label: 'Auckland', offset: '+13:00', region: 'Pacific' },
    { value: 'Pacific/Fiji', label: 'Fiji', offset: '+12:00', region: 'Pacific' },
    { value: 'Pacific/Honolulu', label: 'Honolulu', offset: '-10:00', region: 'Pacific' },
  ];

  return timezones.sort((a, b) => a.label.localeCompare(b.label));
};

export interface MarketSession {
  name: string;
  timezone: string;
  openHour: number;
  closeHour: number;
  isOpen: boolean;
  nextOpen?: Date;
  nextClose?: Date;
}

export const getMarketStatus = (selectedTimezone: string = 'UTC') => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  // Weekend check (Friday 22:00 UTC to Sunday 22:00 UTC)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && utcHour >= 22);
  
  const sessions: MarketSession[] = [
    {
      name: 'Sydney',
      timezone: 'Australia/Sydney',
      openHour: 22, // 22:00 UTC Sunday - 07:00 UTC Monday
      closeHour: 7,
      isOpen: false
    },
    {
      name: 'Tokyo',
      timezone: 'Asia/Tokyo',
      openHour: 0, // 00:00 UTC - 09:00 UTC
      closeHour: 9,
      isOpen: false
    },
    {
      name: 'London',
      timezone: 'Europe/London',
      openHour: 8, // 08:00 UTC - 17:00 UTC
      closeHour: 17,
      isOpen: false
    },
    {
      name: 'New York',
      timezone: 'America/New_York',
      openHour: 13, // 13:00 UTC - 22:00 UTC
      closeHour: 22,
      isOpen: false
    }
  ];

  let currentSession = 'Market Closed';
  let nextSession = 'Sydney';
  let timeUntilNext = '';
  let isMarketOpen = false;

  if (!isWeekend) {
    // Check each session
    for (const session of sessions) {
      if (session.openHour < session.closeHour) {
        // Same day session
        if (utcHour >= session.openHour && utcHour < session.closeHour) {
          session.isOpen = true;
          currentSession = session.name;
          isMarketOpen = true;
          break;
        }
      } else {
        // Overnight session (Sydney)
        if (utcHour >= session.openHour || utcHour < session.closeHour) {
          session.isOpen = true;
          currentSession = session.name;
          isMarketOpen = true;
          break;
        }
      }
    }

    // Determine next session
    if (isMarketOpen) {
      const currentSessionObj = sessions.find(s => s.isOpen);
      const currentIndex = sessions.findIndex(s => s.isOpen);
      nextSession = sessions[(currentIndex + 1) % sessions.length].name;
      
      // Calculate time until next session
      if (currentSessionObj) {
        let closeHour = currentSessionObj.closeHour;
        if (closeHour <= utcHour && currentSessionObj.openHour > currentSessionObj.closeHour) {
          closeHour += 24; // Next day
        }
        const hoursUntilClose = closeHour - utcHour;
        const minutesUntilClose = hoursUntilClose > 0 ? 60 - utcMinutes : 0;
        timeUntilNext = `${Math.max(0, hoursUntilClose - 1)}h ${minutesUntilClose}m`;
      }
    } else {
      // Find next opening session
      const nextOpenSession = sessions.find(session => {
        if (session.openHour > utcHour) {
          return true;
        }
        return false;
      }) || sessions[0]; // Default to Sydney if no session found today
      
      nextSession = nextOpenSession.name;
      let hoursUntilNext = nextOpenSession.openHour - utcHour;
      if (hoursUntilNext <= 0) hoursUntilNext += 24;
      timeUntilNext = `${hoursUntilNext}h ${60 - utcMinutes}m`;
    }
  } else {
    // Weekend - calculate time until Sunday 22:00 UTC (Sydney open)
    const nextSunday = new Date(now);
    if (dayOfWeek === 0) {
      // It's Sunday, check if before 22:00 UTC
      if (utcHour < 22) {
        const hoursUntil = 22 - utcHour;
        const minutesUntil = 60 - utcMinutes;
        timeUntilNext = `${hoursUntil - 1}h ${minutesUntil}m`;
      } else {
        // After 22:00 UTC Sunday, market should be open
        nextSunday.setUTCDate(now.getUTCDate() + 7);
        nextSunday.setUTCHours(22, 0, 0, 0);
      }
    } else {
      // Saturday or Friday after 22:00
      const daysUntilSunday = dayOfWeek === 6 ? 1 : (dayOfWeek === 5 ? 2 : 7 - dayOfWeek);
      nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
      nextSunday.setUTCHours(22, 0, 0, 0);
    }
    
    if (timeUntilNext === '') {
      const diff = nextSunday.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeUntilNext = `${hours}h ${minutes}m`;
    }
  }

  // Format current time in selected timezone
  const localTime = now.toLocaleString('en-US', {
    timeZone: selectedTimezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return {
    isOpen: isMarketOpen,
    currentSession,
    nextSession,
    timeUntilNext,
    localTime,
    sessions,
    isWeekend
  };
};

export const formatTimeInTimezone = (date: Date, timezone: string): string => {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};
