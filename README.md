
  # Campus Bazaar Web App Prototype

  This is a code bundle for Campus Bazaar Web App Prototype. The original project is available at https://www.figma.com/design/DB5jhSxzd3lxxA4P4KmqOd/Campus-Bazaar-Web-App-Prototype.

## Running the app

1) Install dependencies  
`npm install`

2) Configure Postgres  
Create a `.env` file in the project root with at least:
```
DATABASE_URL=postgres://USER:PASS@localhost:5432/campus_bazaar
PORT=4000
```
Ensure the database exists (e.g., `createdb campus_bazaar`). The API will auto-create tables and seed sample listings on first start.

3) Start the API (Express + Postgres)  
`npm run server`

4) Start the frontend (Vite)  
`npm run dev`

The frontend expects the API at `http://localhost:4000/api`. To change it, set `VITE_API_BASE_URL` in a `.env` file (Vite variables must be prefixed with `VITE_`).
  