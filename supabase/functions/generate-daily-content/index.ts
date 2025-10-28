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
    const { planId, dayNumber } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the study plan and related goal
    const { data: plan } = await supabaseClient
      .from('study_plans')
      .select('*, study_goals(*)')
      .eq('id', planId)
      .single();

    if (!plan) throw new Error('Plan not found');

    const goal = plan.study_goals;

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
            content: 'You are a helpful study advisor. Create detailed, comprehensive daily study content.'
          },
          {
            role: 'user',
            content: `Based on this study plan and goal, create detailed study content for Day ${dayNumber}:

Goal: ${goal.title}
Description: ${goal.description || 'Not provided'}
Priority: ${goal.priority}

Study Plan Overview:
${plan.plan_content}

Create comprehensive study content for Day ${dayNumber} that includes:
1. Learning objectives for the day
2. Detailed explanations of key concepts
3. Definitions and terminology
4. Step-by-step examples with solutions
5. Practice exercises (with answers)
6. Summary of key takeaways
7. Tips for retention and understanding

Make this content detailed enough that the student can study entirely from it without needing external materials.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate daily content');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Save the daily content
    await supabaseClient.from('daily_study_content').insert({
      plan_id: planId,
      user_id: plan.user_id,
      day_number: dayNumber,
      content: content,
    });

    return new Response(JSON.stringify({ content }), {
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