/**
 * Shared Access Control for Monetalis Collections
 *
 * All Monetalis data is scoped to a loan. The Logto access token
 * carries { sub, email, logtoRoles }. loanId and role are resolved
 * from the monetalis-users collection (or Custom JWT claims).
 *
 * Access rules:
 *   read    → authenticated, auto-filter by user's loanId
 *   create  → admin only, loan must match user's loanId
 *   update  → admin only, existing doc must belong to user's loan
 *   delete  → admin only, existing doc must belong to user's loan
 *
 * monetalis-users has custom rules (users can see their own record).
 */

import type { Access, Where, PayloadRequest, CollectionSlug } from 'payload'
import { resolveMonetalisUser, type LogtoUser } from '@/middleware/logto-jwt'

// ── Helper: extract full user context (with loanId/role) ────────────────────

type ResolvedUser = LogtoUser & { loanId: string; role: string }

async function getUser(req: PayloadRequest): Promise<ResolvedUser | null> {
  // 1. Try Logto Bearer token (API calls from Monetalis SPA)
  const resolved = await resolveMonetalisUser(req as { headers: Headers }, req.payload)
  if (resolved) return resolved

  // 2. Fallback: admin panel auth via payload-token cookie
  // req.user is set by Payload's auth strategy when logged into the admin panel
  if (req.user) {
    const adminUser = req.user as any
    const logtoSub = adminUser.logtoSub
    if (!logtoSub) return null

    // Look up monetalis user by the admin user's logtoSub
    try {
      const result = await req.payload.find({
        collection: 'monetalis-users',
        where: { logtoSub: { equals: logtoSub } },
        limit: 1,
        depth: 0,
      })
      if (result.docs.length === 0) return null
      const mu = result.docs[0] as any
      if (!mu.isActive) return null

      const loanId = typeof mu.loan === 'object' ? mu.loan?.id : mu.loan
      if (!loanId) return null

      return {
        sub: logtoSub,
        email: adminUser.email || '',
        logtoRoles: [],
        loanId,
        role: mu.role || 'viewer',
      }
    } catch {
      return null
    }
  }

  return null
}

/** Extract loanId from a document (handles both string and populated relationship). */
function extractLoanId(doc: any): string | undefined {
  if (!doc?.loan) return undefined
  return typeof doc.loan === 'object' ? doc.loan.id : doc.loan
}

// ── Generated AI insight access ─────────────────────────────────────────────

/** Generated AI records are read-only through generic REST. */
export const aiInsightAccess = {
  read: async ({ req }: { req: PayloadRequest }) => {
    const user = await getUser(req)
    if (!user) return false
    return { loan: { equals: user.loanId } as Where } as Where
  },
  create: async ({ req }: { req: PayloadRequest }) => {
    const user = await getUser(req)
    return Boolean(user && user.role === 'admin')
  },
  update: async () => false,
  delete: async () => false,
}

export const aiInsightConfigAccess = {
  read: async ({ req }: { req: PayloadRequest }) => {
    const user = await getUser(req)
    return user?.role === 'admin'
  },
  create: async ({ req }: { req: PayloadRequest }) => {
    const user = await getUser(req)
    return user?.role === 'admin'
  },
  update: async ({ req }: { req: PayloadRequest }) => {
    const user = await getUser(req)
    return user?.role === 'admin'
  },
  delete: async ({ req }: { req: PayloadRequest }) => {
    const user = await getUser(req)
    return user?.role === 'admin'
  },
}

// ── Loan-scoped collection access ───────────────────────────────────────────

/** Auto-filter read queries to the user's loan only. */
export const loanScopedRead: Access = async ({ req }) => {
  const user = await getUser(req)
  if (!user) return false

  return {
    loan: { equals: user.loanId } as Where,
  } as Where
}

/** Create: admin only, loan must match user's loanId. */
export const loanScopedCreate: Access = async ({ req, data }) => {
  const user = await getUser(req)
  if (!user) return false
  if (user.role !== 'admin') return false

  return extractLoanId(data) === user.loanId
}

/**
 * Build an update access function for a specific loan-scoped collection.
 * PayloadRequest doesn't expose `collection` in types, so we pass the slug.
 */
export function loanScopedUpdate(collectionSlug: CollectionSlug): Access {
  return async ({ req, id }) => {
    const user = await getUser(req)
    if (!user) return false
    if (user.role !== 'admin') return false

    // Verify the document belongs to user's loan
    const res = await req.payload.find({
      collection: collectionSlug,
      where: { id: { equals: id! } },
      limit: 1,
      depth: 0,
    })
    if (!res.docs.length) return false
    return extractLoanId(res.docs[0]) === user.loanId
  }
}

/**
 * Build a delete access function for a specific loan-scoped collection.
 */
export function loanScopedDelete(collectionSlug: CollectionSlug): Access {
  return async ({ req, id }) => {
    const user = await getUser(req)
    if (!user) return false
    if (user.role !== 'admin') return false

    const res = await req.payload.find({
      collection: collectionSlug,
      where: { id: { equals: id! } },
      limit: 1,
      depth: 0,
    })
    if (!res.docs.length) return false
    return extractLoanId(res.docs[0]) === user.loanId
  }
}

/**
 * Build a full access set for a loan-scoped collection.
 * Usage: access: loanScopedAccess('kpr-schedule')
 */
export function loanScopedAccess(collectionSlug: CollectionSlug) {
  return {
    read: loanScopedRead,
    create: loanScopedCreate,
    update: loanScopedUpdate(collectionSlug),
    delete: loanScopedDelete(collectionSlug),
  }
}

// ── Monetalis-users access ──────────────────────────────────────────────────

/** Users can only read their own record. Admins can read all. */
export const usersRead: Access = async ({ req }) => {
  const user = await getUser(req)
  if (!user) return false

  if (user.role === 'admin') return true

  return {
    logtoSub: { equals: user.sub } as Where,
  } as Where
}

/** Admin only — invite new users. */
export const usersCreate: Access = async ({ req }) => {
  const user = await getUser(req)
  if (!user) return false
  return user.role === 'admin'
}

/** Admin can update anyone. Viewer can only update own record. */
export const usersUpdate: Access = async ({ req, data, id }) => {
  const user = await getUser(req)
  if (!user) return false

  if (user.role === 'admin') return true

  // Viewer: only own record
  const res = await req.payload.find({
    collection: 'monetalis-users',
    where: { id: { equals: id! } },
    limit: 1,
    depth: 0,
  })
  if (!res.docs.length) return false
  return (res.docs[0] as any)?.logtoSub === user.sub
}

/** Admin only. */
export const usersDelete: Access = async ({ req }) => {
  const user = await getUser(req)
  if (!user) return false
  return user.role === 'admin'
}

export const usersAccess = {
  read: usersRead,
  create: usersCreate,
  update: usersUpdate,
  delete: usersDelete,
}
