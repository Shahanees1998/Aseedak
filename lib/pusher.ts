import Pusher from 'pusher'

// Debug Pusher configuration
console.log('🔧 Pusher Configuration Debug:')
console.log('  PUSHER_APP_ID:', process.env.PUSHER_APP_ID || 'UNDEFINED')
console.log('  PUSHER_KEY:', process.env.PUSHER_KEY || 'UNDEFINED')
console.log('  PUSHER_SECRET:', process.env.PUSHER_SECRET ? 'SET' : 'UNDEFINED')
console.log('  PUSHER_CLUSTER:', process.env.PUSHER_CLUSTER || 'UNDEFINED')
console.log('  NODE_ENV:', process.env.NODE_ENV)
console.log('  All env keys containing PUSHER:', Object.keys(process.env).filter(key => key.includes('PUSHER')))

// Check if all required environment variables are present
const isPusherConfigured = process.env.PUSHER_APP_ID && 
                          process.env.PUSHER_KEY && 
                          process.env.PUSHER_SECRET && 
                          process.env.PUSHER_CLUSTER

if (!isPusherConfigured) {
  console.error('❌ Pusher is not properly configured. Missing environment variables.')
  console.error('Required: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER')
}

export const pusher = isPusherConfigured ? new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
}) : null

export default pusher