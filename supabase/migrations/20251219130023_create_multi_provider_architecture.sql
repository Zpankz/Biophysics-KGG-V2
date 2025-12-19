/*
  # Multi-Provider AI Architecture - Core Tables

  ## Overview
  Complete database schema for managing multiple AI providers, models, and configurations.

  ## New Tables

  ### 1. `provider_capabilities`
  Stores information about each AI provider and their available models
  - `id` (uuid, primary key)
  - `provider_name` (text, unique) - Unique identifier for provider
  - `display_name` (text) - Human-readable provider name
  - `supports_completion` (boolean) - Whether provider supports text completion
  - `supports_embedding` (boolean) - Whether provider supports embeddings
  - `supports_reranking` (boolean) - Whether provider supports reranking
  - `supports_voice` (boolean) - Whether provider supports voice/audio
  - `api_docs_url` (text) - Link to provider's API documentation
  - `pricing_url` (text) - Link to provider's pricing page
  - `available_models` (jsonb) - Array of model configurations with pricing
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `user_api_keys`
  Stores encrypted API keys for each user and provider
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `provider_name` (text) - Which provider this key is for
  - `encrypted_key` (text) - Encrypted API key
  - `key_name` (text) - Optional user-friendly name for the key
  - `is_active` (boolean) - Whether this key should be used
  - `last_validated` (timestamptz) - Last time key was verified
  - `validation_status` (text) - valid/invalid/untested
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - UNIQUE constraint on (user_id, provider_name, key_name)

  ### 3. `model_configurations`
  Stores model configuration presets for different use cases
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users, nullable for system defaults)
  - `config_name` (text) - Name of the configuration
  - `is_active` (boolean) - Whether this config is currently active
  - `is_system_default` (boolean) - Whether this is a pre-built system config
  - `description` (text) - Description of the configuration
  - `chunking_config` (jsonb) - Provider/model/params for text chunking
  - `extraction_config` (jsonb) - Provider/model/params for entity extraction
  - `embedding_config` (jsonb) - Provider/model/params for embeddings
  - `reranking_config` (jsonb) - Provider/model/params for reranking
  - `chat_config` (jsonb) - Provider/model/params for chat
  - `voice_config` (jsonb) - Provider/model/params for voice
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - UNIQUE constraint on (user_id, config_name)

  ### 4. `api_usage_logs`
  Tracks all API calls for analytics and cost management
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `provider_name` (text) - Which provider was used
  - `model_name` (text) - Which model was used
  - `task_type` (text) - Type of task (chunking/extraction/embedding/etc)
  - `input_tokens` (integer) - Number of input tokens
  - `output_tokens` (integer) - Number of output tokens
  - `latency_ms` (integer) - Response time in milliseconds
  - `cost_usd` (decimal) - Estimated cost in USD
  - `success` (boolean) - Whether the call succeeded
  - `error_message` (text) - Error message if failed
  - `created_at` (timestamptz)

  ### 5. `user_preferences`
  Stores user-specific preferences
  - `user_id` (uuid, primary key, foreign key to auth.users)
  - `theme` (text) - dark/light/auto
  - `auto_save` (boolean) - Whether to auto-save configurations
  - `active_config_id` (uuid) - Currently active configuration
  - `show_cost_estimates` (boolean) - Show cost estimates in UI
  - `enable_analytics` (boolean) - Track usage analytics
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own API keys, configs, logs, and preferences
  - System default configurations are readable by all authenticated users
  - Provider capabilities are readable by all authenticated users

  ## Indexes
  - Optimize queries by user_id, provider_name, and created_at
  - Special index for active configurations
*/

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Provider capabilities system table
CREATE TABLE IF NOT EXISTS provider_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  supports_completion BOOLEAN DEFAULT false,
  supports_embedding BOOLEAN DEFAULT false,
  supports_reranking BOOLEAN DEFAULT false,
  supports_voice BOOLEAN DEFAULT false,
  api_docs_url TEXT,
  pricing_url TEXT,
  available_models JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User API keys (encrypted)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_validated TIMESTAMPTZ,
  validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'untested')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider_name, key_name)
);

-- Model configurations
CREATE TABLE IF NOT EXISTS model_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_system_default BOOLEAN DEFAULT false,
  description TEXT,
  
  -- Task-specific configurations
  chunking_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  extraction_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  reranking_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  chat_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  voice_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, config_name)
);

-- Usage analytics
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
  auto_save BOOLEAN DEFAULT true,
  active_config_id UUID REFERENCES model_configurations(id),
  show_cost_estimates BOOLEAN DEFAULT true,
  enable_analytics BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider_name);
CREATE INDEX IF NOT EXISTS idx_model_configs_user_id ON model_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_model_configs_active ON model_configurations(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON api_usage_logs(created_at);

-- RLS Policies
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own API keys"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON user_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON user_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Model configurations policies
CREATE POLICY "Users can view own configs and system defaults"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_system_default = true);

CREATE POLICY "Users can insert own configs"
  ON model_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configs"
  ON model_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs"
  ON model_configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON api_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Provider capabilities is public read
ALTER TABLE provider_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view provider capabilities"
  ON provider_capabilities FOR SELECT
  TO authenticated
  USING (true);