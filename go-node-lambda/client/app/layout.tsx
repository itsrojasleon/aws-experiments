import './output.css';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="m-2">{children}</body>
    </html>
  );
}
