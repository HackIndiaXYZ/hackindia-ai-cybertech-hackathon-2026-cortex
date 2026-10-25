export interface HourlyForecast {
  time: string;
  temp: number;
}

export interface DailyForecast {
  day: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
}

export interface WeatherData {
  location: string;
  temperature: number; // current temp
  humidity: number;
  windSpeed: number;
  rainVolume: number; // mm
  uvIndex: number;
  condition: "Sunny" | "Cloudy" | "Rainy" | "Snow" | "Clear";
  zone: string | null;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export const mockWeather: WeatherData = {
  location: "Jaipur, India",
  temperature: 38,
  humidity: 22,
  windSpeed: 14,
  rainVolume: 0,
  uvIndex: 9,
  condition: "Sunny",
  zone: "HOT_DRY",
  hourly: [
    { time: "12 PM", temp: 36 },
    { time: "1 PM", temp: 37 },
    { time: "2 PM", temp: 38 },
    { time: "3 PM", temp: 38 },
    { time: "4 PM", temp: 37 },
    { time: "5 PM", temp: 35 },
    { time: "6 PM", temp: 33 },
    { time: "7 PM", temp: 31 },
    { time: "8 PM", temp: 29 },
    { time: "9 PM", temp: 28 },
    { time: "10 PM", temp: 27 },
    { time: "11 PM", temp: 26 },
    { time: "12 AM", temp: 25 },
    { time: "1 AM", temp: 24 },
    { time: "2 AM", temp: 23 },
    { time: "3 AM", temp: 22 },
    { time: "4 AM", temp: 22 },
    { time: "5 AM", temp: 21 },
    { time: "6 AM", temp: 22 },
    { time: "7 AM", temp: 24 },
    { time: "8 AM", temp: 27 },
    { time: "9 AM", temp: 29 },
    { time: "10 AM", temp: 32 },
    { time: "11 AM", temp: 34 },
  ],
  daily: [
    { day: "Mon", minTemp: 22, maxTemp: 38, condition: "Sunny" },
    { day: "Tue", minTemp: 23, maxTemp: 39, condition: "Sunny" },
    { day: "Wed", minTemp: 24, maxTemp: 38, condition: "Cloudy" },
    { day: "Thu", minTemp: 22, maxTemp: 35, condition: "Rainy" },
    { day: "Fri", minTemp: 20, maxTemp: 33, condition: "Rainy" },
    { day: "Sat", minTemp: 19, maxTemp: 34, condition: "Sunny" },
    { day: "Sun", minTemp: 21, maxTemp: 37, condition: "Sunny" },
  ]
};
