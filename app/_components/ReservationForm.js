"use client";

import { useState } from "react";
import { differenceInDays } from "date-fns";
import { useReservation } from "./ReservationContext";
import { createBooking } from "../_lib/action";
import SubmitButton from "./SubmitButton";

function ReservationForm({ cabin, user, settings }) {
  const { range, resetRange } = useReservation();
  const { maxCapacity, regularPrice, discount, id } = cabin;
  const { breakfastPrice } = settings;

  const startDate = range.from;
  const endDate = range.to;
  const numNights = differenceInDays(endDate, startDate);

  const cabinPrice = numNights * (regularPrice - discount);

  // state برای کنترل تعداد مهمان و انتخاب صبحانه
  const [numGuests, setNumGuests] = useState("");
  const [hasBreakfast, setHasBreakfast] = useState(false);

  // محاسبه هزینه اضافه صبحانه
  const extrasPrice =
    hasBreakfast && numGuests && numNights > 0
      ? breakfastPrice * Number(numGuests) * numNights
      : 0;

  const bookingData = {
    startDate,
    endDate,
    numNights,
    cabinPrice,
    cabinId: id,
  };

  const createBookingWithData = createBooking.bind(null, bookingData);

  return (
    <div className="scale-[1.0] flex-1">
      <div className="bg-primary-800 text-primary-300 px-16 py-5 flex justify-between items-center">
        <p>Logged in as</p>

        <div className="flex gap-4 items-center">
          <img
            referrerPolicy="no-referrer"
            className="h-8 rounded-full"
            src={user.image}
            alt={user.name}
          />
          <p>{user.name}</p>
        </div>
      </div>

      <form
        action={async (formData) => {
          await createBookingWithData(formData);
          resetRange();
          setNumGuests("");
          setHasBreakfast(false);
        }}
        className="bg-primary-900 py-10 px-16 text-lg flex gap-5 flex-col"
      >
        <div className="space-y-2">
          <label htmlFor="numGuests">How many guests?</label>
          <select
            name="numGuests"
            id="numGuests"
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
            required
            value={numGuests}
            onChange={(e) => setNumGuests(e.target.value)}
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
            id="observations"
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
            placeholder="Any pets, allergies, special requirements, etc.?"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <label htmlFor="hasBreakfast" className="cursor-pointer">
                Do you want breakfast?{" "}
                {breakfastPrice !== undefined && (
                  <span className="text-sm text-primary-400">
                    (Price: {breakfastPrice} per person per day)
                  </span>
                )}
              </label>
              {hasBreakfast && numGuests && numNights > 0 && (
                <p className="text-sm text-green-300 mt-1">
                  +{extrasPrice}$ will be added to your total
                </p>
              )}
            </div>
            <input
              type="checkbox"
              name="hasBreakfast"
              id="hasBreakfast"
              className="
              h-5 w-5 appearance-none rounded-full border-2
              border-primary-400 bg-primary-800 transition-all
              checked:border-accent-500 checked:bg-accent-500
              checked:ring-1 checked:ring-accent-200
              focus:ring-2 focus:ring-accent-300
              cursor-pointer
            "
              checked={hasBreakfast}
              onChange={(e) => setHasBreakfast(e.target.checked)}
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-6">
          {!(startDate && endDate) ? (
            <p className="text-primary-300 text-base p-4">
              Start by selecting dates
            </p>
          ) : (
            <SubmitButton pendingLabel="Reserving...">Reserve now</SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReservationForm;
