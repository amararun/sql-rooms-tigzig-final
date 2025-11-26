# SQL Rooms AI @Tigzig

This is a customized version of the original [SQLRooms](https://sqlrooms.org) application.

**Original repositories:**
- Main repository: [SQLRooms GitHub](https://github.com/sqlrooms/sqlrooms)
- AI Example: [SQLRooms AI Example](https://github.com/sqlrooms/sqlrooms/tree/main/examples/ai)

## Features

### AI-Powered Data Analysis
- **Natural Language Queries**: Ask questions in plain English and get SQL results
- **Multi-Model Support**: OpenAI GPT-4o-mini, Google Gemini 2.0 Flash, Anthropic Claude
- **Smart Tool Selection**: AI automatically chooses the right tool for your request
- **On-Demand Schema Discovery**: AI intelligently discovers table schemas only when needed using DESCRIBE queries, achieving 60% token savings compared to sending full schemas upfront.

### Visualization
- **Vega Lite Charts**: Interactive data visualizations with full Vega Lite specification support
- **Dual-Axis Charts**: Compare metrics with different scales on the same chart
- **Chart Types**: Bar charts, line charts, scatter plots, histograms, and more

### Comprehensive Data Import
- **Smart File Detection**: Automatically detects delimiters in CSV, TSV, pipe-delimited files
- **Multiple Formats**: CSV, TSV, Pipe-delimited (.pipe, .psv), Parquet, JSON, Text files
- **Database Import**: Import entire DuckDB database files (.db, .duckdb) into separate schemas
- **Drag & Drop**: Simple file drop interface with progress indicators

### Flexible Export Options
- **Database Export**: Export entire database as compressed ZIP with Parquet files (85-90% size reduction)
- **Table Export**: Export individual tables in CSV, Pipe-delimited, or Parquet formats
- **Schema Documentation**: Auto-generated README with usage examples
- **Direct Download**: Files download immediately without intermediate steps

### Professional API Key Management
- **Multi-Provider Support**: Manage OpenAI, Google Gemini, and Anthropic API keys
- **Secure Storage**: Keys stored locally in browser, never transmitted to servers
- **Real-Time Validation**: Instant feedback on key format and validity
- **Batch Management**: Configure all providers in one interface

### Database Operations
- **DDL Support**: Create, drop, and alter tables with AI assistance
- **DML Operations**: Insert, update, and delete data with safety checks
- **Schema Awareness**: AI automatically knows about all tables and their structure
- **Cross-Schema Queries**: Query across multiple imported schemas

### Enhanced User Experience
- **Resizable Layout**: Drag to resize panels with react-mosaic-component
- **Session Management**: Persistent chat history with automatic cleanup
- **Toast Notifications**: Clear feedback for all operations
- **Responsive Design**: Works on desktop and mobile devices

### Technical Features
- **DuckDB Integration**: In-browser SQL engine with full SQL support
- **State Persistence**: Chat sessions and API keys are saved locally in your browser. **Note:** The database itself is in-memory, meaning imported tables and data will be cleared on page refresh.
- **Error Handling**: Comprehensive error recovery with user-friendly messages
- **Performance Optimized**: Efficient data processing and memory management

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd sql-rooms

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Add Data**: Drag and drop CSV files or import DuckDB databases
2. **Ask Questions**: Type natural language questions about your data
3. **Get Insights**: AI generates SQL queries and visualizations
4. **Export Results**: Download tables or entire databases in your preferred format

## Deployment

### Web Hosting (Vercel, Netlify, etc.)

Connect your GitHub repository to Vercel or Netlify - they will automatically build and deploy your app on every push.

**No manual build needed** - hosting providers handle the build process (`npm run build`) automatically.

### Single-File Build (Email Distribution)

For distributing the app as a single HTML file that works without a server:

```bash
npm run build:single-file
```

This creates `dist-single/SQL-ROOMS-TIGZIG-FULL-APP.html` (3.4 MB), a self-contained version that can be:
- ✅ Emailed as an attachment
- ✅ Double-clicked to open in any browser
- ✅ Shared via file transfer (Google Drive, Dropbox)
- ✅ Used offline (after initial CDN downloads)

**Features:**
- All app code embedded in a single HTML file
- No server deployment required
- Works identically to the web version
- First load: 30s-3min (downloading React & DuckDB from CDN)
- Subsequent loads: 5-10 seconds (cached)

See [App Architecture Document](./docs/APP_ARCHITECTURE.md#single-file-build-system) for full details.

## For AI Coders (and Humans)

This section provides guidance for AI agents and developers working on this codebase.

1.  **Application Architecture**: Before making changes, it is highly recommended to review the [App Architecture Document](./docs/APP_ARCHITECTURE.md). This document details:
    *   Customizations made to the original SQLRooms application.
    *   Technical challenges, solutions, and future plans.
    *   An overview of how new features (like data import/export and API management) are implemented.
    *   A crucial guide for tracing functionality from this example repository back to the original source code, which is included for reference in the `sql-rooms-main-repo/` directory.
    *   It also includes critical technical notes on topics like NPM package patching, Vite bundling gotchas, and CSS overrides.
    *   **Single-File Build System**: Complete documentation on creating email-able, serverless deployments.

2.  **Repository Structure for Tracing**: For human developers who have just cloned this repository: please be aware that the full original SQLRooms monorepo (`sql-rooms-main-repo/`) might not be included in a standard clone. To enable full-context tracing for an AI assistant, ensure that the complete original repository is present at the root of this project.

## Technical Notes

### StatCounter Web Analytics

This application includes a StatCounter key for web analytics purposes.

**If you are deploying this app:**
- **Remove the key**: Delete StatCounter code from `index.html` (between `<!-- STATCOUNTER_START -->` and `<!-- STATCOUNTER_END -->` markers)
- **OR replace with your own**: Update the `sc_project` and `sc_security` values in `index.html`

**Single-file build:**
- StatCounter is **automatically excluded** from the single-file build (`npm run build:single-file`)
- This ensures privacy-friendly offline distribution with no external tracking
- See [App Architecture Document](./docs/APP_ARCHITECTURE.md#single-file-customization-system) for implementation details

## Credits

Original application: [SQLRooms.org](https://sqlrooms.org)
