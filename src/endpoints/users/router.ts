import { Hono } from "hono";
import { fromHono } from "chanfana";

export const usersRouter = fromHono(new Hono());


