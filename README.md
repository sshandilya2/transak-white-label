## Overview

The **Transak API Client SDK** provides a simple and efficient way to integrate with the **Transak API** for cryptocurrency and fiat transactions. This SDK allows developers to:

- Fetch cryptocurrency & fiat currency data
- Get quotes for transactions
- Manage user authentication (email OTP verification)
- Submit multi-level KYC
- Reserve wallets and create orders
- Fetch order details and transaction statuses

The SDK is structured to follow best practices and provides a clean, modular interface for seamless API integration.

---

## Installation

```bash
npm install 
```

---

## Run Sample UI integration

```bash
npm start 
```

---

## Run API sequence from Terminal/ Backend

```bash
npm run api-sequence-test 
```

---
## Configuration & Setup

### **1️⃣  Import the SDK & Initialize with API Key & Environment**

```jsx

import { TransakAPI } from './lib/index.js';
// Optionally, if TransakAPI needs configuration, pass it here (e.g., your API key, base URL, etc.)
const transakSdk = new TransakAPI({
    environment: 'staging',
    partnerApiKey: 'a2374be4-c59a-400e-809b-72c226c74b8f',
});

```

> Note: The SDK supports both Staging and Production environments.
> 

---

## Authentication

**Getting Started**

To use this function, you must first **request a** `frontendAuth` &  ****`partnerApiKey` **Key** from Transak. You can obtain it by reaching out to: **Sales Team:** [sales@transak.com](mailto:sales@transak.com).  Once you receive your **Partner** **API key** and **Frontend Auth token**, you can pass them in the request along with the **user’s email address**.

**How It Works**

1. The **email OTP request is user-centric**—Transak sends a **one-time password (OTP)** to the user’s email.
2. The user enters the OTP in your application.
3. You verify the OTP using **verifyEmailOtp** to obtain an **access token**.
4. Once authenticated, you can proceed with **further actions like KYC verification, order placement, etc.**.

### **Send Email OTP**

The `sendEmailOtp` function is a **non-authenticated** API method that allows you to initiate user authentication by sending an OTP to the provided email address.

**Example Usage**

```jsx
await transak.user.sendEmailOtp({ email: 'user@example.com', frontendAuth: 'your-frontend-auth' });
```

> Response Output Fields:
> 

```json
{ "isTncAccepted": "boolean" }
```

### **Verify Email OTP**

The `verifyEmailOtp` is a **non-authenticated API** that allows you to **verify a user’s email using an OTP** and retrieve an **access token** in return.

Once you have successfully called `sendEmailOtp`, you need to pass the **email verification code** along with the user’s email to **verify the OTP**.

**Access Token Usage**

- This **access token is required** for all **authenticated API calls** (such as placing orders, fetching user details, and submitting KYC).
- This **access token remains valid for 30 days from the time of generation**. Once expired, the user must restart the authentication process by requesting a new OTP.

**Example Usage**

```jsx
const response = await transak.user.verifyEmailOtp({
    email: 'user@example.com',
    emailVerificationCode: '123456'
});
console.log(response);
```

> Response Output Fields:
> 

```json
{
  "id": "string", // ID is equal to the user's access token
  "ttl": "number", // TTL is generally the TTL of the access token; access token expiry is generally 30 days from generation
  "created": "string", // Date created means date-time
  "userId": "string"
}
```

---

## Cryptocurrency, Fiat & Quote Data

### **Fetch Crypto Currencies**

`getCryptoCurrencies` helps you fetch the list of supported cryptocurrencies along with high-level data, including the cryptocurrency name, symbol, and whether it is allowed for transactions. This is a **public API endpoint**, so no authentication is required.

**Example Usage**

```jsx
const cryptos = await transak.public.getCryptoCurrencies();
console.log(cryptos);
```

### **Fetch Fiat Currencies**

`getFiatCurrencies` allows you to fetch the list of supported fiat currencies along with their respective **supported countries, payment methods, and transaction limits**. Since different **payment methods** have varying **transaction limits**, this API provides details on the limits applicable for each fiat currency. This is a **public API endpoint**, so no authentication is required.

**Example Usage**

```jsx
const fiats = await transak.public.getFiatCurrencies();
console.log(fiats);
```

### **Fetch Quote**

`getQuote` is a **public API call** that allows you to fetch a **temporary price quote** for a cryptocurrency transaction based on the selected **fiat currency, cryptocurrency, payment method, and transaction amount**. Since cryptocurrency prices are **volatile**, the returned quote is refreshed **every minute** to reflect the latest market price.

After fetching the **supported cryptocurrencies and fiat currencies**, you must call getQuote to get the latest exchange rate. This quote is **critical** for KYC verification and order placement:

**KYC Process:**

