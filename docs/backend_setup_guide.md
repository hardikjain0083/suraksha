# SuRaksha MAPS v4.0 - Backend Setup & Running Guide

This guide describes how to set up, seed, and run the FastAPI backend for **SuRaksha MAPS v4.0** on Windows.

---

## 📋 Prerequisites
Before running the backend, ensure you have the following installed on your machine:
1. **Python**: v3.10 or higher.
   * Verify by running: `python --version`
2. **MongoDB**:
   * **Local MongoDB**: Ensure it is running on your machine (usually `mongodb://localhost:27017`).
   * **MongoDB Atlas (Cloud)**: Create a cluster and get your connection string (`mongodb+srv://...`).

---

## 🛠️ Step-by-Step Setup

### Step 1: Navigate to the Backend Directory
Open your terminal (PowerShell or Command Prompt) and change to the backend directory:
```powershell
cd "c:\Users\Asus\OneDrive\Desktop\SuRaksha MAPS v4.0\suraksha\backend"
```

### Step 2: Configure Environment Variables (`.env`)
Create a `.env` file in the `backend` folder. You can base it on the `.env.example` file located in the parent directory.

1. **For Local MongoDB**:
   Create a `.env` file with the following contents:
   ```env
   MONGODB_URI=mongodb://localhost:27017/suraksha_maps
   JWT_SECRET=your-secure-random-jwt-secret-key-here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ENVIRONMENT=development
   EMBEDDING_MODEL=all-MiniLM-L6-v2
   DEMO_MODE=true
   BACKEND_CORS_ORIGINS=["http://localhost:5173"]
   ```

2. **For MongoDB Atlas (Cloud)**:
   Use your Atlas connection URI:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/suraksha_maps?retryWrites=true&w=majority
   JWT_SECRET=your-secure-random-jwt-secret-key-here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ENVIRONMENT=development
   EMBEDDING_MODEL=all-MiniLM-L6-v2
   DEMO_MODE=true
   BACKEND_CORS_ORIGINS=["http://localhost:5173"]
   ```

---

### Step 3: Create & Activate Python Virtual Environment
A virtual environment (`venv`) keeps backend dependencies isolated.

1. **Create the environment** (if not already done):
   ```powershell
   python -m venv venv
   ```

2. **Activate the environment**:
   * **PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
     *(Note: If you receive a script execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first)*
   * **Command Prompt (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```

Upon activation, you will see `(venv)` prepended to your command prompt.

---

### Step 4: Install Dependencies
With the virtual environment active, install all required packages:
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

*Note: The dependencies include `sentence-transformers` for vector searches. The first time you run similarity searches, the backend will automatically download the 120MB ML model (`all-MiniLM-L6-v2`) in the background.*

---

### Step 5: Database Schema & Seeding (Crucial)
To populate the database with user roles, departments, mock policies, circulars, and gap-detection threads:

1. **Setup Collections and Indexes**:
   ```powershell
   python setup_atlas.py
   ```
2. **Seed Initial Mock Data**:
   ```powershell
   python seed_database.py
   ```

This will connect to your MongoDB database, delete any old collections, build standard and vector indexes, and populate departments, mock compliance officers, and compliance circular loops.

---

### Step 6: Start the Backend Server
Run the FastAPI application with Uvicorn:
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Once started:
* The backend API server will be available at: **`http://localhost:8000`**
* You can view and interact with the **interactive Swagger API documentation** at: **`http://localhost:8000/docs`**
* You can check server health at: **`http://localhost:8000/health`**

---

## ⚡ Quick Start (Oneliner for subsequent runs)
Once you have completed the initial setup, you only need to run this whenever you open a new terminal:
```powershell
cd "c:\Users\Asus\OneDrive\Desktop\SuRaksha MAPS v4.0\suraksha\backend"
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
