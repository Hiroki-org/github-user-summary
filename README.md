# GitHub User Summary

Unlock Your GitHub Profile! Explore user profiles, visualize contributions, and analyze coding habits with a beautiful, data-driven summary.

## Features

*   **Profile Analysis:** Gain insights into any GitHub user's profile.
*   **Contribution Visualization:** View contribution graphs and statistics in an engaging format.
*   **Data-Driven Summary:** Understand coding habits and language usage.
*   **Modern UI:** Built with Next.js App Router and Tailwind CSS for a sleek, responsive design.
*   **Dynamic Theming:** Extracts colors from user avatars to create personalized themes.
*   **Fast & Reliable:** Utilizes GitHub GraphQL API with REST fallbacks for optimal performance.

## Tech Stack

*   [Next.js](https://nextjs.org/) (App Router)
*   [React](https://react.dev/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [NextAuth.js](https://next-auth.js.org/)
*   [Recharts](https://recharts.org/)
*   [Vitest](https://vitest.dev/)

## Getting Started

### Prerequisites

*   Node.js (v20 or newer recommended)
*   npm, yarn, pnpm, or bun

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/github-user-summary.git
    cd github-user-summary
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the root directory and add the necessary environment variables (e.g., for NextAuth and GitHub API access). For local development, you may need a dummy secret:
    ```bash
    export NEXTAUTH_SECRET=mysecret123
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Testing & Verification

This project uses Vitest for unit testing.

*   Run tests:
    ```bash
    npm test
    ```
*   Run linting:
    ```bash
    npm run lint
    ```
*   Build the project:
    ```bash
    npm run build
    ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
