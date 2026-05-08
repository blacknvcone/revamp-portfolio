import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'My Portfolio',
  description: 'Welcome to my portfolio website',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
