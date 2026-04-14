import {Router} from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadRecipt } from "../controllers/upload.controller.js";


const router = Router();

router.route("/").post(upload.single("recipt") , uploadRecipt);
export default router;