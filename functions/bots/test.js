(async () => {
  const { sendSlackMessage } = require('./slack')
  await sendSlackMessage({ collectionName: "Test", success: false, error: { "error": "shit went down" } })
})();