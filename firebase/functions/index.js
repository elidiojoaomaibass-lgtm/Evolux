// Firebase Cloud Function to send push notifications on new transactions
// ---------------------------------------------------
// Ensure you have installed Firebase Admin SDK in this function:
//   cd firebase/functions && npm install firebase-admin firebase-functions
// Then deploy with: firebase deploy --only functions
// ---------------------------------------------------

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Expected Firestore structure:
 *   /transactions/{transactionId}
 *   Each transaction document should contain at least:
 *     - amount (number or string)
 *     - currency (e.g., "MZN")
 *     - from (string) – e.g., "Evolux Prod"
 *     - userId (string) – ID of the user who should receive the notification
 */
exports.notifyOnNewTransaction = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return null;

    const { amount, currency, from, userId } = data;
    const messageBody = `Novo pedido de ${amount} ${currency} - from ${from}`;

    // Retrieve the saved FCM token(s) for the user
    const tokenDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('tokens')
      .get();

    if (tokenDoc.empty) {
      console.warn(`No FCM tokens found for user ${userId}`);
      return null;
    }

    const tokens = tokenDoc.docs.map(d => d.id); // token stored as doc ID

    const payload = {
      notification: {
        title: '📦 Novo pedido! 🎉',
        body: messageBody,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // adjust for your client framework
        icon: '/icons/icon-192x192.png', // optional
      },
      data: {
        transactionId: context.params.transactionId,
        amount: String(amount),
        currency: currency,
        from: from,
      },
    };

    // Send multicast message
    const response = await admin.messaging().sendMulticast({
      tokens,
      ...payload,
    });

    console.log('Notification sent', response);
    // Cleanup invalid tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[idx]);
        }
      }
    });
    if (invalidTokens.length) {
      const batch = admin.firestore().batch();
      invalidTokens.forEach(tok => {
        const ref = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('tokens')
          .doc(tok);
        batch.delete(ref);
      });
      await batch.commit();
    }
    return null;
  });
