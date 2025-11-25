import { Hono } from "hono";
import { fromHono } from "chanfana";
import { CategoryList } from "./categoryList";
import { CategoryCreate } from "./categoryCreate";
import { CategoryRead } from "./categoryRead";
import { CategoryUpdate } from "./categoryUpdate";
import { CategoryDelete } from "./categoryDelete";

export const categoriesRouter = fromHono(new Hono());

categoriesRouter.get("/", CategoryList);
categoriesRouter.post("/", CategoryCreate);
categoriesRouter.get("/:id", CategoryRead);
categoriesRouter.put("/:id", CategoryUpdate);
categoriesRouter.delete("/:id", CategoryDelete);
