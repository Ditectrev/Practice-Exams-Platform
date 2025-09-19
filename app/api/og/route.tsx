import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const question = searchParams.get("question") ?? "My default title";
    const width = parseInt(searchParams.get("width") ?? "0");

    return new ImageResponse(
      (
        <div tw="flex text-center w-full h-full bg-slate-800 items-center justify-center">
          <p
            tw={`px-8 ${
              width < 640 ? "text-3xl" : "text-2xl"
            } font-sans text-stone-300`}
          >
            {question}
          </p>
        </div>
      ),
      {
        width: width < 640 ? 800 : 1200,
        height: width < 640 ? 450 : 300,
      },
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
