import { Hono } from "hono";
import { fromHono } from "chanfana";
import { ConsultationList } from "./consultationList";
import { ConsultationCreate } from "./consultationCreate";
import { ConsultationRead } from "./consultationRead";
import { ConsultationUpdate } from "./consultationUpdate";
import { ConsultationDelete } from "./consultationDelete";

export const consultationsRouter = fromHono(new Hono());

consultationsRouter.get("/", ConsultationList);
consultationsRouter.post("/", ConsultationCreate);
consultationsRouter.get("/:id", ConsultationRead);
consultationsRouter.put("/:id", ConsultationUpdate);
consultationsRouter.delete("/:id", ConsultationDelete);

