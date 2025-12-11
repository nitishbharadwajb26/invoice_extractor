# Gmail Invoice Extractor - Backend

FastAPI backend for extracting and parsing invoice data from Gmail attachments.

## Overview
This service handles:
- Google OAuth 2.0 authentication.
- Fetching emails from Gmail (last 50 messages to avoid rate limits).
- Extracting invoice data using:
  - **Local Mode**: `pdfplumber` (Privacy-focused).
  - **OpenAI Mode**: GPT-4 Vision (High accuracy).
- Storing data in SQLite.

## Prerequisites
- Python 3.10+
- Google Cloud Console Project with Gmail API enabled.

## Setup

1. **Create Virtual Environment**
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Linux/Mac
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # Or on Windows: copy .env.example .env
   ```
   
   **Important:** Update `.env` with your credentials:
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
   - `OPENAI_API_KEY`: Required only for OpenAI extraction mode.
   
   *Note: Since the app is in "Testing" mode on Google Cloud, ensure your email is added to the "Test Users" list in the OAuth consent screen settings.*

## Running the Server

```bash
uvicorn app.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.
Docs available at `http://localhost:8000/docs`.

Alternatively, after initial setup, you can run both backend and frontend using the root `run.bat` (Windows) or `run.sh` (Linux/Mac) script.

## Notes
- **Rate Limits**: The system is currently capped to scan the last 50 emails to respect Gmail API limits during testing.
- **Privacy**: In "Local Mode", PDF content is processed locally and not sent to any third-party AI service.
