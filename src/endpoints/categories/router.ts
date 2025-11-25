import { Hono } from "hono";
import { fromHono } from "chanfana";
import { CategoryList } from "./categoryList";
import { CategoryCreate } from "./categoryCreate";
import { CategoryRead } from "./categoryRead";
import { CategoryUpdate } from "./categoryUpdate";
import { CategoryDelete } from "./categoryDelete";

const honoRouter = new Hono();

honoRouter.get("/", CategoryList);
honoRouter.post("/", CategoryCreate);
honoRouter.get("/:id", CategoryRead);
honoRouter.put("/:id", CategoryUpdate);
honoRouter.delete("/:id", CategoryDelete);

export const categoriesRouter = fromHono(honoRouter);
