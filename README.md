# One-Shot

**Context Builder for Large Language Models.**

One-Shot is a developer tool designed to streamline the process of creating context payloads for LLMs. Instead of manually copying and pasting files across your codebase, One-Shot allows you to visualize your project structure, select relevant files, and generate a structured, optimized prompt in seconds.

## Features

- **Visual File Explorer**: Navigate your project tree intuitively.
- **Selective Context**: Pick only the files that matter for your current task.
- **Token Budgeting**: Monitor your token usage in real-time against model limits.
- **Multi-Provider Support**: Compatible with OpenAI, Anthropic, Google Gemini, and local models.
- **Privacy First**: Your code stays local. API keys are stored securely on your machine.

## Installation

### Prerequisites

- [Go](https://go.dev/) 1.21+
- [Node.js](https://nodejs.org/) 20+
- [Wails](https://wails.io/) v2

### Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/obeskay/one-shot.git
   cd one-shot
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   wails dev
   ```

4. **Build for production**
   ```bash
   wails build
   ```
   The compiled binary will be available in the `build/bin` directory.

## Usage

1. Open One-Shot.
2. Select your target project directory.
3. Browse the file tree and select the files relevant to your task.
4. (Optional) Enter your prompt or intent in the dashboard.
5. Click **Generate One-Shot** to copy the formatted context to your clipboard.

## Tech Stack

Built with performance and native experience in mind:

- **Backend**: Go (via Wails)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4

## Contributing

Contributions are welcome. Please ensure your code follows the project's structure and includes relevant tests.

## License

Distributed under the MIT License. See `LICENSE` for more information.
