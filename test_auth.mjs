import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test_dummy_user_123@example.com',
    password: 'password123456'
  });
  
  if (error) {
    console.error("Auth Error:", error.message);
  } else {
    console.log("Auth Success:", data);
  }
}

testAuth();
