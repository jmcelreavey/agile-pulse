# Authentication

Agile Pulse uses NextAuth.js to handle authentication. Currently, the system supports sign-up and sign-in through Google accounts.

## Sign Up / Sign In

### Supported Providers

At present, Agile Pulse supports authentication through:

- Google

### Process

1. Users can initiate the sign-up/sign-in process from the login page.
2. They will be redirected to the Google authentication page.
3. After successful authentication with Google, users are redirected back to Agile Pulse.

### NextAuth.js Integration

NextAuth.js is used to handle the OAuth flow with Google. It provides:

- Secure token handling
- Session management
- Easy integration with Next.js applications

For developer information on NextAuth.js setup, refer to the [NextAuth.js documentation](https://next-auth.js.org/).

## System Access

Upon successful authentication:

1. Users are redirected to the Agile Pulse home page.
2. The home page displays a list of projects the user has access to.

## Project Access

Access to projects is determined by the user's email domain:

- A user's email domain (e.g., "example.com" for <john.doe@example.com>) grants access to projects associated with that domain.
- Users can only view and interact with projects linked to their email domain.

## User Roles and Permissions

Currently, all users have the same permissions.

## Security Considerations

Sessions are stored in the database.
