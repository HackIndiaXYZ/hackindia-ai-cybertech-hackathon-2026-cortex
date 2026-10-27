/**
 * locationClimateZones.js
 * ------------------------------------------------------------------
 * Verified Indian city and district building climate zone classifications
 * adhering to NBC 2016 (Part 11 / Part 8) and ECBC 2017 / BEE guidelines.
 *
 * The 5 Indian Building Climate Zones:
 *  - Hot-Dry
 *  - Warm-Humid
 *  - Composite
 *  - Temperate
 *  - Cold
 *
 * Each listed entry includes a verifiable `source`.
 * If a selected location/district is not directly listed, the system
 * computes the geographical nearest listed city using Haversine distance,
 * returning "Nearest listed city: <city>".
 * If no coordinates or nearest match can be identified, "Climate zone not classified"
 * is returned and ranking is skipped.
 * ------------------------------------------------------------------
 */

export const CLIMATE_ZONES = {
  HOT_DRY: "Hot-Dry",
  WARM_HUMID: "Warm-Humid",
  COMPOSITE: "Composite",
  TEMPERATE: "Temperate",
  COLD: "Cold",
};

/**
 * Verified stations and cities from NBC 2016 Part 11 / ECBC 2017 Appendix B
 */
export const VERIFIED_CLIMATE_ZONES = [
  // --- COMPOSITE ---
  {
    id: "kanpur-nagar",
    name: "Kanpur Nagar",
    district: "Kanpur Nagar",
    state: "Uttar Pradesh",
    zone: "Composite",
    lat: 26.4499,
    lon: 80.3319,
    aliases: ["Kanpur", "Kanpur City"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "new-delhi",
    name: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    zone: "Composite",
    lat: 28.6139,
    lon: 77.2090,
    aliases: ["Delhi", "NCR"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "lucknow",
    name: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    zone: "Composite",
    lat: 26.8467,
    lon: 80.9462,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "agra",
    name: "Agra",
    district: "Agra",
    state: "Uttar Pradesh",
    zone: "Composite",
    lat: 27.1767,
    lon: 78.0081,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "varanasi",
    name: "Varanasi",
    district: "Varanasi",
    state: "Uttar Pradesh",
    zone: "Composite",
    lat: 25.3176,
    lon: 82.9739,
    aliases: ["Banaras", "Kashi"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "prayagraj",
    name: "Prayagraj",
    district: "Prayagraj",
    state: "Uttar Pradesh",
    zone: "Composite",
    lat: 25.4358,
    lon: 81.8463,
    aliases: ["Allahabad"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "bhopal",
    name: "Bhopal",
    district: "Bhopal",
    state: "Madhya Pradesh",
    zone: "Composite",
    lat: 23.2599,
    lon: 77.4126,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "gwalior",
    name: "Gwalior",
    district: "Gwalior",
    state: "Madhya Pradesh",
    zone: "Composite",
    lat: 26.2183,
    lon: 78.1828,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "indore",
    name: "Indore",
    district: "Indore",
    state: "Madhya Pradesh",
    zone: "Composite",
    lat: 22.7196,
    lon: 75.8577,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "amritsar",
    name: "Amritsar",
    district: "Amritsar",
    state: "Punjab",
    zone: "Composite",
    lat: 31.6340,
    lon: 74.8723,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "ludhiana",
    name: "Ludhiana",
    district: "Ludhiana",
    state: "Punjab",
    zone: "Composite",
    lat: 30.9010,
    lon: 75.8573,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "chandigarh",
    name: "Chandigarh",
    district: "Chandigarh",
    state: "Chandigarh",
    zone: "Composite",
    lat: 30.7333,
    lon: 76.7794,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "patna",
    name: "Patna",
    district: "Patna",
    state: "Bihar",
    zone: "Composite",
    lat: 25.5941,
    lon: 85.1376,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "raipur",
    name: "Raipur",
    district: "Raipur",
    state: "Chhattisgarh",
    zone: "Composite",
    lat: 21.2514,
    lon: 81.6296,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "nagpur",
    name: "Nagpur",
    district: "Nagpur",
    state: "Maharashtra",
    zone: "Composite",
    lat: 21.1458,
    lon: 79.0882,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    zone: "Composite",
    lat: 17.3850,
    lon: 78.4867,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "ranchi",
    name: "Ranchi",
    district: "Ranchi",
    state: "Jharkhand",
    zone: "Composite",
    lat: 23.3441,
    lon: 85.3096,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "dehradun",
    name: "Dehradun",
    district: "Dehradun",
    state: "Uttarakhand",
    zone: "Composite",
    lat: 30.3165,
    lon: 78.0322,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },

  // --- HOT-DRY ---
  {
    id: "jaipur",
    name: "Jaipur",
    district: "Jaipur",
    state: "Rajasthan",
    zone: "Hot-Dry",
    lat: 26.9124,
    lon: 75.7873,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "jodhpur",
    name: "Jodhpur",
    district: "Jodhpur",
    state: "Rajasthan",
    zone: "Hot-Dry",
    lat: 26.2389,
    lon: 73.0243,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "bikaner",
    name: "Bikaner",
    district: "Bikaner",
    state: "Rajasthan",
    zone: "Hot-Dry",
    lat: 28.0229,
    lon: 73.3119,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "jaisalmer",
    name: "Jaisalmer",
    district: "Jaisalmer",
    state: "Rajasthan",
    zone: "Hot-Dry",
    lat: 26.9157,
    lon: 70.9083,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "barmer",
    name: "Barmer",
    district: "Barmer",
    state: "Rajasthan",
    zone: "Hot-Dry",
    lat: 25.7521,
    lon: 71.3967,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "kota",
    name: "Kota",
    district: "Kota",
    state: "Rajasthan",
    zone: "Hot-Dry",
    lat: 25.2138,
    lon: 75.8648,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "solapur",
    name: "Solapur",
    district: "Solapur",
    state: "Maharashtra",
    zone: "Hot-Dry",
    lat: 17.6599,
    lon: 75.9064,
    aliases: ["Sholapur"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "ballari",
    name: "Ballari",
    district: "Ballari",
    state: "Karnataka",
    zone: "Hot-Dry",
    lat: 15.1394,
    lon: 76.9214,
    aliases: ["Bellary"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    zone: "Hot-Dry",
    lat: 23.0225,
    lon: 72.5714,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "rajkot",
    name: "Rajkot",
    district: "Rajkot",
    state: "Gujarat",
    zone: "Hot-Dry",
    lat: 22.3039,
    lon: 70.8022,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },

  // --- WARM-HUMID ---
  {
    id: "chennai",
    name: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    zone: "Warm-Humid",
    lat: 13.0827,
    lon: 80.2707,
    aliases: ["Madras"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    district: "Mumbai",
    state: "Maharashtra",
    zone: "Warm-Humid",
    lat: 19.0760,
    lon: 72.8777,
    aliases: ["Bombay"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    district: "Kolkata",
    state: "West Bengal",
    zone: "Warm-Humid",
    lat: 22.5726,
    lon: 88.3639,
    aliases: ["Calcutta"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "kochi",
    name: "Kochi",
    district: "Ernakulam",
    state: "Kerala",
    zone: "Warm-Humid",
    lat: 9.9312,
    lon: 76.2673,
    aliases: ["Cochin", "Ernakulam"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    state: "Kerala",
    zone: "Warm-Humid",
    lat: 8.5241,
    lon: 76.9366,
    aliases: ["Trivandrum"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "panaji",
    name: "Panaji",
    district: "North Goa",
    state: "Goa",
    zone: "Warm-Humid",
    lat: 15.4909,
    lon: 73.8278,
    aliases: ["Goa"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "mangaluru",
    name: "Mangaluru",
    district: "Dakshina Kannada",
    state: "Karnataka",
    zone: "Warm-Humid",
    lat: 12.9141,
    lon: 74.8560,
    aliases: ["Mangalore"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    zone: "Warm-Humid",
    lat: 17.6868,
    lon: 83.2185,
    aliases: ["Vizag"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "puri",
    name: "Puri",
    district: "Puri",
    state: "Odisha",
    zone: "Warm-Humid",
    lat: 19.8135,
    lon: 85.8312,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "bhubaneswar",
    name: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    zone: "Warm-Humid",
    lat: 20.2961,
    lon: 85.8245,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "surat",
    name: "Surat",
    district: "Surat",
    state: "Gujarat",
    zone: "Warm-Humid",
    lat: 21.1702,
    lon: 72.8311,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "guwahati",
    name: "Guwahati",
    district: "Kamrup Metropolitan",
    state: "Assam",
    zone: "Warm-Humid",
    lat: 26.1445,
    lon: 91.7362,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },

  // --- TEMPERATE ---
  {
    id: "bengaluru",
    name: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    zone: "Temperate",
    lat: 12.9716,
    lon: 77.5946,
    aliases: ["Bangalore"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "pune",
    name: "Pune",
    district: "Pune",
    state: "Maharashtra",
    zone: "Temperate",
    lat: 18.5204,
    lon: 73.8567,
    aliases: ["Poona"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },

  // --- COLD ---
  {
    id: "shimla",
    name: "Shimla",
    district: "Shimla",
    state: "Himachal Pradesh",
    zone: "Cold",
    lat: 31.1048,
    lon: 77.1734,
    aliases: ["Simla"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "srinagar",
    name: "Srinagar",
    district: "Srinagar",
    state: "Jammu and Kashmir",
    zone: "Cold",
    lat: 34.0837,
    lon: 74.7973,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "leh",
    name: "Leh",
    district: "Leh",
    state: "Ladakh",
    zone: "Cold",
    lat: 34.1526,
    lon: 77.5771,
    aliases: ["Ladakh"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "manali",
    name: "Manali",
    district: "Kullu",
    state: "Himachal Pradesh",
    zone: "Cold",
    lat: 32.2432,
    lon: 77.1892,
    aliases: ["Kullu"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "dharamshala",
    name: "Dharamshala",
    district: "Kangra",
    state: "Himachal Pradesh",
    zone: "Cold",
    lat: 32.2190,
    lon: 76.3234,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "mussoorie",
    name: "Mussoorie",
    district: "Dehradun (Hills)",
    state: "Uttarakhand",
    zone: "Cold",
    lat: 30.4598,
    lon: 78.0644,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "nainital",
    name: "Nainital",
    district: "Nainital",
    state: "Uttarakhand",
    zone: "Cold",
    lat: 29.3919,
    lon: 79.4542,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "gangtok",
    name: "Gangtok",
    district: "East Sikkim",
    state: "Sikkim",
    zone: "Cold",
    lat: 27.3314,
    lon: 88.6138,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "shillong",
    name: "Shillong",
    district: "East Khasi Hills",
    state: "Meghalaya",
    zone: "Cold",
    lat: 25.5788,
    lon: 91.8933,
    aliases: [],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
  {
    id: "ooty",
    name: "Ooty",
    district: "Nilgiris",
    state: "Tamil Nadu",
    zone: "Cold",
    lat: 11.4102,
    lon: 76.6950,
    aliases: ["Udhagamandalam"],
    source: "NBC 2016 (Part 11) / ECBC 2017 Table 2.1",
  },
];

/**
 * Sample unlisted districts with coordinates for testing & fallback demonstration.
 * (e.g. Unnao is ~18 km from Kanpur Nagar, Alwar is ~135 km from Jaipur, etc.)
 */
export const UNLISTED_SAMPLE_DISTRICTS = [
  {
    id: "unnao",
    name: "Unnao",
    district: "Unnao",
    state: "Uttar Pradesh",
    lat: 26.5400,
    lon: 80.4800,
  },
  {
    id: "fatehpur",
    name: "Fatehpur",
    district: "Fatehpur",
    state: "Uttar Pradesh",
    lat: 25.9288,
    lon: 80.8130,
  },
  {
    id: "sitapur",
    name: "Sitapur",
    district: "Sitapur",
    state: "Uttar Pradesh",
    lat: 27.5684,
    lon: 80.6829,
  },
  {
    id: "alwar",
    name: "Alwar",
    district: "Alwar",
    state: "Rajasthan",
    lat: 27.5530,
    lon: 76.6346,
  },
  {
    id: "thane",
    name: "Thane",
    district: "Thane",
    state: "Maharashtra",
    lat: 19.2183,
    lon: 72.9781,
  },
  {
    id: "solan",
    name: "Solan",
    district: "Solan",
    state: "Himachal Pradesh",
    lat: 30.9045,
    lon: 77.0967,
  },
];

/**
 * Calculates Great Circle distance between two lat/lon pairs in kilometres.
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest listed verified city for given coordinates.
 */
export function findNearestVerifiedCity(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return null;
  }
  let closest = null;
  let minDistance = Infinity;

  for (const entry of VERIFIED_CLIMATE_ZONES) {
    const dist = haversineDistanceKm(lat, lon, entry.lat, entry.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = { ...entry, distanceKm: Math.round(dist) };
    }
  }
  return closest;
}

/**
 * Resolves the climate zone for an Indian city, district, or coordinate pair.
 *
 * Rules:
 *  1. If exact or alias match is found in verified list:
 *     return { zone, source, nearestCity: null, isFallback: false, unclassified: false }
 *  2. If unlisted district with coordinates, fall back to nearest listed city:
 *     return { zone, source: nearest.source, nearestCity: nearest.name, isFallback: true, unclassified: false }
 *  3. If not found and no coordinates:
 *     return { zone: null, source: null, nearestCity: null, isFallback: false, unclassified: true, message: "Climate zone not classified" }
 */
export function resolveLocationClimate(queryOrObj) {
  if (!queryOrObj) {
    return {
      zone: null,
      source: null,
      nearestCity: null,
      isFallback: false,
      unclassified: true,
      message: "Climate zone not classified",
    };
  }

  // Handle object input with name, district, or lat/lon
  let name = "";
  let lat = null;
  let lon = null;

  if (typeof queryOrObj === "string") {
    name = queryOrObj.trim();
  } else if (typeof queryOrObj === "object") {
    name = queryOrObj.name || queryOrObj.district || "";
    lat = typeof queryOrObj.lat === "number" ? queryOrObj.lat : (typeof queryOrObj.latitude === "number" ? queryOrObj.latitude : null);
    lon = typeof queryOrObj.lon === "number" ? queryOrObj.lon : (typeof queryOrObj.longitude === "number" ? queryOrObj.longitude : null);
  }

  const cleanName = name.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();

  // 1. Direct match check on verified list (name, district, or aliases)
  if (cleanName) {
    for (const entry of VERIFIED_CLIMATE_ZONES) {
      const entryName = entry.name.toLowerCase();
      const entryDistrict = entry.district.toLowerCase();
      const matchName = cleanName === entryName || cleanName.includes(entryName) || entryName.includes(cleanName);
      const matchDistrict = cleanName === entryDistrict || cleanName.includes(entryDistrict);
      const matchAlias = entry.aliases && entry.aliases.some((a) => {
        const al = a.toLowerCase();
        return cleanName === al || cleanName.includes(al) || al.includes(cleanName);
      });

      if (matchName || matchDistrict || matchAlias) {
        return {
          id: entry.id,
          name: entry.name,
          district: entry.district,
          state: entry.state,
          zone: entry.zone,
          source: entry.source,
          nearestCity: null,
          isFallback: false,
          unclassified: false,
        };
      }
    }

    // Check sample unlisted districts list to extract coordinates if not provided
    if ((lat === null || lon === null) && cleanName) {
      const unlisted = UNLISTED_SAMPLE_DISTRICTS.find((u) => {
        const uName = u.name.toLowerCase();
        return cleanName === uName || cleanName.includes(uName);
      });
      if (unlisted) {
        lat = unlisted.lat;
        lon = unlisted.lon;
      }
    }
  }

  // 2. Coordinate fallback to nearest listed city
  if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
    const nearest = findNearestVerifiedCity(lat, lon);
    if (nearest) {
      return {
        id: `fallback-${nearest.id}`,
        name: name || `Near ${nearest.name}`,
        district: name || nearest.district,
        state: nearest.state,
        zone: nearest.zone,
        source: nearest.source,
        nearestCity: nearest.name,
        distanceKm: nearest.distanceKm,
        isFallback: true,
        unclassified: false,
        fallbackText: `Nearest listed city: ${nearest.name}`,
      };
    }
  }

  // 3. Unclassified
  return {
    zone: null,
    source: null,
    nearestCity: null,
    isFallback: false,
    unclassified: true,
    message: "Climate zone not classified",
  };
}

/**
 * Returns searchable list combining verified cities and sample unlisted districts.
 */
export function getAllSearchableLocations() {
  const verified = VERIFIED_CLIMATE_ZONES.map((c) => ({
    id: c.id,
    name: `${c.name}, ${c.state}`,
    cityName: c.name,
    district: c.district,
    state: c.state,
    zone: c.zone,
    lat: c.lat,
    lon: c.lon,
    source: c.source,
    isVerified: true,
  }));

  const unlisted = UNLISTED_SAMPLE_DISTRICTS.map((u) => ({
    id: u.id,
    name: `${u.name}, ${u.state}`,
    cityName: u.name,
    district: u.district,
    state: u.state,
    zone: null,
    lat: u.lat,
    lon: u.lon,
    source: null,
    isVerified: false,
  }));

  return [...verified, ...unlisted];
}
