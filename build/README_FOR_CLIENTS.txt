================================================================================
  IQR-SHIPSTATION CONNECTOR - WINDOWS EXE VERSION
  Super Simple Setup Guide
================================================================================

📦 WHAT'S IN THIS FOLDER:

  IQR-ShipStation-Connector.exe  ← The main program
  START_CONNECTOR.bat            ← Double-click this to start
  .env.example                   ← Template for your settings
  README_FOR_CLIENTS.txt         ← This file


================================================================================
STEP 1: GET YOUR API KEYS
================================================================================

You need 3 things:

1️⃣ IQ RESELLER API KEY:
   - Log into IQ Reseller
   - Go to Settings → API Settings
   - Copy your API Key

2️⃣ SHIPSTATION API KEY:
   - Log into ShipStation
   - Click your name → Account Settings → API Settings
   - Copy the "API Key"

3️⃣ SHIPSTATION API SECRET:
   - Same place as above
   - Copy the "API Secret"

💾 Save these in a notepad - you'll need them in the next step!


================================================================================
STEP 2: CREATE YOUR .ENV FILE
================================================================================

1. Find the file ".env.example" in this folder

2. Right-click it → "Open with" → "Notepad"

3. You'll see this:

   PORT=3001
   NODE_ENV=production
   IQR_API_KEY=your_iqr_api_key_here
   IQR_AUTH_URL=https://signin.iqreseller.com
   IQR_API_BASE_URL=https://api.iqreseller.com
   SHIPSTATION_API_KEY=your_shipstation_api_key_here
   SHIPSTATION_API_SECRET=your_shipstation_api_secret_here
   SHIPSTATION_API_BASE_URL=https://ssapi.shipstation.com
   SYNC_INTERVAL_MINUTES=15
   SYNC_BATCH_SIZE=50
   SYNC_MAX_RETRIES=3

4. Replace these 3 lines with YOUR actual keys:
   - IQR_API_KEY=paste_your_iqr_key_here
   - SHIPSTATION_API_KEY=paste_your_shipstation_key_here
   - SHIPSTATION_API_SECRET=paste_your_shipstation_secret_here

5. Click File → Save As

6. Change filename to: .env
   (Just ".env" - NOT ".env.txt")

7. Make sure "Save as type" is "All Files (*.*)"

8. Click Save

9. Close Notepad


================================================================================
STEP 3: START THE CONNECTOR
================================================================================

1. Double-click "START_CONNECTOR.bat"

2. A black window will open

3. You should see:
   ╔═══════════════════════════════════════════════════════════╗
   ║     IQ Reseller ↔ ShipStation Connector                   ║
   ╠═══════════════════════════════════════════════════════════╣
   ║  Server running on port 3001                              ║
   ╚═══════════════════════════════════════════════════════════╝

4. ✅ IT'S WORKING!

⚠️ IMPORTANT: Keep this window open! If you close it, the connector stops.


================================================================================
STEP 4: TEST IF IT'S WORKING
================================================================================

1. Open your web browser (Chrome, Edge, etc.)

2. Go to: http://localhost:3001/health

3. You should see: {"status":"healthy",...}

4. ✅ If you see that, everything is working!

5. Now go to: http://localhost:3001/health/detailed

6. Check that both say "up":
   - "iqr": "up"
   - "shipstation": "up"

7. ✅ Perfect! The connector is running and connected!


================================================================================
HOW TO MAKE IT RUN AUTOMATICALLY ON STARTUP
================================================================================

OPTION 1 - EASY WAY (Task Scheduler):

1. Press Windows Key + R

2. Type: shell:startup

3. Press Enter (a folder opens)

4. Right-click "START_CONNECTOR.bat" → "Create shortcut"

5. Drag the shortcut into the Startup folder

6. ✅ Done! It will start automatically when Windows starts


OPTION 2 - WINDOWS SERVICE (Advanced):

1. Download NSSM: https://nssm.cc/download

2. Extract nssm.exe

3. Open Command Prompt as Administrator

4. Run: nssm install IQRConnector

5. Browse to: IQR-ShipStation-Connector.exe

6. Click "Install service"

7. ✅ Done! It runs as a Windows service


================================================================================
TROUBLESHOOTING
================================================================================

❌ "Cannot find .env file":
   → You didn't create the .env file correctly
   → Make sure it's named ".env" not ".env.txt"
   → Put it in the same folder as the .exe

❌ "IQR authentication failed":
   → Check your IQR_API_KEY in .env
   → Make sure there are no extra spaces
   → Make sure you copied the entire key

❌ "ShipStation authentication failed":
   → Check both SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET
   → Make sure you copied both correctly

❌ "Port 3001 already in use":
   → Something else is using that port
   → In .env, change PORT=3001 to PORT=3002

❌ Window closes immediately:
   → There's an error in your .env file
   → Check all values are correct
   → Make sure there are no extra quotes or spaces


================================================================================
HOW IT WORKS
================================================================================

Once running, the connector automatically:

✅ Checks IQ Reseller for new orders every 15 minutes
✅ Creates those orders in ShipStation
✅ Listens for shipping updates from ShipStation
✅ Updates tracking info back in IQ Reseller

You don't need to do anything - it works automatically!


================================================================================
SYSTEM REQUIREMENTS
================================================================================

✅ Windows 10 or Windows 11
✅ Internet connection
✅ 100 MB free disk space
✅ 256 MB RAM

That's it! No other software needed!


================================================================================
NEED HELP?
================================================================================

📧 Email: agentslogic@gmail.com

🌐 GitHub: https://github.com/AgentsLogic/iqr-shipstation-connector


================================================================================
THAT'S IT! 🎉
================================================================================

The connector is now running and syncing orders automatically!

