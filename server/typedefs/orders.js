module.exports = `
  type Supplier {
    name: String
    supplierOrderID: String
  }

  type OrderProduct {
    productID: ID!
    price: Float
    title: String
    image: String
    qty: Int
    variant: String
    link: String
    supplier: Supplier
  }

  type Total {
    cost: Float
    price: Float
  }

  type PaymentData {
    txID: String
    method: String
    brand: String
    last4: String
  }

  interface BaseAddress {
    _id: ID
    firstName: String
    lastName: String
    phoneNumber: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String
    state: String
    postCode: String
    additionalInfo: String
  }

  type GenericAddress implements BaseAddress {
    _id: ID
    firstName: String
    lastName: String
    phoneNumber: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String
    state: String
    postCode: String
    additionalInfo: String
  }

  type VenezuelanAddress implements BaseAddress {
    _id: ID
    firstName: String
    lastName: String
    phoneNumber: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String
    state: String
    postCode: String
    additionalInfo: String
    municipality: String
  }

  union Address = GenericAddress | VenezuelanAddress

  type Timeline {
    status: String
    date: String
  }

  type ShippingData {
    address: Address
    courier: String
    total: Total
    method: String
    dimensions: String
    weight: String
    timeline: Timeline
    eta: String
  }

  type Order {
    _id: ID!
    cart: [OrderProduct]
    userID: String
    firstName: String
    lastName: String
    email: String
    phoneNumber: String
    price: Float
    cost: Float
    payment: PaymentData
    shipping: ShippingData
    status: String
    creationDate: String
    updatedOn: String
    locator: String
  }
`