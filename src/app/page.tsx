import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "ADMIN") redirect("/admin");
  if (role === "MANAGER") redirect("/manager");
  redirect("/goals");
}
