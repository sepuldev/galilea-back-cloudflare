import { Hono } from "hono";
import { fromHono } from "chanfana";
import { UploadImage } from "./uploadImage";
import { ListImages } from "./listImages";
import { DeleteImage } from "./deleteImage";

export const uploadRouter = fromHono(new Hono());

uploadRouter.post("/", UploadImage);
uploadRouter.get("/", ListImages);
uploadRouter.delete("/:path", DeleteImage);
