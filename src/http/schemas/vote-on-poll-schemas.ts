import z from 'zod';

export const voteOnPollBody = z.object({
  pollOptionId: z.string().uuid(),
});

export const voteOnPollParams = z.object({
  pollId: z.string().uuid(),
});
