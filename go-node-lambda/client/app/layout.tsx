import './output.css';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="bg-black flex justify-center items-center h-screen text-white text-xl">
        {children}
      </body>
    </html>
  );
}
