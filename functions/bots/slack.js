const axios = require('axios').default

module.exports = {
  sendSlackMessage: async ({ collectionName, updates, inserts, success, error }) => {
    let emoji = success ? ':white_check_mark:' : ':x:'
    let payload = success ?
      {
        type: "mrkdwn",
        text: `Sup bois! \n *${collectionName}* - ${emoji} \n _Updates_: ${updates} \n _Inserts_: ${inserts} \n _Total_: ${updates + inserts}`
      } :
      {
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
      throw new Error(e)
    }
  },
  orderRecieved: async ({ email, total, locator }) => {
    try {
      const response = await axios.post('https://hooks.slack.com/services/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', {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*New order recieved!*"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*Email*\n:star::star::star::star:\n ${email}\n:star::star::star::star:`
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*Total*\n:moneybag::moneybag::moneybag:\n $${total}\n:moneybag::moneybag::moneybag:`
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*Locator*\n:mag_right::mag_right::mag_right:\n ${locator}\n:mag_right::mag_right::mag_right:`
            }
          },
          {
            "type": "divider"
          }
        ]
      })
      return { success: true, data: response }
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }
  },
  orderCancelled: async ({ email, total, locator }) => {
    try {
      const response = await axios.post('https://hooks.slack.com/services/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', {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Order cancelled!* :cry:"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*Email* \n ${email}`
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*Total*\n $${total}`
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*Locator*\n${locator}`
            }
          },
          {
            "type": "divider"
          }
        ]
      })
      return { success: true, data: response }
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }
  }
}