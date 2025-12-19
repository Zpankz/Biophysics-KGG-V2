/*
  # Update Provider Models to Real Names

  ## Overview
  Updates all provider model names and system configurations to use actual, currently available models.

  ## Changes Made
  1. **Anthropic Models**
     - Updated to: claude-3-opus-20240229, claude-3-5-sonnet-20241022, claude-3-haiku-20240307

  2. **OpenAI Models**
     - Updated to: gpt-4o, gpt-4o-mini, gpt-4-turbo

  3. **Google Models**
     - Updated to: gemini-1.5-pro, gemini-1.5-flash

  4. **xAI Models**
     - Updated to: grok-beta, grok-2-1212

  5. **Groq Models**
     - Updated to: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768

  6. **System Configurations**
     - Updated all default configurations to use real models
     - Removed references to non-existent providers (Voyage, ElevenLabs)
*/

-- Update Anthropic models
UPDATE provider_capabilities
SET available_models = '[
  {"name":"claude-3-opus-20240229","type":"completion","context":200000,"cost_per_1k_input":0.015,"cost_per_1k_output":0.075},
  {"name":"claude-3-5-sonnet-20241022","type":"completion","context":200000,"cost_per_1k_input":0.003,"cost_per_1k_output":0.015},
  {"name":"claude-3-haiku-20240307","type":"completion","context":200000,"cost_per_1k_input":0.00025,"cost_per_1k_output":0.00125}
]'::jsonb
WHERE provider_name = 'anthropic';

-- Update OpenAI models
UPDATE provider_capabilities
SET available_models = '[
  {"name":"gpt-4o","type":"completion","context":128000,"cost_per_1k_input":0.005,"cost_per_1k_output":0.015},
  {"name":"gpt-4o-mini","type":"completion","context":128000,"cost_per_1k_input":0.00015,"cost_per_1k_output":0.0006},
  {"name":"gpt-4-turbo","type":"completion","context":128000,"cost_per_1k_input":0.01,"cost_per_1k_output":0.03},
  {"name":"text-embedding-3-large","type":"embedding","dimensions":3072,"cost_per_1k":0.00013},
  {"name":"text-embedding-3-small","type":"embedding","dimensions":1536,"cost_per_1k":0.00002},
  {"name":"gpt-4o-audio-preview","type":"voice","cost_per_1k_input":0.01,"cost_per_1k_output":0.04}
]'::jsonb
WHERE provider_name = 'openai';

-- Update Google models
UPDATE provider_capabilities
SET available_models = '[
  {"name":"gemini-1.5-pro","type":"completion","context":1000000,"cost_per_1k_input":0.00125,"cost_per_1k_output":0.005},
  {"name":"gemini-1.5-flash","type":"completion","context":1000000,"cost_per_1k_input":0.000075,"cost_per_1k_output":0.0003},
  {"name":"text-embedding-004","type":"embedding","dimensions":768,"cost_per_1k":0.00001}
]'::jsonb
WHERE provider_name = 'google';

-- Update xAI models
UPDATE provider_capabilities
SET available_models = '[
  {"name":"grok-beta","type":"completion","context":128000,"cost_per_1k_input":0.005,"cost_per_1k_output":0.015},
  {"name":"grok-2-1212","type":"completion","context":128000,"cost_per_1k_input":0.002,"cost_per_1k_output":0.01}
]'::jsonb
WHERE provider_name = 'xai';

-- Update Groq models
UPDATE provider_capabilities
SET available_models = '[
  {"name":"llama-3.3-70b-versatile","type":"completion","context":8192,"cost_per_1k_input":0.00059,"cost_per_1k_output":0.00079,"tokens_per_sec":280},
  {"name":"llama-3.1-8b-instant","type":"completion","context":8192,"cost_per_1k_input":0.00005,"cost_per_1k_output":0.00008,"tokens_per_sec":560},
  {"name":"mixtral-8x7b-32768","type":"completion","context":32768,"cost_per_1k_input":0.00024,"cost_per_1k_output":0.00024,"tokens_per_sec":480}
]'::jsonb
WHERE provider_name = 'groq';

-- Update Ultra Performance config
UPDATE model_configurations
SET 
  extraction_config = '{"provider":"anthropic","model":"claude-3-opus-20240229","params":{"temperature":0.1,"max_tokens":4000}}'::jsonb,
  chat_config = '{"provider":"anthropic","model":"claude-3-opus-20240229","params":{"temperature":0.7,"max_tokens":8000,"streaming":true}}'::jsonb,
  embedding_config = '{"provider":"openai","model":"text-embedding-3-large","params":{"dimensions":3072,"batch_size":100}}'::jsonb,
  chunking_config = '{"provider":"openai","model":"gpt-4o","params":{"chunk_size":1000,"overlap":200,"method":"semantic"}}'::jsonb
WHERE config_name = 'Ultra Performance' AND is_system_default = true;

-- Update Balanced config  
UPDATE model_configurations
SET 
  extraction_config = '{"provider":"anthropic","model":"claude-3-5-sonnet-20241022","params":{"temperature":0.2,"max_tokens":3000}}'::jsonb,
  chat_config = '{"provider":"openai","model":"gpt-4o","params":{"temperature":0.7,"max_tokens":4000,"streaming":true}}'::jsonb,
  embedding_config = '{"provider":"openai","model":"text-embedding-3-large","params":{"dimensions":3072,"batch_size":100}}'::jsonb,
  chunking_config = '{"provider":"openai","model":"gpt-4o-mini","params":{"chunk_size":800,"overlap":150,"method":"semantic"}}'::jsonb
WHERE config_name = 'Balanced' AND is_system_default = true;

-- Update Speed Optimized config
UPDATE model_configurations
SET 
  extraction_config = '{"provider":"groq","model":"llama-3.3-70b-versatile","params":{"temperature":0.1,"max_tokens":2000}}'::jsonb,
  chat_config = '{"provider":"groq","model":"llama-3.3-70b-versatile","params":{"temperature":0.7,"max_tokens":4000,"streaming":true}}'::jsonb,
  embedding_config = '{"provider":"openai","model":"text-embedding-3-small","params":{"dimensions":1536,"batch_size":200}}'::jsonb
WHERE config_name = 'Speed Optimized' AND is_system_default = true;

-- Update Research & Reasoning config
UPDATE model_configurations
SET 
  extraction_config = '{"provider":"xai","model":"grok-beta","params":{"temperature":0.1,"max_tokens":6000}}'::jsonb,
  chat_config = '{"provider":"xai","model":"grok-beta","params":{"temperature":0.6,"max_tokens":8000,"streaming":true}}'::jsonb,
  embedding_config = '{"provider":"openai","model":"text-embedding-3-large","params":{"dimensions":3072,"batch_size":50}}'::jsonb,
  chunking_config = '{"provider":"openai","model":"gpt-4o","params":{"chunk_size":1200,"overlap":300,"method":"semantic"}}'::jsonb
WHERE config_name = 'Research & Reasoning' AND is_system_default = true;