"use server";

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

// ACTION FOR SIGN IN
export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

// ACTION FOR SIGN OUT
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
