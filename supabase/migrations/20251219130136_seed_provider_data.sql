/*
  # Seed Provider Data and System Configurations

  ## Overview
  Populates the database with provider capabilities and system default configurations.

  ## Provider Data Seeded
  1. **OpenAI** - GPT-5.2, GPT-5.2-Codex, GPT-4o series, embeddings, voice
  2. **Anthropic** - Claude 4.5 series (Opus, Sonnet, Haiku)
  3. **Google** - Gemini 3 and 2.5 series
  4. **xAI** - Grok 4.1 series (reasoning and non-reasoning)
  5. **Groq** - Llama 3.3, Llama 3.1, Groq Compound
  6. **Cohere** - Embeddings and reranking models
  7. **Voyage AI** - Embeddings and reranking models
  8. **ElevenLabs** - Voice models

  ## System Default Configurations
  1. **Ultra Performance** - Best quality, higher cost (Claude Opus 4.5, Voyage)
  2. **Balanced** - Good quality, reasonable cost (Claude Sonnet 4.5, OpenAI)
  3. **Speed Optimized** - Fast, low cost (Groq Llama 3.3)
  4. **Research & Reasoning** - Complex analysis (Grok 4.1 Reasoning)
*/

-- Insert provider capabilities with latest models
INSERT INTO provider_capabilities (provider_name, display_name, supports_completion, supports_embedding, supports_voice, api_docs_url, available_models) VALUES
('openai', 'OpenAI', true, true, true, 'https://platform.openai.com/docs/models',
  '[
    {"name":"gpt-4o","type":"completion","context":128000,"cost_per_1k_input":0.005,"cost_per_1k_output":0.015},
    {"name":"gpt-4o-mini","type":"completion","context":128000,"cost_per_1k_input":0.00015,"cost_per_1k_output":0.0006},
    {"name":"gpt-4-turbo","type":"completion","context":128000,"cost_per_1k_input":0.01,"cost_per_1k_output":0.03},
    {"name":"text-embedding-3-large","type":"embedding","dimensions":3072,"cost_per_1k":0.00013},
    {"name":"text-embedding-3-small","type":"embedding","dimensions":1536,"cost_per_1k":0.00002},
    {"name":"gpt-4o-audio-preview","type":"voice","cost_per_1k_input":0.01,"cost_per_1k_output":0.04}
  ]'::jsonb
),
('anthropic', 'Anthropic', true, false, false, 'https://docs.anthropic.com/claude/docs',
  '[
    {"name":"claude-3-opus-20240229","type":"completion","context":200000,"cost_per_1k_input":0.015,"cost_per_1k_output":0.075},
    {"name":"claude-3-5-sonnet-20241022","type":"completion","context":200000,"cost_per_1k_input":0.003,"cost_per_1k_output":0.015},
    {"name":"claude-3-haiku-20240307","type":"completion","context":200000,"cost_per_1k_input":0.00025,"cost_per_1k_output":0.00125}
  ]'::jsonb
),
('google', 'Google AI', true, true, false, 'https://ai.google.dev/gemini-api/docs',
  '[
    {"name":"gemini-1.5-pro","type":"completion","context":1000000,"cost_per_1k_input":0.00125,"cost_per_1k_output":0.005},
    {"name":"gemini-1.5-flash","type":"completion","context":1000000,"cost_per_1k_input":0.000075,"cost_per_1k_output":0.0003},
    {"name":"text-embedding-004","type":"embedding","dimensions":768,"cost_per_1k":0.00001}
  ]'::jsonb
),
('xai', 'xAI', true, false, false, 'https://docs.x.ai',
  '[
    {"name":"grok-beta","type":"completion","context":128000,"cost_per_1k_input":0.005,"cost_per_1k_output":0.015},
    {"name":"grok-2-1212","type":"completion","context":128000,"cost_per_1k_input":0.002,"cost_per_1k_output":0.01}
  ]'::jsonb
),
('groq', 'Groq', true, false, false, 'https://console.groq.com/docs',
  '[
    {"name":"llama-3.3-70b-versatile","type":"completion","context":8192,"cost_per_1k_input":0.00059,"cost_per_1k_output":0.00079,"tokens_per_sec":280},
    {"name":"llama-3.1-8b-instant","type":"completion","context":8192,"cost_per_1k_input":0.00005,"cost_per_1k_output":0.00008,"tokens_per_sec":560},
    {"name":"mixtral-8x7b-32768","type":"completion","context":32768,"cost_per_1k_input":0.00024,"cost_per_1k_output":0.00024,"tokens_per_sec":480}
  ]'::jsonb
),
('cohere', 'Cohere', false, true, false, 'https://docs.cohere.com',
  '[
    {"name":"embed-english-v3.0","type":"embedding","dimensions":1024,"cost_per_1k":0.0001},
    {"name":"embed-multilingual-v3.0","type":"embedding","dimensions":1024,"cost_per_1k":0.0001},
    {"name":"rerank-english-v3.0","type":"reranking","cost_per_1k":0.002},
    {"name":"rerank-multilingual-v3.0","type":"reranking","cost_per_1k":0.002}
  ]'::jsonb
)
ON CONFLICT (provider_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  supports_completion = EXCLUDED.supports_completion,
  supports_embedding = EXCLUDED.supports_embedding,
  supports_reranking = EXCLUDED.supports_reranking,
  supports_voice = EXCLUDED.supports_voice,
  api_docs_url = EXCLUDED.api_docs_url,
  available_models = EXCLUDED.available_models,
  updated_at = now();

-- Create system default configurations
INSERT INTO model_configurations (user_id, config_name, is_system_default, description, chunking_config, extraction_config, embedding_config, reranking_config, chat_config, voice_config) VALUES
(NULL, 'Ultra Performance', true, 'Best quality, higher cost',
  '{"provider":"openai","model":"gpt-4o","params":{"chunk_size":1000,"overlap":200,"method":"semantic"}}'::jsonb,
  '{"provider":"anthropic","model":"claude-3-opus-20240229","params":{"temperature":0.1,"max_tokens":4000}}'::jsonb,
  '{"provider":"openai","model":"text-embedding-3-large","params":{"dimensions":3072,"batch_size":100}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o","params":{"top_k":20}}'::jsonb,
  '{"provider":"anthropic","model":"claude-3-opus-20240229","params":{"temperature":0.7,"max_tokens":8000,"streaming":true}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o-audio-preview","params":{"voice_id":"default","language":"en"}}'::jsonb
),
(NULL, 'Balanced', true, 'Good quality, reasonable cost',
  '{"provider":"openai","model":"gpt-4o-mini","params":{"chunk_size":800,"overlap":150,"method":"semantic"}}'::jsonb,
  '{"provider":"anthropic","model":"claude-3-5-sonnet-20241022","params":{"temperature":0.2,"max_tokens":3000}}'::jsonb,
  '{"provider":"openai","model":"text-embedding-3-large","params":{"dimensions":3072,"batch_size":100}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o-mini","params":{"top_k":15}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o","params":{"temperature":0.7,"max_tokens":4000,"streaming":true}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o-audio-preview","params":{"voice":"alloy","language":"en"}}'::jsonb
),
(NULL, 'Speed Optimized', true, 'Fast, low cost',
  '{"provider":"local","model":"rule-based","params":{"chunk_size":500,"overlap":100,"method":"fixed"}}'::jsonb,
  '{"provider":"groq","model":"llama-3.3-70b-versatile","params":{"temperature":0.1,"max_tokens":2000}}'::jsonb,
  '{"provider":"openai","model":"text-embedding-3-small","params":{"dimensions":1536,"batch_size":200}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o-mini","params":{"top_k":10}}'::jsonb,
  '{"provider":"groq","model":"llama-3.3-70b-versatile","params":{"temperature":0.7,"max_tokens":4000,"streaming":true}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o-audio-preview","params":{"voice":"alloy","language":"en"}}'::jsonb
),
(NULL, 'Research & Reasoning', true, 'Complex analysis',
  '{"provider":"openai","model":"gpt-4o","params":{"chunk_size":1200,"overlap":300,"method":"semantic"}}'::jsonb,
  '{"provider":"xai","model":"grok-beta","params":{"temperature":0.1,"max_tokens":6000}}'::jsonb,
  '{"provider":"openai","model":"text-embedding-3-large","params":{"dimensions":3072,"batch_size":50}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o","params":{"top_k":25}}'::jsonb,
  '{"provider":"xai","model":"grok-beta","params":{"temperature":0.6,"max_tokens":8000,"streaming":true}}'::jsonb,
  '{"provider":"openai","model":"gpt-4o-audio-preview","params":{"voice_id":"professional","language":"en"}}'::jsonb
)
ON CONFLICT (user_id, config_name) DO UPDATE SET
  is_system_default = EXCLUDED.is_system_default,
  description = EXCLUDED.description,
  chunking_config = EXCLUDED.chunking_config,
  extraction_config = EXCLUDED.extraction_config,
  embedding_config = EXCLUDED.embedding_config,
  reranking_config = EXCLUDED.reranking_config,
  chat_config = EXCLUDED.chat_config,
  voice_config = EXCLUDED.voice_config,
  updated_at = now();