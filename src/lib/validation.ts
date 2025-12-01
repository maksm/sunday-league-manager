import { z } from 'zod';

// Registration validation
export const registerSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1).optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    playerId: z.string().optional(),
  })
  .refine((data) => data.name || data.playerId, {
    message: 'Either name or playerId must be provided',
  });

// RSVP validation
export const rsvpSchema = z.object({
  matchdayId: z.string().min(1, 'Matchday ID is required'),
  status: z.enum(['IN', 'IN_BEER', 'OUT', 'OUT_INJURED', 'MAYBE']),
});

// Vote validation
export const voteSchema = z.object({
  targetId: z.string().min(1, 'Target player ID is required'),
});

// Finish match validation
export const finishMatchSchema = z.object({
  result: z.string().regex(/^\d+-\d+$/, 'Result must be in format "X-Y"'),
  teamAIds: z.array(z.string()).min(1, 'Team A must have at least one player'),
  teamBIds: z.array(z.string()).min(1, 'Team B must have at least one player'),
});

// Create matchday validation
export const createMatchdaySchema = z.object({
  date: z.string().datetime('Invalid date format'),
  seasonId: z.string().min(1, 'Season ID is required'),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

// Update matchday validation
export const updateMatchdaySchema = z.object({
  date: z.string().datetime('Invalid date format').optional(),
  seasonId: z.string().nullable().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

// Create player validation
export const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

// Update player validation
export const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// Create season validation
export const createSeasonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
  matchday: z.string().min(1, 'Matchday is required'),
  startHour: z.string().regex(/^\d{2}:\d{2}$/, 'Start hour must be in HH:MM format'),
  endHour: z.string().regex(/^\d{2}:\d{2}$/, 'End hour must be in HH:MM format'),
});

// Update season validation
export const updateSeasonSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(1).max(200).optional(),
  matchday: z.string().min(1).optional(),
  startHour: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endHour: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

// Helper function to validate request body
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Validation failed' };
  }
}
