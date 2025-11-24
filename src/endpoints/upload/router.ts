import { Hono } from "hono";
import { fromHono } from "chanfana";
import { UploadImage } from "./uploadImage";

export const uploadRouter = fromHono(new Hono());

uploadRouter.post("/", UploadImage);
