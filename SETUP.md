# Setup Guide for SuRaksha MAPS v4.0

This guide is intended for colleagues and developers looking to run the project locally.

## Prerequisites
- **Node.js**: v18 or higher (for frontend)
- **Python**: v3.10 or higher (for backend)
- **MongoDB**: A running MongoDB instance (local or Atlas)

## 1. Clone the Repository
```bash
git clone <repository_url>
cd suraksha-maps-v4
```

## 2. Backend Setup
The backend runs on FastAPI and Python.

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file based on the example (or add your MongoDB URI)
echo MONGODB_URI=mongodb://localhost:27017 > .env
echo JWT_SECRET=my_super_secret_key >> .env
echo ENVIRONMENT=development >> .env
echo DEMO_MODE=true >> .env
echo BACKEND_CORS_ORIGINS=["http://localhost:5173"] >> .env

# Run the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend should now be running at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

## 3. Frontend Setup
The frontend runs on React and Vite.

Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Create a .env.development file
echo VITE_API_URL=http://localhost:8000 > .env.development
echo VITE_DEMO_MODE=true >> .env.development

# Start the frontend development server
npm run dev
```
The frontend should now be accessible at `http://localhost:5173`.

## 4. Troubleshooting
- **MongoDB Connection**: If the backend fails to connect, ensure your local MongoDB is running on port 27017, or verify your Atlas `MONGODB_URI`.
- **CORS Errors**: Ensure the frontend URL (`http://localhost:5173`) matches the `BACKEND_CORS_ORIGINS` in the backend `.env`.
