"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "./auth";
import { getBooking, getBookings } from "./data-service";
import { supabase } from "./supabase";
import { revalidatePath } from "next/cache";
import { ckb } from "date-fns/locale";
import { areIntervalsOverlapping } from "date-fns";

// ACTION FOR UPDATE GUEST PROFILE :
export async function updateGuest(formData) {
  // console.log(formData);
  const session = await auth();
  if (!session) throw new Error("You must be logged in ⛔");

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Please provide a valid national ID ⛔");

  const updateData = { nationality, countryFlag, nationalID };

  const { error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) throw new Error("Guest could not be updated ⛔");

  revalidatePath("/account/profile");
}

//ACTION FOR CREATE BOOKING =
export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in ⛔");

  const numGuests = Number(formData.get("numGuests"));
  const hasBreakfast = formData.get("hasBreakfast") === "on";
  const observations = formData.get("observations")?.slice(0, 1000) || "";

  const { data: settingsArray, error: settingError } = await supabase
    .from("settings")
    .select("*");

  if (settingError) throw new Error("Error fetching settings");

  if (!settingsArray || settingsArray.length === 0) {
    throw new Error("Settings not found");
  }

  const breakfastPrice = settingsArray?.[0]?.breakfastPrice;
  const minBookinLength = settingsArray?.[0]?.minBookinLength;

  if (bookingData.numNights < minBookinLength) {
    throw new Error(`Number of nights must be at least ${minBookinLength} ⛔`);
  }

  const { data: existingBookings, error: bookingError } = await supabase
    .from("bookings")
    .select("startDate, endDate")
    .eq("cabinId", bookingData.cabinId)
    .in("status", ["confirmed", "unconfirmed"]);

  if (bookingError) throw new Error("Error checking existing bookings");

  const newStart = new Date(bookingData.startDate);
  const newEnd = new Date(bookingData.endDate);

  const isOverlapping = existingBookings.some((booking) =>
    areIntervalsOverlapping(
      { start: newStart, end: newEnd },
      {
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
      }
    )
  );

  if (isOverlapping) {
    throw new Error("This date range is already booked ❌");
  }

  const extrasPrice = hasBreakfast
    ? breakfastPrice * numGuests * bookingData.numNights
    : 0;

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests,
    observations,
    extrasPrice,
    totalPrice: bookingData.cabinPrice + extrasPrice,
    isPaid: false,
    hasBreakfast,
    status: "unconfirmed",
  };

  const { error } = await supabase.from("bookings").insert([newBooking]);
  if (error) throw new Error("Booking could not be created");

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  redirect("/cabins/thankyou");
}

//ACTION FOR DELETE BOOKING =

export async function deleteBooking(bookingId) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in ⛔");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("you are not allowed to delete this booking ❌");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error("Booking could not be deleted 🤔");

  revalidatePath("/account/reservations");
}

//ACTION FOR UPDATE BOOKING
export async function updateBooking(formData) {
  const bookingId = Number(formData.get("bookingId"));
  const hasBreakfast = formData.get("hasBreakfast") === "on";
  const numGuests = Number(formData.get("numGuests"));
  const numNights = Number(formData.get("numNights")); // You'll need to pass this from the form
  const cabinPrice = Number(formData.get("cabinPrice")); // You'll need to pass this from the form

  const { data, error: settingError } = await supabase
    .from("settings")
    .select("breakfastPrice")
    .single();

  if (settingError) throw new Error("Error fetching settings");

  const breakfastPrice = data.breakfastPrice;

  // 1) Authentication
  const session = await auth();
  if (!session) throw new Error("You must be logged in ⛔");

  // 2) Authorization
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to update this booking");

  // 3) Calculate new prices
  const extrasPrice = hasBreakfast ? breakfastPrice * numGuests * numNights : 0;
  const totalPrice = cabinPrice + extrasPrice;

  // 4) Building update data
  const updateData = {
    numGuests,
    observations: formData.get("observations").slice(0, 1000),
    hasBreakfast,
    extrasPrice, // Add this to your update
    totalPrice, // Add this to your update
  };

  // 5) Mutation
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  // 6) Error handling
  if (error) throw new Error("Booking could not be updated");

  // 7) Revalidation
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations");

  // 8) Redirecting
  redirect("/account/reservations");
}

// ACTION FOR SIGN IN
export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

// ACTION FOR SIGN OUT
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
