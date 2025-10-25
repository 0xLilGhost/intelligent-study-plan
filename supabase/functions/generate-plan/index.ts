import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the goal details
    const { data: goal } = await supabaseClient
      .from('study_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (!goal) throw new Error('Goal not found');

    // Get user's study files
    const { data: files } = await supabaseClient
      .from('study_files')
      .select('*')
      .eq('user_id', goal.user_id);

    // Build context from files
    const fileContext = files?.map(f => f.file_name).join(', ') || 'No files uploaded yet';

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful study advisor. Create personalized, actionable study plans.'
          },
          {
            role: 'user',
            content: `Create a detailed study plan for this goal:
Title: ${goal.title}
Description: ${goal.description || 'Not provided'}
Target Date: ${goal.target_date || 'Not set'}
Priority: ${goal.priority}
Available Materials: ${fileContext}

Provide a structured plan with weekly milestones and daily tasks.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate plan');
    }

    const aiData = await aiResponse.json();
    const plan = aiData.choices[0].message.content;

    // Save the plan
    await supabaseClient.from('study_plans').insert({
      goal_id: goalId,
      user_id: goal.user_id,
      plan_content: plan,
    });

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
