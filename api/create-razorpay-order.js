import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // To test locally, you MUST set these environment variables!
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("Razorpay keys missing in environment");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // Pro License costs $9.99 globally, but we offer Regional Pricing for India at ₹499.
    // Razorpay amount is in PAISE (1 INR = 100 Paise). So 499 INR = 49900 paise.
    const options = {
      amount: 49900, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture
    };

    if (options.amount < 100) {
      return res.status(400).json({ message: "Amount must be at least 100 paise" });
    }

    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({ 
      id: order.id,
      currency: order.currency,
      amount: order.amount 
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    if (error.statusCode === 401 || (error.error && error.error.code === 'BAD_REQUEST_ERROR' && error.error.description.includes('authorized'))) {
      return res.status(401).json({ message: "Authentication Failed with Razorpay", error: error.message });
    }
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
}
