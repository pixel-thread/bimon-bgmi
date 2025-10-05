// app/your-snake-folder/layout.tsx  (same folder as page.tsx)
export const metadata = {
  };

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

  export default function SnakeLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  }