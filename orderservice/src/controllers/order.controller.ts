import { Request, Response } from "express";

export class OrderController {
    static async healthCheck(_req: Request, res: Response) {
        return res.status(200).json({
          message: "health check order service"
        })
      }
}
