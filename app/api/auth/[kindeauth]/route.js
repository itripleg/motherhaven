import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
export const GET = handleAuth({
  postLoginRedirect: "http://localhost:3000/dashboard}",
});
