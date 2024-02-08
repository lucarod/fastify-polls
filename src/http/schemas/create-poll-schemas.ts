import z from 'zod';

export const createPollBody = z.object({
  title: z.string(),
  options: z.array(z.string()),
});
