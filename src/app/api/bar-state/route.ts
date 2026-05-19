import { NextResponse } from "next/server";
import { getBarState } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getBarState();
  return NextResponse.json(state);
}
