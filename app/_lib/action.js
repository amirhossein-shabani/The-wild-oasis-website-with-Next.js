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

//ACTION FOR DELETE RESERVATION'S
export async function deleteReservation(bookingId) {
  await new Promise((res) => setTimeout(res, 2000));

  // With this error, we can test the useOptimistic hook.
  // If the action throws an error after 2 seconds, will the element return to the UI?
  // throw new Error();

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
