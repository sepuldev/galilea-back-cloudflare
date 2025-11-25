import { Hono } from "hono";
import { fromHono } from "chanfana";
import { ConsultationList } from "./consultationList";
import { ConsultationCreate } from "./consultationCreate";
import { ConsultationRead } from "./consultationRead";
import { ConsultationUpdate } from "./consultationUpdate";
import { ConsultationDelete } from "./consultationDelete";

export const consultationsRouter = fromHono(new Hono());

consultationsRouter.get("/", new ConsultationList());
consultationsRouter.post("/", new ConsultationCreate());
consultationsRouter.get("/:id", new ConsultationRead());
consultationsRouter.put("/:id", new ConsultationUpdate());
consultationsRouter.delete("/:id", new ConsultationDelete());

