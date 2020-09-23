module.exports = `
  type Supplier {
    name: String
    supplierOrderID: String
  }

  type OrderProduct {
    productID: ID!
    price: Float
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
  }

  interface BaseAddress {
    _id: ID
    firstName: String
    lastName: String
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
    total: Total
    payment: PaymentData
    shipping: ShippingData
    status: String
    creationDate: String
    updatedOn: String
  }
`