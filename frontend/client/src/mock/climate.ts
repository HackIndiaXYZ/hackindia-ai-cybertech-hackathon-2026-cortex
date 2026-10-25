export interface ClimateMonth {
  month: string;
  temp: number; // Avg temp
  minTemp: number;
  maxTemp: number;
  rain: number; // mm
  humidity: number;
}

export const mockClimateData: ClimateMonth[] = [
  { month: "Jan", temp: 15, minTemp: 8, maxTemp: 22, rain: 5, humidity: 30 },
  { month: "Feb", temp: 18, minTemp: 11, maxTemp: 26, rain: 10, humidity: 28 },
  { month: "Mar", temp: 24, minTemp: 16, maxTemp: 32, rain: 5, humidity: 25 },
  { month: "Apr", temp: 30, minTemp: 22, maxTemp: 38, rain: 2, humidity: 22 },
  { month: "May", temp: 34, minTemp: 26, maxTemp: 41, rain: 15, humidity: 25 },
  { month: "Jun", temp: 33, minTemp: 27, maxTemp: 39, rain: 85, humidity: 55 },
  { month: "Jul", temp: 30, minTemp: 25, maxTemp: 34, rain: 210, humidity: 75 },
  { month: "Aug", temp: 28, minTemp: 24, maxTemp: 32, rain: 230, humidity: 80 },
  { month: "Sep", temp: 29, minTemp: 23, maxTemp: 34, rain: 90, humidity: 65 },
  { month: "Oct", temp: 27, minTemp: 19, maxTemp: 34, rain: 15, humidity: 40 },
  { month: "Nov", temp: 21, minTemp: 13, maxTemp: 29, rain: 5, humidity: 35 },
  { month: "Dec", temp: 17, minTemp: 9, maxTemp: 24, rain: 2, humidity: 32 },
];
