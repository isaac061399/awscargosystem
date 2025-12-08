# Next.js App

This is a Admin Dashboard starter based on Next.js application.

## Prerequisites

- Node.js (latest LTS recommended)
- npm or yarn

## Installation

Clone the repository and install dependencies:

```sh
git clone <repository-url>
cd <project-folder>
npm install  # or yarn install
```

## Environment Variables

Create a `.env` file and copy and paste the content of the `.env.example` file and define your environment variables:

```sh
# Dashboard
DASHBOARD_MAINTENANCE=false

# API
API_KEY="[API_KEY_RANDOM_CHARACTERS]"
API_MAINTENANCE=false

# Database
DATABASE_URL="postgresql://[username]:[password]@[host]:[port]/[database][?parameter_list]"
DATABASE_URL_REPLICA="postgresql://[username]:[password]@[host]:[port]/[replica-database][?parameter_list]"

# Auth
NEXTAUTH_PASS_SECRET="[32_RANDOM_CHARACTERS]"
NEXTAUTH_2FA_SECRET="[32_RANDOM_CHARACTERS]"
NEXTAUTH_SECRET="[32_RANDOM_CHARACTERS]"
NEXTAUTH_URL="http://localhost:3000"

# App Auth
APP_PASS_SECRET="[32_RANDOM_CHARACTERS]"
APP_ACCESS_SECRET="[32_RANDOM_CHARACTERS]"
APP_REFRESH_SECRET="[32_RANDOM_CHARACTERS]"

# AWS
AWS_ACCESS_KEY_ID="[SAMPLE_KEY_ID]"
AWS_SECRET_ACCESS_KEY="[SAMPLE_ACCESS_KEY]"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="[S3_BUCKET]"

# Cache
CACHE_ENABLED=true/false
CACHE_REDIS_HOST="[REDIS_HOST]"
CACHE_REDIS_PORT=6379
CACHE_REDIS_PASSWORD="[REDIS_PASSWORD]" (optional)
CACHE_REDIS_KEY_PREFIX="[KEY_PREFIX]" (optional)

# Push Notifications
PUSH_ENABLED=false
PUSH_FIREBASE_SERVICE_ACCOUNT="[SERVICE_ACCOUNT_FILE_BASE64]"
```

## Settings

Modify the `src/configs/siteConfig.ts` file to configure your application settings. Update these values according to your project requirements.

## Init Database

Update the database schema according to the `src/prisma/schema.prisma` file and execute the seed script to populate it with initial data:

```sh
npm run db:init --email <email@example.com>  # or yarn db:init --email <email@example.com>
```

Note: For your first login, use the 'Forgot Password' option with your registered email to set a password.

## Running the Development Server

Start the development server:

```sh
npm run dev  # or yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

To build the application for production:

```sh
npm run build  # or yarn build
```

To start the production server:

```sh
npm run start  # or yarn start
```

## Deployment

You can deploy your Next.js app using:

- Vercel (`vercel deploy`)
- Netlify
- Docker
- Custom server

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
