module.exports = `
  input StripeOnBoardInput {
    card_token: String! @constraint(minLength: 5, maxLength: 100)
    last4: String! @constraint(minLength: 4, maxLength: 4)
    country: String! @constraint(minLength: 2, maxLength: 3)
    email: String! @constraint(minLength: 5, format: "email")
    firebaseID: String! @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
  }

  input SupplierInput {
    name: String! @constraint(minLength: 5, maxLength: 100)
    supplierOrderID: String @constraint(minLength: 5, maxLength: 100)
  }

  input ProductInput {
    productID: String! @constraint(minLength: 10, maxLength: 10, uniqueTypeName: "ID")
    image: String!
    title: String!
    price: Float!
    qty: Int! @constraint(min: 1)
    link: String! @constraint(format: "uri")
    variant: String 
    supplier: SupplierInput
  }

  input AddressInput {
    firstName: String! @constraint(minLength: 2, maxLength: 100)
    lastName: String! @constraint(minLength: 2, maxLength: 100)
    phoneNumber: String! @constraint(minLength: 9)
    street: String! @constraint(minLength: 2, maxLength: 100)
    houseOrAptNumber: String! @constraint(minLength: 1, maxLength: 100)
    city: String! @constraint(minLength: 2, maxLength: 100)
    state: String! @constraint(minLength: 2, maxLength: 100)
    country: String! @constraint(minLength: 2, maxLength: 100)
    municipality: String @constraint(minLength: 2, maxLength: 50)
    postCode: String @constraint(maxLength: 6)
    additionalInfo: String @constraint(maxLength: 150)
  }

  input TotalInput {
    cost: Float
    price: Float
  }

  input PaymentInput {
    card: String! @constraint(maxLength: 100)
    customer: String! @constraint(maxLength: 100)
    brand: String! @constraint(maxLength: 50)
    last4: String! @constraint(maxLength: 4)
    fee: Float! 
  }

  input ShippingDataInput {
    address: AddressInput
    courier: String! @constraint(minLength: 2, maxLength: 100)
    method: String! @constraint(minLength: 2, maxLength: 100)
    weight: String 
    dimensions: String
    total: TotalInput
    eta: String
  }

  input CreateOrderInput {
    cart: [ProductInput]!
    userID: String! @constraint(minLength: 2, maxLength: 100)
    firstName: String! @constraint(minLength: 2, maxLength: 100)
    lastName: String! @constraint(minLength: 2, maxLength: 100)
    email: String! @constraint(minLength: 5, format: "email")
    phoneNumber: String! @constraint(minLength: 9)
    price: Float!
    payment: PaymentInput!
    shipping: ShippingDataInput!
    status: String
    idemKey: String
  }

  input CancelOrderInput {
    orderID: String!
    firebaseID: String!
  }

  input CourierSpecsInput { 
    orderID: String!
    weight: String!
    dimensions: String!
  }

  input UpdateProductStatusInput {
    orderID: String!
    status: String!
    productID: String!
  }

  input UpdateOrderInput {
    _id: String! @constraint(minLength: 2, maxLength: 100, uniqueTypeName: "ID")
    cart: [ProductInput]
    userID: String @constraint(minLength: 2, maxLength: 100)
    firstName: String @constraint(minLength: 2, maxLength: 100)
    lastName: String @constraint(minLength: 2, maxLength: 100)
    email: String @constraint(minLength: 5, format: "email")
    phoneNumber: String @constraint(minLength: 9)
    price: Float
    cost: Float
    shipping: ShippingDataInput
    status: String
  }
    
  input GetShippingCostsInput {
    productID: String! @constraint(minLength: 2, maxLength: 100)
    quantity: Int! @constraint(min: 1)
  }
  input GetUserInput {
    firebaseID: String! @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
  }

  input UpdateAddressInput {
    addressID: String!  @constraint(minLength: 2, maxLength: 100, uniqueTypeName: "ID")
    firstName: String! @constraint(minLength: 2, maxLength: 100)
    lastName: String! @constraint(minLength: 2, maxLength: 100)
    phoneNumber: String! @constraint(minLength: 9)
    street: String! @constraint(minLength: 2, maxLength: 100)
    houseOrAptNumber: String! @constraint(minLength: 1, maxLength: 100)
    city: String! @constraint(minLength: 2, maxLength: 100)
    state: String! @constraint(minLength: 2, maxLength: 100)
    country: String! @constraint(minLength: 2, maxLength: 100)
    municipality: String @constraint(minLength: 2, maxLength: 50)
    postCode: String @constraint(maxLength: 6)
    additionalInfo: String @constraint(maxLength: 150)
  }

  input RemoveUserAddressInput {
    addressID: String!  @constraint(minLength: 2, maxLength: 100, uniqueTypeName: "ID")
  }

  input CreateUserInput {
    firebaseID: String!  @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
    firstName: String
    lastName: String
    email: String! @constraint(minLength: 5, format: "email")
    phoneNumber: String! @constraint(minLength: 9)
  }

  input UpdateUserInput {
    firebaseID: String! @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
    firstName: String! @constraint(minLength: 2, maxLength: 100)
    lastName: String! @constraint(minLength: 2, maxLength: 100)
    phoneNumber: String! @constraint(minLength: 9)
  }

  input AddUserProductInput {
    productID: String! @constraint(minLength: 2, maxLength: 100, uniqueTypeName: "ID")
    price: Float!
    qty: Int! @constraint(min: 1)
    link: String! @constraint(format: "uri")
    supplier: SupplierInput
  }

  input ChangeUserStatusInput {
    firebaseID: String! @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
    status: String! @constraint(minLength: 2, maxLength: 100)
  }

  input CustomerCardInput {
    firebaseID: ID!
    card_id: String!
    customer: String!
  }

  input ListCustomerCardInput {
    firebaseID: ID!
    customer: String!
  }

  input addExpoTokenInput {
    firebaseID: ID! @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
    token: String! @constraint(minLength: 2, maxLength: 100)
    installationID: String! @constraint(minLength: 2, maxLength: 100)
  }
`