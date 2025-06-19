// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uqohgtgpqijblzljdaxl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2hndGdwcWlqYmx6bGpkYXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTAxMjQsImV4cCI6MjA2Mzc2NjEyNH0.YStbY4Ln5fTKDlG6jJFL3qmLmzqJ7ZTLOOTnpWtTx1Y";// Use Service Role key for uploads

export const supabase = createClient(supabaseUrl, supabaseKey);