import { Hono } from "hono";
import { fromHono } from "chanfana";
import { AuthMe } from "./authMe";

export const authRouter = fromHono(new Hono());

authRouter.get("/me", AuthMe);

