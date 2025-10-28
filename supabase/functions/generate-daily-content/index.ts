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

    // Get the study plan
    const { data: plan } = await supabaseClient
      .from('study_plans')
      .select('*, study_goals(*)')
      .eq('id', planId)
      .single();

    if (!plan) throw new Error('Study plan not found');

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
            content: 'You are an expert educational content creator. Generate detailed, engaging daily study content.'
          },
          {
            role: 'user',
            content: `Based on this study plan, create detailed study content for Day ${dayNumber}:

Goal: ${plan.study_goals.title}
Study Plan: ${plan.plan_content}

Generate comprehensive content for Day ${dayNumber} including:
1. **Learning Objectives**: What the student should accomplish today
2. **Core Concepts**: Detailed explanations of key topics with examples
3. **Step-by-Step Guide**: Clear instructions for what to study and in what order
4. **Practice Exercises**: 3-5 questions or problems to reinforce learning
5. **Key Takeaways**: Summary of the most important points
6. **Real-World Applications**: How this knowledge applies in practice

Make it detailed enough that the student can learn directly from this content without needing textbooks.`
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
    const { data: dailyContent, error: insertError } = await supabaseClient
      .from('daily_study_content')
      .insert({
        plan_id: planId,
        user_id: plan.user_id,
        day_number: dayNumber,
        content: content,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ content: dailyContent }), {
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
