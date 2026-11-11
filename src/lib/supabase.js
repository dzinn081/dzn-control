import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmhnvwxbdhzywxaqitnv.supabase.co';

const supabaseKey = 'sb_publishable_BsHs6jI1JgkgJO9ZUiBDAA_C85zNrdf';

export const supabase = createClient(supabaseUrl, supabaseKey);
