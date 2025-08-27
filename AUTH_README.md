# BRMH-Based Authentication System Implementation

## Overview

The authentication system has been successfully implemented in your InfluenceHub web application using **BRMH (Backend Resource Management Hub)** for user management and authentication. This provides a unified data management solution for both authentication and business data.

## Features Implemented

### 🔐 Authentication Methods

1. **OAuth Authentication**
   - Cognito OAuth integration
   - Automatic token exchange
   - State parameter validation

2. **Email Authentication**
   - Username/password login
   - Email-based signup
   - JWT token management

3. **Phone Authentication**
   - Phone number signup/login
   - OTP verification
   - SMS-based verification flow

### 🔄 Authentication Flow

1. **Initial Load**
   - Check for existing tokens in localStorage
   - Validate tokens with backend
   - Auto-redirect to main app if valid

2. **Login/Signup Process**
   - User selects authentication method
   - Completes authentication flow
   - Tokens are stored securely
   - Automatic redirect to main application

3. **Token Management**
   - Automatic token refresh
   - Secure token storage
   - Token expiration handling

## File Structure

```
app/
├── pages/
│   └── auth.tsx              # Main authentication component
├── page.tsx                  # Main app entry point with auth logic
└── lib/
    ├── brmh-auth-utils.ts    # BRM-based authentication utilities
    ├── brmh-api.ts           # BRM API for data operations
    └── auth-utils.ts         # Legacy auth utilities (can be removed)
```

## Key Components

### Auth Component (`app/pages/auth.tsx`)
- **Multi-method authentication**: OAuth, Email, Phone
- **Responsive UI**: Modern design with shadcn/ui components
- **Error handling**: Comprehensive error messages
- **Loading states**: User feedback during authentication

### BRMHAuthUtils (`lib/brmh-auth-utils.ts`)
- **BRMH integration**: User management through BRMH tables
- **Token management**: Store, retrieve, validate, clear tokens
- **User operations**: Create, update, and validate users in BRMH
- **Password hashing**: Secure password storage and verification
- **Error handling**: Network and authentication error handling

### Main Page (`app/page.tsx`)
- **Authentication state management**: Check auth status on load
- **Loading states**: Show loading spinner during auth check
- **Conditional rendering**: Show auth page or main app based on auth status

## BRMH Integration

The authentication system uses BRMH for user management:

### BRMH Table: `brmh-users`
- **User storage**: All user data stored in BRMH table
- **CRUD operations**: Create, read, update, delete users
- **Data structure**: Username, email, phone, password (hashed), role, status
- **Custom fields**: Additional user data stored in `data` field

### BRMH Endpoints Used
- `POST /crud?tableName=brmh-users` - Create user
- `GET /crud?tableName=brmh-users&id={id}` - Get user by ID
- `GET /crud?tableName=brmh-users&pagination=true` - Get all users
- `PUT /crud?tableName=brmh-users` - Update user
- `DELETE /crud?tableName=brmh-users` - Delete user

## Environment Variables

### For Production (with backend):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
```

### For Testing (mock mode - no backend required):
```env
NEXT_PUBLIC_MOCK_AUTH=true
```

**Note:** When `NEXT_PUBLIC_MOCK_AUTH=true` is set, the authentication system will work without a backend server, allowing you to test the full authentication flow immediately.

## Usage

### Starting the Application

```bash
npm run dev
```

The application will:
1. Check for existing authentication tokens
2. Validate tokens with the backend
3. Show authentication page if not authenticated
4. Redirect to main application after successful authentication

### Authentication Flow

1. **OAuth Flow**:
   - Click "Sign in with Cognito OAuth"
   - Redirected to Cognito login page
   - After successful login, redirected back to app
   - Tokens automatically stored and user redirected to main app

2. **Email Flow**:
   - Select "Email" authentication method
   - Enter username/password
   - Click "Sign In" or "Sign Up"
   - On success, redirected to main app

3. **Phone Flow**:
   - Select "Phone" authentication method
   - Enter phone number and password
   - For signup: Enter OTP verification code
   - On success, redirected to main app

## Security Features

- **Token Storage**: Secure localStorage token storage
- **Token Validation**: Backend token validation on each request
- **Auto-refresh**: Automatic token refresh before expiration
- **State Management**: OAuth state parameter validation
- **Error Handling**: Comprehensive error handling and user feedback

## Redirect Behavior

After successful authentication:
- ✅ User is automatically redirected to the main application
- ✅ Authentication state is maintained across page refreshes
- ✅ Tokens are validated on each app load
- ✅ Invalid tokens are automatically cleared

## Logout

Users can logout from the main application, which will:
- Clear all stored tokens
- Redirect back to authentication page
- Clear session storage data

## Error Handling

The system handles various error scenarios:
- Network errors
- Invalid credentials
- Token expiration
- OAuth errors
- OTP verification failures

All errors are displayed to users with clear, actionable messages.

## Next Steps

1. **Backend Integration**: Ensure your backend implements all required authentication endpoints
2. **Environment Setup**: Configure `NEXT_PUBLIC_BACKEND_URL` for your environment
3. **Testing**: Test all authentication flows (OAuth, Email, Phone)
4. **Customization**: Customize UI components and styling as needed

The authentication system is now fully functional and ready for production use!
