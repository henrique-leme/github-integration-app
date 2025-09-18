# StarSling - GitHub Integration App

<p align="center">
  <img src="https://img.shields.io/static/v1?label=Next.js&message=framework&color=blue&style=for-the-badge&logo=next.js"/>
  <img src="https://img.shields.io/static/v1?label=TypeScript&message=language&color=blue&style=for-the-badge&logo=typescript"/>
  <img src="https://img.shields.io/static/v1?label=PostgreSQL&message=database&color=blue&style=for-the-badge&logo=postgresql"/>
  <img src="https://img.shields.io/static/v1?label=BetterAuth&message=authentication&color=green&style=for-the-badge&logo=auth0"/>
  <img src="https://img.shields.io/static/v1?label=Inngest&message=background%20jobs&color=purple&style=for-the-badge&logo=inngest"/>
  <img src="https://img.shields.io/static/v1?label=Tailwind&message=CSS%20framework&color=cyan&style=for-the-badge&logo=tailwindcss"/>
  <img src="https://img.shields.io/static/v1?label=GitHub&message=API&color=black&style=for-the-badge&logo=github"/>
  <img src="https://img.shields.io/static/v1?label=Zod&message=validation&color=orange&style=for-the-badge&logo=zod"/>
</p>

## Project Status: Done for Testing

### Description

StarSling is "Cursor for DevOps" - a comprehensive GitHub integration application built with Next.js that provides seamless organization-level GitHub App integration. It allows users to authenticate via GitHub OAuth, manage repositories, track issues and deployments, all through a modern and intuitive dashboard interface.

### ⚙️ Features

- **Authentication & Security:**
  - GitHub OAuth authentication with BetterAuth
  - GitHub App installation at organization level
  - Encrypted access token storage
  - Secure webhook signature verification
  - Session-based authentication

- **GitHub Integration:**
  - Real-time integration status monitoring
  - Repository management and overview
  - Issues tracking and filtering
  - Deployment status monitoring
  - Pull request management
  - Webhook handling for GitHub events

- **Background Processing:**
  - Asynchronous webhook processing with Inngest
  - Background job reliability and retry mechanisms
  - Event-driven architecture for scalability

- **User Interface:**
  - Responsive dashboard with dark mode support
  - Real-time status updates
  - Interactive components with Lucide React icons
  - Modern UI with Tailwind CSS styling

### 📚 Documentation

For detailed documentation, refer to the sections below for complete setup and deployment instructions.

To access the documentation locally:

1. Clone the project
2. Follow the setup instructions below

### 📝 Table of Contents

