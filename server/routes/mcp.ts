import { Router } from "express";
import { createOperationsAgent } from "../mcp";

const router = Router();
const agentPromise = createOperationsAgent();

router.post("/mcp", async (req, res) => {
  const { prompt, module } = req.body as { prompt?: string; module?: string };
  if (!prompt) {
    return res.status(400).json({ success: false, error: "prompt is required" });
  }
  try {
    const agent = await agentPromise;
    const result = await agent.handleRequest({ prompt, module });
    if (result.success) {
      res.json({ success: true, output: result.output });
    } else {
      res.status(400).json({ success: false, error: result.output });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
