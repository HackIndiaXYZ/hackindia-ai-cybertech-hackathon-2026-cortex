---
trigger: always_on
---

backend/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   └── routes/
│   │       └── analysis.py
│   │
│   ├── services/
│   │   ├── weather_service.py
│   │   ├── flood_service.py
│   │   └── geocoding_service.py
│   │
│   ├── analysis/
│   │   ├── environment_analyzer.py
│   │   └── rules.py
│   │
│   ├── schemas/
│   │   └── analysis_schema.py
│   │
│   └── core/
│       └── config.py
│
├── tests/
│   ├── test_analysis.py
│   └── test_api.py
│
├── requirements.txt
├── .env
└── README.md