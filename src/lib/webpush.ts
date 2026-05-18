import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string; badge?: number }
) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (e: unknown) {
    // Subscription scaduta o non valida — il chiamante gestisce la pulizia
    throw e
  }
}

export default webpush
