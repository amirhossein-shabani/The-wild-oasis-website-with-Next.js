import { Josefin_Sans } from "next/font/google";
import Header from "@/app/_components/Header";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  display: "swap",
});

import "@/app/_styles/globals.css";
import { ReservationProvider } from "./_components/ReservationContext";

export const metadata = {
  // title: "The Wild Oasis",
  title: {
    template: "%s / The Wild Oasis",
    default: "Welcome / The Wild Oasis",
  },
  description:
    "Luxuious cabin hotel, located in the heart of the Italian Dolomites, surrounded by beautiful mountains and dark forests",
  keywords: [
    "luxury",
    "hotel",
    "cabin",
    "mountains",
    "dolomites",
    "italy",
    "nature",
    "wild oasis",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` ${josefin.className} bg-primary-950 text-primary-100 min-h-screen  flex flex-col relative`}
      >
        <Header />
        <div className="flex-1 px-8 py-12 grid">
          <main className="max-w-7xl mx-auto  w-full">
            {/* the children are the server components and we can use them as children in ReservationProvider which the client component becuase this childrens rendered in initial rendering and after that pass as children prop to ReservationProvider and all the client components can use this ReservationProvider (context api ) component*/}
            <ReservationProvider>{children}</ReservationProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
