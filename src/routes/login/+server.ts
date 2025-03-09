import type { RequestHandler } from "./$types.ts";
import { getUserByEmail } from '../../queries/select.ts';
import jwt from "jsonwebtoken";

const jsonResponse = (data: object, status: number, headers: HeadersInit = {}) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

export const POST: RequestHandler = async ({
  request,
}: {
  request: Request;
}) => {
  try {
    const { email } = await request.json();

    const user = await getUserByEmail(email);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
      headers: {
        "Set-Cookie": `jwt=${token}; HttpOnly; Path=/; Max-Age=3600; Secure`,
      },
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ message: "login failed" }, 500);
  }
};