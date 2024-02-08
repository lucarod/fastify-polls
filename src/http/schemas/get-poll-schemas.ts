import z from 'zod';

export const getPollParams = z.object({
  pollId: z.string().uuid(),
});
