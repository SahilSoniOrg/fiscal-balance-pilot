# Fiscal Balance Pilot

A modern, full-featured financial accounting application built with React and TypeScript. This application allows businesses to manage their accounts, journals, transactions, and financial reporting in an intuitive interface.

## Project Overview

Fiscal Balance Pilot is designed to provide a comprehensive accounting system with the following features:

- **Multi-workplace support**: Manage accounting for multiple businesses
- **Account management**: Create and manage accounts with proper account hierarchy
- **Journal entries**: Record financial transactions with double-entry accounting
- **Currency support**: Handle multiple currencies with proper exchange rates
- **Financial reports**: Generate balance sheets, income statements, and other financial reports
- **User authentication**: Secure login and role-based access control

## Technical Architecture

### Frontend Technologies

- **React 18**: Modern component-based UI architecture
- **TypeScript**: Type-safe JavaScript for improved reliability
- **Vite**: Lightning-fast build tooling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: High-quality React components built with Radix UI and Tailwind CSS
- **React Router**: Client-side routing
- **React Query**: Data fetching and state management
- **Context API**: Global state management

### Project Structure

```
src/
├── components/     # UI components organized by feature
│   ├── accounts/   # Account-related components
│   ├── journals/   # Journal-related components
│   ├── dashboard/  # Dashboard components
│   ├── layout/     # Layout components (header, sidebar, etc.)
│   └── ui/         # Reusable UI components
├── context/        # React Context providers for global state
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and types
├── pages/          # Page components
└── services/       # API service functions
```

### Key Features

#### Account Management
- Create, update, and manage chart of accounts
- Support for different account types (Assets, Liabilities, Equity, Revenue, Expense)
- Hierarchical account structure

#### Journal Entries
- Create and manage journal entries with double-entry accounting
- Support for reversal journals
- Transaction history and audit trail

#### Multi-currency Support
- Support for multiple currencies
- Currency conversion for transactions and reports

#### Data Visualization
- Dashboard with key financial metrics
- Charts and graphs for financial analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A backend API service (separate repository)

### Installation

1. Clone the repository:
```sh
git clone <repository-url>
cd fiscal-balance-pilot
```

2. Install dependencies:
```sh
npm install
```

3. Create a `.env` file with your configuration:
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

4. Start the development server:
```sh
npm run dev
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

## Development Notes

- The application uses Context API for global state management
- API requests are deduplication-enabled to prevent duplicate calls
- Forms use a centralized validation system for consistency

## Recent Optimizations & Bug Fixes

### Performance Improvements
- Implemented request deduplication to prevent duplicate API calls
- Enhanced dependency tracking in context providers to prevent unnecessary re-renders
- Added proper memoization of context values to reduce render cycles
- Optimized form state management to prevent recursive updates

### Bug Fixes
- Fixed issues with currency display and selection
- Resolved infinite re-render loops in form components
- Addressed dialog cancel button functionality
- Corrected parent account ID handling for account creation/editing
- Fixed includeReversals parameter handling in journal listings

## License

This project is proprietary and confidential.
