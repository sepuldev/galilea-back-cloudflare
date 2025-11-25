import { Hono } from "hono";
import { fromHono } from "chanfana";
import { CategoryList } from "./categoryList";
import { CategoryCreate } from "./categoryCreate";
import { CategoryRead } from "./categoryRead";
import { CategoryUpdate } from "./categoryUpdate";
import { CategoryDelete } from "./categoryDelete";

const honoRouter = new Hono();

honoRouter.get("/", new CategoryList());
honoRouter.post("/", new CategoryCreate());
honoRouter.get("/:id", new CategoryRead());
honoRouter.put("/:id", new CategoryUpdate());
honoRouter.delete("/:id", new CategoryDelete());

export const categoriesRouter = fromHono(honoRouter);
