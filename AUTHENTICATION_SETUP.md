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
   - Email OTP verification
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

- **Email OTP**: 6-digit verification code sent via email
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

### Apple SSO Production Issues

If Apple SSO shows "invalid_request" error in production, check these common causes:

#### 1. **Apple Developer Configuration**

- **Services ID**: Verify your Services ID (`com.ditectrev.education`) is correctly configured in Apple Developer Console
- **Redirect URLs**: Ensure your production domain is added to the "Return URLs" list
- **Domain Verification**: Verify your domain ownership in Apple Developer Console
- **Key Configuration**: Check that your Apple Sign In key is properly configured

#### 2. **Appwrite Configuration**

- **Client ID**: Must match your Apple Services ID exactly (`com.ditectrev.education`)
- **Bundle ID**: Should match your app's bundle identifier
- **Team ID**: Verify this matches your Apple Developer Team ID
- **Key ID**: Must match the Key ID from your Apple Sign In key
- **Private Key**: Ensure the private key is correctly formatted (PEM format)

#### 3. **Production Environment**

- **HTTPS Required**: Apple SSO only works over HTTPS in production
- **Domain Matching**: The domain in the request must match the registered domain
- **Callback URL**: Must be `https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/apple/[PROJECT_ID]`

#### 4. **Debugging Steps**

1. Check Appwrite console logs for detailed error messages
2. Verify all Apple Developer settings match Appwrite configuration
3. Test the OAuth flow manually using Apple's authorization URL
4. Ensure your production domain is verified with Apple

#### 5. **Common Error Codes**

- **invalid_client**: Client ID mismatch or invalid configuration
- **invalid_request**: Malformed request or missing parameters
- **unauthorized_client**: App not authorized for Apple Sign In

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
