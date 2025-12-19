/*
  # Allow Anonymous Access to System Configurations

  ## Overview
  Allows unauthenticated users to read system default model configurations.

  ## Changes
  1. Add policy for anonymous users to read system default configurations
  2. This enables the app to work without authentication for basic functionality

  ## Security
  - Only system default configurations (is_system_default = true) are accessible
  - User-specific configurations remain protected
  - No write access for anonymous users
*/

-- Allow anonymous users to read system default configurations
CREATE POLICY "Anonymous users can view system defaults"
  ON model_configurations FOR SELECT
  TO anon
  USING (is_system_default = true);

-- Allow anonymous users to view provider capabilities
CREATE POLICY "Anonymous users can view provider capabilities"
  ON provider_capabilities FOR SELECT
  TO anon
  USING (true);