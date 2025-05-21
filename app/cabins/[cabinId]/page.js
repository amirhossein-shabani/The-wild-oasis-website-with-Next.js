import Cabin from "@/app/_components/Cabin";
import Reservation from "@/app/_components/Reservation";
import Spinner from "@/app/_components/Spinner";
import { getCabin, getCabins } from "@/app/_lib/data-service";
import { GET } from "@/app/api/cabins/[cabinId]/route";
import { Suspense } from "react";

// generate metadata dynamiclly by generateMedadata() function :
export async function generateMetadata({ params }) {
  const { name } = await getCabin(params.cabinId);
  return {
    title: `Cabin ${name}`,
  };
}

export async function generateStaticParams() {
  const cabins = await getCabins();
  const ids = cabins.map((cabin) => ({ cabinId: String(cabin.id) }));

  return ids;
}

// example to how we can use the api endpoint which we definde with Route Handler :

// async function getCabinData(cabinId) {
//   const res = await fetch(`http://localhost:3000/api/cabins/${cabinId}`);
//   if (!res.ok) throw new Error("Failed to fetch cabin data");
//   return res.json();
// }

export default async function Page({ params }) {
  const cabin = await getCabin(params.cabinId);
  // const { cabinId } = params;
  // const { cabin, bookedDates } = await getCabinData(cabinId);

  console.log(cabin, bookedDates);

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <Cabin cabin={cabin} />
      <div>
        <h2 className="text-5xl font-semibold text-center mb-10 text-accent-400 ">
          Reserve {cabin.name} today. Pay on arrival.
        </h2>
        <Suspense fallback={<Spinner />}>
          <Reservation cabin={cabin} />
        </Suspense>
      </div>
    </div>
  );
}
