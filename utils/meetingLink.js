// Generates a placeholder external meeting link.
// In-scope: relies entirely on external third-party links (Zoom/Google Meet),
// not native video hosting. This stub simulates the API response you'd get
// back from the real Zoom/Meet API in sandbox/dev mode.
function generateMeetingLink(provider = 'meet') {
  const roomId = Math.random().toString(36).slice(2, 10);
  if (provider === 'zoom') {
    return `https://zoom.us/j/${roomId}`;
  }
  return `https://meet.google.com/${roomId.slice(0, 3)}-${roomId.slice(3, 7)}-${roomId.slice(7)}`;
}

module.exports = { generateMeetingLink };
