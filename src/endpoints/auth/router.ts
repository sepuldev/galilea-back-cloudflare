import { Hono } from "hono";
import { fromHono } from "chanfana";
import { AuthMe } from "./authMe";
import { AuthLogin } from "./login";
import { AuthRefresh } from "./refresh";

export const authRouter = fromHono(new Hono());

authRouter.post("/login", AuthLogin);
authRouter.post("/refresh", AuthRefresh);
authRouter.get("/me", AuthMe);

