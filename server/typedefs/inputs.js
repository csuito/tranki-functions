module.exports = `
  input StripeOnBoardInput {
    card_token: String! @constraint(minLength: 5, maxLength: 100)
    email: String! @constraint(minLength: 5, format: "email")
    firebaseID: String! @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
  }

  input SupplierInput {
    name: String! @constraint(minLength: 5, maxLength: 100)
    supplierOrderID: String @constraint(minLength: 5, maxLength: 100)
  }

  input ProductInput {
    productID: String! @constraint(minLength: 10, maxLength: 10, uniqueTypeName: "ID")
    price: Float!
    qty: Int! @constraint(min: 1)
    link: String! @constraint(format: "uri")
    variant: String 
    supplier: SupplierInput
  }

  input AddressInput {
    firstName: String! @constraint(minLength: 2, maxLength: 100)
    lastName: String! @constraint(minLength: 2, maxLength: 100)
    streetType: String! @constraint(minLength: 2, maxLength: 100)
    street: String! @constraint(minLength: 2, maxLength: 100)
    houseOrAptNumber: String! @constraint(minLength: 1, maxLength: 20)
    city: String! @constraint(minLength: 2, maxLength: 100)
    state: String! @constraint(minLength: 2, maxLength: 100)
    country: String! @constraint(minLength: 2, maxLength: 100)
    postCode: String @constraint(minLength: 2, maxLength: 100)
    residence: String @constraint(minLength: 2, maxLength: 100)
    urbanization: String @constraint(minLength: 2, maxLength: 100)
    municipality: String @constraint(minLength: 2, maxLength: 100)
    additionalInfo: String @constraint(minLength: 2, maxLength: 100)
  }

  input TotalInput {
    cost: Float
    price: Float
  }

  input PaymentInput {
    card: String! @constraint(maxLength: 100)
    customer: String! @constraint(maxLength: 100)
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
    total: TotalInput!
    payment: PaymentInput!
    shipping: ShippingDataInput!
    status: String
  }

  input UpdateOrderInput {
    _id: String! @constraint(minLength: 2, maxLength: 100, uniqueTypeName: "ID")
    cart: [ProductInput]
    userID: String @constraint(minLength: 2, maxLength: 100)
    firstName: String @constraint(minLength: 2, maxLength: 100)
    lastName: String @constraint(minLength: 2, maxLength: 100)
    email: String @constraint(minLength: 5, format: "email")
    phoneNumber: String @constraint(minLength: 9)
    total: TotalInput
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
    firstName: String  @constraint(minLength: 2, maxLength: 100)
    lastName: String  @constraint(minLength: 2, maxLength: 100)
    streetType: String  @constraint(minLength: 2, maxLength: 100)
    street: String  @constraint(minLength: 2, maxLength: 100)
    houseOrAptNumber: String  @constraint(minLength: 2, maxLength: 100)
    city: String  @constraint(minLength: 2, maxLength: 100)
    state: String  @constraint(minLength: 2, maxLength: 100)
    country: String  @constraint(minLength: 2, maxLength: 100)
    postCode: String  @constraint(minLength: 2, maxLength: 100)
    residence: String  @constraint(minLength: 2, maxLength: 100)
    urbanization: String  @constraint(minLength: 2, maxLength: 100)
    municipality: String  @constraint(minLength: 2, maxLength: 100)
    additionalInfo: String  @constraint(minLength: 2, maxLength: 500)
  }

  input CreateUserInput {
    firebaseID: String!  @constraint(minLength: 5, maxLength: 100, uniqueTypeName: "ID")
    firstName: String!  @constraint(minLength: 2, maxLength: 100)
    lastName: String!  @constraint(minLength: 2, maxLength: 100)
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
`