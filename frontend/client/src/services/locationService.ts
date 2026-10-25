export interface GeocodedLocation {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

// Mock search results
const mockResults: GeocodedLocation[] = [
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, state: "Rajasthan", country: "India" },
  { name: "London", lat: 51.5074, lon: -0.1278, country: "United Kingdom" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, country: "Singapore" },
  { name: "Phoenix", lat: 33.4484, lon: -112.074, state: "Arizona", country: "USA" },
  { name: "Oslo", lat: 59.9139, lon: 10.7522, country: "Norway" },
  { name: "Lagos", lat: 6.5244, lon: 3.3792, country: "Nigeria" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, state: "New South Wales", country: "Australia" }
];

export const locationService = {
  /**
   * Search for locations by query. Isolated for future API swap.
   */
  async search(query: string): Promise<GeocodedLocation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const q = query.toLowerCase();
        const results = mockResults.filter(
          (loc) =>
            loc.name.toLowerCase().includes(q) ||
            loc.country?.toLowerCase().includes(q) ||
            loc.state?.toLowerCase().includes(q)
        );
        resolve(results.slice(0, 5));
      }, 400); // Simulate network delay
    });
  }
};
