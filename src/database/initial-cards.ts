/** Every card is created by the business user of the initial data,
 * the owner id is added by the init of the database
 * */
export const InitialCards = [
  {
    title: "card1",
    subtitle: "subtitle1",
    description: "The first business card of the application",
    phone: "0501111111",
    email: "card1@card1.com",
    web: "https://card1.com",
    address: {
      street: "street1",
      city: "city1",
      country: "country1",
      state: "state1",
      houseNumber: 1,
      zip: "11111",
    },
    image: {
      alt: "card1",
      url: "https://picsum.photos/200/300",
    },
  },
  {
    title: "card2",
    subtitle: "subtitle2",
    description: "The second business card of the application",
    phone: "0522222222",
    email: "card2@card2.com",
    web: "https://card2.com",
    address: {
      street: "street2",
      city: "city2",
      country: "country2",
      state: "state2",
      houseNumber: 2,
      zip: "22222",
    },
    image: {
      alt: "card2",
      url: "https://picsum.photos/200/300",
    },
  },
  {
    title: "card3",
    subtitle: "subtitle3",
    description: "The third business card of the application",
    phone: "0543333333",
    email: "card3@card3.com",
    web: "https://card3.com",
    address: {
      street: "street3",
      city: "city3",
      country: "country3",
      state: "state3",
      houseNumber: 3,
      zip: "33333",
    },
    image: {
      alt: "card3",
      url: "https://picsum.photos/200/300",
    },
  },
];
