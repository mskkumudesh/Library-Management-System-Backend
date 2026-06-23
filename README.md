# ShelfScan — Library Management System with Barcode Scanning

A full-stack library management system built with the MERN stack and TypeScript. Librarians manage
the book catalog and check books in/out by scanning ISBN barcodes with a camera; members can browse
the catalog and track what they've borrowed.

> librarian dashboard, email confirmations (Nodemailer) on checkout
> and return, and an AI chat assistant for members (Google Gemini + function calling) that searches the
> real catalog and recommends books. Only styling polish and deployment remain (see `Roadmap` below).

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Redux Toolkit, React Router, TailwindCSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Advanced feature | In-browser barcode scanning (`html5-qrcode`) for ISBN check-in/check-out, Email notification, OpenAI chatbot |

## Project Structure

```
shelfscan/
├── backend/
│   └── src/
│       ├── config/                                                    # DB connection
│       ├── models/                                                    # User, Book, BorrowRecord (Mongoose)
│       ├── middleware/                                                # JWT auth, role guard, error handler
│       ├── controllers/                                               # Route logic
│       ├── routes/                                                    # Express routers
│       ├── utils/                                                     # Token generation
│       └── server.ts
└── frontend/
    └── src/
        ├── app/                                                       # Redux store
        ├── api/                                                       # Axios instance with JWT interceptor
        ├── features/auth,borrow,chat,dashboard,scanner,books
        ├── components/                                                # ProtectedRoute, shared UI
        └── App.tsx
```

## Setup & Run

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

### Backend

```bash
cd backend
cp .env.example .env     # set related credentials
npm install
npm run dev               
```

### Frontend

```bash
cd frontend
cp .env.example .env      # set related credentials
npm install
npm run dev                
```


## API Endpoints (current)

```
POST /api/auth/register   
POST /api/auth/login      
GET  /api/auth/me         

GET    /api/books             
GET    /api/books/:id                                 
GET    /api/books/isbn/:isbn                           
POST   /api/books             
PUT    /api/books/:id         
DELETE /api/books/:id                                  

GET    /api/users/members        

POST   /api/borrow                    
POST   /api/borrow/:id/return                            
GET    /api/borrow/active                                
GET    /api/borrow/overdue                               
GET    /api/borrow/member/:memberId                      

GET    /api/dashboard/summary                            

POST   /api/chat                                          
```

## Email Notifications

Nodemailer sends transactional emails for:
- **Checkout** — a confirmation with the due date, sent to the member.
- **Return** — a confirmation, including any late fine charged.



## AI Chat Assistant

A floating chat widget (bottom-right, member accounts only) backed by Google Gemini (`gemini-2.5-flash`)
with function calling — no credit card required for the free tier. When a member asks about a book,
author, or topic, the model calls a `search_catalog` tool that queries the real MongoDB catalog
(title/author/category, case-insensitive) and only recommends books that actually exist with real
availability counts — it doesn't invent titles. It can also answer general questions about how
borrowing works (14-day loan, $0.50/day late fine) without needing to search.

Set `GEMINI_API_KEY` in `backend/.env` (get a free key at https://aistudio.google.com/app/apikey — no
credit card needed). If the key is missing, `/api/chat` returns a clear 503 instead of crashing the server.

## Deployment

- **Frontend:** Vercel — set `VITE_API_BASE_URL` to your deployed backend URL.
- **Backend:** Render / Railway — set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`.
- **Database:** MongoDB Atlas — whitelist your backend host's IP (or `0.0.0.0/0` for testing).

## Roadmap

1. ✅ Auth (JWT, roles: librarian/member)
2. ✅ Book catalog CRUD (librarian-managed, members browse/search)
3. ✅ Borrow / return flow (manual ISBN entry, auto late fines)
4. ✅ Camera barcode scanning (advanced feature) — scan ISBN → auto check-out/check-in
   - ✅ Auto-generate a valid EAN-13 barcode for books without a printed ISBN, with a live scannable preview (librarian can print and stick it on the cover)
   - ✅ Live camera scan on Checkout (auto-fills ISBN) and Active Loans (scan-to-return)
5. ✅ Overdue tracking, fines, dashboard analytics
6. ⬜ Styling polish, deployment, screenshots


_Deployed URLs: 

- **Backend URL:** https://library-management-system-backend-zeta-five.vercel.app
- **Frontend URL:** https://library-management-system-frontend-pink.vercel.app


