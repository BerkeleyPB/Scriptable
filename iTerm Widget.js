// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: terminal;
/******************************************************************************
 * Constants and Configurations
 *****************************************************************************/

// Change TODO to your usernames!
const NAME = 'TODO';

// API PARAMETERS !important
// WEATHER_API_KEY, you need an Open Weather API Key
// You can get one for free at: https://home.openweathermap.org/api_keys (account needed).
const WEATHER_API_KEY = 'TODO';

// Change TODO to your default location!
const DEFAULT_LOCATION = { latitude: TODO, longitude: TODO };


// Cache keys
const CACHE_KEY_LAST_UPDATED = 'last_updated';
const CACHE_KEY_LOCATION = 'location';

// Font name and size
const FONT_NAME = 'Menlo';
const FONT_SIZE = 11;

// Colors
const COLORS = {
  bg0: '#282a36',
  bg1: '#282a36',
  battery: '#50fa7b',
  location: '#bd93f9',
  time: '#ff5555',
  progress: '#ffb86c',

  weather: '#f8f8f2',
};

/******************************************************************************
 * Initial Setups
 *****************************************************************************/

/**
 * Convenience function to add days to a Date.
 * 
 * @param {*} days The number of days to add
 */ 
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

// Import and setup Cache
const Cache = importModule('Cache');
const cache = new Cache('terminalWidget');

// Fetch data and create widget
const data = await fetchData();
const widget = createWidget(data);

Script.setWidget(widget);
Script.complete();


/******************************************************************************
 * Main Functions (Widget and Data-Fetching)
 *****************************************************************************/

/**
 * Main widget function.
 * 
 * @param {} data The data for the widget to display
 */
function createWidget(data) {
  console.log(`Creating widget with data: ${JSON.stringify(data)}`);

  const widget = new ListWidget();
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color(COLORS.bg0), new Color(COLORS.bg1)];
  bgColor.locations = [0.0, 1.0];
  widget.backgroundGradient = bgColor;
  widget.setPadding(12, 15, 15, 12);

  const stack = widget.addStack();
  stack.layoutHorizontally();

//-------------------------------------
// leftStack
//-------------------------------------
  const leftStack = stack.addStack();
  leftStack.layoutVertically();
  leftStack.spacing = 4;
  leftStack.size = new Size(200, 0);

  // Line 0 - Last Login
  const timeFormatter = new DateFormatter();
  timeFormatter.locale = "en";
  timeFormatter.useNoDateStyle();
  timeFormatter.useShortTimeStyle();

  const lastLoginLine = leftStack.addText(`Last login: ${timeFormatter.string(new Date())} on ttys001`);
  lastLoginLine.textColor = Color.white();
  lastLoginLine.textOpacity = 0.7;
  lastLoginLine.font = new Font(FONT_NAME, 10);

  // Line 1 - Input
  const inputLine = leftStack.addText(`iPhone:~ ${NAME}$ info`);
  inputLine.textColor = Color.white();
  inputLine.font = new Font(FONT_NAME, FONT_SIZE);
  
  // Line ２ - Battery
  const batteryLine = leftStack.addText(`${renderBattery()}`)
  batteryLine.textColor = new Color(COLORS.battery);
  batteryLine.font = new Font(FONT_NAME, FONT_SIZE);

  // Line 3 - Location
  const locationLine = leftStack.addText(`📍 | ${data.weather.location}`);
  locationLine.textColor = new Color(COLORS.location);
  locationLine.font = new Font(FONT_NAME, FONT_SIZE);

  // Line 4 - Time
  const time = new Date()
  const dfTime = new DateFormatter()
  dfTime.locale = "en"
  dfTime.useMediumDateStyle()
  dfTime.useNoTimeStyle()
  
  const timeLine = leftStack.addText(`🗓 | ${dfTime.string(time)}`)
  timeLine.textColor = new Color(COLORS.time);
  timeLine.font = new Font(FONT_NAME, FONT_SIZE);
  
  // Line 5~6 - Progress
  const minutes=time.getMinutes()
  const hours=time.getHours()
  const day=time.getDate()
  const month=time.getMonth()

  const progress1Line = leftStack.addText(`${timeProgress(1440, hours * 60 + minutes)}`)
  progress1Line.textColor = new Color(COLORS.progress);
  progress1Line.font = Font.regularSystemFont(12)

  const progress2Line = leftStack.addText(`${timeProgress(365, month / 12 * 365 + day)}`)
  progress2Line.textColor = new Color(COLORS.progress);
  progress2Line.font = Font.regularSystemFont(12)

//-------------------------------------
// rightStack
//-------------------------------------
  //Weather
  stack.addSpacer();
  const rightStack = stack.addStack();
  rightStack.spacing = 2;
  rightStack.layoutVertically();
  rightStack.bottomAlignContent();

  addWeatherLine(rightStack, `${data.weather.icon} `, 32);
  addWeatherLine(rightStack, `${data.weather.description}, ${data.weather.temperature}°`, 12, true);
  addWeatherLine(rightStack, `${data.weather.high}°-${data.weather.low}°`);
  addWeatherLine(rightStack, `FEELS ${data.weather.feelsLike}°`);
  addWeatherLine(rightStack, `WIND ${data.weather.wind}mph`);
  
  return widget;
}

// addWeatherLine
function addWeatherLine(widget, text, size, bold) {
  const stack = widget.addStack();
  stack.setPadding(0, 0, 0, 0);
  stack.layoutHorizontally();
  stack.addSpacer();
  const line = stack.addText(text);
  line.textColor = new Color(COLORS.weather);
  line.font = new Font(FONT_NAME + (bold ? "-Bold" : ""), size || 11);
}

