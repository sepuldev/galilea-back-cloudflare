import { Hono } from "hono";
import { fromHono } from "chanfana";
import { CategoryList } from "./categoryList";

export const categoriesRouter = fromHono(new Hono());

categoriesRouter.get("/", CategoryList);
