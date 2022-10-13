const axios = require('axios');

const main = async () => {
  const doc = {
    receiver: {
      id: '390293203920930239029302930',
      address:
        'Contrary to popular belief, Lorem Ipsum is not simply random text',
      identityDocumentTypeCode: 1,
      docNumber: '1',
      name: 'hahahaha hahaha hahaha',
      exceptionCode: 0
    },
    itemDetails: [
      {
        id: '29389283928392898392833923',
        hello: 1287182781728172,
        hihihi: '02930230293988jd8jd8jd8jd',
        description:
          'Contrary to popular belief, Lorem Ipsum is not simply random text',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      },
      {
        id: 'abc-123',
        hello: 12345,
        hihihi: 'hehehehe',
        description: 'laptop',
        quantity: 1,
        unitOfMeasurement: 1,
        price: 10,
        economyActivity: 'l',
        subtotal: 10,
        discount: 10
      }
    ],
    totals: {
      totalAmount: 100,
      detailAmount: 10,
      xkosxkosxkosxkosk: 3,
      currencyCode: 1,
      exchangeRate: 1,
      totalAmountCurrency: 100,
      kxoskxoskxosxkoskxosx:
        'Contrary to popular belief, Lorem Ipsum is not simply random text',
      oxksoxkosxkoskxosxk:
        'Contrary to popular belief, Lorem Ipsum is not simply random text',
      xxoowiejnunxnx: 0,
      additionalDiscount: 0,
      totalAmountIvaSubject: 0
    },
    docId: {
      address: 'some address',
      legendText:
        'Contrary to popular belief, Lorem Ipsum is not simply random text',
      username: 'lover123',
      branchCode: 1,
      posCode: 2,
      invoiceNumber: 1,
      docCode: '3'
    },
    information: {
      oiwoeioweiow: 'incoterm value',
      ieoweoiweoe: 'incotermDetail value',
      destinationPort: 'destinationPort value',
      destinationPlace: 'destinationPlace value',
      countryCode: 2,
      paymentMethodCode: 1,
      additionalInformation: 'blabla',
      descriptionNumberPackageBundles:
        'Contrary to popular belief, Lorem Ipsum is not simply random text'
    }
  };

  const vals = [];
  for (let i = 0; i < 2000; i++) {
    vals.push(doc);
  }

  const { data } = await axios.post(
    'https://3kizb8c34k.execute-api.us-east-1.amazonaws.com/prod/',
    {
      message: vals
    }
  );

  console.log(data);
};

main();
