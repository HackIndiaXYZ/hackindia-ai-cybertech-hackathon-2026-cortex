# Thermal_Shelter
# start frontend 
cd frontend
npm install
npm run dev

# start backend 
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
