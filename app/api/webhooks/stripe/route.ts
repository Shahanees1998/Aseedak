import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Handle successful payment for in-app purchases
        if (paymentIntent.metadata?.userId && paymentIntent.metadata?.purchaseType) {
          await handleSuccessfulPurchase(
            paymentIntent.metadata.userId,
            paymentIntent.metadata.purchaseType,
            paymentIntent.metadata.purchaseId,
            paymentIntent.id
          )
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleSuccessfulPurchase(
  userId: string,
  purchaseType: string,
  purchaseId: string,
  paymentIntentId: string
) {
  try {
    // Create a record of the successful purchase
    await prisma.userPurchase.create({
      data: {
        userId,
        type: purchaseType,
        itemId: purchaseId,
        stripePaymentIntentId: paymentIntentId,
        amount: 0, // Amount will be stored in Stripe
        status: 'completed'
      }
    })

    console.log(`Purchase recorded for user ${userId}: ${purchaseType}`)
  } catch (error) {
    console.error('Error recording purchase:', error)
  }
}