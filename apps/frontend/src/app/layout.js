import "./globals.css";

export const metadata = {
  title: "DownLink | Universal Downloader",
  description: "Download content from Instagram, TikTok, YouTube, Twitter and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
