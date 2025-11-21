// src/endpoints/posts/router.ts
import { Hono } from "hono";
import { fromHono } from "chanfana";
import { PostList } from "./postList";
import { PostCreate } from "./postCreate";
import { PostRead } from "./postRead";
import { PostUpdate } from "./postUpdate";
import { PostDelete } from "./postDelete";

export const postsRouter = fromHono(new Hono());

postsRouter.get("/", PostList);
postsRouter.post("/", PostCreate);
postsRouter.get("/:id", PostRead);
postsRouter.put("/:id", PostUpdate);
postsRouter.delete("/:id", PostDelete);

