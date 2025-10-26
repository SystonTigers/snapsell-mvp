import { z } from "zod";
export const PriceBands = z.object({ low: z.number(), mid: z.number(), high: z.number() });
