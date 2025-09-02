# Authentication Setup Guide

This guide will help you set up Appwrite authentication for your Practice Exams Platform.

## Prerequisites

1. An Appwrite account (sign up at [appwrite.io](https://appwrite.io))
2. A new Appwrite project

## Step 1: Create Appwrite Project

1. Log in to your Appwrite console
2. Click "Create Project"
3. Give your project a name (e.g., "Practice Exams Platform")
4. Choose your preferred region
5. Click "Create"

## Step 2: Configure Authentication

### Enable Authentication Methods

1. In your project dashboard, go to **Auth** → **Settings**
2. Enable the following authentication methods:
   - **Email/Password** (for OTP)
   - **Google OAuth**
   - **Apple OAuth**

### Configure OAuth Providers

#### Google OAuth

1. Go to **Auth** → **OAuth2 Providers**
2. Click on **Google**
3. Enable the provider
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Set redirect URL: `https://yourdomain.com/auth/callback`

#### Apple OAuth

1. Go to **Auth** → **OAuth2 Providers**
2. Click on **Apple**
3. Enable the provider
4. Add your Apple OAuth credentials:
   - Client ID
   - Client Secret
   - Team ID
5. Set redirect URL: `https://yourdomain.com/auth/callback`

### Configure Email Templates

1. Go to **Auth** → **Templates**
2. Customize the email templates for:
   - Magic URL (email OTP)
   - Email verification

## Step 3: Environment Variables

Create a `.env.local` file in your project root with:

```bash
APPWRITE_PUBLIC_ENDPOINT=https://[REGION].cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
```

Replace `your_project_id_here` with your actual Appwrite project ID.

## Step 4: Update Callback URLs

In your Appwrite project settings, you need to configure callback URLs for OAuth providers:

### For Google OAuth:

1. Go to **Auth** → **OAuth2 Providers** → **Google**
2. In the Google OAuth configuration, you'll see a **Redirect URL** field
3. Set this to: `https://yourdomain.com/auth/callback`

### For Apple OAuth:

1. Go to **Auth** → **OAuth2 Providers** → **Apple**
2. In the Apple OAuth configuration, you'll see a **Redirect URL** field
3. Set this to: `https://yourdomain.com/auth/callback`

**Note**: The success/failure URLs mentioned in the original documentation are not standard Appwrite settings. Appwrite handles OAuth redirects automatically to the redirect URL you specify above. The success/failure parameters are handled by your application logic in the callback route.

## Step 5: Test Authentication

1. Start your development server
2. Navigate to any practice or exam page
3. You should see the 15-minute trial timer
4. After 15 minutes, the authentication modal should appear
5. Test all three authentication methods:
   - Email OTP
   - Google OAuth
   - Apple OAuth

## Features Implemented

### Authentication Methods

- **Email OTP**: Magic link authentication via email
- **Google OAuth**: Sign in with Google account
- **Apple OAuth**: Sign in with Apple ID

### Trial System

- **15-minute trial** for unauthenticated users
- **Automatic blocking** after trial expires
- **Persistent trial state** across browser sessions
- **Visual indicators** for trial status

### User Experience

- **Seamless integration** with existing UI
- **Responsive design** for mobile and desktop
- **User profile management** in navigation
- **Automatic redirects** after authentication

## PWA Compatibility

This authentication system is fully compatible with PWA Builder for:

- **Android** deployment
- **iOS** deployment
- **Microsoft Store** deployment

The authentication flow works seamlessly across all platforms.

## Troubleshooting

### Common Issues

1. **OAuth redirect errors**: Ensure callback URLs are correctly configured
2. **Email not sending**: Check Appwrite email service configuration
3. **Trial timer not working**: Clear localStorage and refresh page
4. **Authentication state not persisting**: Check browser console for errors

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```bash
NEXT_PUBLIC_DEBUG_AUTH=true
```

## Security Considerations

- All authentication is handled server-side by Appwrite
- No sensitive credentials are stored in the frontend
- Session management is handled securely by Appwrite
- OAuth tokens are never exposed to the client

## Next Steps

After setup, consider:

1. Adding user profile management
2. Implementing role-based access control
3. Adding analytics for user engagement
4. Setting up email notifications for user actions
