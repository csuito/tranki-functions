(async () => {
  const { sendSlackMessage } = require('./slack')
  await sendSlackMessage({ collectionName: "Test Success", success: true, updates: 1, inserts: 1, total: 2 })
  await sendSlackMessage({ collectionName: "Test", success: false, error: { "error": "shit went down" } })
})();