## About The Project

A React frontend and Cloudflare workers backend application offering features that replicate Medium, the popular blogging platform. 

Features:
* Token based Authentication.
* Create, Read, Update, Delete Blogs.
* Bookmark, Like, Search, Filter Blogs.
* Autosave blog while writing.
* User profiles.
* Topics.
* Subscribe profiles.
* Comment.

## Technologies & Libraries

- Frontend: React, Tailwind, Typescript
- Backend: PostgreSQL, Clouflare Workers
- Tools: Prisma, Zod

## Project Structure

- Backend: Contains server-side code and logic.
- Common: Shared assets and modules used by frontend and backend. (NPM Library)
- Frontend: Contains client-side code and logic.

## Local Setup

#### Backend

##### Pre-requisities:

- Create a copy of .env.example and name the file `.env`
- Set up Postgres DATABASE_URL in .env file. You can get a free PostgreSQL connection string from [neon.tech](https://neon.tech/).
- Create a copy of wrangler.sample.toml and name the file `warngler.toml`
- Set up Prisma connection pool DATABASE_URL in wrangler.toml file. You can get this for free from [Prisma](https://www.prisma.io/data-platform/accelerate).
- Set up JWT Secret JWT_SECRET in wrangler.toml file. This can be any value.
- Login to ([cloudflare](https://www.cloudflare.com/)) and create a new R2 bucket. You probably need a Credit card for verfication.
- Allow Access for R2.dev subdomain for your R2 bucket from R2>settings.
- Replace Bucket-name and preview-your-bucket-name with your R2-bucket-name in wrangler.toml file.
- Replace R2_SUBDOMAIN_URL with your R2 subdomain URL in wrangler.toml file.

```bash 

cd backend
npm install
npm run prisma:migrate
npx prisma generate
npm run dev

```

> Note: wrangler.toml is the environment configuration file for a serverless backend. .env is used by Prisma for connection pooling. Ensure you configure both environment files accordingly.

#### Frontend

- Navigate into the frontend directory using 
```bash

cd frontend
npm install
npm run dev

```

> Note: `frontend/src/config.ts` contains `BACKEND_URL`. If you need your frontend to point to local backend server, uncomment `export const BACKEND_URL = "http://localhost:8787"`. 


#### Running Frontend and Backend Concurrently

To make the developer experience smoother, you can now run both the frontend and backend simultaneously using a single command from the project root.

##### Steps:

- Ensure you have project root folder. install packages with
   ```sh
   npm install
   ```
- Insall both frontend and backend pakages with
   ```sh
   npm install:all
   ```
- Now you can simply run:
   ```sh
   npm run dev
   ```
   This command will start both the frontend and backend servers simultaneously.

