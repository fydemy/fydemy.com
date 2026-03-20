import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import Script from "next/script";
import { ThemeProvider } from "./components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Home • Fydemy",
    template: "%s • Fydemy",
  },
  icons: {
    icon: "/web/fav.svg",
  },
  description: "We're building open-source projects and empowering learning.",
  openGraph: {
    title: "Fydemy",
    description: "We're building open-source projects and empowering learning.",
    url: baseUrl,
    siteName: "Fydemy",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  if (typeof window === "undefined") {
    fetch("http://127.0.0.1:7248/ingest/1be3383c-edda-4c27-953f-67dbc4c70846", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "app/layout.tsx:RootLayout",
        message: "SSR render html",
        data: { env: "server", hasStyleProp: false },
        timestamp: Date.now(),
        hypothesisId: "A",
      }),
    }).catch(() => {});
  }
  // #endregion
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cx(
        "text-black bg-white dark:text-white dark:bg-black",
        GeistSans.variable,
      )}
    >
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <body className="antialiased max-w-3xl px-0 sm:px-4 mx-auto">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>
            {children}
            <Footer />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
