import type { PshLocation } from './types';

/**
 * Curated peak-sun-hour reference locations (winter/summer anchors).
 *
 * Monthly PSH profiles are derived deterministically at seed time from the
 * winter/summer anchors + latitude (see `synthMonthlyPsh` in the core engine),
 * so every seeded city carries a 12-value profile that the engine consumes
 * directly and uses for worst-month auto-selection.
 *
 * PSH values are engineering-representative long-term averages for each
 * climate, not measured site data.
 */

interface PshEntry {
  id: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  winterPsh: number;
  summerPsh: number;
  recommendedTilt: number;
}

const RAW_PSH: PshEntry[] = [
  { id: 'psh-abu-dhabi', country: 'UAE', city: 'Abu Dhabi', latitude: 24.45, longitude: 54.38, winterPsh: 4.6, summerPsh: 6.4, recommendedTilt: 24 },
  { id: 'psh-abuja', country: 'Nigeria', city: 'Abuja', latitude: 9.07, longitude: 7.5, winterPsh: 4.8, summerPsh: 5.3, recommendedTilt: 9 },
  { id: 'psh-accra', country: 'Ghana', city: 'Accra', latitude: 5.6, longitude: -0.19, winterPsh: 4.4, summerPsh: 4.9, recommendedTilt: 6 },
  { id: 'psh-addis-ababa', country: 'Ethiopia', city: 'Addis Ababa', latitude: 9.03, longitude: 38.74, winterPsh: 4.9, summerPsh: 5.3, recommendedTilt: 9 },
  { id: 'psh-adelaide', country: 'Australia', city: 'Adelaide', latitude: -34.93, longitude: 138.6, winterPsh: 2.9, summerPsh: 6.8, recommendedTilt: 33 },
  { id: 'psh-algiers', country: 'Algeria', city: 'Algiers', latitude: 36.75, longitude: 3.06, winterPsh: 2.5, summerPsh: 6.9, recommendedTilt: 33 },
  { id: 'psh-amman', country: 'Jordan', city: 'Amman', latitude: 31.95, longitude: 35.93, winterPsh: 3.5, summerPsh: 7.0, recommendedTilt: 31 },
  { id: 'psh-amsterdam', country: 'Netherlands', city: 'Amsterdam', latitude: 52.37, longitude: 4.9, winterPsh: 0.6, summerPsh: 4.8, recommendedTilt: 38 },
  { id: 'psh-athens', country: 'Greece', city: 'Athens', latitude: 37.98, longitude: 23.73, winterPsh: 2.2, summerPsh: 7.3, recommendedTilt: 33 },
  { id: 'psh-atlanta', country: 'USA', city: 'Atlanta', latitude: 33.75, longitude: -84.39, winterPsh: 3.0, summerPsh: 5.8, recommendedTilt: 30 },
  { id: 'psh-auckland', country: 'New Zealand', city: 'Auckland', latitude: -36.85, longitude: 174.76, winterPsh: 2.5, summerPsh: 5.8, recommendedTilt: 36 },
  { id: 'psh-bangkok', country: 'Thailand', city: 'Bangkok', latitude: 13.76, longitude: 100.5, winterPsh: 4.6, summerPsh: 4.3, recommendedTilt: 13 },
  { id: 'psh-bangalore', country: 'India', city: 'Bangalore', latitude: 12.97, longitude: 77.59, winterPsh: 5.3, summerPsh: 4.9, recommendedTilt: 13 },
  { id: 'psh-barcelona', country: 'Spain', city: 'Barcelona', latitude: 41.39, longitude: 2.17, winterPsh: 2.3, summerPsh: 6.7, recommendedTilt: 34 },
  { id: 'psh-beijing', country: 'China', city: 'Beijing', latitude: 39.9, longitude: 116.41, winterPsh: 2.8, summerPsh: 5.8, recommendedTilt: 36 },
  { id: 'psh-beirut', country: 'Lebanon', city: 'Beirut', latitude: 33.89, longitude: 35.5, winterPsh: 2.9, summerPsh: 6.9, recommendedTilt: 32 },
  { id: 'psh-berlin', country: 'Germany', city: 'Berlin', latitude: 52.52, longitude: 13.4, winterPsh: 0.7, summerPsh: 5.0, recommendedTilt: 40 },
  { id: 'psh-bogota', country: 'Colombia', city: 'Bogotá', latitude: 4.71, longitude: -74.07, winterPsh: 4.1, summerPsh: 4.6, recommendedTilt: 5 },
  { id: 'psh-boston', country: 'USA', city: 'Boston', latitude: 42.36, longitude: -71.06, winterPsh: 2.0, summerPsh: 5.4, recommendedTilt: 37 },
  { id: 'psh-brasilia', country: 'Brazil', city: 'Brasília', latitude: -15.79, longitude: -47.88, winterPsh: 4.9, summerPsh: 5.2, recommendedTilt: 16 },
  { id: 'psh-brisbane', country: 'Australia', city: 'Brisbane', latitude: -27.47, longitude: 153.03, winterPsh: 4.3, summerPsh: 6.2, recommendedTilt: 28 },
  { id: 'psh-brussels', country: 'Belgium', city: 'Brussels', latitude: 50.85, longitude: 4.35, winterPsh: 0.7, summerPsh: 4.7, recommendedTilt: 38 },
  { id: 'psh-budapest', country: 'Hungary', city: 'Budapest', latitude: 47.5, longitude: 19.04, winterPsh: 1.1, summerPsh: 5.9, recommendedTilt: 38 },
  { id: 'psh-buenos-aires', country: 'Argentina', city: 'Buenos Aires', latitude: -34.6, longitude: -58.38, winterPsh: 2.9, summerPsh: 6.2, recommendedTilt: 33 },
  { id: 'psh-cairo', country: 'Egypt', city: 'Cairo', latitude: 30.04, longitude: 31.24, winterPsh: 4.3, summerPsh: 7.0, recommendedTilt: 29 },
  { id: 'psh-cape-town', country: 'South Africa', city: 'Cape Town', latitude: -33.92, longitude: 18.42, winterPsh: 3.4, summerPsh: 6.5, recommendedTilt: 34 },
  { id: 'psh-caracas', country: 'Venezuela', city: 'Caracas', latitude: 10.48, longitude: -66.9, winterPsh: 4.5, summerPsh: 5.4, recommendedTilt: 10 },
  { id: 'psh-casablanca', country: 'Morocco', city: 'Casablanca', latitude: 33.57, longitude: -7.59, winterPsh: 3.2, summerPsh: 6.6, recommendedTilt: 32 },
  { id: 'psh-chennai', country: 'India', city: 'Chennai', latitude: 13.08, longitude: 80.27, winterPsh: 5.1, summerPsh: 4.6, recommendedTilt: 13 },
  { id: 'psh-chicago', country: 'USA', city: 'Chicago', latitude: 41.88, longitude: -87.63, winterPsh: 1.9, summerPsh: 5.5, recommendedTilt: 38 },
  { id: 'psh-colombo', country: 'Sri Lanka', city: 'Colombo', latitude: 6.93, longitude: 79.86, winterPsh: 4.6, summerPsh: 4.8, recommendedTilt: 7 },
  { id: 'psh-copenhagen', country: 'Denmark', city: 'Copenhagen', latitude: 55.68, longitude: 12.57, winterPsh: 0.5, summerPsh: 4.8, recommendedTilt: 40 },
  { id: 'psh-dakar', country: 'Senegal', city: 'Dakar', latitude: 14.69, longitude: -17.44, winterPsh: 4.8, summerPsh: 5.5, recommendedTilt: 15 },
  { id: 'psh-dallas', country: 'USA', city: 'Dallas', latitude: 32.78, longitude: -96.8, winterPsh: 3.4, summerPsh: 5.9, recommendedTilt: 30 },
  { id: 'psh-dar-es-salaam', country: 'Tanzania', city: 'Dar es Salaam', latitude: -6.79, longitude: 39.21, winterPsh: 4.4, summerPsh: 5.3, recommendedTilt: 7 },
  { id: 'psh-denver', country: 'USA', city: 'Denver', latitude: 39.74, longitude: -104.99, winterPsh: 3.9, summerPsh: 6.1, recommendedTilt: 35 },
  { id: 'psh-dhaka', country: 'Bangladesh', city: 'Dhaka', latitude: 23.81, longitude: 90.41, winterPsh: 4.2, summerPsh: 4.0, recommendedTilt: 23 },
  { id: 'psh-doha', country: 'Qatar', city: 'Doha', latitude: 25.29, longitude: 51.53, winterPsh: 4.7, summerPsh: 6.5, recommendedTilt: 25 },
  { id: 'psh-dubai', country: 'UAE', city: 'Dubai', latitude: 25.2, longitude: 55.27, winterPsh: 4.5, summerPsh: 6.3, recommendedTilt: 24 },
  { id: 'psh-dublin', country: 'Ireland', city: 'Dublin', latitude: 53.35, longitude: -6.26, winterPsh: 0.8, summerPsh: 4.7, recommendedTilt: 35 },
  { id: 'psh-edinburgh', country: 'UK', city: 'Edinburgh', latitude: 55.95, longitude: -3.19, winterPsh: 0.6, summerPsh: 4.4, recommendedTilt: 40 },
  { id: 'psh-frankfurt', country: 'Germany', city: 'Frankfurt', latitude: 50.11, longitude: 8.68, winterPsh: 0.8, summerPsh: 5.1, recommendedTilt: 38 },
  { id: 'psh-guadalajara', country: 'Mexico', city: 'Guadalajara', latitude: 20.66, longitude: -103.35, winterPsh: 5.1, summerPsh: 5.8, recommendedTilt: 21 },
  { id: 'psh-hanoi', country: 'Vietnam', city: 'Hanoi', latitude: 21.03, longitude: 105.85, winterPsh: 3.0, summerPsh: 4.6, recommendedTilt: 21 },
  { id: 'psh-harare', country: 'Zimbabwe', city: 'Harare', latitude: -17.83, longitude: 31.05, winterPsh: 5.0, summerPsh: 6.0, recommendedTilt: 18 },
  { id: 'psh-havana', country: 'Cuba', city: 'Havana', latitude: 23.11, longitude: -82.37, winterPsh: 4.4, summerPsh: 5.7, recommendedTilt: 23 },
  { id: 'psh-helsinki', country: 'Finland', city: 'Helsinki', latitude: 60.17, longitude: 24.94, winterPsh: 0.3, summerPsh: 5.1, recommendedTilt: 45 },
  { id: 'psh-ho-chi-minh', country: 'Vietnam', city: 'Ho Chi Minh City', latitude: 10.82, longitude: 106.63, winterPsh: 3.9, summerPsh: 4.2, recommendedTilt: 11 },
  { id: 'psh-hong-kong', country: 'China', city: 'Hong Kong', latitude: 22.32, longitude: 114.17, winterPsh: 3.1, summerPsh: 4.6, recommendedTilt: 22 },
  { id: 'psh-houston', country: 'USA', city: 'Houston', latitude: 29.76, longitude: -95.37, winterPsh: 3.2, summerPsh: 5.6, recommendedTilt: 29 },
  { id: 'psh-hyderabad', country: 'India', city: 'Hyderabad', latitude: 17.39, longitude: 78.49, winterPsh: 5.2, summerPsh: 5.1, recommendedTilt: 17 },
  { id: 'psh-istanbul', country: 'Turkey', city: 'Istanbul', latitude: 41.01, longitude: 28.98, winterPsh: 1.8, summerPsh: 6.4, recommendedTilt: 36 },
  { id: 'psh-jakarta', country: 'Indonesia', city: 'Jakarta', latitude: -6.21, longitude: 106.85, winterPsh: 3.9, summerPsh: 4.5, recommendedTilt: 6 },
  { id: 'psh-johannesburg', country: 'South Africa', city: 'Johannesburg', latitude: -26.2, longitude: 28.05, winterPsh: 4.5, summerPsh: 5.7, recommendedTilt: 27 },
  { id: 'psh-kampala', country: 'Uganda', city: 'Kampala', latitude: 0.35, longitude: 32.58, winterPsh: 4.8, summerPsh: 5.1, recommendedTilt: 0 },
  { id: 'psh-karachi', country: 'Pakistan', city: 'Karachi', latitude: 24.86, longitude: 67.01, winterPsh: 4.8, summerPsh: 5.7, recommendedTilt: 24 },
  { id: 'psh-kathmandu', country: 'Nepal', city: 'Kathmandu', latitude: 27.72, longitude: 85.32, winterPsh: 4.0, summerPsh: 5.0, recommendedTilt: 27 },
  { id: 'psh-kigali', country: 'Rwanda', city: 'Kigali', latitude: -1.94, longitude: 30.06, winterPsh: 4.6, summerPsh: 5.0, recommendedTilt: 8 },
  { id: 'psh-kolkata', country: 'India', city: 'Kolkata', latitude: 22.57, longitude: 88.36, winterPsh: 4.5, summerPsh: 4.2, recommendedTilt: 22 },
  { id: 'psh-kuala-lumpur', country: 'Malaysia', city: 'Kuala Lumpur', latitude: 3.14, longitude: 101.69, winterPsh: 3.8, summerPsh: 4.3, recommendedTilt: 3 },
  { id: 'psh-lagos', country: 'Nigeria', city: 'Lagos', latitude: 6.52, longitude: 3.38, winterPsh: 3.9, summerPsh: 4.7, recommendedTilt: 8 },
  { id: 'psh-lahore', country: 'Pakistan', city: 'Lahore', latitude: 31.55, longitude: 74.34, winterPsh: 3.5, summerPsh: 5.8, recommendedTilt: 31 },
  { id: 'psh-las-vegas', country: 'USA', city: 'Las Vegas', latitude: 36.17, longitude: -115.14, winterPsh: 4.8, summerPsh: 7.6, recommendedTilt: 32 },
  { id: 'psh-lima', country: 'Peru', city: 'Lima', latitude: -12.05, longitude: -77.04, winterPsh: 4.3, summerPsh: 5.6, recommendedTilt: 12 },
  { id: 'psh-lisbon', country: 'Portugal', city: 'Lisbon', latitude: 38.72, longitude: -9.14, winterPsh: 2.7, summerPsh: 7.2, recommendedTilt: 33 },
  { id: 'psh-london', country: 'UK', city: 'London', latitude: 51.51, longitude: -0.13, winterPsh: 0.8, summerPsh: 4.9, recommendedTilt: 35 },
  { id: 'psh-los-angeles', country: 'USA', city: 'Los Angeles', latitude: 34.05, longitude: -118.24, winterPsh: 3.9, summerPsh: 6.6, recommendedTilt: 31 },
  { id: 'psh-lusaka', country: 'Zambia', city: 'Lusaka', latitude: -15.39, longitude: 28.32, winterPsh: 4.9, summerPsh: 5.9, recommendedTilt: 15 },
  { id: 'psh-madrid', country: 'Spain', city: 'Madrid', latitude: 40.42, longitude: -3.7, winterPsh: 2.9, summerPsh: 7.1, recommendedTilt: 32 },
  { id: 'psh-manchester', country: 'UK', city: 'Manchester', latitude: 53.48, longitude: -2.24, winterPsh: 0.6, summerPsh: 4.2, recommendedTilt: 40 },
  { id: 'psh-manila', country: 'Philippines', city: 'Manila', latitude: 14.6, longitude: 120.98, winterPsh: 4.3, summerPsh: 5.0, recommendedTilt: 13 },
  { id: 'psh-melbourne', country: 'Australia', city: 'Melbourne', latitude: -37.81, longitude: 144.96, winterPsh: 2.6, summerPsh: 6.2, recommendedTilt: 36 },
  { id: 'psh-mexico-city', country: 'Mexico', city: 'Mexico City', latitude: 19.43, longitude: -99.13, winterPsh: 5.0, summerPsh: 5.6, recommendedTilt: 20 },
  { id: 'psh-miami', country: 'USA', city: 'Miami', latitude: 25.76, longitude: -80.19, winterPsh: 4.3, summerPsh: 5.5, recommendedTilt: 26 },
  { id: 'psh-milan', country: 'Italy', city: 'Milan', latitude: 45.46, longitude: 9.19, winterPsh: 1.4, summerPsh: 6.0, recommendedTilt: 37 },
  { id: 'psh-montreal', country: 'Canada', city: 'Montreal', latitude: 45.5, longitude: -73.57, winterPsh: 1.7, summerPsh: 5.2, recommendedTilt: 40 },
  { id: 'psh-munich', country: 'Germany', city: 'Munich', latitude: 48.14, longitude: 11.58, winterPsh: 0.9, summerPsh: 5.3, recommendedTilt: 38 },
  { id: 'psh-mumbai', country: 'India', city: 'Mumbai', latitude: 19.08, longitude: 72.88, winterPsh: 5.1, summerPsh: 3.5, recommendedTilt: 15 },
  { id: 'psh-nairobi', country: 'Kenya', city: 'Nairobi', latitude: -1.29, longitude: 36.82, winterPsh: 5.5, summerPsh: 5.2, recommendedTilt: 0 },
  { id: 'psh-new-delhi', country: 'India', city: 'New Delhi', latitude: 28.61, longitude: 77.21, winterPsh: 3.9, summerPsh: 5.9, recommendedTilt: 28 },
  { id: 'psh-new-york', country: 'USA', city: 'New York', latitude: 40.71, longitude: -74.01, winterPsh: 2.2, summerPsh: 5.4, recommendedTilt: 34 },
  { id: 'psh-osaka', country: 'Japan', city: 'Osaka', latitude: 34.69, longitude: 135.5, winterPsh: 2.6, summerPsh: 4.7, recommendedTilt: 33 },
  { id: 'psh-oslo', country: 'Norway', city: 'Oslo', latitude: 59.91, longitude: 10.75, winterPsh: 0.4, summerPsh: 5.0, recommendedTilt: 40 },
  { id: 'psh-paris', country: 'France', city: 'Paris', latitude: 48.86, longitude: 2.35, winterPsh: 1.0, summerPsh: 5.0, recommendedTilt: 35 },
  { id: 'psh-perth', country: 'Australia', city: 'Perth', latitude: -31.95, longitude: 115.86, winterPsh: 3.2, summerPsh: 7.7, recommendedTilt: 32 },
  { id: 'psh-phoenix', country: 'USA', city: 'Phoenix', latitude: 33.45, longitude: -112.07, winterPsh: 5.0, summerPsh: 7.4, recommendedTilt: 30 },
  { id: 'psh-prague', country: 'Czech Republic', city: 'Prague', latitude: 50.08, longitude: 14.44, winterPsh: 1.0, summerPsh: 5.3, recommendedTilt: 38 },
  { id: 'psh-quito', country: 'Ecuador', city: 'Quito', latitude: -0.18, longitude: -78.47, winterPsh: 4.7, summerPsh: 5.1, recommendedTilt: 0 },
  { id: 'psh-rio-de-janeiro', country: 'Brazil', city: 'Rio de Janeiro', latitude: -22.91, longitude: -43.17, winterPsh: 4.0, summerPsh: 5.1, recommendedTilt: 23 },
  { id: 'psh-riyadh', country: 'Saudi Arabia', city: 'Riyadh', latitude: 24.71, longitude: 46.68, winterPsh: 4.6, summerPsh: 7.1, recommendedTilt: 24 },
  { id: 'psh-rome', country: 'Italy', city: 'Rome', latitude: 41.9, longitude: 12.5, winterPsh: 2.0, summerPsh: 6.9, recommendedTilt: 32 },
  { id: 'psh-san-francisco', country: 'USA', city: 'San Francisco', latitude: 37.77, longitude: -122.42, winterPsh: 2.9, summerPsh: 6.3, recommendedTilt: 31 },
  { id: 'psh-santiago', country: 'Chile', city: 'Santiago', latitude: -33.45, longitude: -70.67, winterPsh: 4.0, summerPsh: 7.4, recommendedTilt: 32 },
  { id: 'psh-sao-paulo', country: 'Brazil', city: 'São Paulo', latitude: -23.55, longitude: -46.63, winterPsh: 3.8, summerPsh: 4.4, recommendedTilt: 23 },
  { id: 'psh-seattle', country: 'USA', city: 'Seattle', latitude: 47.61, longitude: -122.33, winterPsh: 1.3, summerPsh: 5.7, recommendedTilt: 40 },
  { id: 'psh-seoul', country: 'South Korea', city: 'Seoul', latitude: 37.57, longitude: 126.98, winterPsh: 2.5, summerPsh: 4.7, recommendedTilt: 33 },
  { id: 'psh-shanghai', country: 'China', city: 'Shanghai', latitude: 31.23, longitude: 121.47, winterPsh: 2.8, summerPsh: 4.7, recommendedTilt: 30 },
  { id: 'psh-singapore', country: 'Singapore', city: 'Singapore', latitude: 1.35, longitude: 103.82, winterPsh: 3.7, summerPsh: 4.4, recommendedTilt: 5 },
  { id: 'psh-stockholm', country: 'Sweden', city: 'Stockholm', latitude: 59.33, longitude: 18.07, winterPsh: 0.4, summerPsh: 5.1, recommendedTilt: 42 },
  { id: 'psh-suva', country: 'Fiji', city: 'Suva', latitude: -18.14, longitude: 178.44, winterPsh: 3.8, summerPsh: 4.9, recommendedTilt: 18 },
  { id: 'psh-sydney', country: 'Australia', city: 'Sydney', latitude: -33.87, longitude: 151.21, winterPsh: 3.1, summerPsh: 5.8, recommendedTilt: 33 },
  { id: 'psh-taipei', country: 'Taiwan', city: 'Taipei', latitude: 25.03, longitude: 121.57, winterPsh: 2.4, summerPsh: 4.5, recommendedTilt: 25 },
  { id: 'psh-tehran', country: 'Iran', city: 'Tehran', latitude: 35.69, longitude: 51.39, winterPsh: 3.1, summerPsh: 6.9, recommendedTilt: 33 },
  { id: 'psh-tel-aviv', country: 'Israel', city: 'Tel Aviv', latitude: 32.09, longitude: 34.78, winterPsh: 3.2, summerPsh: 6.8, recommendedTilt: 31 },
  { id: 'psh-tokyo', country: 'Japan', city: 'Tokyo', latitude: 35.68, longitude: 139.69, winterPsh: 2.7, summerPsh: 4.6, recommendedTilt: 33 },
  { id: 'psh-toronto', country: 'Canada', city: 'Toronto', latitude: 43.65, longitude: -79.38, winterPsh: 1.6, summerPsh: 5.1, recommendedTilt: 36 },
  { id: 'psh-tunis', country: 'Tunisia', city: 'Tunis', latitude: 36.81, longitude: 10.18, winterPsh: 2.7, summerPsh: 6.9, recommendedTilt: 33 },
  { id: 'psh-vancouver', country: 'Canada', city: 'Vancouver', latitude: 49.28, longitude: -123.12, winterPsh: 1.0, summerPsh: 5.2, recommendedTilt: 42 },
  { id: 'psh-vienna', country: 'Austria', city: 'Vienna', latitude: 48.21, longitude: 16.37, winterPsh: 1.0, summerPsh: 5.6, recommendedTilt: 38 },
  { id: 'psh-warsaw', country: 'Poland', city: 'Warsaw', latitude: 52.23, longitude: 21.01, winterPsh: 0.7, summerPsh: 5.0, recommendedTilt: 40 },
  { id: 'psh-washington-dc', country: 'USA', city: 'Washington DC', latitude: 38.91, longitude: -77.04, winterPsh: 2.3, summerPsh: 5.6, recommendedTilt: 35 },
  { id: 'psh-wellington', country: 'New Zealand', city: 'Wellington', latitude: -41.29, longitude: 174.78, winterPsh: 2.2, summerPsh: 5.9, recommendedTilt: 40 },
  { id: 'psh-zurich', country: 'Switzerland', city: 'Zurich', latitude: 47.37, longitude: 8.54, winterPsh: 0.8, summerPsh: 5.1, recommendedTilt: 40 },
];

export const SEED_PSH: PshLocation[] = RAW_PSH.map((entry) => ({ ...entry }));
