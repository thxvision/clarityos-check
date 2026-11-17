import "./globals.css";

export const metadata = {
  title: "ClarityOS® Check · THX",
  description: "Misst, ob in eurer Organisation dieselben Regeln gelten.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <header className="top">
          <span className="brand">THX</span>
          <span className="brand-sub">ClarityOS® Check</span>
        </header>
        <main>{children}</main>
        <footer className="foot">THX e.U. · Gmunden · Daten in der EU (Frankfurt) · Anonym ab 5 Antworten pro Gruppe</footer>
      </body>
    </html>
  );
}
