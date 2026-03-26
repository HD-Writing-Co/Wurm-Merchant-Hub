import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { record } = await req.json() 

  // Hardcoded for your project: gjftmhvteylhtlwcouwg
  const supabase = createClient(
    "https://gjftmhvteylhtlwcouwg.supabase.co",
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('discord_id, character_name')
    .eq('id', record.seller_id)
    .single()

  if (profileError || !profile?.discord_id) {
    return new Response('No Discord ID linked', { status: 200 })
  }

  const discordToken = Deno.env.get('DISCORD_BOT_TOKEN')

  const channelReq = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${discordToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: profile.discord_id })
  })
  
  const channel = await channelReq.json()
  if (!channel.id) return new Response('Discord Channel Error', { status: 500 })

  await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${discordToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `Hey **${profile.character_name}**, you have a new message:`,
      embeds: [{
        title: "⚔️ New message on Wurm Marketplace",
        color: 0xD4AF37, 
        fields: [
          { name: "📦 Product", value: record.item_name, inline: true },
          { name: "💬 From", value: record.sender_name, inline: true },
          { name: "📝 Message", value: `\n👋 ${record.message} ⚔️` }
        ],
        footer: { text: "Wurm Marketplace • Black Bronze Alliance" }
      }]
    })
  })

  return new Response('Notification Sent', { status: 200 })
})
