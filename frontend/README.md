# Gmail Invoice Extractor - Frontend

Next.js web interface for the Gmail Invoice Extractor.

## Overview
A modern dashboard built with:
- Next.js 15+ (App Router)
- Tailwind CSS
- TypeScript

## Prerequisites
- Node.js 18+

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file in this directory:
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
   *(Ensure the Backend is running on port 8000)*

## Running the App

```bash
npm run dev
```
The application will open at `http://localhost:3000`.

Alternatively, after initial setup, you can run both frontend and backend using the root `run.bat` (Windows) or `run.sh` (Linux/Mac) script.

## Features
- **Connect Gmail**: Secure OAuth flow.
- **Dashboard**: View extracted invoices in a table.
- **Extraction Modes**: Toggle between "Local" (Privacy) and "OpenAI" (Accuracy).
- **Export**: Download data as CSV.

## Project Structure
- `src/components`: UI components (Button, Table, etc.).
- `src/lib/api.ts`: API client for communicating with the backend.
- `src/app`: Next.js App Router pages.
