import { Hono } from "hono";
import { fromHono } from "chanfana";
import { EmailCreate } from "./emailCreate";

export const emailRouter = fromHono(new Hono());

emailRouter.post("/", new EmailCreate());