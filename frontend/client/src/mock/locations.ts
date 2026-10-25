import type { ZoneOrNeutral } from "../types";

export interface MockLocation {
  id: string;
  name: string;
  zone: ZoneOrNeutral;
}

export const MOCK_LOCATIONS: MockLocation[] = [
  { id: "1",  name: "Jaipur, Rajasthan, India",        zone: "HOT_DRY"    },
  { id: "2",  name: "Dubai, United Arab Emirates",     zone: "HOT_DRY"    },
  { id: "3",  name: "Phoenix, Arizona, USA",           zone: "HOT_DRY"    },
  { id: "4",  name: "Riyadh, Saudi Arabia",            zone: "HOT_DRY"    },
  { id: "5",  name: "Jodhpur, Rajasthan, India",       zone: "HOT_DRY"    },
  { id: "6",  name: "Mumbai, Maharashtra, India",      zone: "WARM_HUMID" },
  { id: "7",  name: "Singapore",                       zone: "WARM_HUMID" },
  { id: "8",  name: "Miami, Florida, USA",             zone: "WARM_HUMID" },
  { id: "9",  name: "Kochi, Kerala, India",            zone: "WARM_HUMID" },
  { id: "10", name: "Bangkok, Thailand",               zone: "WARM_HUMID" },
  { id: "11", name: "New Delhi, India",                zone: "COMPOSITE"  },
  { id: "12", name: "Chicago, Illinois, USA",          zone: "COMPOSITE"  },
  { id: "13", name: "Beijing, China",                  zone: "COMPOSITE"  },
  { id: "14", name: "Hyderabad, Telangana, India",     zone: "COMPOSITE"  },
  { id: "15", name: "Istanbul, Turkey",                zone: "COMPOSITE"  },
  { id: "16", name: "London, United Kingdom",          zone: "TEMPERATE"  },
  { id: "17", name: "Sydney, New South Wales, Australia", zone: "TEMPERATE" },
  { id: "18", name: "Bangalore, Karnataka, India",     zone: "TEMPERATE"  },
  { id: "19", name: "Portland, Oregon, USA",           zone: "TEMPERATE"  },
  { id: "20", name: "Amsterdam, Netherlands",          zone: "TEMPERATE"  },
  { id: "21", name: "Oslo, Norway",                   zone: "COLD"       },
  { id: "22", name: "Shimla, Himachal Pradesh, India", zone: "COLD"       },
  { id: "23", name: "Toronto, Ontario, Canada",        zone: "COLD"       },
  { id: "24", name: "Helsinki, Finland",               zone: "COLD"       },
  { id: "25", name: "Leh, Ladakh, India",              zone: "COLD"       },
];
