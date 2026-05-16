export function createDiscordVoiceController({
  runtimeConfigured = false
} = {}) {
  return {
    async startCapture() {
      if (!runtimeConfigured) {
        return {
          started: false,
          reason: 'voice_runtime_not_configured',
          nextStep: 'Install and wire @discordjs/voice, prism-media, and an Opus runtime before live voice capture.'
        };
      }

      return {
        started: false,
        reason: 'voice_capture_not_implemented',
        nextStep: 'Wire Discord voice receiver stream into Whisper provider.'
      };
    }
  };
}
