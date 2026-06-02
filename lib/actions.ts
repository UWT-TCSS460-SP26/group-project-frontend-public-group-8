'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { ApiError, apiWrite } from '@/lib/api'

export type ActionResult = { ok: true } | { ok: false; status?: number; error: string }

async function tokenOrError(): Promise<{ token: string } | ActionResult> {
  const session = await auth()
  const token = session?.accessToken
  if (!token) return { ok: false, status: 401, error: 'You must be signed in.' }
  return { token }
}

function explain(e: unknown): ActionResult {
  if (e instanceof ApiError) {
    if (e.status === 401) return { ok: false, status: 401, error: 'Your session expired — sign in again.' }
    if (e.status === 403) return { ok: false, status: 403, error: 'You do not have permission for this action.' }
    if (e.status === 400) return { ok: false, status: 400, error: e.body || 'Invalid input.' }
    if (e.status === 404) return { ok: false, status: 404, error: 'Not found.' }
    return { ok: false, status: e.status, error: `Server error (${e.status}). Try again in a moment.` }
  }
  return { ok: false, error: 'Network error. Check your connection and try again.' }
}

export async function submitRating(
  titleId: number,
  mediaType: 'movie' | 'tv',
  rating: number
): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, status: 400, error: 'Rating must be a whole number from 1 to 5.' }
  }
  const t = await tokenOrError()
  if ('ok' in t) return t
  try {
    await apiWrite(`/v1/ratings/${titleId}`, {
      method: 'POST',
      token: t.token,
      body: { rating, media_type: mediaType },
    })
    revalidatePath(`/media/${mediaType}/${titleId}`)
    revalidatePath('/profile')
    return { ok: true }
  } catch (e) {
    return explain(e)
  }
}

export async function deleteRating(
  titleId: number,
  mediaType: 'movie' | 'tv'
): Promise<ActionResult> {
  const t = await tokenOrError()
  if ('ok' in t) return t
  try {
    await apiWrite(`/v1/ratings/${titleId}`, { method: 'DELETE', token: t.token })
    revalidatePath(`/media/${mediaType}/${titleId}`)
    revalidatePath('/profile')
    return { ok: true }
  } catch (e) {
    return explain(e)
  }
}

export async function submitReview(input: {
  titleId: number
  mediaType: 'movie' | 'tv'
  content: string
  header?: string
}): Promise<ActionResult> {
  const content = input.content.trim()
  if (!content) return { ok: false, status: 400, error: 'Review content is required.' }
  if (content.length > 5000) {
    return { ok: false, status: 400, error: 'Review must be 5000 characters or fewer.' }
  }
  const header = input.header?.trim()
  if (header && header.length > 200) {
    return { ok: false, status: 400, error: 'Title must be 200 characters or fewer.' }
  }

  const t = await tokenOrError()
  if ('ok' in t) return t
  try {
    const body: Record<string, unknown> = {
      title_id: input.titleId,
      media_type: input.mediaType,
      content,
    }
    if (header) body.header = header
    await apiWrite('/v1/reviews', { method: 'POST', token: t.token, body })
    revalidatePath(`/media/${input.mediaType}/${input.titleId}`)
    revalidatePath('/profile')
    return { ok: true }
  } catch (e) {
    return explain(e)
  }
}

export async function updateReview(
  reviewId: number,
  patch: { content?: string; header?: string }
): Promise<ActionResult> {
  const body: Record<string, unknown> = {}
  if (patch.content !== undefined) {
    const c = patch.content.trim()
    if (!c) return { ok: false, status: 400, error: 'Review content cannot be empty.' }
    if (c.length > 5000) return { ok: false, status: 400, error: 'Review must be 5000 characters or fewer.' }
    body.content = c
  }
  if (patch.header !== undefined) {
    const h = patch.header.trim()
    if (h.length > 200) return { ok: false, status: 400, error: 'Title must be 200 characters or fewer.' }
    body.header = h
  }
  if (Object.keys(body).length === 0) {
    return { ok: false, status: 400, error: 'Nothing to update.' }
  }

  const t = await tokenOrError()
  if ('ok' in t) return t
  try {
    await apiWrite(`/v1/reviews/${reviewId}`, { method: 'PUT', token: t.token, body })
    revalidatePath('/profile')
    return { ok: true }
  } catch (e) {
    return explain(e)
  }
}

export async function deleteReview(reviewId: number): Promise<ActionResult> {
  const t = await tokenOrError()
  if ('ok' in t) return t
  try {
    await apiWrite(`/v1/reviews/${reviewId}`, { method: 'DELETE', token: t.token })
    revalidatePath('/profile')
    return { ok: true }
  } catch (e) {
    return explain(e)
  }
}