- [Getting Started](#getting-started)
- [How to Run](#how-to-run)
- [Development](#development)
- [Deployment](#deployment)
- [Authors](#authors)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 📋 Prerequisites

Ensure you have the following installed:

- Git
- Node.js 18+ and pnpm
- PostgreSQL database (local or hosted like Supabase)
- Docker (optional, for local PostgreSQL)
- GitHub OAuth App (for user authentication)
- GitHub App (for organization integration)

### 🔧 Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/starsling-github-integration.git
   ```

2. Navigate to the project directory:

   ```sh
   cd starsling-github-integration/
   ```

3. Copy the environment configuration file:

   ```sh
   cp .env.example .env.local

   # Note: This command will not work in Windows OS, for Windows you have to
   # manually copy and paste the .env.example and rename it to .env.local
   ```

4. Install dependencies:
   ```sh
   pnpm install
   ```

## ⚙️ How to Run

### Environment Configuration

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/github_integration_app"

# BetterAuth
BETTER_AUTH_SECRET="your-32-character-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth App (for user authentication)
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# GitHub App (for organization integration)
GITHUB_APP_ID="your-github-app-id"
GITHUB_APP_CLIENT_ID="your-github-app-client-id"
GITHUB_APP_CLIENT_SECRET="your-github-app-client-secret"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nyour-github-app-private-key\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"

# Inngest (for background job processing)
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

### 3. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App with:
   - **Application name**: StarSling GitHub OAuth
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env.local`

### 4. Expose localhost publicly (for GitHub webhooks)

GitHub webhooks need a public URL. For local development, use a tunnel:

#### Option A: serveo.net (Quick & Free)
```bash
# Open a separate terminal and run:
ssh -R 80:localhost:3000 serveo.net

# Copy the URL that appears (e.g., https://abc123.serveo.net)
# Use this URL in the GitHub App configuration below
```

#### Option B: ngrok (Alternative)
```bash
# Install ngrok from https://ngrok.com/download
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

⚠️ **Important**: Keep the tunnel running while developing!

### 5. Create GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Create a new GitHub App with:
   - **Name**: StarSling GitHub Test
   - **Homepage URL**: `https://your-tunnel-url.serveo.net` (from step 4)
   - **Callback URL**: `https://your-tunnel-url.serveo.net/api/github/callback`
   - **Webhook URL**: `https://your-tunnel-url.serveo.net/api/github/webhook`
   - **Permissions**:
     - Issues: Read & Write
     - Pull requests: Read
     - Metadata: Read
     - Deployments: Read
     - Merge queues: Read
   - **Subscribe to events**:
     - Issues (opened, edited, closed, reopened)
     - Installation
     - Installation repositories
3. **Generate Private Key**:
   - Scroll down to "Private keys" section
   - Click "Generate a private key"
   - Download the `.pem` file
   - Open the file and copy the entire content (including headers)
4. **Generate Webhook Secret**:
   ```bash
   openssl rand -hex 32
   ```
5. Copy all credentials (App ID, Client ID, Client Secret, Private Key, Webhook Secret) to your `.env.local`

### 6. Create Inngest Account and Configure Keys

1. Go to [Inngest Dashboard](https://app.inngest.com/) and sign up
2. Create a new environment (e.g., "local")
3. In your environment dashboard, find the **Keys** section:
   - Copy the **Event Key**
   - Copy the **Signing Key**
4. Add these to your `.env.local`

### 7. Configure All Environment Variables

Update your `.env.local` with all the credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/github_integration_app"

# BetterAuth
BETTER_AUTH_SECRET="your-32-character-secret-key"
BETTER_AUTH_URL="https://your-tunnel-url.serveo.net"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-tunnel-url.serveo.net"

# GitHub OAuth App (for user authentication)
GITHUB_CLIENT_ID="Ov23li..." # OAuth App Client ID (starts with "Ov")
GITHUB_CLIENT_SECRET="your-oauth-app-client-secret"

# GitHub App (for organization integration)
GITHUB_APP_ID="1234567" # Numeric App ID
GITHUB_APP_CLIENT_ID="Iv23li..." # GitHub App Client ID (starts with "Iv")
GITHUB_APP_CLIENT_SECRET="your-github-app-client-secret"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...copy entire private key content...
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your-generated-webhook-secret"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

**⚠️ Important notes:**
- **OAuth App Client ID** starts with `Ov` (for user login)
- **GitHub App Client ID** starts with `Iv` (for organization integration)
- **Private Key** must include the full content with headers and line breaks
- **Webhook Secret** should be a secure random string (use `openssl rand -hex 32`)
- Keep the tunnel running while developing!

### 8. Set up PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# Wait for the database to be ready
docker-compose logs -f postgres
```

The database will be automatically initialized with the required schema.

#### Option B: Local PostgreSQL

If you prefer to use a local PostgreSQL installation:

1. Create a database named `github_integration_app`
2. Update the `DATABASE_URL` in your `.env.local`
3. Run the initialization script: `psql -d github_integration_app -f scripts/init.sql`

### 9. Start Inngest Dev Server (for background jobs)

For local development, you need to run the Inngest Dev Server to process webhooks and background jobs:

```bash
# In a separate terminal window
npx inngest-cli@latest dev
```

This will start the Inngest Dev Server on `http://localhost:8288` and automatically connect to your Next.js app to process background jobs.

### 10. Database Schema

The database includes:

- **BetterAuth tables**: users, sessions, organizations, etc. (auto-created)
- **integration_installations**: stores GitHub App installation data
- **Indexes**: optimized for organization and provider lookups
- **Triggers**: automatic `updated_at` timestamp updates

### Start the Development Server

1. Start the development server:

   ```sh
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Application Flow

1. **Home Page** (`/`) - Landing page with navigation links
2. **Login** (`/login`) - GitHub OAuth authentication
3. **Dashboard** (`/dashboard`) - Main dashboard after authentication
4. **Integrations** (`/integrations`) - Manage GitHub App integrations

## API Routes

- `/api/auth/[...all]` - BetterAuth authentication endpoints
- `/api/github/auth` - Initiate GitHub App installation
- `/api/github/callback` - Handle GitHub App installation callback
- `/api/github/webhook` - Handle GitHub webhooks
- `/api/integrations/github/status` - Check GitHub integration status
- `/api/integrations/github/disconnect` - Disconnect GitHub integration
- `/api/inngest` - Inngest function endpoints

## GitHub App Installation Flow

1. User clicks "Connect" on the integrations page
2. Redirects to GitHub App installation page
3. User installs the app on their organization
4. GitHub redirects back with installation details
5. App exchanges installation for access tokens
6. Tokens are encrypted and stored in the database
7. User sees "Connected" status on integrations page

## Webhook Handling

The app handles these GitHub webhook events:

- **installation** - App installed/uninstalled/suspended
- **installation_repositories** - Repository access added/removed
- **issues** - Issue events (for future use)

Events are processed asynchronously using Inngest for reliability.

## Security Features

- ✅ Webhook signature verification
- ✅ Access token encryption at rest
- ✅ Session-based authentication
- ✅ Environment variable validation with Zod

## Development

### Database Schema

The `integration_installations` table stores GitHub App installation data:

```sql
CREATE TABLE integration_installations (
  id VARCHAR(255) PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'github',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Adding New Features

1. Update schemas in `/src/lib/schemas.ts`
2. Add API routes in `/src/app/api/`
3. Create Inngest functions in `/src/inngest/functions.ts`
4. Add UI components in `/src/app/`

### 📦 Deployment

#### Environment Variables for Production

Update your environment variables for production:

```env
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-domain.com"
```

#### Vercel Deployment

1. Deploy to Vercel:
   ```bash
   vercel deploy --prod
   ```

2. Update GitHub App webhook URL to your production URL

3. Set environment variables in Vercel dashboard

### 🛠️ Built With

- **Frontend:**
  - [Next.js 15](https://nextjs.org/) - The React framework with App Router
  - [TypeScript](https://www.typescriptlang.org/) - The programming language
  - [Tailwind CSS](https://tailwindcss.com/) - The CSS framework
  - [Lucide React](https://lucide.dev/) - Icon library
  - [BetterAuth](https://www.better-auth.com/) - Authentication framework

- **Backend:**
  - [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - Backend API
  - [PostgreSQL](https://www.postgresql.org/) - The database
  - [Inngest](https://www.inngest.com/) - Background job processing
  - [Zod](https://zod.dev/) - Schema validation
  - [crypto-js](https://www.npmjs.com/package/crypto-js) - Encryption library

- **Integration:**
  - [GitHub API](https://docs.github.com/en/rest) - GitHub integration
  - [GitHub Apps](https://docs.github.com/en/apps) - Organization-level access
  - [GitHub Webhooks](https://docs.github.com/en/webhooks) - Real-time events

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check `DATABASE_URL` format
   - Verify database credentials

2. **"redirect_uri is not associated with this application" Error**
   - Ensure OAuth App callback URL is: `https://your-tunnel-url/api/auth/callback/github`
   - Check you're using the correct OAuth App Client ID (starts with "Ov")
   - Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`

3. **GitHub App Installation Error**
   - Check GitHub App permissions and events
   - Verify webhook URL is accessible: `https://your-tunnel-url/api/github/webhook`
   - Ensure GitHub App callback URL is: `https://your-tunnel-url/api/github/callback`
   - Check webhook secret configuration

4. **Private Key Errors**
   - Ensure `GITHUB_APP_PRIVATE_KEY` includes full content with headers
   - Check for proper line breaks in the private key
   - Verify the private key was generated for the correct GitHub App

5. **Tunnel Connection Issues**
   - Ensure tunnel (serveo.net/ngrok) is running
   - Check if tunnel URL matches the one in GitHub App configuration
   - Update `.env` URLs when tunnel URL changes

6. **Webhook Signature Verification Failed**
   - Ensure `GITHUB_WEBHOOK_SECRET` matches GitHub App webhook secret
   - Check webhook payload format

7. **Inngest "Event key not found" Error**
   - Ensure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are correctly set in `.env`
   - Verify keys match those from your Inngest dashboard
   - Make sure Inngest Dev Server is running (`npx inngest-cli@latest dev`)

### Logs

Check the console for detailed error messages and webhook processing logs.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/        # BetterAuth endpoints
│   │   ├── github/               # GitHub App endpoints
│   │   ├── integrations/         # Integration management
│   │   └── inngest/              # Inngest function server
│   ├── dashboard/                # Dashboard page
│   ├── integrations/             # Integrations page
│   ├── login/                    # Login page
│   └── page.tsx                  # Home page
├── inngest/
│   └── functions.ts              # Background job functions
└── lib/
    ├── auth.ts                   # BetterAuth configuration
    ├── auth-client.ts            # BetterAuth React client
    ├── db.ts                     # Database connection
    ├── encryption.ts             # Token encryption
    ├── github.ts                 # GitHub API service
    ├── inngest.ts                # Inngest client
    └── schemas.ts                # Zod validation schemas
```

## ✒️ Authors

- **Henrique Leme** - _Developer_ - [GitHub]([https://github.com/your-username](https://github.com/henrique-leme))

See also the list of [contributors](https://github.com/henrique-leme/starsling-github-integration/contributors) who participated in this project.

## License

MIT