- The **quote ID** must be passed when calling `getKycForms().`
- Based on the **order amount**, the user may be required to complete different KYC tiers (**Simple KYC, Standard KYC**).

**Order Placement:**

- The **quote ID** is also required when calling `createOrder().`
- At the time of payment settlement, Transak sends the **exact amount of cryptocurrency** based on the latest exchange rate at that moment.

Thus, `getQuote` plays a **vital role** in the **entire order flow**, from **KYC verification to order execution**.

**Example Usage**

```jsx
  const quoteData = await transak.public.getQuote({
    "fiatCurrency": "EUR",
    "cryptoCurrency": "USDC",
    "paymentMethod": "sepa_bank_transfer",
    "isBuyOrSell": "BUY",
    "fiatAmount": 30,
    "partnerApiKey": "string",
    "network": "arbitrum",
    "quoteCountryCode": "FR"
  });
```

> Response Output Fields
> 

```json
{
  "quoteId": "string", // Unique identifier for the quote (UUID)
  "conversionPrice": "number", // Exchange rate at the time of the quote
  "fiatCurrency": "string", // Fiat currency used in the quote (e.g., EUR, USD)
  "cryptoCurrency": "string", // Cryptocurrency involved in the quote (e.g., USDC, BTC)
  "paymentMethod": "string", // Payment method used (e.g., sepa_bank_transfer, card_payment)
  "fiatAmount": "number", // Fiat amount specified in the quote
  "cryptoAmount": "number", // Equivalent cryptocurrency amount
  "isBuyOrSell": "string", // Type of transaction (BUY or SELL)
  "network": "string", // Blockchain network for the transaction (e.g., arbitrum, ethereum)
  "feeDecimal": "number", // Decimal representation of the total fee percentage
  "totalFee": "number", // Total fee charged in fiat currency
  "feeBreakdown": [
    {
      "name": "string", // Description of the fee (e.g., Transak fee, Network/Exchange fee)
      "value": "number", // Fee amount in fiat currency
      "id": "string", // Unique identifier for the fee type
      "ids": "array" // List of IDs related to the fee breakdown
    }
  ],
  "nonce": "number" // Unique number for ensuring quote validity and preventing replay attacks
}
```

---

## User Auth & KYC

### **Get User Details**

`getUser` is an **authenticated API call** that allows you to fetch the user details of the authenticated user. Since authentication has already been completed, the **access token is automatically stored in the SDK’s session**, so you don’t need to pass it explicitly. Simply calling `getUser()` will return the user details if authenticated; otherwise, it will throw an error indicating that the **access token is not valid or has expired**.

**Example Usage**

```jsx
const user = await transak.user.getUser();
console.log(user);
```

> Response Output Fields & User Schema
> 

```jsx
{
  "id": "string", // User's unique identifier (UUID)
  "firstName": "string | null", // User's first name or null if not submitted
  "lastName": "string | null", // User's last name or null if not submitted
  "email": "string", // User's email address
  "mobileNumber": "string | null", // User's mobile number with country code or null if not submitted
  "status": "string", // User's status (e.g., ACTIVE, INACTIVE)
  "dob": "string | null", // User's date of birth in ISO 8601 format or null if not submitted
  "kyc": {
    "status": "string", // KYC status (NOT_SUBMITTED, SUBMITTED, APPROVED, REJECTED)
    "type": "string | null", // KYC type (e.g., SIMPLE, STANDARD) Learn more here https://transak.com/kyc
    "updatedAt": "string", // Last update timestamp in ISO 8601 format
    "kycSubmittedAt": "string | null" // KYC submission timestamp or null if not submitted
  },
  "address": {
    "addressLine1": "string", // First line of the address
    "addressLine2": "string", // Second line of the address
    "state": "string", // State or region
    "city": "string", // City name
    "postCode": "string", // Postal code
    "country": "string", // Full country name
    "countryCode": "string" // ISO country code (e.g., FR for France)
  } // If submitted then it will return with above address object or null if not submitted 
  "createdAt": "string" // Account creation timestamp in ISO 8601 format
}
```

### **Get KYC Forms - Fetch Required KYC Forms Based on Quote ID**

`getKycForms` is an **authenticated API call** that dynamically returns the **KYC forms a user needs to complete** based on the **quote ID**. Since Transak supports **multi-level KYC** across different countries, this API helps determine the exact KYC requirements for a user before proceeding with transactions.

The **quote ID** must be passed when calling this API, as it determines the required **KYC level (Simple KYC, Standard KYC, etc.)**. The response includes a list of **required KYC forms**, such as:

- **Personal Details** → Includes firstName, lastName, email, and mobileNumber.
- **Address Details** → User’s residential details.
- **Purpose of Usage** → Required for compliance with Transak’s regulations.
- **ID Proof** → Only required for **Standard KYC**. If the user is under **Simple KYC**, ID proof is not required.

