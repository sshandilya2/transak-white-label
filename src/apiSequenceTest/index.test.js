import { TransakAPI } from './../lib/index.js';

const transak = new TransakAPI({
  environment: 'staging',
  partnerApiKey: 'a2374be4-c59a-400e-809b-72c226c74b8f',
});

import { handleKYCVerificationViaApi } from './kycUtil/index.js';
import { orderApiSequenceTests } from './orderUtil/index.js';
import { sampleData } from './sample_data.js';
import { executeApiTest } from './utils/index.js';

let accessToken = sampleData.env.ACCESS_TOKEN || null; // Store accessToken
const frontendAuth = sampleData.env['frontend-auth'];
const email = sampleData.env.EMAIL || null; // Store accessToken
let isAccessTokenValid;

describe('Authentication API Tests', function () {
  this.timeout(20000000); // Increase timeout for API calls

  it('should ensure accessToken is valid or fetch a new one', async function () {
    if (!frontendAuth)
      throw new Error(
        '❌ Frontend Auth is missing. Please provide a valid frontend auth token in env.'
      );
    if (!email)
      throw new Error(
        '❌ Email is missing. Please provide a valid email in env.'
      );

    if (accessToken)
      isAccessTokenValid = await transak.isAccessTokenValid(accessToken);

    if (!isAccessTokenValid) {
      console.log(
        '⚠️ Access token is invalid or expired. Triggering email verification...'
      );

      // Send email OTP
      const sendEmailOtpData = await transak.user.sendEmailOtp({
        email,
        frontendAuth,
      });
      // ✅ Validate user response
      await executeApiTest('send_email_otp', sendEmailOtpData);

      const otp =
        sampleData.env.ENVIRONMENT === 'staging'
          ? `${sampleData.env.OTP_CODE}`
          : readlineSync.question('Enter the OTP received on email: ');

      // 4️⃣ Verify email OTP and get new accessToken
      const accessTokenData = await transak.user.verifyEmailOtp({
        email,
        emailVerificationCode: otp,
      });
      if (!accessTokenData)
        throw new Error('❌ Failed to verify email and obtain access token.');

      await executeApiTest('verify_email_otp', accessTokenData);
      console.log('✅ Email verified successfully.');

      sampleData.env.ACCESS_TOKEN = accessTokenData.id;

      //Fetch user again with the new token
      await transak.user.getUser();
    }
    if (transak.client.userData.id)
      console.log(
        `✅ User authenticated successfully. Access token - ${sampleData.env.ACCESS_TOKEN}`
      );
    else throw new Error('❌ User not authenticated.');
  });

  it('should fetch user details and validate response fields', async function () {
    // ✅ Validate user response
    await executeApiTest('get_user', transak.client.userData);
    console.log(
      `✅ User Details Validated Successfully for: ${transak.client.userData.email}`
    );
  });

  it('should handle KYC verification', async function () {
    if (!transak.client.accessToken)
      throw new Error(
        '❌ Access Token is missing. Run email verification apiSequenceTest first.'
      );
    await handleKYCVerificationViaApi(transak);
  });

  it('should handle order placement', async function () {
    if (!transak.client.accessToken)
      throw new Error(
        '❌ Access Token is missing. Run email verification apiSequenceTest first.'
      );
    await orderApiSequenceTests(transak);
  });
});
