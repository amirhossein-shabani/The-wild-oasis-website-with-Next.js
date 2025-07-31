"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "./auth";
import { getBooking, getBookings } from "./data-service";
import { supabase } from "./supabase";
import { revalidatePath } from "next/cache";

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

  /*
  const data =  Object.entries(formData.entries())

  we use this order to evoide to use ".get" for getting the propertie's of huge formData and after this code we correctly use (for example )=

  ... data.numGuests ;
  */

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed",
  };
  // Adding the hasBreakfast input:
  // I can later add an input field to the form for the hasBreakfast option as a challenge to practice form handling.

  //  Validating bookingDate in Supabase:
  // I can add validation logic in Supabase to check if there is already a reservation for the selected dates before allowing the booking to be saved.

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

  // 1) Authentication
  const session = await auth();
  if (!session) throw new Error("You must be logged in ⛔");

  // 2)Authorization
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to update this booking");

  // 3)Building update data
  const updateData = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };

  //4) Mutation
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  // 5) Error handling
  if (error) throw new Error("Booking could not be updated");

  // 6) Revalidation
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations");

  // 7) Redirecting
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
