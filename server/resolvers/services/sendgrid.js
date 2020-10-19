const sendgrid = require('@sendgrid/mail')
if (process.env.NODE_ENV === "local") {
  require("dotenv").config()
}
console.log(process.env.SENDGRID_API)
sendgrid.setApiKey(process.env.SENDGRID_API || "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")
module.exports = {
  /**
   * Sends welcome message to user
   */
  sendWelcomeMessage: async ({ firstName, email }) => {
    const emailID = process.env.WELCOME_EMAIL || "d-dd892e2c814041c0a338b398ad68708b"
    const msg = {
      to: email,
      from: 'contacto@tranki.app',
      fromname: 'Equipo Tranki',
      subject: '¡Bienvenido/a!',
      templateId: emailID,
      dynamicTemplateData: {
        firstName
      }
    }
    try {
      await sendgrid.send(msg)
      return { success: true }
    } catch (e) {
      return { success: false }
    }
  },
  /**
   * Send email order update
   */
  sendOrderConfirmation: async ({ email, locator, cart, subTotal, shippingCost, total, stripeFee }) => {
    const emailID = process.env.ORDER_UPDATE || "d-e825797c82434fb3b7bde6541b822bfb"
    const qty = cart.reduce((count, product) => count + product.qty, 0)
    const msg = {
      to: email,
      from: 'contacto@tranki.app',
      fromname: 'Equipo Tranki',
      subject: 'Tu orden ha sido actualizada',
      templateId: emailID,
      dynamicTemplateData: {
        orderID: locator,
        cart,
        shippingCost: parseFloat(shippingCost).toFixed(2),
        subTotal: parseFloat(subTotal).toFixed(2),
        stripeFee: parseFloat(stripeFee).toFixed(2),
        total: parseFloat(total).toFixed(2),
        qty
      }
    }
    try {
      await sendgrid.send(msg)
      return { success: true }
    } catch (e) {
      return { success: false }
    }
  },

  /**
   * Sends email on order cancellation
   */
  orderCancelled: async ({ orderID, firstName, total, email }) => {
    const emailID = process.env.ORDER_CANCELLED || "d-afeed6ce365240ad94439370f8bb1f92"
    const msg = {
      to: email,
      from: 'contacto@tranki.app',
      fromname: 'Equipo Tranki',
      subject: 'Tu orden ha sido actualizada',
      templateId: emailID,
      dynamicTemplateData: {
        orderID, firstName, total
      }
    }
    try {
      await sendgrid.send(msg)
      return { success: true }
    } catch (e) {
      return { success: false }
    }
  }
}