# Windows Setup Guide - FemiHealth

## Prerequisites

Install these tools on your Windows laptop:

1. **Node.js** (v18+)
   - Download from: https://nodejs.org/
   - Choose LTS version

2. **Python** (v3.8+)
   - Download from: https://www.python.org/downloads/
   - Check "Add Python to PATH" during installation

3. **Git**
   - Download from: https://git-scm.com/
   - Use default settings

4. **MongoDB Community Server** (required for running the backend locally)
   - Download from: https://www.mongodb.com/try/download/community
   - Follow the [MongoDB setup instructions](#mongodb-setup-on-windows) below
   - Or use MongoDB Atlas (cloud) and update `MONGODB_URI` accordingly

## MongoDB Setup on Windows

1. **Download the installer**
   - Go to the [MongoDB Community Server download page](https://www.mongodb.com/try/download/community) and choose the latest MSI package for Windows.
   - Pick the x64 architecture and click **Download**.

2. **Run the installer**
   - Choose **Complete** setup and keep the default installation path.
   - Leave **Install MongoDB as a Service** checked. Use the default service name (`MongoDB`), run the service as **Network Service**, and set it to **Start at boot**.

3. **Select tools**
   - Keep `mongosh` selected. Installing **MongoDB Compass** is optional but helpful for inspecting data visually.

4. **Create data directories (only if the installer didn't create them)**
   ```powershell
   mkdir C:\data\db
   mkdir C:\data\log
   ```

5. **Add MongoDB binaries to PATH (optional but recommended)**
   - During installation you can tick **Install MongoDB Shell (mongosh) for all users**.
   - If you skipped that, add `C:\Program Files\MongoDB\Server\<version>\bin` to your user `Path` environment variable so `mongosh` and `mongod` are available in any terminal.

6. **Verify the service**
   ```powershell
   net start MongoDB   # starts the service if it's not already running
   mongosh
   ```
   - You should see a `test>` prompt in `mongosh`. Type `exit` to leave.
   - If `net start` reports the service is already running, that's expected.

7. **Create the project database (optional)**
   ```powershell
   mongosh
   use femihealth
   ```
   - The backend will auto-create collections as needed. Ensure `.env` contains `MONGODB_URI=mongodb://127.0.0.1:27017/femihealth`.

### Using MongoDB Atlas (cloud alternative)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Add an IP access rule (e.g., `0.0.0.0/0` for testing or your machine's IP for tighter security).
3. Create a database user and keep the username/password handy.
4. Obtain the connection string from the Atlas dashboard and replace `<password>` with your actual password.
5. Update `MONGODB_URI` in `femihealth-backend/.env` to the Atlas URI.

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd femiHealth
```

### 2. Backend Setup
```bash
cd femihealth-backend
npm install
cp .env.example .env
# Edit .env file with your settings
```

### 3. Frontend Setup
```bash
cd ../femihealth-frontend
npm install
```

### 4. ML Service Setup
```bash
cd ../ml-service
pip install -r requirements_41.txt
```

## Running the Application

Open **4 separate terminals** (Command Prompt or PowerShell):

### Terminal 1 - MongoDB (local)

Skip this terminal if you are using MongoDB Atlas.

If you installed MongoDB as a Windows service, ensure it is running:

```powershell
net start MongoDB
```

If you installed without the service, start `mongod` manually (adjust the path if needed):

```powershell
mongod --dbpath "C:\data\db"
```

### Terminal 2 - Backend
```bash
cd femihealth-backend
npm start
```

### Terminal 3 - ML Service
```bash
cd ml-service
python app_41_features.py
```

### Terminal 4 - Frontend
```bash
cd femihealth-frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:5001

## Windows-Specific Tips

1. **Use PowerShell** or **Windows Terminal** for better command line experience
2. **Administrator privileges** may be needed for some npm commands
3. If you encounter permission issues, try:
   ```bash
   npm install --force
   ```
4. For Python, use `python` instead of `python3` in commands
5. Make sure Windows Firewall allows connections to ports 3000, 5000, and 5001

## Troubleshooting

- **Node.js not found**: Restart your terminal after installation
- **Python not found**: Check if "Add to PATH" was enabled during installation
- **Port already in use**: Change ports in respective config files
- **MongoDB connection issues**: Use MongoDB Atlas as an alternative

## Quick Test

Once all services are running, visit http://localhost:3000 and try the PCOS prediction form.
