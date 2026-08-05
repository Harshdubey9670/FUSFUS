import fs from 'fs';
import path from 'path';

const pages = [
  { path: 'pages/auth/LoginPage.jsx', name: 'Login' },
  { path: 'pages/auth/SignupPage.jsx', name: 'Signup' },
  { path: 'pages/auth/ForgotPasswordPage.jsx', name: 'ForgotPassword' },
  { path: 'pages/auth/OtpPage.jsx', name: 'Otp' },
  { path: 'pages/auth/ProfileSetupPage.jsx', name: 'ProfileSetup' },
  { path: 'pages/user/FeedPage.jsx', name: 'Feed' },
  { path: 'pages/user/ReelsPage.jsx', name: 'Reels' },
  { path: 'pages/user/StoriesPage.jsx', name: 'Stories' },
  { path: 'pages/user/CameraPage.jsx', name: 'Camera' },
  { path: 'pages/user/ExplorePage.jsx', name: 'Explore' },
  { path: 'pages/user/ChatPage.jsx', name: 'Chat' },
  { path: 'pages/user/VaultPage.jsx', name: 'Vault' },
  { path: 'pages/user/NotificationsPage.jsx', name: 'Notifications' },
  { path: 'pages/user/ProfilePage.jsx', name: 'Profile' },
  { path: 'pages/user/SettingsPage.jsx', name: 'Settings' },
  { path: 'pages/admin/AdminDashboardPage.jsx', name: 'AdminDashboard' }
];

const template = (name) => `import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";

const ${name}Page = () => {
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="hero-text text-3xl">${name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">This is the placeholder for the ${name} page.</p>
      </CardContent>
    </Card>
  );
};

export default ${name}Page;
`;

pages.forEach(page => {
  const fullPath = path.join(process.cwd(), 'src', page.path);
  fs.writeFileSync(fullPath, template(page.name));
});

console.log('Pages generated!');
