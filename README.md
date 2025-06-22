# Coreframe


**Coreframe** is the open-source chat interface for all your models.

![Coreframe cover](./public/cover_coreframe.jpg)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/coreframe)

## Features

- **Multi-Model Support**: OpenAI, Claude, local Ollama models, and more
- **BYOK (Bring Your Own Key)**: Securely use your own API keys
- **Self-Hostable**: Deploy on your own infrastructure
- **File Attachments**: Upload and chat about documents and images
- **Export Conversations**: Download your chats as JSON or Markdown
- **Dark/Light Mode**: Choose your preferred theme

## Quick Start

### Local Development

```bash
# Clone and run Coreframe
git clone https://github.com/0ni-x4/coreframe.git
cd coreframe
npm install
npm run dev
```

### Production Deployment

```bash
git clone https://github.com/0ni-x4/coreframe.git
cd coreframe
npm install
npm run build
npm start
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/coreframe)

## Configuration

See [INSTALL.md](./INSTALL.md) for detailed setup instructions including:

- Environment variables
- Database setup (optional)
- Authentication configuration
- Model provider setup
- Docker deployment options

## Local Models with Ollama

Coreframe has built-in support for Ollama. Simply:

1. Install and run Ollama locally
2. Pull some models (`ollama pull llama2`)
3. Start Coreframe - models will appear automatically!

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- 📖 [Documentation](./INSTALL.md)
- 🐛 [Report Issues](https://github.com/ibelick/coreframe/issues)
- 💬 [Discussions](https://github.com/ibelick/coreframe/discussions)
