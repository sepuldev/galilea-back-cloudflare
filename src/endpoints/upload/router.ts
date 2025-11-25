import { Hono } from "hono";
import { fromHono } from "chanfana";
import { UploadImage } from "./uploadImage";
import { ListImages } from "./listImages";
import { DeleteImage } from "./deleteImage";

export const uploadRouter = fromHono(new Hono());

uploadRouter.post("/", new UploadImage());
uploadRouter.get("/", new ListImages());
uploadRouter.delete("/:path", new DeleteImage());
