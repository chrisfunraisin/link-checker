# Link Checker

A full-stack web application for finding broken links on websites. Input a URL and get a comprehensive report of all broken links grouped by page.

## Features

- 🔗 **Website Crawling**: Automatically crawls internal pages of a website
- 🔍 **Link Checking**: Checks the status of all links found on each page
- 📊 **Detailed Reports**: Displays broken links grouped by page with HTTP status codes
- 🎨 **Modern UI**: Clean and intuitive user interface
- ⚡ **Fast**: Efficient concurrent link checking

## Project Structure

```
linkchecker/
├── backend/           # Express.js server
│   ├── server.js      # Main server file
│   ├── linkChecker.js # Link checking logic
│   └── package.json
├── frontend/          # React app
│   ├── src/
│   │   ├── App.js     # Main component
│   │   ├── App.css    # Styling
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

You'll need to run both the backend server and the React development server.

### Terminal 1 - Start the Backend

```bash
cd backend
npm start
```

The backend server will run on `http://localhost:5000`

### Terminal 2 - Start the Frontend

```bash
cd frontend
npm start
```

The frontend will automatically open at `http://localhost:3000`

## How to Use

1. Enter a website URL in the input field (e.g., `https://example.com`)
2. Click "Check Links" button
3. The application will:
   - Crawl internal pages of the website
   - Check the status of all links
   - Display results grouped by page
4. View broken links with their HTTP status codes

## API Endpoints

### POST /api/check-links

Checks links on a website.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "totalPages": 5,
  "totalBrokenLinks": 3,
  "pages": [
    {
      "url": "https://example.com",
      "brokenLinkCount": 2,
      "brokenLinks": [
        {
          "url": "https://example.com/broken-page",
          "status": 404,
          "error": null
        }
      ]
    }
  ]
}
```

## Configuration

### Crawler Limits

Edit `backend/linkChecker.js` to adjust:
- `maxPages`: Maximum number of pages to crawl (default: 50)

### Backend Port

Set the `PORT` environment variable:
```bash
PORT=3001 npm start
```

## Limitations

- Only checks HTTP status with HEAD requests (falls back to GET if needed)
- Crawls a maximum of 50 pages by default to prevent excessive crawling
- Only follows internal links (same domain)
- Respects timeout limits (5 seconds for link checks, 10 seconds for page fetches)

## Technologies Used

### Backend
- **Express.js**: Web framework
- **Axios**: HTTP client for making requests
- **Cheerio**: HTML parser for extracting links
- **CORS**: Enable cross-origin requests

### Frontend
- **React**: UI framework
- **Axios**: HTTP client for API calls
- **CSS3**: Modern styling with gradients and animations

## License

MIT

## Troubleshooting

### Backend won't start
- Ensure port 5000 is not in use
- Check that all dependencies are installed: `npm install`
- Clear npm cache: `npm cache clean --force`

### Frontend can't reach backend
- Make sure backend server is running on port 5000
- Check that CORS is properly configured
- Verify the proxy setting in `frontend/package.json`

### Link checking is slow
- Some websites may take time to respond
- Reduce the number of pages to check by modifying `maxPages` in `linkChecker.js`
- Increase timeout values if you get timeout errors

## Future Enhancements

- Add authentication and user accounts
- Store and compare historical results
- Export results as CSV/PDF
- Support for sitemaps
- Custom timeout configuration
- Rate limiting controls
- Support for checking external links only
