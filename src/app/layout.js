import "./globals.css";

export const metadata = {
  title: "UniDL | Universal Downloader",
  description: "Download content from Instagram, TikTok, YouTube, Twitter and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
