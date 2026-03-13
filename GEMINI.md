# Vidio (VStream)

## Project Overview
Vidio (also referred to as VStream in `package.json`) is a production-ready backend for a video streaming platform similar to YouTube. It is built with Node.js and Express, utilizing MongoDB for data storage. The application supports features such as user authentication, video management, playlists, social interactions (likes, comments, tweets), and subscriptions.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Authentication:** JWT (Access & Refresh Tokens)
- **File Storage:** Cloudinary (via Multer)
- **Language:** JavaScript (ES Modules)

## Key Features
- **User Management:** Registration, login, logout, profile updates, avatars/cover images.
- **Video System:** Upload, publish, view tracking, aggregation.
- **Social:** Comments, Likes (polymorphic), Tweets (community posts).
- **Organization:** Playlists, Subscriptions.
- **Security:** standard security practices including password hashing (bcrypt) and JWT-based auth.

## Building and Running

### Prerequisites
- Node.js installed.
- MongoDB instance (local or Atlas).
- Cloudinary account for media storage.

### Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Configuration:**
    Create a `.env` file in the root directory. Required variables include:
    - `PORT` (e.g., 8000)
    - `MONGODB_URI`
    - `CORS_ORIGIN`
    - `ACCESS_TOKEN_SECRET`
    - `ACCESS_TOKEN_EXPIRY`
    - `REFRESH_TOKEN_SECRET`
    - `REFRESH_TOKEN_EXPIRY`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`

### Running the Application
- **Development Mode:**
    ```bash
    npm run dev
    ```
    This uses `nodemon` to watch for changes and restart the server.

## Development Conventions

- **File Structure:**
    - `src/app.js`: Application configuration (middleware, routes).
    - `src/index.js`: Entry point, connects to DB and starts server.
    - `src/controllers`: Business logic for each resource.
    - `src/models`: Mongoose schemas.
    - `src/routes`: API route definitions.
    - `src/middlewares`: Custom middleware (e.g., `auth.middleware.js`, `multer.middleware.js`).
    - `src/utils`: Helper utilities (`asyncHandler`, `ApiError`, `ApiResponse`).

- **Coding Style:**
    - **ES Modules:** The project uses ES6 `import`/`export` syntax (type: "module" in `package.json`).
    - **Async Handling:** All controller functions are wrapped in `asyncHandler` to avoid repetitive try-catch blocks.
    - **Response Format:** API responses follow a consistent structure using the `ApiResponse` class.
    - **Error Handling:** Errors are thrown using the `ApiError` class and caught by a global error handler.

- **Routing:**
    - Routes are grouped by resource (e.g., `/api/v1/users`, `/api/v1/videos`).
    - `app.js` handles the mounting of these routes.
