import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hneoiyskrgonzzzdeetx.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZW9peXNrcmdvbnp6emRlZXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQwNjQsImV4cCI6MjA3NDk2MDA2NH0.6oIfvKrqPmxdMNGSn-tq5LKkKG78chTgXi-Uur_YW90"
export const supabase = createClient(supabaseUrl, supabaseKey)