# Quick Start Guide

## Installation Complete! ✅

Your Link Checker application is ready to use. Both backend and frontend dependencies have been installed.

## Starting the Application

You need two terminal windows/tabs to run both the backend server and frontend app simultaneously.

### Step 1: Start the Backend Server

In the first terminal, run:
```bash
cd /Users/chris/Projects/linkchecker/backend
npm start
```

You should see: `Link checker server running on http://localhost:5000`

### Step 2: Start the Frontend App

In a second terminal, run:
```bash
cd /Users/chris/Projects/linkchecker/frontend
npm start
```

The React app will automatically open in your browser at http://localhost:3000

## Using the Application

1. **Enter a URL**: Type a website URL (e.g., https://example.com) in the input field
2. **Check Links**: Click the "Check Links" button
3. **Wait for Results**: The app will crawl the website and check all links (this may take a minute)
4. **View Results**: See a detailed breakdown of broken links grouped by page with HTTP status codes

## Features

- 🔗 Crawls internal pages of the website (up to 50 pages by default)
- 🔍 Checks the status of all links found
- 📊 Groups broken links by page for easy identification
- 🎨 Modern, responsive UI with real-time feedback
- ⚡ Efficient concurrent link checking

## Troubleshooting

**Backend won't start?**
- Make sure port 5000 is available
- Run `npm install` in the backend folder if you get module errors

**Frontend can't reach backend?**
- Ensure the backend is running on http://localhost:5000
- Check that CORS is enabled (it is by default)

**Link checking is slow?**
- This is normal for sites with many links
- You can reduce the maximum pages in backend/linkChecker.js (change `maxPages`)

For more details, see the README.md file in the project root.
