import { z } from 'zod'

export const dictionarySchema = z.object({
  name: z.string().min(2, 'Название слишком короткое'),
  type: z.enum([
    'categories',
    'subcategories',
    'industries',
    'skills',
    'technologies',
    'regions',
    'documentTypes',
  ]),
})

export type DictionaryFormValues = z.infer<typeof dictionarySchema>
