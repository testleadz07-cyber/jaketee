import User from '@/models/User'
import { connectDB } from '@/lib/mongodb'
import { createNotification } from '@/lib/notifications'

// Called only with Google's server-verified OAuth profile, never request JSON.
export async function resolveGoogleUser(profile: { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string }, linkingUserId?: string) {
  if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error('GoogleEmailUnverified')
  if (!await connectDB()) throw new Error('GoogleUnavailable')
  await User.init()
  const email = profile.email.trim().toLowerCase()
  let user = await User.findOne({ googleId: profile.sub })
  if (user) {
    if (linkingUserId && String(user._id) !== linkingUserId) throw new Error('GoogleAccountConflict')
  } else {
    const matches = await User.find({ email }).limit(2)
    if (matches.length) {
      if (matches.length !== 1 || !linkingUserId || String(matches[0]._id) !== linkingUserId) throw new Error('GoogleLinkRequired')
      user = matches[0]
      if (!user.isActive || user.googleId) throw new Error('GoogleAccountConflict')
      user.googleId = profile.sub
      await user.save()
    } else {
      if (linkingUserId) throw new Error('GoogleAccountConflict')
      user = await User.findOneAndUpdate(
        { googleId: profile.sub },
        { $setOnInsert: { googleId: profile.sub, email, name: profile.name?.slice(0, 200) || email.split('@')[0], avatar: profile.picture, role: 'customer', isActive: true } },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      await createNotification({ type: 'user_registered', title: 'New Google account', message: `${user.name} registered with Google.`, link: `/admin/users/${user._id}`, eventKey: `google-signup:${user._id}` })
    }
  }
  if (!user || user.isActive === false) throw new Error('GoogleAccountDisabled')
  return user
}