As per the **quote ID**, the system dynamically returns the appropriate KYC forms for the user to complete.

**Example Usage**

```jsx
const kycForms = await transak.user.getKycForms({ quoteId });
```

> Response Output Fields & User Schema
> 

```jsx
{
  "kycType": "string", // Type of KYC (e.g., SIMPLE, STANDARD)
  "formIds": "array" // List of form IDs required for KYC (e.g., personalDetails, address, purposeOfUsage)
}
```

### **Patch User - Update User’s Personal or Address Details**

`patchUser` is an **authenticated API call** that allows updating a user’s **personal details** or **address details**. The response follows the **same schema as** `getUser()`, returning the updated user profile.

The **fields that can be updated** via patchUser include:

- **Personal Details:** firstName, lastName, mobileNumber, dob
- **Address Details:** Address-related fields fetched via **getKycForms()**

Any modifications to user data must comply with **KYC requirements**, and certain updates may require the user to re-submit verification documents.

```jsx
await transak.user.patchUser({
    firstName: 'John',
    lastName: 'Doe',
    mobileNumber: '1234567890',
    dob: '1990-01-01'
});
```

---

### **Fetch ID Proof KYC Form**

```jsx
const idProofForm = await transak.user.getKycFormsById({ formId: 'idProof', quoteId: 'abcd-1234' });
console.log(idProofForm);
```

> Response Output Fields:
> 

```json
{
    "formId": { "type": "string", "isRequired": true },
    "formName": { "type": "string", "isRequired": true },
    "kycUrl": { "type": "string", "isRequired": true },
    "expiresAt": { "type": "string", "isRequired": true }
}
```

---

## Orders

### **Fetch Order Details**

```jsx
const orderDetails = await transak.order.getOrderById({ orderId: 'abcd-5678' });
console.log(orderDetails);

```

> Response Output Fields:
> 

```json
{
	"id": "string", // Unique identifier for the transaction (UUID)
	"userId": "string", // User's unique identifier (UUID)
	"status": "string", // Transaction status (e.g., COMPLETED, AWAITING_PAYMENT_FROM_USER, PENDING_DELIVERY_FROM_TRANSAK) You can learn more here https://docs.transak.com/docs/tracking-user-kyc-and-order-status
	"isBuyOrSell": "string", // Type of transaction (BUY or SELL)
	"fiatCurrency": "string", // Fiat currency used in the transaction (e.g., EUR, USD). The full list can be fetch using transak.public.getFiatCurrencies() or https://transak.com/global-coverage
	"cryptoCurrency": "string", // Cryptocurrency involved in the transaction (e.g., USDC, BTC). The full list can be fetch using transak.public.getCryptoCurrencies() or https://transak.com/crypto-coverage
	"paymentMethod": "string", // Payment method used (e.g., sepa_bank_transfer)
	"network": "string", // Blockchain network used for the transaction (e.g., arbitrum, ethereum)
	"walletAddress": "string", // Wallet address where the crypto is sent
	"addressAdditionalData": "boolean", // This is the optional field. Indicates if additional address data is required
	"quoteId": "string", // Quote ID associated with the transaction (UUID)
	"fiatAmount": "number", // Fiat amount in the original currency
	"fiatAmountInUsd": "number", // Equivalent fiat amount in USD
	"amountPaid": "number", // Amount actually paid by the user
	"cryptoAmount": "number", // Amount of cryptocurrency received
	"conversionPrice": "number", // Exchange rate between cryptoCurrency / fiat
	"totalFeeInFiat": "number", // Total fees deducted in fiat currency
	"paymentOptions": [
		{
			"currency": "string", // Currency of the payment method (e.g., EUR, USD)
			"id": "string", // Payment method ID (e.g., sepa_bank_transfer)
			"name": "string", // Payment method name
			"fields": [ { "name": "string", "value": "string"}, { "name": "string", "value": "string"} ] // List of required fields for the payment method
		}
	],
	"transactionHash": "string", // Blockchain transaction hash
	"createdAt": "string", // Timestamp when the transaction was created (ISO 8601 format)
	"updatedAt": "string", // Timestamp of the last update (ISO 8601 format)
	"completedAt": "string", // Timestamp when the transaction was completed (ISO 8601 format)
	"statusHistories": [
		{
			"status": "string", // Status of the transaction at a specific time
			"createdAt": "string" // Timestamp when the status was updated (ISO 8601 format)
		}
	]
}
```

---

## Error Handling

All API calls **return structured responses**. If an API call fails, the SDK throws an **error object**:

```jsx
try {
    const order = await transak.order.getOrderById({ orderId: 'abcd-5678' });
} catch (error) {
    console.error(error.message); // Error Message
    console.error(error.details); // Structured Error Object
}

```

---

## License

This SDK is licensed under the **MIT License**.