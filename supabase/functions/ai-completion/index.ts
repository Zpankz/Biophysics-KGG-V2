import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { provider, model, request: completionRequest, apiKey } = await req.json();

    if (!provider || !model || !completionRequest || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let response;

    if (provider === "anthropic") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: completionRequest.maxTokens ?? 4000,
          temperature: completionRequest.temperature ?? 0.7,
          system: completionRequest.systemPrompt,
          messages: [
            {
              role: "user",
              content: completionRequest.prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({
          text: data.content[0]?.text || "",
          usage: {
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0,
          },
          model: model,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (provider === "openai") {
      const messages: any[] = [];

      if (completionRequest.systemPrompt) {
        messages.push({ role: "system", content: completionRequest.systemPrompt });
      }

      messages.push({ role: "user", content: completionRequest.prompt });

      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: completionRequest.temperature ?? 0.7,
          max_tokens: completionRequest.maxTokens ?? 4000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({
          text: data.choices[0]?.message?.content || "",
          usage: {
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
          },
          model: model,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (provider === "groq") {
      const messages: any[] = [];

      if (completionRequest.systemPrompt) {
        messages.push({ role: "system", content: completionRequest.systemPrompt });
      }

      messages.push({ role: "user", content: completionRequest.prompt });

      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: completionRequest.temperature ?? 0.7,
          max_tokens: completionRequest.maxTokens ?? 4000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({
          text: data.choices[0]?.message?.content || "",
          usage: {
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
          },
          model: model,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (provider === "xai") {
      const messages: any[] = [];

      if (completionRequest.systemPrompt) {
        messages.push({ role: "system", content: completionRequest.systemPrompt });
      }

      messages.push({ role: "user", content: completionRequest.prompt });

      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: completionRequest.temperature ?? 0.7,
          max_tokens: completionRequest.maxTokens ?? 4000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`xAI API error: ${error}`);
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({
          text: data.choices[0]?.message?.content || "",
          usage: {
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
          },
          model: model,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Provider ${provider} not supported` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
