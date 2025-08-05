// This file is used to set up the test environment for Vitest.
// You can use this file to import global styles, set up mocks, etc.

import '@testing-library/jest-dom';
import { vi } from 'vitest';

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  then(onFulfilled: (value: { data: any[]; count: number; error: any }) => void) {
    onFulfilled({
      data: [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'Test Description',
          ingredients: [{ name: 'ingredient1', amount: 100, unit: 'g' }],
          steps: ['step1'],
          created_at: new Date().toISOString(),
          user_id: 'test-user',
          kcal: 100,
          protein_g: 10,
          fat_g: 5,
          carbs_g: 15,
        },
      ],
      count: 1,
      error: null,
    });
  },
};

vi.mock('@/db/supabase.client', () => ({
  supabaseClient: {
    from: vi.fn(() => mockQueryBuilder),
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('@/lib/services/openrouter.service', () => ({
  openRouter: {
    sendChat: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        kcal: 100,
        protein_g: 10,
        fat_g: 5,
        carbs_g: 20,
      }),
    }),
  },
})); 