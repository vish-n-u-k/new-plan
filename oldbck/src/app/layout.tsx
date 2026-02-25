import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js Starter',
  description: 'A full-stack Next.js starter template with TypeScript, Prisma, and Zod',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
