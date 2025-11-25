// src/endpoints/posts/router.ts
import { Hono } from "hono";
import { fromHono } from "chanfana";
import { PostList } from "./postList";
import { PostCreate } from "./postCreate";
import { PostRead } from "./postRead";
import { PostUpdate } from "./postUpdate";
import { PostDelete } from "./postDelete";

export const postsRouter = fromHono(new Hono());

postsRouter.get("/", new PostList());
postsRouter.post("/", new PostCreate());
postsRouter.get("/:id", new PostRead());
postsRouter.put("/:id", new PostUpdate());
postsRouter.delete("/:id", new PostDelete());

