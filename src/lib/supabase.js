import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmhnvwxbdhzywxaqitnv.supabase.co';

const supabaseKey = 'COLE_SUA_PUBLISHABLE_KEY_AQUI';

export const supabase = createClient(supabaseUrl, supabaseKey);
