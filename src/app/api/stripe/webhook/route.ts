import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const Stripe = (await import('stripe')).default
    const { createClient } = await import('@supabase/supabase-js')

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!

    let event: any

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId

      if (userId) {
        await supabase
          .from('estabelecimentos')
          .update({
            plano: 'pro',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plano_ativo_em: new Date().toISOString(),
          })
          .eq('userId', userId)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      await supabase
        .from('estabelecimentos')
        .update({ plano: 'trial' })
        .eq('stripe_subscription_id', subscription.id)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}