import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { record } = await req.json() // The new inquiry row

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Get the seller's Discord ID from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('discord_id, character_name')
    .eq('id', record.seller_id)
    .single()

  if (!profile?.discord_id) return new Response('No Discord ID linked', { status: 200 })

  // 2. Create a DM channel with the user
  const discordToken = Deno.env.get('DISCORD_BOT_TOKEN')
  const channelReq = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${discordToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: profile.discord_id })
  })
  const channel = await channelReq.json()

  // 3. Send the message
  await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${discordToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: "⚔️ New Market Inquiry!",
        color: 0xD4AF37, // Gold
        fields: [
          { name: "Item", value: record.item_name, inline: true },
          { name: "From", value: record.sender_name, inline: true },
          { name: "Message", value: record.message }
        ],
        footer: { text: "Wurm Hub Market Notifications" }
      }]
    })
  })

  return new Response('Notification sent', { status: 200 })
})