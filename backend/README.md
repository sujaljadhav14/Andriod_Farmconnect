# Crop Backend

This backend is a cleaned integration of the crop API prototype that originally lived on `origin/mahek-dev`.

## Endpoints

- `GET /health`
- `GET /crops`
- `POST /addCrop`

## Setup

1. Install backend dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set `MONGO_URI`

3. Start the server:

```bash
npm start
```

## Mobile App Note

The mobile app currently keeps demo mode as the safe default. To point the app at this backend, set the crop API base URL in `src/services/cropService.js`.
