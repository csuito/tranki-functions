const axios = require('axios').default

module.exports = {
  sendSlackMessage: async ({ collectionName, updates, inserts, success, error }) => {
    let emoji = success ? ':white_check_mark:' : ':x:'
    let payload = success ? {
      type: "mrkdwn",
      text: `Sup bois! \n *${collectionName}* - ${emoji} \n _Updates_: ${updates} \n _Inserts_: ${inserts} \n _Total_: ${updates + inserts}`
    } : {
        type: "mrkdwn",
        text: `Oh no! \n *${collectionName}* - ${emoji} \n _Error_: \`\`\`${JSON.stringify(error)}\`\`\``
      }
    try {
      const response = await axios.post('https://hooks.slack.com/services/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', {
        blocks: [{
          type: "section",
          text: payload
        }]
      })
      return { success: true, data: response }
    } catch (e) {
      console.log(e)
    }
  }
}