export interface ForexFactoryEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  event: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  detail?: string;
}

export interface ForexFactoryResponse {
  events: ForexFactoryEvent[];
  status: string;
  message?: string;
}

const RAPIDAPI_KEY = '68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2';
const RAPIDAPI_HOST = 'forex-factory-scraper1.p.rapidapi.com';

export const fetchForexFactoryNews = async (
  selectedDate: Date = new Date(),
  currency: string = 'ALL',
  timezone: string = 'GMT+00:00'
): Promise<ForexFactoryEvent[]> => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  
  try {
    // Convert timezone format for API
    const timezoneForAPI = convertTimezoneForAPI(timezone);
    
    const url = `https://${RAPIDAPI_HOST}/get_calendar_details`;
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString().padStart(2, '0'),
      day: day.toString().padStart(2, '0'),
      currency: currency === 'ALL' ? 'ALL' : currency,
      event_name: 'ALL',
      timezone: timezoneForAPI,
      time_format: '24h'
    });

    console.log('Fetching Forex Factory data with params:', Object.fromEntries(params));

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`API response error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Handle different response formats
    let events = [];
    if (data && Array.isArray(data)) {
      events = data;
    } else if (data && data.events && Array.isArray(data.events)) {
      events = data.events;
    } else if (data && data.data && Array.isArray(data.data)) {
      events = data.data;
    }
    
    // Transform and filter the response data
    const transformedEvents = events.map((event: any, index: number) => ({
      id: `ff-${selectedDate.getTime()}-${index}`,
      date: event.date || selectedDate.toISOString().split('T')[0],
      time: event.time || '00:00',
      currency: event.currency || event.curr || 'USD',
      impact: mapImpactLevel(event.impact || event.importance),
      event: event.event || event.title || event.name || 'Economic Event',
      actual: formatValue(event.actual || event.act),
      forecast: formatValue(event.forecast || event.fore || event.expected),
      previous: formatValue(event.previous || event.prev),
      detail: event.detail || event.description || event.desc || ''
    }));

    // Apply currency filter if not ALL
    const filteredEvents = currency === 'ALL' 
      ? transformedEvents 
      : transformedEvents.filter((event: ForexFactoryEvent) => event.currency === currency);

    console.log(`Filtered ${filteredEvents.length} events for ${currency} on ${selectedDate.toDateString()}`);
    return filteredEvents;

  } catch (error) {
    console.error('Error fetching Forex Factory news:', error);
    
    // Return filtered mock data as fallback
    const mockData = getMockForexFactoryData(selectedDate);
    return currency === 'ALL' 
      ? mockData 
      : mockData.filter((event: ForexFactoryEvent) => event.currency === currency);
  }
};

// Helper function to convert timezone format for API
const convertTimezoneForAPI = (timezone: string): string => {
  // Convert common timezone formats to API expected format
  const timezoneMap: { [key: string]: string } = {
    'UTC': 'GMT+00:00',
    'GMT': 'GMT+00:00',
    'America/New_York': 'GMT-05:00',
    'America/Chicago': 'GMT-06:00',
    'America/Denver': 'GMT-07:00',
    'America/Los_Angeles': 'GMT-08:00',
    'Europe/London': 'GMT+00:00',
    'Europe/Berlin': 'GMT+01:00',
    'Europe/Moscow': 'GMT+03:00',
    'Asia/Tokyo': 'GMT+09:00',
    'Asia/Shanghai': 'GMT+08:00',
    'Asia/Kolkata': 'GMT+05:30',
    'Australia/Sydney': 'GMT+11:00'
  };
  
  return timezoneMap[timezone] || timezone;
};

// Helper function to format values
const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
};

const mapImpactLevel = (impact: any): 'low' | 'medium' | 'high' => {
  if (typeof impact === 'string') {
    const lowerImpact = impact.toLowerCase();
    if (lowerImpact.includes('high') || lowerImpact.includes('red')) return 'high';
    if (lowerImpact.includes('medium') || lowerImpact.includes('orange') || lowerImpact.includes('yellow')) return 'medium';
    return 'low';
  }
  if (typeof impact === 'number') {
    if (impact >= 3) return 'high';
    if (impact >= 2) return 'medium';
    return 'low';
  }
  return 'low';
};

const getMockForexFactoryData = (selectedDate?: Date): ForexFactoryEvent[] => {
  const today = selectedDate || new Date();
  const currentTime = today.toTimeString().slice(0, 5);
  
  return [
    {
      id: 'ff-mock-1',
      date: today.toISOString().split('T')[0],
      time: '04:00',
      currency: 'NZD',
      impact: 'medium',
      event: 'BusinessNZ Manufacturing Index',
      actual: '52.8',
      forecast: '51.5',
      previous: '49.2'
    },
    {
      id: 'ff-mock-2',
      date: today.toISOString().split('T')[0],
      time: '04:15',
      currency: 'NZD',
      impact: 'low',
      event: 'FPI m/m',
      actual: '0.7%',
      forecast: '0.5%',
      previous: '1.2%'
    },
    {
      id: 'ff-mock-3',
      date: today.toISOString().split('T')[0],
      time: '05:20',
      currency: 'JPY',
      impact: 'medium',
      event: 'Prelim GDP Price Index y/y',
      actual: '3.0%',
      forecast: '3.1%',
      previous: '3.3%'
    },
    {
      id: 'ff-mock-4',
      date: today.toISOString().split('T')[0],
      time: '07:00',
      currency: 'CNY',
      impact: 'high',
      event: 'New Home Prices m/m',
      actual: '-0.31%',
      forecast: '-0.25%',
      previous: '-0.27%'
    },
    {
      id: 'ff-mock-5',
      date: today.toISOString().split('T')[0],
      time: '07:30',
      currency: 'CNY',
      impact: 'high',
      event: 'Industrial Production y/y',
      actual: '5.7%',
      forecast: '6.0%',
      previous: '6.8%'
    },
    {
      id: 'ff-mock-6',
      date: today.toISOString().split('T')[0],
      time: '10:00',
      currency: 'JPY',
      impact: 'medium',
      event: 'Revised Industrial Production m/m',
      actual: '2.1%',
      forecast: '1.7%',
      previous: '1.7%'
    },
    {
      id: 'ff-mock-7',
      date: today.toISOString().split('T')[0],
      time: '18:00',
      currency: 'CAD',
      impact: 'medium',
      event: 'Manufacturing Sales m/m',
      actual: '0.3%',
      forecast: '0.4%',
      previous: '-1.5%'
    },
    {
      id: 'ff-mock-8',
      date: today.toISOString().split('T')[0],
      time: '18:45',
      currency: 'USD',
      impact: 'high',
      event: 'Core Retail Sales m/m',
      actual: '0.3%',
      forecast: '0.3%',
      previous: '0.8%'
    },
    {
      id: 'ff-mock-9',
      date: today.toISOString().split('T')[0],
      time: '19:30',
      currency: 'USD',
      impact: 'high',
      event: 'Prelim UoM Consumer Sentiment',
      actual: '58.6',
      forecast: '61.9',
      previous: '61.7'
    }
  ];
};

export const getImpactColor = (impact: 'low' | 'medium' | 'high'): string => {
  switch (impact) {
    case 'high':
      return 'text-red-400 bg-red-400/20';
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/20';
    case 'low':
      return 'text-green-400 bg-green-400/20';
    default:
      return 'text-gray-400 bg-gray-400/20';
  }
};

export const getImpactIcon = (impact: 'low' | 'medium' | 'high'): string => {
  switch (impact) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export const formatEventTime = (time: string, timezone: string = 'UTC'): string => {
  try {
    if (!time || time === '' || time === 'All Day') {
      return 'All Day';
    }

    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) {
      return time;
    }

    const hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);
    
    if (isNaN(hoursNum) || isNaN(minutesNum)) {
      return time;
    }

    // Create a date object for today with the event time
    const today = new Date();
    const eventDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hoursNum, minutesNum);
    
    // Map timezone strings to proper timezone identifiers
    const timezoneMap: { [key: string]: string } = {
      'UTC': 'UTC',
      'UTC+5:30': 'Asia/Kolkata',
      'UTC-5': 'America/New_York',
      'UTC-8': 'America/Los_Angeles',
      'UTC+1': 'Europe/Berlin',
      'UTC+9': 'Asia/Tokyo',
      'UTC+10': 'Australia/Sydney'
    };

    const mappedTimezone = timezoneMap[timezone] || 'UTC';
    
    // Calculate timezone offset
    const timezoneOffsets: { [key: string]: number } = {
      'UTC': 0,
      'UTC+5:30': 5.5,
      'UTC-5': -5,
      'UTC-8': -8,
      'UTC+1': 1,
      'UTC+9': 9,
      'UTC+10': 10
    };

    const offset = timezoneOffsets[timezone] || 0;
    const adjustedHours = (hoursNum + offset + 24) % 24;
    
    // Format the time
    const formattedHours = adjustedHours.toString().padStart(2, '0');
    const formattedMinutes = minutesNum.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}`;
  } catch (error) {
    console.error('Error formatting event time:', error);
    return time || '00:00';
  }
};
