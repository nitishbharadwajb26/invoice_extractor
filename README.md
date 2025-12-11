# Gmail Invoice Extractor

A web application that automates the extraction of invoice data from Gmail attachments with privacy-conscious extraction options.

## Features

- **Gmail OAuth Integration**: Securely connect your Gmail account
- **Label-based Filtering**: Choose which Gmail label to scan for invoices
- **Dual Extraction Modes**:
  - **Local Processing (Privacy)**: Uses pdfplumber for local text extraction - data never leaves your server
  - **OpenAI Processing (Accuracy)**: Uses GPT-4 for better extraction accuracy on complex invoices
- **Invoice Table**: View all extracted invoices with pagination
- **CSV Export**: Download all invoice data as CSV

## Tech Stack

- **Backend**: FastAPI + SQLite + SQLAlchemy
- **Frontend**: Next.js 14 + Tailwind CSS
- **PDF Processing**: pdfplumber (local), OpenAI API (optional)

## Prerequisites

- Python 3.10+
- Node.js 18+
- Google Cloud Console project with Gmail API enabled
- OpenAI API key (optional, for AI extraction mode)

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Gmail API:
   - Go to APIs & Services > Library
   - Search for "Gmail API" and enable it
4. Create OAuth credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: Web application
   - Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
5. Copy the Client ID and Client Secret

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - OPENAI_API_KEY (optional)
# - SECRET_KEY (change for production)

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Run development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage

1. Open http://localhost:3000
2. Select your preferred extraction mode:
   - **Local**: Privacy-focused, data stays on server
   - **OpenAI**: Better accuracy for complex invoices
3. Click "Connect with Gmail" and authorize access
4. On the dashboard, select a Gmail label containing invoice emails
5. Click "Sync Emails" to process and extract invoice data
6. View extracted invoices in the table
7. Click "Export CSV" to download the data

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/google/url` | GET | Get OAuth authorization URL |
| `/auth/google/callback` | GET | Handle OAuth callback |
| `/auth/logout` | POST | Logout and clear tokens |
| `/user/me` | GET | Get current user info |
| `/user/extraction-mode` | PUT | Update extraction mode |
| `/gmail/labels` | GET | List Gmail labels |
| `/gmail/sync` | POST | Sync emails and extract invoices |
| `/invoices` | GET | List invoices (paginated) |
| `/invoices/{id}` | GET | Get single invoice |
| `/invoices/{id}` | DELETE | Delete an invoice |
| `/invoices/export` | GET | Export as CSV |

## What Was Implemented

- Full Gmail OAuth 2.0 authentication flow
- Gmail label fetching and email sync
- PDF attachment extraction from emails
- Two extraction modes (Local with pdfplumber, OpenAI with GPT-4)
- Invoice data storage in SQLite
- RESTful API with FastAPI
- Next.js frontend with:
  - Connect/Disconnect Gmail
  - Extraction mode selection
  - Label selector
  - Invoice table with delete
  - Pagination
  - CSV export
- Token encryption for stored credentials

## What Was Not Implemented (Time Constraints)

- Refresh token handling when access token expires
- Email filtering by date range
- Invoice detail modal/view
- Bulk delete functionality
- Search/filter invoices
- Unit tests
- Docker containerization
- Production deployment configuration

## Future Improvements

Given more time, I would add:

1. **Token Refresh**: Automatic refresh of expired Google tokens
2. **Background Processing**: Queue system for processing large volumes of emails
3. **Invoice Preview**: Modal to view full invoice details and raw text
4. **Advanced Filtering**: Filter invoices by date, vendor, amount range
5. **Duplicate Detection**: Better detection of duplicate invoices
6. **Multiple File Support**: Handle ZIP attachments with multiple invoices
7. **OCR Support**: Handle scanned PDF invoices (images) using OCR
8. **Webhooks**: Real-time sync using Gmail push notifications
9. **Multi-user Support**: Proper user sessions with JWT tokens
10. **Testing**: Comprehensive unit and integration tests
11. **Docker**: Containerized deployment
12. **CI/CD**: Automated testing and deployment pipeline

## Project Structure

```
invoice_extractor/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, logging, security
│   │   ├── components/     # Feature modules (auth, user, gmail, invoice)
│   │   ├── services/       # PDF extraction services
│   │   ├── database.py     # Database setup
│   │   └── main.py         # FastAPI app entry
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API client, auth helpers
│   │   └── types/          # TypeScript interfaces
│   └── .env.local.example
└── README.md
```

## License

MIT
