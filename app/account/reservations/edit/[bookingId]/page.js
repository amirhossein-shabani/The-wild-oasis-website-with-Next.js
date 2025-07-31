import SubmitButton from "@/app/_components/SubmitButton";
import { updateBooking } from "@/app/_lib/action";
import { getBooking, getCabin } from "@/app/_lib/data-service";

export async function generateMetadata({ params }) {
  const { bookingId } = params;

  return {
    title: `Edit Reservation #${bookingId}`,
  };
}

export default async function Page({ params }) {
  const { bookingId } = params;
  const {
    numGuests,
    observations,
    cabinId,
    hasBreakfast,
    cabinPrice,
    numNights,
  } = await getBooking(bookingId);
  const { maxCapacity } = await getCabin(cabinId);

  return (
    <div>
      <h2 className="font-semibold text-2xl text-accent-400 mb-7">
        Edit Reservation #{bookingId}
      </h2>

      <form
        action={updateBooking}
        className="bg-primary-900 py-8 px-12 text-lg flex gap-6 flex-col"
      >
        <input type="hidden" value={bookingId} name="bookingId" />
        <input type="hidden" value={cabinPrice} name="cabinPrice" />
        <input type="hidden" value={numNights} name="numNights" />

        <div className="space-y-2">
          <label htmlFor="numGuests">How many guests?</label>
          <select
            name="numGuests"
            id="numGuests"
            defaultValue={numGuests}
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
            required
          >
            <option value="" key="">
              Select number of guests...
            </option>
            {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((x) => (
              <option value={x} key={x}>
                {x} {x === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="observations">
            Anything we should know about your stay?
          </label>
          <textarea
            name="observations"
            defaultValue={observations}
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="pr-5" htmlFor="hasBreakfast">
            Do you want breakfast?
          </label>
          <input
            type="checkbox"
            name="hasBreakfast"
            defaultChecked={hasBreakfast}
            className="
              h-5 w-5 appearance-none rounded-full border-2
              border-primary-400 bg-primary-800 transition-all
              checked:border-accent-500 checked:bg-accent-500
              checked:ring-1 checked:ring-accent-200
              focus:ring-2 focus:ring-accent-300
              cursor-pointer
            "
          />
        </div>

        <div className="flex justify-end items-center gap-6">
          <SubmitButton pendingLabel="Updating...">
            Update reservation
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
