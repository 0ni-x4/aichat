# Desktop App Setup Guide

Your Next.js chat application has been successfully configured as a Tauri desktop app! 🎉

## Required Setup

### 1. Create Environment File

Create a `.env` file in the root directory with the following variables:

```bash
# Required for encryption/decryption functionality
ENCRYPTION_KEY=your-encryption-key-here-32-chars-long

# Required for CSRF protection
CSRF_SECRET=your-csrf-secret-here

# Supabase Configuration (Optional - only if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE=your-supabase-service-role-key

# AI Provider API Keys (Optional - users can add their own keys in the app)
OPENAI_API_KEY=your-openai-api-key
MISTRAL_API_KEY=your-mistral-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
XAI_API_KEY=your-xai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Ollama Configuration (Optional)
OLLAMA_BASE_URL=http://localhost:11434
DISABLE_OLLAMA=false

# Development
NODE_ENV=development
```

### 2. Generate Required Keys

For the required encryption and CSRF keys, you can generate them using:

```bash
# Generate ENCRYPTION_KEY (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate CSRF_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development Commands

### Start Desktop App in Development Mode
```bash
npm run desktop:dev
```
This will start both the Next.js dev server and the Tauri app simultaneously.

### Start Individual Services
```bash
# Start only Next.js dev server
npm run dev

# Start only Tauri dev (requires Next.js server to be running)
npm run tauri:dev
```

## Production Build

### Build Desktop App
```bash
npm run desktop:build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`.

## App Configuration

The desktop app is configured with:
- **App Name**: Coreframe
- **Window Size**: 1200x800 (minimum 800x600)
- **Identifier**: com.kchat.desktop
- **Platform Support**: All platforms (Windows, macOS, Linux)

## Troubleshooting

### Build Errors
- Ensure all required environment variables are set in `.env`
- Make sure Rust is installed for Tauri builds
- Check that Node.js and npm are up to date

### Port Conflicts
- The app uses port 3000 by default
- Make sure no other services are using this port

### Missing Dependencies
If you encounter issues, try:
```bash
npm install
```

## File Structure

```
.
├── src-tauri/          # Tauri Rust backend
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── app/                # Next.js frontend
├── .env                # Environment variables (create this)
└── package.json        # Updated with desktop scripts
```

Enjoy your new desktop chat application! 🚀 