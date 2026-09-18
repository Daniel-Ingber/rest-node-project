/** The first user is a regular one, the second is a business user
 * and the third one is the admin of the application
 * */
export const InitialUsers = [
  {
    name: {
      first: "test1",
      last: "test1",
    },
    address: {
      street: "street1",
      city: "city1",
      country: "country1",
      state: "state1",
      houseNumber: 1,
      zip: "11111",
    },
    image: {
      alt: "user-profile",
      url: "https://picsum.photos/200/300",
    },
    phone: "0501111111",
    email: "user1@user1.com",
    isBusiness: false,
    password: "Aa123456!",
    createdAt: new Date(),
    isAdmin: false,
  },
  {
    name: {
      first: "test2",
      last: "test2",
    },
    address: {
      street: "street2",
      city: "city2",
      country: "country2",
      state: "state2",
      houseNumber: 2,
      zip: "22222",
    },
    image: {
      alt: "user-profile",
      url: "https://picsum.photos/200/300",
    },
    phone: "0522222222",
    email: "user2@user2.com",
    isBusiness: true,
    password: "Aa123456!",
    createdAt: new Date(),
    isAdmin: false,
  },
  {
    name: {
      first: "test3",
      last: "test3",
    },
    address: {
      street: "street3",
      city: "city3",
      country: "country3",
      state: "state3",
      houseNumber: 3,
      zip: "33333",
    },
    image: {
      alt: "user-profile",
      url: "https://picsum.photos/200/300",
    },
    phone: "0543333333",
    email: "user3@user3.com",
    isBusiness: true,
    password: "Aa123456!",
    createdAt: new Date(),
    isAdmin: true,
  },
];
