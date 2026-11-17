import "./globals.css";
export const metadata = { title: "Haveli Dhaba – Family Indian Dhaba | Ulda, Jharkhand", description: "Haveli Dhaba, a family-friendly Indian highway dhaba near NH-33, Ulda, Jharkhand. Tandoori specialities and warm family dining.", openGraph: { title: "Haveli Dhaba – Ulda, Jharkhand", images: ["/images/photo-5.jpg"] } };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Inter:wght@400;500;600&display=swap" /></head><body>{children}</body></html>);
}