/**
 * Fetch pieces of data for the widget.
 */
async function fetchData() {
  // Get the weather data
  const weather = await fetchWeather();

  // Get last data update time (and set)
  const lastUpdated = await getLastUpdated();
  cache.write(CACHE_KEY_LAST_UPDATED, new Date().getTime());

  return {
    weather,
    lastUpdated,
  };
}


/******************************************************************************
 * Helper Functions
 *****************************************************************************/

//-------------------------------------
// Progress Helper Functions
//-------------------------------------

function renderBattery() {
  const batteryLevel = Device.batteryLevel()
  const juice = "⚡︎".repeat(Math.floor(batteryLevel * 10))
  const used = "•".repeat(Math.floor((1-batteryLevel) * 10 + 1))
  if (Device.isCharging()) {
    return `⚡️ | [${juice}${used}] ${Math.round(batteryLevel * 100)}%`
  }
  else {
    return `🔋 | [${juice}${used}] ${Math.round(batteryLevel * 100)}%`
  }
}

function timeProgress(total, nowTime) {
  const passed = "■".repeat(Math.floor(nowTime / total * 10))
  const future = "□".repeat(10 - passed.length)
  if (passed.length < 5) {
    return `⏳  |  ${passed}${future} ${Math.round(nowTime / total * 100)}%`
  }
  else {
    return `⌛️  |  ${passed}${future} ${Math.round(nowTime / total * 100)}%`
  }
}

//-------------------------------------
// Weather Helper Functions
//-------------------------------------

/**
 * Fetch the weather data from Open Weather Map
 */
async function fetchWeather() {
  let location = await cache.read(CACHE_KEY_LOCATION);
  if (!location) {
    try {
      Location.setAccuracyToThreeKilometers();
      location = await Location.current();
    } catch(error) {
      location = await cache.read(CACHE_KEY_LOCATION);
    }
  }
  if (!location) {
    location = DEFAULT_LOCATION;
  }
  const url = "https://api.openweathermap.org/data/2.5/onecall?lat=" + location.latitude + "&lon=" + location.longitude + "&exclude=minutely,hourly,alerts&units=imperial&lang=en&appid=" + WEATHER_API_KEY;
  const address = await Location.reverseGeocode(location.latitude, location.longitude);
  const data = await fetchJson(`weather_${address[0].locality}`, url);

  const currentTime = new Date().getTime() / 1000;
  const isNight = currentTime >= data.current.sunset || currentTime <= data.current.sunrise

  return {
    location: `${address[0].postalAddress.city}, ${address[0].postalAddress.state}, ${address[0].postalAddress.country}`,
    icon: getWeatherEmoji(data.current.weather[0].id, isNight),
    description: data.current.weather[0].main,
    temperature: Math.round((data.current.temp - 32) / 1.8),
    high: Math.round((data.daily[0].temp.max - 32) / 1.8),
    low: Math.round((data.daily[0].temp.min - 32) / 1.8),
    feelsLike: Math.round((data.current.feels_like - 32) / 1.8),
    wind: Math.round(data.current.wind_speed),
  }
}

/**
 * Given a weather code from Open Weather Map, determine the best emoji to show.
 * 
 * @param {*} code Weather code from Open Weather Map
 * @param {*} isNight Is `true` if it is after sunset and before sunrise
 */
function getWeatherEmoji(code, isNight) {
  if (code >= 200 && code < 300 || code == 960 || code == 961) {
    return "⛈"
  } else if ((code >= 300 && code < 600) || code == 701) {
    return "🌧"
  } else if (code >= 600 && code < 700) {
    return "❄️"
  } else if (code == 711) {
    return "🔥" 
  } else if (code == 800) {
    return isNight ? "🌒" : "☀️" 
  } else if (code == 801) {
    return isNight ? "☁️" : "🌤"  
  } else if (code == 802) {
    return isNight ? "☁️" : "⛅️"  
  } else if (code == 803) {
    return isNight ? "☁️" : "🌥" 
  } else if (code == 804) {
    return "☁️"  
  } else if (code == 900 || code == 962 || code == 781) {
    return "🌪" 
  } else if (code >= 700 && code < 800) {
    return "🌫" 
  } else if (code == 903) {
    return "🥶"  
  } else if (code == 904) {
    return "🥵" 
  } else if (code == 905 || code == 957) {
    return "💨" 
  } else if (code == 906 || code == 958 || code == 959) {
    return "🧊" 
  } else {
    return "❓" 
  }
}

//-------------------------------------
// Misc. Helper Functions
//-------------------------------------

/**
 * Make a REST request and return the response
 * 
 * @param {*} key Cache key
 * @param {*} url URL to make the request to
 * @param {*} headers Headers for the request
 */
async function fetchJson(key, url, headers) {
  const cached = await cache.read(key, 5);
  if (cached) {
    return cached;
  }

  try {
    console.log(`Fetching url: ${url}`);
    const req = new Request(url);
    req.headers = headers;
    const resp = await req.loadJSON();
    cache.write(key, resp);
    return resp;
  } catch (error) {
    try {
      return cache.read(key, 5);
    } catch (error) {
      console.log(`Couldn't fetch ${url}`);
    }
  }
}

/**
 * Get the last updated timestamp from the Cache.
 */
async function getLastUpdated() {
  let cachedLastUpdated = await cache.read(CACHE_KEY_LAST_UPDATED);

  if (!cachedLastUpdated) {
    cachedLastUpdated = new Date().getTime();
    cache.write(CACHE_KEY_LAST_UPDATED, cachedLastUpdated);
  }

  return cachedLastUpdated;
}